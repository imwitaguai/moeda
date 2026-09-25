# Assistente de IA e cotações reais

## Objetivo

Adicionar ao Clube das Moedas um tutor educativo de IA e usar cotações atuais da AwesomeAPI quando houver dados válidos para as moedas selecionadas. Toda credencial permanecerá exclusivamente no ambiente da Netlify.

## Escopo

- Manter o site estático e a hospedagem atual.
- Usar duas Netlify Functions independentes: uma para cotações e outra para o assistente.
- Abrir o Conversor com valor `1`, origem `Brasil · BRL` e destino `México · MXN`.
- Manter ambos os seletores editáveis para qualquer moeda conversível disponível.
- Identificar a procedência de cada taxa para nunca apresentar um valor educativo como cotação real.
- Adicionar um assistente compacto que ensina moedas, países, câmbio e orienta o uso do conversor.

## Lista canônica de moedas

O frontend e a Function de cotações usarão a mesma lista canônica: `BRL`, `MXN`, `ARS`, `USD`, `CAD`, `CLP`, `EGP`, `JPY`, `EUR`, `AUD` e `GBP`. `ANT` não é conversível e não participa das consultas.

Se a AwesomeAPI não oferecer um par ou devolver dados inválidos, somente essa moeda permanecerá com a taxa educativa. Uma conversão só será rotulada como real quando toda moeda selecionada diferente de `BRL` tiver procedência real; `BRL` é a âncora com taxa 1 e não precisa de cotação própria. Qualquer conversão que dependa de uma taxa educativa será identificada como `Taxa educativa temporária`. BRL → BRL será um estado neutro, `Mesma moeda · sem conversão de mercado`, sem selo ou horário de cotação real.

## Arquitetura

### Function de cotações

`netlify/functions/rates.mjs` aceitará somente `GET` com `base=BRL`. Outros métodos retornarão `405`; base ausente será tratada como `BRL`, e outra base retornará `400`.

A Function consultará, em uma única chamada, o endpoint:

```text
https://economia.awesomeapi.com.br/json/last/MXN-BRL,ARS-BRL,USD-BRL,CAD-BRL,CLP-BRL,EGP-BRL,JPY-BRL,EUR-BRL,AUD-BRL,GBP-BRL
```

A credencial será lida de `process.env.AWESOMEAPI_KEY` e enviada no header `x-api-key`. O token não fará parte da URL, resposta ou logs.

Na AwesomeAPI, o `bid` de `USD-BRL` representa BRL por 1 USD. No frontend, `perBRL` representa unidades da moeda por 1 BRL. Portanto, para cada par `MOEDA-BRL`, a normalização obrigatória será:

```text
rates.MOEDA = 1 / Number(payload.MOEDABRL.bid)
rates.BRL = 1
```

Exemplo verificável: `USDBRL.bid = "5"` produz `rates.USD = 0.2`.

A resposta de sucesso terá o contrato:

```json
{
  "base": "BRL",
  "rates": { "BRL": 1, "USD": 0.2 },
  "liveCodes": ["USD"],
  "updatedAtByCode": { "USD": "2026-09-24T15:00:00.000Z" },
  "source": "AwesomeAPI"
}
```

`source` e `liveCodes` são obrigatórios. `liveCodes` conterá somente moedas estrangeiras com taxa válida; `BRL` nunca será incluído. Cada item de `updatedAtByCode` será derivado do `timestamp` do provedor, não do relógio da Function. A Function retornará `200` se houver ao menos uma moeda estrangeira válida e poderá retornar um subconjunto. O frontend aplicará procedência por código, evitando um modo global de taxa real. Se nenhum par for válido, retornará `502`.

Cada entrada exige chave esperada, códigos coerentes, `bid` numérico, positivo, finito e dentro do intervalo defensivo `1e-9` a `1e12`. Entradas duplicadas, desconhecidas ou com estrutura inesperada serão ignoradas. A requisição terá timeout de 5 segundos. Respostas de sucesso usarão `Cache-Control: public, max-age=300, stale-while-revalidate=60`.

Erros seguirão `{ "error": { "code": "CODIGO", "message": "mensagem segura" } }`, com `400`, `405`, `502`, `503` ou `504`, sem refletir corpo ou detalhes do provedor.

### Function do assistente

`netlify/functions/assistant.mjs` será stateless e aceitará somente `POST` com `Content-Type: application/json`. O corpo terá limite máximo de 16 KiB antes do parse e o schema:

```json
{
  "message": "string entre 1 e 1000 caracteres",
  "context": { "amount": 1, "from": "BRL", "to": "MXN" }
}
```

