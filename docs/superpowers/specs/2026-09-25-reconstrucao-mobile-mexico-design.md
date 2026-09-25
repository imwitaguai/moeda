# Reconstrução mobile — Conversor México

## Objetivo

Adaptar a página principal do conversor para smartphone (até 700 px) com alta fidelidade à referência `images/smart swat.png`, mantendo desktop e páginas secundárias inalterados.

## Estratégia

Aplicar somente regras CSS dentro do breakpoint mobile existente. A estrutura HTML, a lógica de conversão, a atualização de cotação, a seleção de moedas e a navegação atual são reutilizadas; não haverá duplicação de conteúdo ou lógica para mobile.

## Composição visual

### Cabeçalho

O topo móvel apresentará a marca, o controle de tema/configurações e um cenário mexicano alto. O título será exibido em duas linhas, com grande destaque, seguido do subtítulo. A arte de fundo, bandeira, igreja e cactos existentes serão ajustados por posicionamento e escala para reproduzir a hierarquia da referência sem bloquear controles.

### Cotação

O cartão de cotação aparece imediatamente após o cabeçalho: fundo branco quente, cantos amplos, título com ícone, selo de estado à direita, duas linhas de equivalência e data de atualização. Em largura pequena, o texto pode reduzir, mas as duas relações e o estado da cotação devem continuar legíveis.

### Conversor

O formulário será um cartão único claro:

- título `Valor para converter` à esquerda e campo monetário à direita;
- texto por extenso centralizado logo abaixo do campo;
- seletores `De` e `Para` lado a lado, com botão circular de inversão entre eles;
- sem o botão `Converter` no smartphone, porque as alterações já atualizam o resultado automaticamente.

### Resultado e navegação

O resultado terá cartão verde-claro arredondado, valor convertido em destaque, código e nome da moeda, equação e valor por extenso. As ilustrações existentes podem permanecer decorativas e reduzir em telas estreitas. A mensagem informativa permanece abaixo do resultado. A barra de navegação inferior continua fixa, com quatro itens e o conversor ativo.

## Limites e responsividade

- Todas as regras novas serão limitadas a `@media (max-width: 700px)` e ao contexto do tema México quando necessário.
- Não haverá overflow horizontal nem elementos decorativos sobre controles ou texto.
- Em telas muito estreitas (até 380 px), tipografia e espaçamento podem reduzir para preservar as duas moedas e o botão de troca.
- Desktop e páginas Países/Aprenda não receberão mudança visual intencional.

## Estados e acessibilidade

Estados de cotação real, educativa, carregamento ou erro mantêm os textos já produzidos pelo JavaScript. Controles de moeda, inversão, tema e navegação preservam suas áreas de toque, foco e rótulos acessíveis. A ocultação do botão de conversão não interfere no cálculo automático.

## Verificação

1. Conferir a página inicial em 700 px, 430 px e 380 px, comparando hierarquia, cor, espaçamento e cartões com a referência.
2. Alterar valor, origem, destino e usar a inversão; confirmar atualização da cotação, valor por extenso e resultado.
3. Verificar que o botão `Converter` não aparece no smartphone, mas permanece no desktop.
4. Confirmar que a barra inferior navega e que Países/Aprenda não receberam alteração visual involuntária.
5. Executar `npm test` e verificar a ausência de overflow horizontal.
