# Reconstrução fiel — tela Conversor (Tema México)

## Objetivo

Reproduzir, com alta fidelidade visual em desktop, a tela principal do conversor mostrada na referência `mexicotema.png`. A experiência deve continuar sendo um conversor de moedas funcional e manter as páginas Países, Aprenda e Alunos fora do escopo desta alteração.

## Escopo

- Aplicar o layout México somente à página principal do conversor.
- Usar imagens existentes em `images/` como ornamentos de cabeçalho, flores, cacto, pirâmide, moedas e sombrero.
- Preservar a seleção de moedas, troca de origem/destino, cálculo, atualização de cotação e estados de falha já implementados.
- Manter navegação e conteúdo das páginas secundárias sem alteração visual ou funcional intencional.
- Priorizar o viewport desktop correspondente à referência (aprox. 1254 px de largura); manter regras responsivas funcionais sem exigir reprodução pixel a pixel no mobile.

## Layout e componentes

### Estrutura geral

O `app-shell` terá uma coluna lateral clara e uma área principal. A lateral exibe marca escolar, menu, cartão dos autores e cenário mexicano na base. O item Conversor é o estado ativo, com fundo verde escuro, texto branco e ornamento floral.

O conteúdo principal terá largura e espaçamento próximos à referência. O fundo será off-white com ilustrações mexicanas sutis no cabeçalho. O cabeçalho apresenta o título “Conversor de Moedas”, uma moeda dourada, o subtítulo, uma flor e o selo “Tema México”.

### Conversor

A área superior será uma grade de duas colunas:

- À esquerda, cartão branco quente com título floral “Vamos converter?”, selo educativo, campo de valor, seletores de origem/destino, botão de troca, cartão de cotação, botão Converter e cartão de resultado verde-claro.
- À direita, dois cartões informativos empilhados: “Como funciona?” e “Você sabia?”, cada qual com regra divisória decorativa e ilustração contextual discreta.

O resultado exibirá montante, código, nome da moeda, equação da conversão e arte de moedas/pirâmide. O cartão de cotação expõe taxa de ida e volta e identifica, sem ambiguidade, uma cotação real, educativa, em carregamento ou indisponível.

### Conversões comparativas e rodapé

A seção inferior lista a conversão atual para os demais países em uma grade. O destino selecionado recebe borda vermelha e faixa verde de destaque. O rodapé usa uma linha verde/vermelha, identificação do projeto e aviso de caráter educativo das taxas quando pertinente.

## Sistema visual

- Fonte: manter Baloo 2 para títulos/números e Nunito para conteúdo.
- Paleta: verde mexicano profundo para CTAs e estados ativos; vermelho da bandeira para alertas e contornos; branco quente/bege como fundo; verde suave, azul pálido, rosa e lilás nos cartões comparativos.
- Formas: cartões com cantos arredondados, sombras suaves e bordas sutis. Campos e botões seguem altura, raio e contraste da referência.
- Decoração: imagens não devem interceptar cliques, reduzir legibilidade ou comprometer o fluxo em larguras menores.

## Dados, estados e falhas

O JavaScript atual continuará como a fonte de verdade de moedas e taxas. A reconstrução visual não muda o contrato das Netlify Functions nem grava credenciais no cliente.

- Carregando: sinalizar que a cotação está sendo consultada.
- Cotação real: identificar a fonte e data/hora.
- Alternativa educativa ou erro: exibir uma mensagem clara e taxa educativa temporária, sem impedir a conversão.
- Mesma moeda: manter o estado neutro existente.

## Verificação

1. Executar `npm test` para confirmar cálculo e fluxos do assistente existentes.
2. Conferir a tela principal em largura de referência, comparando hierarquia, colunas, destaques, cores, espaçamento e ornamentos com `mexicotema.png`.
3. Verificar entrada de valor, seleção de moedas, inversão, botão Converter e cartões comparativos.
4. Verificar que páginas Países, Aprenda e Alunos continuam navegáveis e inalteradas no escopo.
