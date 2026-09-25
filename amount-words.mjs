export const CURRENCY_WORDS = {
  BRL: ['real', 'reais'],
  MXN: ['peso mexicano', 'pesos mexicanos'],
  ARS: ['peso argentino', 'pesos argentinos'],
  USD: ['dólar americano', 'dólares americanos'],
  CAD: ['dólar canadense', 'dólares canadenses'],
  CLP: ['peso chileno', 'pesos chilenos'],
  EGP: ['libra egípcia', 'libras egípcias'],
  JPY: ['iene japonês', 'ienes japoneses'],
  EUR: ['euro', 'euros'],
  AUD: ['dólar australiano', 'dólares australianos'],
  GBP: ['libra esterlina', 'libras esterlinas'],
};

export function toWords(value) {
  const units = [
    'zero',
    'um',
    'dois',
    'três',
    'quatro',
    'cinco',
    'seis',
    'sete',
    'oito',
    'nove',
  ];
  const teens = [
    'dez',
    'onze',
    'doze',
    'treze',
    'quatorze',
    'quinze',
    'dezesseis',
    'dezessete',
    'dezoito',
    'dezenove',
  ];
  const tens = [
    '',
    '',
    'vinte',
    'trinta',
    'quarenta',
    'cinquenta',
    'sessenta',
    'setenta',
    'oitenta',
    'noventa',
  ];
  const hundreds = [
    '',
    'cento',
    'duzentos',
    'trezentos',
    'quatrocentos',
    'quinhentos',
    'seiscentos',
    'setecentos',
    'oitocentos',
    'novecentos',
  ];

  const underOneThousand = (number) => {
    if (number < 10) return units[number];
    if (number < 20) return teens[number - 10];
    if (number < 100) {
      return (
        tens[Math.floor(number / 10)] +
        (number % 10 ? ' e ' + units[number % 10] : '')
      );
    }
    if (number === 100) return 'cem';
    return (
      hundreds[Math.floor(number / 100)] +
      (number % 100 ? ' e ' + underOneThousand(number % 100) : '')
    );
  };

  const num = Math.floor(Math.abs(Number(value) || 0));
  if (num === 0) return 'zero';

  const scales = [
    { value: 1e12, singular: 'trilhão', plural: 'trilhões' },
    { value: 1e9, singular: 'bilhão', plural: 'bilhões' },
    { value: 1e6, singular: 'milhão', plural: 'milhões' },
    { value: 1e3, singular: 'mil', plural: 'mil' },
    { value: 1, singular: '', plural: '' },
  ];

  let remaining = num;
  const parts = [];

  for (const scale of scales) {
    const count = Math.floor(remaining / scale.value);
    if (count > 0) {
      remaining %= scale.value;
      let text = '';
      if (scale.value === 1e3) {
        text = count === 1 ? 'mil' : `${underOneThousand(count)} mil`;
      } else if (scale.value >= 1e6) {
        text = `${underOneThousand(count)} ${count === 1 ? scale.singular : scale.plural}`;
      } else {
        text = underOneThousand(count);
      }
      parts.push({ count, scale: scale.value, text });
    }
  }

  if (parts.length === 1) return parts[0].text;

  let result = parts[0].text;
  for (let i = 1; i < parts.length; i++) {
    const prev = parts[i - 1];
    const curr = parts[i];
    const isLast = i === parts.length - 1;
    const isRoundHundredOrUnder100 =
      curr.count < 100 || (curr.count % 100 === 0 && curr.count < 1000);

    if (prev.scale === 1e3 && curr.scale === 1 && !isRoundHundredOrUnder100) {
      result += ' ' + curr.text;
    } else if (isLast && (isRoundHundredOrUnder100 || parts.length === 2)) {
      result += ' e ' + curr.text;
    } else {
      result += ', ' + curr.text;
    }
  }
  return result;
}

export function formatAmountInWords(value, currencyCode, customWords = CURRENCY_WORDS) {
  const [singular, plural] = customWords[currencyCode] || ['unidade', 'unidades'];
  const num = Math.max(0, Number(value) || 0);
  const integerPart = Math.floor(num);
  const cents = Math.round((num - integerPart) * 100);

  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  if (integerPart === 0 && cents > 0) {
    const centsText = toWords(cents) + (cents === 1 ? ' centavo' : ' centavos');
    return cap(`${centsText} de ${singular}`);
  }

  let text = toWords(integerPart);
  let currencySuffix = '';
  if (integerPart === 1) {
    currencySuffix = ' ' + singular;
  } else if (integerPart >= 1e6 && integerPart % 1e6 === 0) {
    currencySuffix = ' de ' + plural;
  } else {
    currencySuffix = ' ' + plural;
  }

  let result = cap(text + currencySuffix);
  if (cents > 0) {
    result += ` e ${toWords(cents)} ${cents === 1 ? 'centavo' : 'centavos'}`;
  }
  return result;
}

export function getAmountValue(rawValue) {
  const raw = String(rawValue || '').trim();
  if (!raw) return 0;
  const normalized = raw.replace(/\./g, '').replace(',', '.');
  const num = parseFloat(normalized);
  return Number.isFinite(num) && num >= 0 ? num : 0;
}

export function formatLiveInput(rawValue) {
  if (!rawValue) return { display: '', number: 0 };
  let val = String(rawValue).trim().replace(/\./g, '');

  const parts = val.split(',');
  let intPart = parts[0].replace(/\D/g, '');
  let decPart = null;

  if (parts.length > 1) {
    decPart = parts.slice(1).join('').replace(/\D/g, '').slice(0, 2);
  }

  if (intPart.length > 1) {
    intPart = intPart.replace(/^0+(?=\d)/, '');
  }

  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  let display = formattedInt;
  if (decPart !== null) {
    display += ',' + decPart;
  }

  const numVal = parseFloat((intPart || '0') + '.' + (decPart || '0')) || 0;
  return { display, number: numVal };
}

