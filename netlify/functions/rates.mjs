const allowedBases = new Set(['BRL', 'MXN', 'ARS', 'USD', 'CAD', 'CLP', 'EGP', 'JPY', 'EUR', 'AUD']);

function normalizeRates(payload) {
  const rates = payload.data || payload.rates || payload.conversion_rates;
  if (!rates || typeof rates !== 'object') return null;
  return Object.fromEntries(Object.entries(rates).filter(([, value]) => typeof value === 'number' && Number.isFinite(value)));
}

export default async request => {
  const base = new URL(request.url).searchParams.get('base') || 'BRL';
  if (!allowedBases.has(base)) return Response.json({ error: 'Moeda base inv\u00e1lida.' }, { status: 400 });
  const template = process.env.CURRENCY_API_URL_TEMPLATE;
  const key = process.env.CURRENCY_API_KEY;
  if (!template || !key) return Response.json({ error: 'Servi\u00e7o de cota\u00e7\u00e3o ainda n\u00e3o configurado.' }, { status: 503 });
  const apiUrl = template.replaceAll('{base}', encodeURIComponent(base)).replaceAll('{key}', encodeURIComponent(key));
  try {
    const response = await fetch(apiUrl, { headers: { Accept: 'application/json' } });
    if (!response.ok) return Response.json({ error: 'N\u00e3o foi poss\u00edvel consultar a cota\u00e7\u00e3o.' }, { status: 502 });
    const rates = normalizeRates(await response.json());
    if (!rates) return Response.json({ error: 'Formato de resposta da API n\u00e3o reconhecido.' }, { status: 502 });
    return Response.json({ base, rates, updatedAt: new Date().toISOString() }, { headers: { 'Cache-Control': 'public, max-age=900' } });
  } catch { return Response.json({ error: 'Falha de conex\u00e3o com o servi\u00e7o de cota\u00e7\u00e3o.' }, { status: 502 }); }
};
