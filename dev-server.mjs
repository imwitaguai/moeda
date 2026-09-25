import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Load .env if present
try {
  process.loadEnvFile();
} catch {
  // .env is optional
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = __dirname;
const PORT = process.env.PORT || 3000;

// Dynamically import netlify functions handlers
let ratesHandler = null;
let assistantHandler = null;

try {
  const ratesModule = await import('./netlify/functions/rates.mjs');
  ratesHandler = ratesModule.default;
} catch (err) {
  console.warn('[dev-server] Could not load rates function:', err.message);
}

try {
  const assistantModule = await import('./netlify/functions/assistant.mjs');
  assistantHandler = assistantModule.default;
} catch (err) {
  console.warn('[dev-server] Could not load assistant function:', err.message);
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.txt': 'text/plain; charset=utf-8'
};

async function nodeToWebRequest(req) {
  const host = req.headers.host || `localhost:${PORT}`;
  const url = new URL(req.url, `http://${host}`);
  const headers = new Headers();
  for (const [key, value] of Object.entries(req.headers)) {
    if (value) {
      if (Array.isArray(value)) {
        value.forEach(v => headers.append(key, v));
      } else {
        headers.set(key, value);
      }
    }
  }

  const init = {
    method: req.method,
    headers
  };

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    const chunks = [];
    for await (const chunk of req) {
      chunks.push(chunk);
    }
    init.body = Buffer.concat(chunks);
  }

  return new Request(url, init);
}

async function sendWebResponse(webRes, res) {
  res.statusCode = webRes.status;
  webRes.headers.forEach((val, key) => {
    res.setHeader(key, val);
  });
  if (webRes.body) {
    const reader = webRes.body.getReader();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(value);
    }
    res.end();
  } else {
    res.end();
  }
}

const server = http.createServer(async (req, res) => {
  try {
    const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);
    const pathname = decodeURIComponent(parsedUrl.pathname);

    // API routes for Netlify Functions
    if (pathname === '/.netlify/functions/rates' && ratesHandler) {
      const webReq = await nodeToWebRequest(req);
      const webRes = await ratesHandler(webReq);
      return await sendWebResponse(webRes, res);
    }

    if (pathname === '/.netlify/functions/assistant' && assistantHandler) {
      const webReq = await nodeToWebRequest(req);
      const webRes = await assistantHandler(webReq);
      return await sendWebResponse(webRes, res);
    }

    // Static file serving
    let relativePath = pathname === '/' ? '/index.html' : pathname;
    let filePath = path.normalize(path.join(ROOT_DIR, relativePath));

    if (!filePath.startsWith(ROOT_DIR)) {
      res.statusCode = 403;
      res.end('Acesso proibido');
      return;
    }

    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }

    if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end('Arquivo não encontrado: ' + pathname);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);

    if (['.html', '.js', '.css'].includes(ext)) {
      res.setHeader('Cache-Control', 'no-cache, must-revalidate');
    }

    const stream = fs.createReadStream(filePath);
    stream.on('error', (err) => {
      if (!res.headersSent) {
        res.statusCode = 500;
        res.end();
      }
    });
    req.on('close', () => {
      stream.destroy();
    });
    stream.pipe(res);
  } catch (error) {
    console.error('[dev-server] Erro na requisição:', error);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end('Erro interno no servidor');
    }
  }
});

server.listen(PORT, () => {
  console.log(`[dev-server] Servidor rodando em http://localhost:${PORT}`);
});
