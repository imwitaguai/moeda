import { FOREIGN_CODES } from '../../currency-config.mjs';
import { normalizeAwesomePayload } from './rates-core.mjs';

const PROVIDER_URL = `https://economia.awesomeapi.com.br/json/last/${FOREIGN_CODES.map(code => `${code}-BRL`).join(',')}`;

function json(body, status = 200, headers = {}) {
  return Response.json(body, { status, headers });
}

function error(code, message, status) {
  return json({ error: { code, message } }, status);
}

export function createRatesHandler(fetchImpl = fetch, timeoutMs = 5000) {
  return async request => {
    if (request.method !== 'GET') return error('METHOD_NOT_ALLOWED', 'Método não permitido.', 405);

    const base = new URL(request.url).searchParams.get('base') || 'BRL';
    if (base !== 'BRL') return error('INVALID_BASE', 'A moeda base deve ser BRL.', 400);

    const key = process.env.AWESOMEAPI_KEY;
    const headers = { Accept: 'application/json' };
    if (key) headers['x-api-key'] = key;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetchImpl(PROVIDER_URL, {
        headers,
        signal: controller.signal
      });
      if (!response.ok) return error('PROVIDER_ERROR', 'Não foi possível consultar a cotação.', 502);

      let payload;
      try {
        payload = await response.json();
      } catch {
        return error('INVALID_PROVIDER_RESPONSE', 'Resposta inválida do serviço de cotação.', 502);
      }

      const normalized = normalizeAwesomePayload(payload);
      if (normalized.liveCodes.length === 0) {
        return error('NO_VALID_RATES', 'Nenhuma cotação válida foi recebida.', 502);
      }

      return json(
        { base: 'BRL', ...normalized, source: 'AwesomeAPI' },
        200,
        { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=60' }
      );
    } catch (cause) {
      if (cause?.name === 'AbortError') return error('PROVIDER_TIMEOUT', 'O serviço de cotação demorou para responder.', 504);
      return error('CONNECTION_ERROR', 'Falha de conexão com o serviço de cotação.', 502);
    } finally {
      clearTimeout(timeout);
    }
  };
}

export default createRatesHandler();

export const config = {
  path: '/.netlify/functions/rates'
};
