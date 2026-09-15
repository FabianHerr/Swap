// Currencies Swap accepts. One list for the form, the API validator, and the offer parser,
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

// How people actually write each currency, in English, French and Spanish, for the offer parser.
// Written lowercase and without accents, because the parser normalizes text the same way.
// Every code also matches itself ("usd", "USD"), except PEN and MAD, which are ordinary English words
// and only count when written in capitals (see CAPS_ONLY_CODES).
const ALIASES = {
  USD: ["us$", "u.s. dollars", "us dollars", "us dollar", "american dollars", "american dollar", "bucks",
    "dollars americains", "dollar americain", "dolares americanos", "dolar americano", "dolares estadounidenses"],
  CAD: ["c$", "ca$", "canadian dollars", "canadian dollar", "loonies", "dollars canadiens", "dollar canadien",
    "huards", "dolares canadienses", "dolar canadiense"],
  AUD: ["a$", "au$", "australian dollars", "australian dollar", "dollars australiens", "dolares australianos"],
  EUR: ["€", "euros", "euro"],
  GBP: ["£", "british pounds", "pounds sterling", "pounds", "pound", "sterling", "quid", "livres sterling",
    "livre sterling", "libras esterlinas", "libra esterlina"],
  CHF: ["swiss francs", "swiss franc", "francs suisses", "franc suisse", "francos suizos"],
  MXN: ["mexican pesos", "mexican peso", "pesos mexicanos", "peso mexicano", "pesos mexicains"],
  COP: ["colombian pesos", "colombian peso", "pesos colombianos", "peso colombiano", "pesos colombiens"],
  ARS: ["argentine pesos", "argentinian pesos", "pesos argentinos", "pesos argentins"],
  CLP: ["chilean pesos", "pesos chilenos", "pesos chiliens"],
  PEN: ["peruvian soles", "peruvian sol", "soles peruanos", "soles"],
  BRL: ["r$", "brazilian reais", "brazilian real", "reais", "reales brasilenos", "real brasileno"],
  DOP: ["rd$", "dominican pesos", "pesos dominicanos"],
  HTG: ["haitian gourdes", "gourdes", "gourde"],
  MAD: ["moroccan dirhams", "dirhams", "dirham"],
  XOF: ["cfa francs", "francs cfa", "franc cfa", "fcfa", "cfa"],
  JPY: ["¥", "japanese yen", "yens", "yen"],
  CNY: ["chinese yuan", "renminbi", "yuan", "rmb"],
  INR: ["₹", "indian rupees", "rupees", "rupee", "roupies"],
  PHP: ["philippine pesos", "pesos philippins"],
};

const CAPS_ONLY_CODES = new Set(["PEN", "MAD"]);

// Words that name a currency without saying which one. The parser never picks for the user.
const AMBIGUOUS = {
  dollars: ["USD", "CAD", "AUD"],
  dollar: ["USD", "CAD", "AUD"],
  dolares: ["USD", "CAD", "AUD"],
  dolar: ["USD", "CAD", "AUD"],
  $: ["USD", "CAD", "AUD"],
  pesos: ["MXN", "COP", "ARS", "CLP", "DOP", "PHP"],
  peso: ["MXN", "COP", "ARS", "CLP", "DOP", "PHP"],
  francs: ["CHF", "XOF"],
  franc: ["CHF", "XOF"],
  francos: ["CHF", "XOF"],
};

module.exports = { CURRENCIES, isCurrencyCode, ALIASES, CAPS_ONLY_CODES, AMBIGUOUS };
