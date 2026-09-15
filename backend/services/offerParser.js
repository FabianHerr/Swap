// Turns a sentence like "j'ai 250 euros, je cherche 370 dollars canadiens" into offer form fields.
//
// Rules first: they're free, predictable, and testable (scripts/eval-parser.js). Only text the rules
// can't settle (a bare "pesos", no direction, three currencies) goes to the LLM, and whatever comes
// back is validated with the same validateOffer the form uses. The result only fills the form; the
// user checks it and posts. It never invents an amount: Swap has no exchange rates to derive one from.
const { ALIASES, CAPS_ONLY_CODES, AMBIGUOUS } = require("../utils/currencies");
const { validateOffer } = require("../utils/validateOffer");
const { extractOffer, isLlmConfigured } = require("./llm");

const MAX_TEXT_LENGTH = 500;
const FIELDS = ["giveAmount", "giveCurrency", "wantAmount", "wantCurrency"];

// Normalization shared by every step: accents off ("dólares" → "dolares"), one kind of apostrophe,
// single spaces. Case is kept (PEN and MAD only count in capitals); matching uses a lowercase copy of
// the same length, so positions line up between the two.
function normalize(text) {
  return String(text ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’‘`´]/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

const isLetter = (ch) => Boolean(ch) && /[a-z]/.test(ch);

// Find `needle` in `haystack` as a whole word (symbols like "€" or "->" need no word boundary)
function findWord(haystack, needle, from = 0) {
  const found = [];
  for (let i = haystack.indexOf(needle, from); i !== -1; i = haystack.indexOf(needle, i + 1)) {
    const end = i + needle.length;
    if (isLetter(needle[0]) && isLetter(haystack[i - 1])) continue;
    if (isLetter(needle[needle.length - 1]) && isLetter(haystack[end])) continue;
    found.push({ start: i, end });
  }
  return found;
}

// ---------- Amounts ----------

// "1,200" "1.200,50" "1 750" "2k" "1.5m" "3 millones" "3 mil". Thousands groups must be exactly 3 digits.
const AMOUNT_RE =
  /(\d{1,3}(?:[ ,.]\d{3}(?!\d))+(?:[.,]\d{1,2}(?!\d))?|\d+(?:[.,]\d+)?)(?: ?(millions|millones|million|millon|mille|mil|thousand|grand|k|m)(?![a-z]))?/g;

const MULTIPLIERS = {
  k: 1e3, thousand: 1e3, grand: 1e3, mil: 1e3, mille: 1e3,
  m: 1e6, million: 1e6, millions: 1e6, millon: 1e6, millones: 1e6,
};

// A written number to a JS number, reading "," and "." the way the writer most likely meant them
function toNumber(raw) {
  let s = raw.replace(/ /g, "");
  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  if (lastComma !== -1 && lastDot !== -1) {
    // Both used: the last one is the decimal point ("1.200,50" or "1,200.50")
    const decimal = lastComma > lastDot ? "," : ".";
    s = s.split(decimal === "," ? "." : ",").join("").replace(decimal, ".");
  } else if (lastComma !== -1 || lastDot !== -1) {
    const parts = s.split(lastComma !== -1 ? "," : ".");
    // "1,200" and "1.150.000" are thousands; "1.5" and "12,50" are decimals
    const thousands = parts.length > 2 || parts[parts.length - 1].length === 3;
    s = parts.join(thousands ? "" : ".");
  }
  return Number(s);
}

function findAmounts(lower) {
  return [...lower.matchAll(AMOUNT_RE)].map((m) => {
    const value = toNumber(m[1]) * (MULTIPLIERS[m[2]] ?? 1);
    return { start: m.index, end: m.index + m[0].length, value: Math.round(value * 100) / 100 };
  });
}

// ---------- Currencies ----------

// Every way of writing a currency, longest first, so "dollars canadiens" wins over "dollars"
const CURRENCY_WORDS = [
  ...Object.entries(ALIASES).flatMap(([code, aliases]) => [
    { word: code.toLowerCase(), code, capsOnly: CAPS_ONLY_CODES.has(code) },
    ...aliases.map((word) => ({ word, code })),
  ]),
  ...Object.entries(AMBIGUOUS).map(([word, options]) => ({ word, code: null, options })),
].sort((a, b) => b.word.length - a.word.length);

function findCurrencies(normalized, lower) {
  const taken = [];
  const overlaps = (s, e) => taken.some((t) => s < t.end && e > t.start);
  const mentions = [];
  for (const entry of CURRENCY_WORDS) {
    for (const { start, end } of findWord(lower, entry.word)) {
      if (overlaps(start, end)) continue;
      if (entry.capsOnly && normalized.slice(start, end) !== entry.code) continue;
      taken.push({ start, end });
      mentions.push({ start, end, code: entry.code, options: entry.options ?? null, word: normalized.slice(start, end) });
    }
  }
  return mentions.sort((a, b) => a.start - b.start);
}

// ---------- Direction ----------

const CUES = [
  ...["have", "has", "got", "i've got", "holding", "selling", "sell", "sells", "offering", "offer", "giving",
    "give", "get rid of", "j'ai", "je vends", "vends", "je donne", "donne", "tengo", "vendo", "ofrezco", "doy",
    "cambio"].map((word) => ({ word, role: "give" })),
  ...["want", "wants", "need", "needs", "looking for", "for", "buying", "buy", "to", "into", "in exchange for",
    "exchange for", "cherche", "je cherche", "recherche", "veux", "voudrais", "besoin de", "contre", "pour",
    "en echange de", "busco", "quiero", "necesito", "por", "a cambio de", "->", "→", "=>", "="].map((word) => ({ word, role: "want" })),
];

// Short connectors only hint at a side; "I want" or "I have" says it outright. When the two disagree
// ("find me a match for 300 USD, I want 400 CAD"), the explicit words win.
const WEAK_CUES = new Set(["for", "to", "into", "pour", "por", "=", "->", "→", "=>"]);

// The cue word closest before a currency decides its side: "want to sell 200 USD" is selling.
// `strongOnly` ignores the connectors above.
function cueBefore(lower, from, to, strongOnly = false) {
  const segment = lower.slice(from, to);
  let best = null;
  for (const cue of CUES) {
    if (strongOnly && WEAK_CUES.has(cue.word)) continue;
    for (const { start, end } of findWord(segment, cue.word)) {
      if (!best || end > best.end || (end === best.end && start < best.start)) best = { start, end, role: cue.role };
    }
  }
  return best?.role ?? null;
}

// Which item is "give" and which is "want", or null when the cues don't settle it
function decideRoles(cues) {
  const giveFirst = cues[0] === "give" || cues[1] === "want";
  const wantFirst = cues[0] === "want" || cues[1] === "give";
  if (giveFirst === wantFirst) return null;
  return giveFirst ? ["give", "want"] : ["want", "give"];
}

// ---------- Rules ----------

// Returns the fields the rules are sure of, warnings, and whether an LLM should take a look.
function parseRules(text) {
  const normalized = normalize(text);
  const lower = normalized.toLowerCase();
  const amounts = findAmounts(lower);
  const mentions = findCurrencies(normalized, lower);
  const warnings = [];
  const fields = {};

  // Pair each amount with the currency written right after it ("250 euros", "3 millones de pesos")
  // or right before it ("€500", "US$ 600")
  const pairedAmounts = new Set();
  for (const amount of amounts) {
    const after = mentions.find((m) => m.amount === undefined && m.start >= amount.end
      && /^ ?(?:(?:de|of|en|in|d') ?)?$/.test(lower.slice(amount.end, m.start)));
    const before = [...mentions].reverse().find((m) => m.amount === undefined && m.end <= amount.start
      && /^ ?$/.test(lower.slice(m.end, amount.start)));
    const mention = after ?? before;
    if (!mention) continue;
    mention.amount = amount;
    pairedAmounts.add(amount);
  }

  // One currency written twice in a row ("400 CAD (canadian dollars)", "200 dollars CAD") is one mention
  const items = [];
  for (const m of mentions) {
    const prev = items[items.length - 1];
    const mStart = Math.min(m.start, m.amount?.start ?? m.start);
    const adjacent = prev && /^[\s(),/-]*$/.test(lower.slice(prev.end, mStart));
    const oneAmount = !(prev?.amount && m.amount);
    if (adjacent && oneAmount && (prev.code === m.code
      || (!prev.code && m.code && prev.options?.includes(m.code))
      || (prev.code && !m.code && m.options?.includes(prev.code)))) {
      items[items.length - 1] = {
        start: prev.start, end: Math.max(prev.end, m.end, m.amount?.end ?? 0),
        code: prev.code ?? m.code, options: null, word: prev.code ? prev.word : m.word, amount: prev.amount ?? m.amount,
      };
      continue;
    }
    items.push({ ...m, start: mStart, end: Math.max(m.end, m.amount?.end ?? 0) });
  }

  let needsLlm = false;
  const ambiguous = [];

  if (items.length === 0) {
    needsLlm = true;
    warnings.push({ message: "Couldn't tell which currencies you mean." });
  } else if (items.length > 2) {
    needsLlm = true;
    warnings.push({ message: "That mentions more than two currencies. Choose the two for this offer." });
  } else {
    const cueFor = (strongOnly) => items.map((item, i) => cueBefore(lower, i === 0 ? 0 : items[i - 1].end, item.start, strongOnly));
    const cues = cueFor(false);
    let roles;
    if (items.length === 1) {
      roles = [cues[0] === "want" ? "want" : "give"];
    } else {
      roles = decideRoles(cues) ?? decideRoles(cueFor(true));
      if (!roles) {
        // No cue at all, or cues that contradict each other: first-mentioned as "have" is only a guess
        roles = ["give", "want"];
        needsLlm = true;
        warnings.push({ message: "Couldn't tell which currency you have and which you want. Check both." });
      }
    }

    items.forEach((item, i) => {
      const role = roles[i];
      if (item.amount) fields[`${role}Amount`] = item.amount.value;
      if (item.code) {
        fields[`${role}Currency`] = item.code;
      } else {
        needsLlm = true;
        ambiguous.push({ word: item.word, options: item.options });
        warnings.push({ field: `${role}Currency`, message: `"${item.word}" could mean ${item.options.join(", ")}. Choose the one you mean.` });
      }
    });

    // A number the rules couldn't attach to a currency, while a currency is missing its amount
    if (amounts.some((a) => !pairedAmounts.has(a)) && items.some((item) => !item.amount)) needsLlm = true;
  }

  return { needsLlm, fields, warnings, ambiguous, amounts: amounts.map((a) => a.value) };
}

// ---------- Validation and the full pipeline ----------

// Keep only the fields that pass the same checks as the form; everything else becomes a warning,
// and every field still empty gets a note saying what to add.
function finalize(rawFields, rawWarnings) {
  const warnings = [...rawWarnings];
  const present = Object.fromEntries(Object.entries(rawFields).filter(([, v]) => v !== null && v !== undefined && v !== ""));
  const { value, errors } = validateOffer(present);
  const fields = {};
  for (const key of FIELDS) {
    if (!(key in present)) continue;
    if (errors[key]) warnings.push({ field: key, message: errors[key] });
    else fields[key] = value[key];
  }

  const missing = FIELDS.filter((key) => !(key in fields));
  if (missing.length === FIELDS.length && !warnings.some((w) => !w.field)) {
    warnings.unshift({ message: "Couldn't find an offer in that. Fill the form instead." });
  }
  const messages = {
    giveAmount: `Add how much ${fields.giveCurrency ? `${fields.giveCurrency} ` : ""}you have.`,
    giveCurrency: "Choose the currency you have.",
    wantAmount: `Add how much ${fields.wantCurrency ? `${fields.wantCurrency} ` : ""}you want for it. Swap never fills in a rate.`,
    wantCurrency: "Choose the currency you want.",
  };
  // With nothing filled, the general warning says enough; four "add this" notes would just be noise
  for (const key of Object.keys(fields).length ? missing : []) {
    if (!warnings.some((w) => w.field === key)) warnings.push({ field: key, message: messages[key] });
  }

  const seen = new Set();
  const unique = warnings.filter((w) => {
    const id = `${w.field ?? ""}|${w.message}`;
    return seen.has(id) ? false : seen.add(id);
  });
  return { complete: missing.length === 0, fields, warnings: unique, missing };
}

// Validate after the model, using what the rules already know about the same text: an amount that
// isn't written anywhere in it is a guess, so it goes; a currency picked for "francs" or "dollars" is
// the model's reading, so it stays with a warning. Shared by the parser and the assistant.
function checkLlmFields(rules, llm) {
  const warnings = (llm.ambiguities ?? []).filter(Boolean).map((message) => ({ message: String(message) }));
  const fields = {};
  for (const key of FIELDS) {
    const v = llm[key];
    if (v === null || v === undefined || v === "") continue;
    if (key.endsWith("Amount") && !rules.amounts.some((a) => Math.abs(a - Number(v)) < 0.005)) {
      warnings.push({ field: key, message: "Couldn't find that amount in your text. Add it yourself." });
      continue;
    }
    const guessedFrom = key.endsWith("Currency") && rules.ambiguous.find((a) => a.options.includes(String(v).toUpperCase()));
    if (guessedFrom) {
      warnings.push({ field: key, message: `Read "${guessedFrom.word}" as ${String(v).toUpperCase()}. Check that's the one you mean.` });
    }
    fields[key] = v;
  }
  return { fields, warnings };
}

