const { isCurrencyCode } = require("./currencies");

// A guard against junk input, not a limit on real swaps: 400 CAD is already over 1,000,000 COP
const MAX_AMOUNT = 100_000_000;

const normalizeCode = (code) => String(code ?? "").trim().toUpperCase();

const toNumber = (amount) => (amount === "" || amount == null ? NaN : Number(amount));

// A message for a bad amount, or undefined when it's fine. Shown under the field it belongs to.
function checkAmount(amount) {
  if (!Number.isFinite(amount) || amount <= 0) return "Enter an amount greater than 0";
  if (amount > MAX_AMOUNT) return `Amount can't be more than ${MAX_AMOUNT.toLocaleString("en-US")}`;
}

// Checks an offer's core fields. Used by the create-offer form now and by the offer parser later,
// so a parsed offer is held to exactly the same rules as a typed one.
// Returns the cleaned values plus one message per invalid field (empty object when valid).
function validateOffer({ giveAmount, giveCurrency, wantAmount, wantCurrency } = {}) {
  const value = {
    giveAmount: toNumber(giveAmount),
    giveCurrency: normalizeCode(giveCurrency),
    wantAmount: toNumber(wantAmount),
    wantCurrency: normalizeCode(wantCurrency),
  };
  const errors = {};

  const giveAmountError = checkAmount(value.giveAmount);
  if (giveAmountError) errors.giveAmount = giveAmountError;
  const wantAmountError = checkAmount(value.wantAmount);
  if (wantAmountError) errors.wantAmount = wantAmountError;

  if (!isCurrencyCode(value.giveCurrency)) errors.giveCurrency = "Choose a supported currency to give";
  if (!isCurrencyCode(value.wantCurrency)) errors.wantCurrency = "Choose a supported currency to receive";

  if (!errors.giveCurrency && value.giveCurrency === value.wantCurrency) {
    errors.wantCurrency = "You can't swap a currency for itself";
  }

  return { value, errors };
}

module.exports = { validateOffer, normalizeCode };