`context` é opcional. Quando presente, `amount` deve ser finito entre 0 e `1e12`, e `from`/`to` devem pertencer à lista canônica de moedas conversíveis. Campos extras serão descartados.

A Function usará `process.env.OPENROUTER_API_KEY` para chamar `POST https://openrouter.ai/api/v1/chat/completions`. O modelo será configurável por `OPENROUTER_MODEL`; a requisição usará `max_tokens: 300`, temperatura baixa e timeout de 15 segundos. A resposta será aceita somente se `choices[0].message.content` for string não vazia e terá o contrato `200 { "reply": "string" }`, limitado a 4000 caracteres.

O prompt de sistema definirá o assistente como tutor educativo, com respostas curtas, apropriadas para estudantes e focadas em moedas, países, câmbio e uso do conversor. O contexto do usuário será tratado como dado, não como instrução privilegiada.

Erros usarão o mesmo envelope seguro, com `400` para entrada inválida, `405` para método, `413` para corpo excessivo, `415` para mídia incorreta, `429` para limite, `502` para resposta inválida do provedor, `503` para configuração ausente e `504` para timeout.

A Function exportará configuração estática de rate limiting da Netlify no caminho `/.netlify/functions/assistant`: 10 requisições por 60 segundos, agregadas por IP e domínio. O painel da OpenRouter também deverá ter orçamento/limite de uso configurado. O rate limiting reduz abuso, mas não será tratado como autenticação absoluta.

### Frontend do Conversor

Na primeira inicialização, o Conversor usará `amount = 1`, `from = BRL` e `to = MXN`. Navegar entre páginas preservará escolhas feitas pelo usuário. CTAs de moedas podem definir explicitamente BRL como origem e a moeda do cartão como destino; isso é intencional e não redefine outras escolhas fora dessa ação. A troca de moedas continuará funcional.

Cada moeda manterá uma taxa educativa imutável e um snapshot atual de taxa/procedência (`live` ou `educational`). Cada resposta `200` substituirá integralmente o snapshot anterior: primeiro todas as moedas estrangeiras retornam à taxa e procedência educativas; depois somente as entradas coerentes da nova resposta são promovidas a `live`. Assim, código ausente na resposta mais recente nunca conserva procedência real antiga.

Antes de alterar o estado, o frontend exigirá `base === "BRL"`, `source === "AwesomeAPI"` e `rates.BRL === 1`. Uma moeda estrangeira só será promovida a `live` se o mesmo código estiver simultaneamente em `rates`, `liveCodes` e `updatedAtByCode`, com taxa conhecida, positiva, finita e dentro da magnitude defensiva, além de timestamp ISO válido. Entradas inconsistentes permanecem educativas. Qualquer par com ao menos um lado estrangeiro educativo será rotulado como fallback; BRL → BRL usará o estado neutro definido acima.

As superfícies de procedência terão estados consistentes:

- `loading`: texto neutro `Carregando cotação...`, sem afirmar que é real;
- `live`: `Cotação real · AwesomeAPI` e horário do dado mais antigo entre as moedas usadas no cálculo;
- `fallback`: texto exato `Taxa educativa temporária`;
- `error`: mantém o fallback, informa indisponibilidade e oferece `Tentar novamente` sem recarregar a página.

O cabeçalho do cartão, selo da cotação, texto abaixo do resultado, minicards afetados e rodapé não poderão contradizer o estado atual. Conteúdo didático sobre exemplos fictícios poderá permanecer assim identificado. Respostas antigas serão ignoradas com `AbortController`/identificador de requisição para não sobrescrever tentativas mais recentes.

### Frontend do assistente

O chat será um painel compacto e responsivo, com histórico apenas na memória da página. O envio ficará desabilitado enquanto houver uma requisição ativa. Perguntas e respostas serão inseridas exclusivamente com `textContent` ou nós de texto; não haverá renderização de HTML, Markdown ou links.

O cliente validará o limite de 1000 caracteres, mostrará estados de envio/erro e permitirá nova tentativa. Mensagens de erro serão locais e genéricas; corpos, headers, prompts e respostas do provedor não serão registrados no console nem exibidos.

## Fluxo de dados

