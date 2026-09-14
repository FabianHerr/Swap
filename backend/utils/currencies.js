// Currencies Swap accepts. One list for the form, the API validator, and (later) the offer parser,
// so a code can't be valid in one place and rejected in another.
const CURRENCIES = [
  { code: "USD", name: "US dollar" },
  { code: "CAD", name: "Canadian dollar" },
  { code: "EUR", name: "Euro" },
  { code: "GBP", name: "British pound" },
  { code: "CHF", name: "Swiss franc" },
  { code: "MXN", name: "Mexican peso" },
  { code: "COP", name: "Colombian peso" },
  { code: "ARS", name: "Argentine peso" },
  { code: "CLP", name: "Chilean peso" },
  { code: "PEN", name: "Peruvian sol" },
  { code: "BRL", name: "Brazilian real" },
  { code: "DOP", name: "Dominican peso" },
  { code: "HTG", name: "Haitian gourde" },
  { code: "MAD", name: "Moroccan dirham" },
  { code: "XOF", name: "West African CFA franc" },
  { code: "JPY", name: "Japanese yen" },
  { code: "CNY", name: "Chinese yuan" },
  { code: "INR", name: "Indian rupee" },
  { code: "PHP", name: "Philippine peso" },
  { code: "AUD", name: "Australian dollar" },
];

const CURRENCY_CODES = new Set(CURRENCIES.map((c) => c.code));

const isCurrencyCode = (code) => CURRENCY_CODES.has(code);

module.exports = { CURRENCIES, isCurrencyCode };
