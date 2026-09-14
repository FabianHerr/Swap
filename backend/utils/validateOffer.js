const { isCurrencyCode } = require("./currencies");

const MAX_AMOUNT = 1_000_000;

const normalizeCode = (code) => String(code ?? "").trim().toUpperCase();

// Checks an offer's core fields. Used by the create-offer form now and by the offer parser later,
// so a parsed offer is held to exactly the same rules as a typed one.
// Returns the cleaned values plus one message per invalid field (empty object when valid).
function validateOffer({ amount, giveCurrency, wantCurrency } = {}) {
  const value = {
    amount: amount === "" || amount == null ? NaN : Number(amount),
    giveCurrency: normalizeCode(giveCurrency),
    wantCurrency: normalizeCode(wantCurrency),
  };
  const errors = {};

  if (!Number.isFinite(value.amount) || value.amount <= 0) {
    errors.amount = "Amount must be a number greater than 0";
  } else if (value.amount > MAX_AMOUNT) {
    errors.amount = `Amount can't be more than ${MAX_AMOUNT.toLocaleString("en-US")}`;
  }

  if (!isCurrencyCode(value.giveCurrency)) errors.giveCurrency = "Choose a supported currency to give";
  if (!isCurrencyCode(value.wantCurrency)) errors.wantCurrency = "Choose a supported currency to receive";

  if (!errors.giveCurrency && value.giveCurrency === value.wantCurrency) {
    errors.wantCurrency = "You can't swap a currency for itself";
  }

  return { value, errors };
}

module.exports = { validateOffer, normalizeCode };
