import test from 'node:test';
import assert from 'node:assert/strict';
import { extractAssistantReply, fallbackAssistantReply, validateAssistantInput } from '../netlify/functions/assistant-core.mjs';
import { config, createAssistantHandler } from '../netlify/functions/assistant.mjs';

test('valida mensagem e reduz contexto à allowlist', () => {
  assert.deepEqual(
    validateAssistantInput({ message: '  Como converter? ', context: { amount: '1', from: 'BRL', to: 'MXN', admin: true } }),
    { message: 'Como converter?', context: { amount: 1, from: 'BRL', to: 'MXN' } }
  );
  assert.equal(validateAssistantInput({ message: '', context: {} }), null);
  assert.equal(validateAssistantInput({ message: 'Oi', context: { amount: 1, from: 'XXX', to: 'BRL' } }), null);
});

test('extrai somente resposta textual limitada', () => {
  assert.equal(extractAssistantReply({ choices: [{ message: { content: ' Olá! ' } }] }), 'Olá!');
  assert.equal(extractAssistantReply({ choices: [] }), null);
  assert.equal(extractAssistantReply({ choices: [{ message: { content: 123 } }] }), null);
});

test('resposta educativa local mantém o tutor disponível', () => {
  const reply = fallbackAssistantReply({
    message: 'Como funciona a taxa de câmbio?',
    context: { amount: 100, from: 'BRL', to: 'USD' }
  });
  assert.match(reply, /taxa de câmbio/i);
  assert.match(reply, /100 de BRL para USD/);
});

test('configura rate limiting exato da Netlify', () => {
  assert.deepEqual(config, {
    path: '/.netlify/functions/assistant',
    rateLimit: { windowLimit: 10, windowSize: 60, aggregateBy: ['ip', 'domain'] }
  });
});

test('handler chama provedor e devolve somente reply', async () => {
  const previous = process.env.OPENROUTER_API_KEY;
  process.env.OPENROUTER_API_KEY = 'test-key';
  try {
    const handler = createAssistantHandler(async (_url, options) => {
      assert.equal(options.headers.Authorization, 'Bearer test-key');
      const payload = JSON.parse(options.body);
      assert.equal(payload.max_tokens, 300);
      return Response.json({ choices: [{ message: { content: 'Use os seletores de moedas.' } }] });
    });
    const response = await handler(new Request('https://example.test/.netlify/functions/assistant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Como uso?', context: { amount: 1, from: 'BRL', to: 'MXN' } })
    }));
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { reply: 'Use os seletores de moedas.' });
  } finally {
    if (previous === undefined) delete process.env.OPENROUTER_API_KEY;
    else process.env.OPENROUTER_API_KEY = previous;
  }
});

test('handler rejeita mídia, JSON e entrada inválidos', async () => {
  const handler = createAssistantHandler(async () => { throw new Error('não deve chamar'); });
  const wrongMedia = await handler(new Request('https://example.test/', { method: 'POST', body: '{}' }));
  assert.equal(wrongMedia.status, 415);
  const invalidJson = await handler(new Request('https://example.test/', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{'
  }));
  assert.equal(invalidJson.status, 400);
  const invalidInput = await handler(new Request('https://example.test/', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: '' })
  }));
  assert.equal(invalidInput.status, 400);
});

test('handler converte abort em timeout 504', async () => {
  const previous = process.env.OPENROUTER_API_KEY;
  process.env.OPENROUTER_API_KEY = 'test-key';
  try {
    const handler = createAssistantHandler((_url, { signal }) => new Promise((_resolve, reject) => {
      signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
    }), 5);
    const response = await handler(new Request('https://example.test/', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ message: 'Olá' })
    }));
    assert.equal(response.status, 200);
    assert.equal((await response.json()).source, 'fallback');
  } finally {
    if (previous === undefined) delete process.env.OPENROUTER_API_KEY;
    else process.env.OPENROUTER_API_KEY = previous;
  }
});
