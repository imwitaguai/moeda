import { CONVERTIBLE_CODES } from '../../currency-config.mjs';

const CODE_SET = new Set(CONVERTIBLE_CODES);

export function validateAssistantInput(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  if (typeof input.message !== 'string') return null;
  const message = input.message.trim();
  if (message.length < 1 || message.length > 1000) return null;

  let context;
  if (input.context !== undefined) {
    const source = input.context;
    if (!source || typeof source !== 'object' || Array.isArray(source)) return null;
    const amount = Number(source.amount);
    if (!Number.isFinite(amount) || amount < 0 || amount > 1e12) return null;
    if (!CODE_SET.has(source.from) || !CODE_SET.has(source.to)) return null;
    context = { amount, from: source.from, to: source.to };
  }

  return { message, ...(context ? { context } : {}) };
}

export function extractAssistantReply(payload) {
  const reply = payload?.choices?.[0]?.message?.content;
  if (typeof reply !== 'string' || !reply.trim()) return null;
  return reply.trim().slice(0, 4000);
}

