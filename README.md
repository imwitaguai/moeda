# Clube das Moedas

## Configuração segura na Netlify

1. Em **Site configuration > Environment variables**, adicione uma chave nova da AwesomeAPI como `AWESOMEAPI_KEY`.
2. Para o tutor de IA, adicione `GEMINI_API_KEY` (Gemini) ou `OPENROUTER_API_KEY` (OpenRouter). Gemini tem prioridade quando as duas estiverem configuradas.
3. Opcionalmente, configure `GEMINI_MODEL` (padrão: `gemini-2.5-flash`), `OPENROUTER_MODEL`, `SITE_URL` e `SITE_NAME` conforme o `.env.example`.
4. Configure um orçamento/limite de uso no provedor escolhido.
5. Faça um novo deploy e confirme no log que o rate limiting da Function `assistant` foi aplicado.

As chaves ficam somente nas Netlify Functions. Nunca salve credenciais reais no repositório ou em JavaScript enviado ao navegador. Chaves compartilhadas em mensagens ou código público devem ser revogadas.

## Desenvolvimento

Execute os testes com:

```bash
npm test
```

O conversor usa taxas educativas quando a AwesomeAPI não está configurada ou não fornece um par. O selo da interface informa claramente quando a cotação é real ou educativa.
