import { FOREIGN_CODES } from '../../currency-config.mjs';

const MIN_RATE = 1e-9;
const MAX_RATE = 1e12;

export function isValidRate(value) {
  return typeof value === 'number' && Number.isFinite(value) && value >= MIN_RATE && value <= MAX_RATE;
}

export function normalizeAwesomePayload(payload, expectedCodes = FOREIGN_CODES) {
  const rates = { BRL: 1 };
  const liveCodes = [];
  const updatedAtByCode = {};

  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    return { rates, liveCodes, updatedAtByCode };
  }

  for (const code of expectedCodes) {
    const quote = payload[`${code}BRL`];
    if (!quote || typeof quote !== 'object' || Array.isArray(quote)) continue;
    if (quote.code !== code || quote.codein !== 'BRL') continue;

    const bid = Number(quote.bid);
    if (!isValidRate(bid)) continue;
    const normalized = 1 / bid;
    if (!isValidRate(normalized)) continue;

    const timestamp = Number(quote.timestamp);
    if (!Number.isFinite(timestamp) || timestamp <= 0) continue;
    const updatedAt = new Date(timestamp * 1000);
    if (Number.isNaN(updatedAt.getTime())) continue;

    rates[code] = normalized;
    liveCodes.push(code);
    updatedAtByCode[code] = updatedAt.toISOString();
  }

  return { rates, liveCodes, updatedAtByCode };
}

export function convertAmount(amount, fromRate, toRate) {
  if (![amount, fromRate, toRate].every(value => typeof value === 'number' && Number.isFinite(value))) {
    throw new TypeError('Valores de conversão inválidos.');
  }
  if (amount < 0 || fromRate <= 0 || toRate <= 0) throw new RangeError('Valores fora do intervalo permitido.');
  return (amount / fromRate) * toRate;
}

