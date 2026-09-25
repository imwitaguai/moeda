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

export function fallbackAssistantReply(input) {
  const question = input.message.toLocaleLowerCase("pt-BR");
  const context = input.context;
  const contextLine = context
    ? ` No conversor, você está usando ${context.amount} de ${context.from} para ${context.to}.`
    : "";

  if (/^(oi|olá|ola|bom dia|boa tarde|boa noite)/.test(question)) {
    return `Olá! Posso explicar moedas, países, câmbio e como usar o conversor.${contextLine}`;
  }
  if (/(como .*converter|como .*usar|usar .*conversor|converter)/.test(question)) {
    return `Escolha a moeda de origem e a de destino, informe um valor e toque em Converter. O resultado mostra quanto esse valor equivale na outra moeda.${contextLine}`;
  }
  if (/(câmbio|cambio|taxa|dólar|dolar|cotação|cotacao)/.test(question)) {
    return `A taxa de câmbio mostra a relação entre duas moedas. Ela pode mudar ao longo do dia; por isso o cartão de cotação informa se o valor exibido é de mercado ou educativo.${contextLine}`;
  }
  if (/(moeda|peso|real|iene|euro|libra)/.test(question)) {
    return `Cada país pode usar uma moeda diferente. Por exemplo, o Brasil usa o real (BRL), os Estados Unidos usam o dólar americano (USD) e o México usa o peso mexicano (MXN).`;
  }
  if (/(país|pais|capital|continente|bandeira)/.test(question)) {
    return `Na página Países, você pode explorar a bandeira, a capital, o continente e a moeda de cada local. Depois, toque em Converter para testar aquela moeda.`;
  }
  return `Posso ajudar com moedas, países, capitais, taxas de câmbio e o uso do conversor. Tente perguntar, por exemplo: “Como funciona o câmbio?” ou “Qual é a moeda do México?”.${contextLine}`;
}
