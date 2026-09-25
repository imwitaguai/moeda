# Reconstrução fiel — tela Conversor (Tema México)

## Objetivo

Reproduzir, com alta fidelidade visual em desktop, a tela principal do conversor mostrada na referência `mexicotema.png`. A experiência deve continuar sendo um conversor de moedas funcional e manter as páginas Países, Aprenda e Alunos fora do escopo desta alteração.

## Escopo

- Aplicar o layout México somente à página principal do conversor.
- Usar imagens existentes em `images/` como ornamentos de cabeçalho, flores, cacto, pirâmide, moedas e sombrero.
- Preservar a seleção de moedas, troca de origem/destino, cálculo, atualização de cotação e estados de falha já implementados.
- Manter navegação e conteúdo das páginas secundárias sem alteração visual ou funcional intencional.
- Priorizar o viewport desktop correspondente à referência (aprox. 1254 px de largura); manter regras responsivas funcionais sem exigir reprodução pixel a pixel no mobile.
- Isolar todos os estilos e alterações de marcação pelo contexto da página do conversor e da classe `theme-mexico`; Países, Aprenda e Alunos não podem receber alterações por seletores globais.

## Layout e componentes

### Estrutura geral

O `app-shell` terá uma coluna lateral clara e uma área principal. A lateral exibe marca escolar, menu, cartão dos autores e cenário mexicano na base. O item Conversor é o estado ativo, com fundo verde escuro, texto branco e ornamento floral.

O conteúdo principal terá largura e espaçamento próximos à referência. O fundo será off-white com ilustrações mexicanas sutis no cabeçalho. O cabeçalho apresenta o título “Conversor de Moedas”, uma moeda dourada, o subtítulo, uma flor e o selo “Tema México”.

No viewport de validação de 1254 × 1254 px, a lateral terá cerca de 206 px e o conteúdo restante terá duas colunas de aproximadamente 700 px e 300 px, separadas por 18–24 px. A área principal terá espaçamento externo de 16–24 px. Os cartões superiores devem se alinhar no topo; o formulário terá cerca de 615–635 px de altura e os cartões informativos, cerca de 330 px e 275 px. A diferença visual aceitável é de até 8 px para espaçamentos e medidas não críticas; não pode haver sobreposição, corte de texto ou mudança de hierarquia.

### Conversor

A área superior será uma grade de duas colunas:

- À esquerda, cartão branco quente com título floral “Vamos converter?”, selo educativo, campo de valor, seletores de origem/destino, botão de troca, cartão de cotação, botão Converter e cartão de resultado verde-claro.
- À direita, dois cartões informativos empilhados: “Como funciona?” e “Você sabia?”, cada qual com regra divisória decorativa e ilustração contextual discreta.

O resultado exibirá montante, código, nome da moeda, equação da conversão e arte de moedas/pirâmide. O cartão de cotação expõe taxa de ida e volta e identifica, sem ambiguidade, uma cotação real, educativa, em carregamento ou indisponível.

Para coincidir com a referência, o tema México inicia e permanece como uma simulação educativa: o selo superior é “🎓 Simulação educativa - Taxa fictícia”, o cartão de cotação mostra “Taxa fictícia” e o rodapé mostra “Valores e cotações fictícias para fins educativos”. A conversão continua calculando normalmente com a tabela educativa determinística. Nenhuma fonte de mercado, data/hora ou estado de carregamento aparece nesta tela. A infraestrutura de cotação real existente pode permanecer para outros contextos, mas não deve substituir nem alterar esses textos no conversor México.

### Conversões comparativas e rodapé

A seção inferior lista a conversão atual para os demais países em uma grade. O destino selecionado recebe borda vermelha e faixa verde de destaque. O rodapé usa uma linha verde/vermelha, identificação do projeto e aviso de caráter educativo das taxas quando pertinente.

Com o padrão Brasil (BRL) → México (MXN) e valor 100,00, a grade segue esta ordem visual: México, Argentina, Estados Unidos, Canadá, Chile, Egito, Japão, França, Austrália e Reino Unido. Os valores ilustrativos da referência são, respectivamente, 350,00 MXN; 20.000,00 ARS; 20,00 USD; 27,00 CAD; 18.000,00 CLP; 900,00 EGP; 3.000,00 JPY; 16,00 EUR; 27,00 AUD; 14,00 GBP. Cada cartão mostra o par, bandeira, nome da moeda e código; México é o selecionado, com cabeçalho “Moeda Selecionada”. Ao mudar origem, destino ou valor, esses valores continuam sendo recalculados, preservando a ordem e o estado selecionado.

## Sistema visual

- Fonte: manter Baloo 2 para títulos/números e Nunito para conteúdo.
- Paleta: verde mexicano profundo para CTAs e estados ativos; vermelho da bandeira para alertas e contornos; branco quente/bege como fundo; verde suave, azul pálido, rosa e lilás nos cartões comparativos.
- Formas: cartões com cantos arredondados, sombras suaves e bordas sutis. Campos e botões seguem altura, raio e contraste da referência.
- Decoração: imagens não devem interceptar cliques, reduzir legibilidade ou comprometer o fluxo em larguras menores.

## Ativos

Os ativos existentes serão reutilizados com este mapeamento: `logo_escola.png`/`logoescola.png` para a marca escolar; `images/mx1.png` para a arte do cabeçalho; `images/mx2.png` para o cenário da lateral; `images/mx12.png` para flores; `images/mx5.png` para a moeda dourada do título; `images/mx11.png` para a pilha de moedas no resultado; `images/mx4.png` para a pirâmide; `images/mx3.png` para o sombrero; e `images/mx7.png` para cactos. As bandeiras usam os arquivos de bandeira já mapeados pelo JavaScript. Caso algum ativo falhe, o conteúdo e os controles continuam visíveis; o ornamento pode ser omitido sem substituir a imagem por conteúdo semântico incorreto.

## Dados, estados e falhas

O JavaScript atual continuará como a fonte de verdade de moedas e taxas educativas. A reconstrução visual não grava credenciais no cliente e não altera o contrato das Netlify Functions.

- Tela México: usar sempre os textos e a tabela de simulação educativa especificados acima.
- Erro de interação: entradas inválidas são normalizadas como já ocorre, sem quebrar o cálculo ou a grade.
- Mesma moeda: manter o estado neutro existente.

## Responsividade mínima

Até 1050 px, a área principal pode reduzir medidas e converter a grade superior em uma coluna, sem scroll horizontal. Abaixo de 700 px, a navegação lateral pode ser substituída pela barra móvel existente; campos de moeda, resultado e cartões comparativos devem caber na largura disponível, com a grade comparativa em uma ou duas colunas. Ornamentos decorativos podem reduzir ou ocultar para preservar conteúdo e alvos de toque.

## Verificação

1. Executar `npm test` para confirmar cálculo e fluxos do assistente existentes.
2. Conferir a tela principal em 1254 × 1254 px, comparando hierarquia, colunas, destaques, cores, espaçamento, textos, ordem da grade e ornamentos com `mexicotema.png`.
3. Verificar entrada de valor, seleção de moedas, inversão, botão Converter e cartões comparativos.
4. Verificar em desktop e mobile que a página principal não possui overflow horizontal e que todos os controles permanecem acessíveis.
5. Verificar por navegação e inspeção visual que páginas Países, Aprenda e Alunos continuam navegáveis e sem vazamento dos estilos exclusivos da tela México.
