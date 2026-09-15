// The only file that knows which AI provider Swap uses. The offer parser calls extractOffer(text) when
// its rules can't settle a message, and gets back fields or null. Null (no key, timeout, rate limit,
// bad JSON) is a normal answer: the user finishes the form, and posting never depends on this.
const { CURRENCIES } = require("../utils/currencies");

// gemini-2.5-flash returned 404 "no longer available to new users" (see DEBUG_LOG.md), so the model is a
// setting, not a constant. The fallback model is tried once when the first is overloaded (503) or rate limited (429).
const DEFAULT_MODEL = "gemini-3.6-flash";
const FALLBACK_MODEL = "gemini-3.5-flash-lite";
const TIMEOUT_MS = 8000;

const isLlmConfigured = () => Boolean(process.env.GEMINI_API_KEY);

const PROMPT = `You read one short message in which a person offers to swap cash in person, and extract the offer.
The person HAS cash in one currency (give) and WANTS cash in another currency (want).

Supported currencies (ISO codes): ${CURRENCIES.map((c) => `${c.code} (${c.name})`).join(", ")}.

Rules:
- giveAmount and wantAmount: only numbers actually written in the message, expanded ("2k" = 2000, "3 millones" = 3000000). If the message doesn't state an amount, return null. Never calculate an amount from an exchange rate.
- giveCurrency and wantCurrency: a supported ISO code. Return null when the message doesn't say which currency, or when a word could mean several (for example "dollars" or "pesos" with no country or city that settles it). Return null rather than guess.
- Give is what the person has, sells or offers. Want is what they need, want or ask for in return.
- If the message names more than two currencies, or isn't a cash swap offer, return nulls.
- ambiguities: for every null currency or unclear direction, one short sentence written to the person, like "\\"pesos\\" could be Mexican, Colombian or another peso. Choose the one you mean." Empty when nothing is unclear.

Examples:
"300 pesos for dollars" -> {"giveAmount":300,"giveCurrency":null,"wantAmount":null,"wantCurrency":null,"ambiguities":["\\"pesos\\" could be several currencies. Choose the one you mean.","\\"dollars\\" could be US, Canadian or Australian dollars. Choose the one you mean."]}
"back from Bogota with 200000 pesos, want Canadian money" -> {"giveAmount":200000,"giveCurrency":"COP","wantAmount":null,"wantCurrency":"CAD","ambiguities":[]}
"I'm in Toronto, got 150 US, need 200 dollars" -> {"giveAmount":150,"giveCurrency":"USD","wantAmount":200,"wantCurrency":"CAD","ambiguities":[]}
"echange 50 livres contre des euros" -> {"giveAmount":50,"giveCurrency":"GBP","wantAmount":null,"wantCurrency":"EUR","ambiguities":[]}`;

const nullable = (type) => ({ type, nullable: true });
const SCHEMA = {
  type: "OBJECT",
  properties: {
    giveAmount: nullable("NUMBER"),
    giveCurrency: nullable("STRING"),
    wantAmount: nullable("NUMBER"),
    wantCurrency: nullable("STRING"),
    ambiguities: { type: "ARRAY", items: { type: "STRING" } },
  },
  required: ["giveAmount", "giveCurrency", "wantAmount", "wantCurrency", "ambiguities"],
};

const offerFields = (parsed) => ({
  giveAmount: parsed.giveAmount ?? null,
  giveCurrency: parsed.giveCurrency ?? null,
  wantAmount: parsed.wantAmount ?? null,
  wantCurrency: parsed.wantCurrency ?? null,
  ambiguities: Array.isArray(parsed.ambiguities) ? parsed.ambiguities : [],
});

// Offer fields from one message, for the Post offer paste box
async function extractOffer(text) {
  const parsed = await generateJson(PROMPT, SCHEMA, text);
  return parsed && offerFields(parsed);
}

const INTENTS = ["fill_form", "search", "find_matches", "help"];

