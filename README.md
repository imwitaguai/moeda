# Clube das Moedas

## Cota\u00e7\u00f5es reais

1. Publique na Netlify.
2. Em **Site configuration > Environment variables**, adicione `CURRENCY_API_KEY` com uma chave nova.
3. Adicione `CURRENCY_API_URL_TEMPLATE` com a URL da documenta\u00e7\u00e3o do provedor. Use `{base}` e `{key}` como marcadores.
4. Fa\u00e7a novo deploy. O site usar\u00e1 a Function `/.netlify/functions/rates` sem expor a chave.

O Supabase pode ser usado para autentica\u00e7\u00e3o ou hist\u00f3rico de convers\u00f5es, mas n\u00e3o \u00e9 necess\u00e1rio para proteger a consulta das cota\u00e7\u00f5es.
