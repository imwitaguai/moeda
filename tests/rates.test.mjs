import test from 'node:test';
import assert from 'node:assert/strict';
import { convertAmount, normalizeAwesomePayload } from '../netlify/functions/rates-core.mjs';
import { createRatesHandler } from '../netlify/functions/rates.mjs';

const quote = (code, bid, timestamp = '1790262000') => ({ code, codein: 'BRL', bid, timestamp });

test('normaliza MOEDA-BRL invertendo o bid', () => {
  const result = normalizeAwesomePayload({ USDBRL: quote('USD', '5') }, ['USD']);
  assert.equal(result.rates.BRL, 1);
  assert.equal(result.rates.USD, 0.2);
  assert.deepEqual(result.liveCodes, ['USD']);
  assert.match(result.updatedAtByCode.USD, /^\d{4}-\d{2}-\d{2}T/);
});

test('descarta bid e payload inconsistentes', () => {
  for (const bid of ['0', '-2', 'NaN', '', '1e20']) {
    const result = normalizeAwesomePayload({ USDBRL: quote('USD', bid) }, ['USD']);
    assert.deepEqual(result, { rates: { BRL: 1 }, liveCodes: [], updatedAtByCode: {} });
  }
  const wrongPair = normalizeAwesomePayload({ USDBRL: quote('EUR', '5') }, ['USD']);
  assert.deepEqual(wrongPair.liveCodes, []);
});

test('converte BRL→USD, USD→BRL e USD→EUR', () => {
  assert.equal(convertAmount(1, 1, 0.2), 0.2);
  assert.equal(convertAmount(1, 0.2, 1), 5);
  assert.equal(convertAmount(10, 0.2, 0.1), 5);
});

test('handler de cotações retorna contrato parcial seguro', async () => {
  const previous = process.env.AWESOMEAPI_KEY;
  process.env.AWESOMEAPI_KEY = 'test-key';
  let receivedHeaders;
  try {
    const handler = createRatesHandler(async (_url, options) => {
      receivedHeaders = options.headers;
      return Response.json({ USDBRL: quote('USD', '5') });
    });
    const response = await handler(new Request('https://example.test/.netlify/functions/rates?base=BRL'));
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.source, 'AwesomeAPI');
    assert.equal(body.rates.USD, 0.2);
    assert.deepEqual(body.liveCodes, ['USD']);
    assert.equal(receivedHeaders['x-api-key'], 'test-key');
  } finally {
    if (previous === undefined) delete process.env.AWESOMEAPI_KEY;
    else process.env.AWESOMEAPI_KEY = previous;
  }
});

test('handler rejeita método e base inválidos', async () => {
  const handler = createRatesHandler(async () => { throw new Error('não deve chamar'); });
  assert.equal((await handler(new Request('https://example.test/', { method: 'POST' }))).status, 405);
  assert.equal((await handler(new Request('https://example.test/?base=USD'))).status, 400);
});

test('handler converte abort em timeout 504', async () => {
  const previous = process.env.AWESOMEAPI_KEY;
  process.env.AWESOMEAPI_KEY = 'test-key';
  try {
    const handler = createRatesHandler((_url, { signal }) => new Promise((_resolve, reject) => {
      signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
    }), 5);
    const response = await handler(new Request('https://example.test/?base=BRL'));
    assert.equal(response.status, 504);
  } finally {
    if (previous === undefined) delete process.env.AWESOMEAPI_KEY;
    else process.env.AWESOMEAPI_KEY = previous;
  }
});

