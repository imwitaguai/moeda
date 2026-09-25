# Texto por extenso no smartphone

## Objetivo

Manter o valor monetário por extenso visível na experiência de smartphone do conversor, reproduzindo a hierarquia observada em `images/smart swat.png`.

## Escopo

- Reutilizar o elemento existente `#amount-in-words` e a atualização dinâmica já provida pelo JavaScript.
- Em viewport de smartphone, apresentar apenas o conteúdo textual por extenso logo abaixo do campo de valor.
- Ocultar o botão `Converter` no smartphone, conforme a referência; o resultado continua sendo recalculado automaticamente ao editar o valor ou alterar moedas.
- Preservar o visual e o comportamento existentes em desktop.

## Layout mobile

No formulário de conversão, o valor por extenso será exibido centralizado imediatamente após o campo monetário. Para `R$ 100,00`, o texto será `Cem reais`.

- Tipografia: tamanho secundário e peso regular, para não competir com o número inserido.
- Cor: cinza suave compatível com a referência.
- Espaçamento: curto entre o campo e o texto, antes dos seletores de moeda.
- No mobile, o ícone e o rótulo `Por extenso (em português)` deixam de aparecer; somente a frase é exibida.
- O conteúdo continua refletindo, em tempo real, o valor e a moeda de origem selecionados.
- O botão `Converter` não será exibido no smartphone, evitando um controle redundante entre a cotação e o resultado. Ele permanece disponível em desktop.

## Comportamento e estados

O formato por extenso continuará sendo calculado pela função existente. Valores com centavos e moedas diferentes devem conservar o texto gerado pela lógica atual. O texto não cria novos controles nem altera o cálculo de conversão.

## Verificação

1. Em smartphone, confirmar que `R$ 100,00` mostra `Cem reais` abaixo do campo, sem caixa, ícone ou rótulo adicional.
2. Alterar valor e moeda de origem para verificar a atualização do texto.
3. Conferir desktop para garantir que a apresentação anterior permanece inalterada.
4. Em smartphone, confirmar que o botão `Converter` não aparece e que a conversão continua atualizando automaticamente.
5. Executar `npm test`.
