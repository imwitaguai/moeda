import test from 'node:test';
import assert from 'node:assert/strict';
import { toWords, formatAmountInWords, getAmountValue, formatLiveInput } from '../amount-words.mjs';

test('converte valores inteiros básicos por extenso', () => {
  assert.equal(toWords(0), 'zero');
  assert.equal(toWords(1), 'um');
  assert.equal(toWords(2), 'dois');
  assert.equal(toWords(15), 'quinze');
  assert.equal(toWords(20), 'vinte');
  assert.equal(toWords(21), 'vinte e um');
  assert.equal(toWords(100), 'cem');
  assert.equal(toWords(105), 'cento e cinco');
  assert.equal(toWords(200), 'duzentos');
  assert.equal(toWords(999), 'novecentos e noventa e nove');
});

test('converte milhares por extenso', () => {
  assert.equal(toWords(1000), 'mil');
  assert.equal(toWords(1001), 'mil e um');
  assert.equal(toWords(1050), 'mil e cinquenta');
  assert.equal(toWords(1100), 'mil e cem');
  assert.equal(toWords(1150), 'mil cento e cinquenta');
  assert.equal(toWords(1500), 'mil e quinhentos');
  assert.equal(toWords(2000), 'dois mil');
  assert.equal(toWords(2024), 'dois mil e vinte e quatro');
  assert.equal(toWords(999999), 'novecentos e noventa e nove mil novecentos e noventa e nove');
});

test('converte milhões, bilhões e trilhões corretamente', () => {
  assert.equal(toWords(1000000), 'um milhão');
  assert.equal(toWords(1500000), 'um milhão e quinhentos mil');
  assert.equal(toWords(2000000), 'dois milhões');
  assert.equal(toWords(10000000), 'dez milhões');
  assert.equal(toWords(1000000000), 'um bilhão');
  assert.equal(toWords(1500000000), 'um bilhão e quinhentos milhões');
  assert.equal(toWords(1000000000000), 'um trilhão');
});

test('formata quantias em moeda respeitando singular, plural e preposição de', () => {
  assert.equal(formatAmountInWords(0, 'BRL'), 'Zero reais');
  assert.equal(formatAmountInWords(1, 'BRL'), 'Um real');
  assert.equal(formatAmountInWords(2, 'BRL'), 'Dois reais');
  assert.equal(formatAmountInWords(100, 'BRL'), 'Cem reais');
  assert.equal(formatAmountInWords(1000, 'BRL'), 'Mil reais');
  assert.equal(formatAmountInWords(1500, 'BRL'), 'Mil e quinhentos reais');
  assert.equal(formatAmountInWords(1000000, 'BRL'), 'Um milhão de reais');
  assert.equal(formatAmountInWords(1500000, 'BRL'), 'Um milhão e quinhentos mil reais');
  assert.equal(formatAmountInWords(2000000, 'BRL'), 'Dois milhões de reais');
  assert.equal(formatAmountInWords(1500000, 'USD'), 'Um milhão e quinhentos mil dólares americanos');
  assert.equal(formatAmountInWords(1000000, 'USD'), 'Um milhão de dólares americanos');
});

test('formata centavos quando presentes', () => {
  assert.equal(formatAmountInWords(1.5, 'BRL'), 'Um real e cinquenta centavos');
  assert.equal(formatAmountInWords(0.25, 'BRL'), 'Vinte e cinco centavos de real');
  assert.equal(formatAmountInWords(1500.5, 'BRL'), 'Mil e quinhentos reais e cinquenta centavos');
});

test('extrai valor numérico de strings formatadas com pontuação brasileira', () => {
  assert.equal(getAmountValue('30000'), 30000);
  assert.equal(getAmountValue('30.000'), 30000);
  assert.equal(getAmountValue('30.000,00'), 30000);
  assert.equal(getAmountValue('1.500.000,00'), 1500000);
  assert.equal(getAmountValue('100,50'), 100.5);
  assert.equal(getAmountValue(''), 0);
});

test('aplica pontuações em tempo real à digitação', () => {
  assert.deepEqual(formatLiveInput('30000'), { display: '30.000', number: 30000 });
  assert.deepEqual(formatLiveInput('30000,'), { display: '30.000,', number: 30000 });
  assert.deepEqual(formatLiveInput('30000,00'), { display: '30.000,00', number: 30000 });
  assert.deepEqual(formatLiveInput('1500000'), { display: '1.500.000', number: 1500000 });
  assert.deepEqual(formatLiveInput('1500000,50'), { display: '1.500.000,50', number: 1500000.5 });
});