const ASSISTANT_PROMPT = `You route one message sent to the assistant of Swap, an app where people swap leftover cash in person.
Pick what the person wants Swap to do, and extract the currencies and amounts they mention.

intent:
- "fill_form": they want to post or create an offer of their own ("post 250 EUR for 370 CAD", "put up my yen").
- "search": they want to browse offers for a currency ("any offers selling euros?", "who has pesos colombianos").
- "find_matches": they say what they have and what they want and want to find someone to swap with ("I have 400 CAD and need COP", "who would take my dollars for euros").
- "help": anything else, or you're unsure.

Fields follow the person's point of view: give = the cash they have, want = the cash they want.
For "search", put the currency they are looking for in wantCurrency, or in giveCurrency if they want someone who takes their currency.

Supported currencies (ISO codes): ${CURRENCIES.map((c) => `${c.code} (${c.name})`).join(", ")}.

Rules:
- Amounts: only numbers actually written in the message ("2k" = 2000). Otherwise null. Never calculate an amount from an exchange rate.
- Currencies: a supported ISO code, or null when the message doesn't say which, or a word could mean several ("dollars", "pesos" with nothing that settles it). Return null rather than guess.
- ambiguities: one short sentence to the person for each null currency that they did mention ambiguously. Empty otherwise.

Examples:
"can you put up 5000 yen for me, I'd like 45 US dollars" -> {"intent":"fill_form","giveAmount":5000,"giveCurrency":"JPY","wantAmount":45,"wantCurrency":"USD","ambiguities":[]}
"is anybody selling swiss francs?" -> {"intent":"search","giveAmount":null,"giveCurrency":null,"wantAmount":null,"wantCurrency":"CHF","ambiguities":[]}
"got leftover reais from Rio, looking for someone who wants them for euros" -> {"intent":"find_matches","giveAmount":null,"giveCurrency":"BRL","wantAmount":null,"wantCurrency":"EUR","ambiguities":[]}
"what is this app" -> {"intent":"help","giveAmount":null,"giveCurrency":null,"wantAmount":null,"wantCurrency":null,"ambiguities":[]}`;

const ASSISTANT_SCHEMA = {
  ...SCHEMA,
  properties: { intent: { type: "STRING", enum: INTENTS }, ...SCHEMA.properties },
  required: ["intent", ...SCHEMA.required],
};

// What an assistant message asks for, plus its offer fields
async function interpretRequest(text) {
  const parsed = await generateJson(ASSISTANT_PROMPT, ASSISTANT_SCHEMA, text);
  if (!parsed) return null;
  return { intent: INTENTS.includes(parsed.intent) ? parsed.intent : "help", ...offerFields(parsed) };
}

// Runs one prompt, trying the fallback model once when the first is overloaded. Both attempts share
// one 8s budget, so a slow provider never holds the request longer than that. Null on any failure.
async function generateJson(prompt, schema, text) {
  if (!isLlmConfigured()) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const primary = process.env.GEMINI_MODEL || DEFAULT_MODEL;
    const first = await callModel(primary, prompt, schema, text, controller.signal);
    if (first.retry && primary !== FALLBACK_MODEL) {
      return (await callModel(FALLBACK_MODEL, prompt, schema, text, controller.signal)).value;
    }
    return first.value;
  } finally {
    clearTimeout(timer);
  }
}

// One generateContent call. `retry` says the failure was load, not a bad request.
async function callModel(model, prompt, schema, text, signal) {
  const started = Date.now();
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: prompt }] },
        contents: [{ role: "user", parts: [{ text }] }],
        generationConfig: {
          temperature: 0,
          responseMimeType: "application/json",
          responseSchema: schema,
          // A short extraction needs almost no reasoning; minimal thinking keeps the call around a second
          thinkingConfig: { thinkingLevel: "minimal" },
        },
      }),
      signal,
    });
    if (!res.ok) {
      // Log the status only: the body can echo the request, and the key travels in a header
      console.warn(JSON.stringify({ event: "llm_error", model, status: res.status, ms: Date.now() - started }));
      return { value: null, retry: res.status === 503 || res.status === 429 };
    }
    const data = await res.json();
    const output = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("");
    return { value: JSON.parse(output) };
  } catch (err) {
    const reason = err.name === "AbortError" ? "timeout" : err.name;
    console.warn(JSON.stringify({ event: "llm_error", model, reason, ms: Date.now() - started }));
    return { value: null, retry: false };
  }
}

module.exports = { extractOffer, interpretRequest, isLlmConfigured };
