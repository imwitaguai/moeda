export const CONVERTIBLE_CODES = Object.freeze([
  'BRL', 'MXN', 'ARS', 'USD', 'CAD', 'CLP', 'EGP', 'JPY', 'EUR', 'AUD', 'GBP'
]);

export const FOREIGN_CODES = Object.freeze(CONVERTIBLE_CODES.filter(code => code !== 'BRL'));