// The whole pipeline. `allowLlm` may be a boolean or a function (the per-user rate limit), asked only
// when the rules actually need help. `meta` is for logs and the eval, not for the API response.
async function parseOffer(text, { allowLlm = true, extract = extractOffer } = {}) {
  const rules = parseRules(text);
  if (!rules.needsLlm) {
    return { source: "rules", ...finalize(rules.fields, rules.warnings), meta: { llm: "skipped" } };
  }

  const fallback = (llm, message) => ({
    source: "rules",
    ...finalize(rules.fields, [...rules.warnings, { message }]),
    meta: { llm },
  });

  if (!isLlmConfigured() && extract === extractOffer) {
    return fallback("unconfigured", "Couldn't fill everything automatically. Finish the form.");
  }
  const allowed = typeof allowLlm === "function" ? allowLlm() : allowLlm;
  if (!allowed) {
    return fallback("limited", "Couldn't fill everything automatically right now. Finish the form.");
  }

  const llm = await extract(text);
  if (!llm) return fallback("failed", "Couldn't fill everything automatically. Finish the form.");

  const { fields, warnings } = checkLlmFields(rules, llm);
  return { source: "llm", ...finalize(fields, warnings), meta: { llm: "ok" } };
}

module.exports = { parseOffer, parseRules, finalize, checkLlmFields, normalize, MAX_TEXT_LENGTH };