1. O site inicia com BRL → MXN e valor 1.
2. O frontend solicita `/.netlify/functions/rates?base=BRL` e mostra o estado neutro.
3. A Function consulta a AwesomeAPI com a chave no header, valida cada par e inverte cada `bid`.
4. O frontend substitui o snapshot anterior, promove somente códigos coerentes e calcula a procedência do par selecionado.
5. Dados ausentes ou falha preservam as taxas educativas com rótulo inequívoco.
6. No chat, o navegador envia apenas mensagem e contexto permitido à Function `assistant`.
7. A Function valida, aplica instruções educativas e consulta a OpenRouter.
8. O frontend apresenta a resposta como texto simples.

## Segurança e configuração

Nenhuma chave será gravada no repositório, enviada ao navegador ou registrada. Chaves anteriormente compartilhadas em conversa devem ser revogadas e substituídas diretamente no painel da Netlify.

Variáveis cadastradas diretamente na Netlify:

- `AWESOMEAPI_KEY`
- `OPENROUTER_API_KEY`
- `OPENROUTER_MODEL` (opcional)
- `SITE_URL` (opcional, usado apenas como identificação na OpenRouter)
- `SITE_NAME` (opcional)

O `.env.example` conterá somente marcadores não secretos. `Origin`, `SITE_URL` e o prompt não serão tratados como autenticação. O deploy log deverá confirmar que a regra de rate limiting foi aplicada.

## Organização para testes

A normalização da AwesomeAPI, validação do contexto e conversão serão funções puras exportáveis. Chamadas `fetch` aceitarão injeção ou serão isoladas para permitir mocks sem rede.

Testes unitários obrigatórios:

- `USD-BRL bid=5` resulta em `rates.USD=0.2`;
- BRL→USD, USD→BRL e USD→EUR produzem valores esperados;
- `bid` zero, negativo, `NaN`, ausente, fora do limite e payload parcial não promovem taxa educativa a real;
- payload com divergência entre `rates`, `liveCodes` e `updatedAtByCode`, timestamp inválido, `base` ou `source` incorretos permanece educativo;
- duas respostas sucessivas comprovam que um código ausente na segunda volta ao snapshot educativo;
- GBP faz parte da lista canônica; par inexistente preserva fallback somente para essa moeda;
- timeout, resposta não JSON, método/base/content-type inválidos e configuração ausente retornam status e envelope previstos;
- saída inválida da IA é rejeitada e nenhum erro reflete dados do provedor;
- mensagens e respostas usam renderização textual, não `innerHTML`.

Haverá ao menos um teste integrado dos estados `loading`, `live`, `fallback` e `error`, incluindo nova tentativa e prevenção de resposta obsoleta.

## Critérios de aceitação

- Na primeira abertura, `#amount` vale `1`, `#from` vale `BRL` e `#to` vale `MXN`.
- Os seletores e o botão de troca permanecem editáveis e funcionais.
- Para fixture `USDBRL.bid = 5`, R$ 1 converte para USD 0,20 e USD 1 converte para R$ 5,00.
- Um par com ambos os códigos `live` exibe `Cotação real · AwesomeAPI` e horário do provedor.
- Payload parcial nunca rotula como real um cálculo que usa taxa educativa.
- BRL → BRL exibe `Mesma moeda · sem conversão de mercado`, sem horário de mercado.
- Falha, configuração ausente ou dados inválidos exibem exatamente `Taxa educativa temporária` e oferecem nova tentativa.
- Nenhuma superfície simultânea contradiz a procedência da conversão atual.
- O assistente aceita até 1000 caracteres, orienta o conversor e responde sobre moedas, países e câmbio.
- Um teste automatizado inspeciona a configuração estática da Function e exige exatamente `windowLimit: 10`, `windowSize: 60` e `aggregateBy: ["ip", "domain"]` no caminho do assistente.
- Um smoke test no domínio publicado, executado após a propagação da regra documentada pela Netlify, confirma efetivamente resposta `429` para a 11ª requisição do mesmo IP/domínio dentro da janela.
- O chat e o Conversor permanecem utilizáveis em viewport de 360 px e em desktop.
- Busca por padrões `sk-`, `sb_`, `Bearer ` e nomes de variáveis não encontra valores reais no repositório ou bundle; marcadores do `.env.example` são permitidos.
- O domínio publicado valida uma cotação real BRL → MXN e uma resposta do assistente sem expor credenciais em HTML, JavaScript, rede do navegador ou logs.

## Implantação

Após os testes locais, as mudanças serão commitadas e enviadas ao GitHub. O deploy da Netlify usará o repositório existente. O responsável cadastrará chaves novas diretamente no painel, configurará orçamento na OpenRouter e acionará novo deploy. A implantação só será concluída após confirmar a regra de rate limiting no log e validar os critérios no domínio publicado.
