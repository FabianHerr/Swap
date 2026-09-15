// "Ask Swap": one message in, one action out. The assistant can fill the Post offer form, search offers
// for a currency, or find open offers that match what someone has and wants. It never acts on its own:
// every result is something the person clicks (post, open offers, send a request) or ignores.
//
// Same approach as the offer parser: keyword rules decide the intent and the parser's rules read the
// currencies and amounts; Gemini is only asked when those can't settle the message, and what it
// returns goes through the same checks. Matching itself is plain arithmetic in matching.js.
const OfferModel = require("../models/Offer");
const SwapRequestModel = require("../models/SwapRequest");
const { parseRules, finalize, checkLlmFields, normalize } = require("./offerParser");
const { interpretRequest, isLlmConfigured } = require("./llm");
const { rankMatches } = require("./matching");
const { ownerProfiles } = require("./ownerProfiles");
const { isCurrencyCode } = require("../utils/currencies");

const MAX_MATCHES = 5;

const EXAMPLES = [
  "I have 400 CAD and want Colombian pesos",
  "Show me offers selling euros",
  "Post 250 EUR for 370 CAD",
];

// Explicit words for what the person wants done, in the order they win: asking to post beats
// everything, asking for a match beats a plain search. EN / FR / ES, written without accents.
const INTENT_WORDS = [
  ["fill_form", ["post", "create", "publish", "put up", "list my", "make an offer", "new offer",
    "publier", "publie", "poster", "creer une offre", "publicar", "publica", "crear una oferta"]],
  ["find_matches", ["match", "matches", "matching", "who wants", "who would take", "swap with", "trade with",
    "someone to swap", "someone who wants", "compatible", "coincide", "coincidencias", "correspond"]],
  ["search", ["show", "search", "browse", "list", "any offers", "offers selling", "offers for", "offers with",
    "who has", "who is selling", "who's selling", "anyone selling", "anybody selling", "look up", "busca",
    "buscar", "muestra", "hay ofertas", "cherche des offres", "montre", "affiche", "qui vend", "quien vende"]],
];

// "who wants my euros": a search for offers that take your currency rather than sell it
const TAKES_MINE = /(^|[^a-z])(who wants|who would take|takes? my|for my|accepts? my|buy my|buying my|quiere mis|veut mes|prend mes)([^a-z]|$)/;

const hasWord = (lower, word) => new RegExp(`(^|[^a-z])${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z]|$)`).test(lower);

function detectIntent(lower) {
  for (const [intent, words] of INTENT_WORDS) {
    if (words.some((word) => hasWord(lower, word))) return intent;
  }
  return null;
}

// What the rules alone make of a message. Pure, so the eval can check it without a database.
function planFromRules(text) {
  const lower = normalize(text).toLowerCase();
  const rules = parseRules(text);
  const keyword = detectIntent(lower);
  const known = ["giveCurrency", "wantCurrency"].filter((k) => rules.fields[k]).length;
  const mentioned = known + rules.ambiguous.length;

  // No keyword: two currencies read as "find me someone to swap with", one as a search
  let intent = keyword;
  if (!intent && mentioned >= 2) intent = "find_matches";
  else if (!intent && mentioned === 1) intent = "search";
  // "who wants my yen?" asks for a match but names one currency: that's a search for offers that take it
  if (intent === "find_matches" && mentioned === 1) intent = "search";

  // A search only needs a currency, so it doesn't spend an AI call on direction or amounts
  const wantsLlm = intent === null || (rules.needsLlm && intent !== "search");
  return { lower, rules, keyword, intent, wantsLlm };
}

// Offers-page filters from a search message: `need` = offers that sell it, `have` = offers that want it
function searchFilters(plan, fields, source) {
  const codes = (list) => list.filter((c) => isCurrencyCode(c));
  if (source === "llm") {
    const [have] = codes([fields.giveCurrency]);
    const [need] = codes([fields.wantCurrency]);
    return { ...(have && { have }), ...(need && { need }) };
  }
  const found = codes([fields.giveCurrency, fields.wantCurrency]);
  if (found.length === 2) return { have: fields.giveCurrency, need: fields.wantCurrency };
  if (found.length === 1) return TAKES_MINE.test(plan.lower) ? { have: found[0] } : { need: found[0] };
  return {};
}

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

function help(message, warnings = []) {
  return {
    action: "help",
    message: message ?? "I can fill an offer for you, search offers for a currency, or find people to swap with.",
    examples: EXAMPLES,
    warnings: warnings.filter((w) => !w.field),
  };
}

async function handleMessage(text, { userId, allowLlm = true } = {}) {
  const plan = planFromRules(text);
  let { intent } = plan;
  let { fields, warnings } = plan.rules;
  let source = "rules";
  let llm = "skipped";

  if (plan.wantsLlm) {
    if (!isLlmConfigured()) llm = "unconfigured";
    else if (!(typeof allowLlm === "function" ? allowLlm() : allowLlm)) llm = "limited";
    else {
      const read = await interpretRequest(text);
      if (!read) {
        llm = "failed";
      } else {
        llm = "ok";
        source = "llm";
        // Words the person actually wrote ("post", "match") outrank the model's reading of them
        intent = plan.keyword ?? read.intent;
        ({ fields, warnings } = checkLlmFields(plan.rules, read));
      }
    }
    if (llm !== "ok" && plan.rules.needsLlm && intent) {
      warnings = [...warnings, { message: "Couldn't read everything automatically. Check the details." }];
    }
  }

  // Same rule as planFromRules, for what the model read: one currency and a match request is a search
  const currencies = ["giveCurrency", "wantCurrency"].filter((k) => isCurrencyCode(String(fields[k] ?? "").toUpperCase()));
  if (source === "llm" && intent === "find_matches" && currencies.length === 1) intent = "search";

  const meta = { intent: intent ?? "help", llm };
  const done = (response) => ({ source, ...response, meta });

  if (intent === "fill_form") {
    const offer = finalize(fields, warnings);
    return done({
      action: "fill_form",
      message: offer.complete
        ? "Here's your offer. Check it, then post it."
        : "I filled what I could. Add the rest before you post.",
      fields: offer.fields,
      complete: offer.complete,
      warnings: offer.warnings,
      rawInput: text.trim(),
    });
  }

  if (intent === "search") {
    const filters = searchFilters(plan, fields, source);
    if (!filters.have && !filters.need) {
      return done(help('Which currency should I look for? Try "Show me offers selling euros".', warnings));
    }
    const count = await OfferModel.countDocuments({
      status: "open",
      owner: { $ne: userId },
      ...(filters.need && { giveCurrency: filters.need }),
      ...(filters.have && { wantCurrency: filters.have }),
    });
    const what = [filters.need && `selling ${filters.need}`, filters.have && `${filters.need ? "for" : "that want"} ${filters.have}`]
      .filter(Boolean).join(" ");
    return done({
      action: "search",
      // Your own offers aren't counted, so say whose these are (the Offers page lists yours too)
      message: `${plural(count, "open offer", "open offers")} from other people ${what}.`,
      filters,
      count,
      warnings: warnings.filter((w) => !w.field),
    });
  }

  if (intent === "find_matches") {
    const offer = finalize(fields, warnings);
    const { giveCurrency: have, wantCurrency: want } = offer.fields;
    if (!have || !want) {
      return done(help('Tell me both currencies, what you have and what you want. For example: "I have 400 CAD and want COP".', offer.warnings));
    }

    const filter = { status: "open", owner: { $ne: userId }, giveCurrency: want, wantCurrency: have };
    const [candidates, total] = await Promise.all([
      OfferModel.find(filter).sort({ createdAt: -1 }).limit(50).lean(),
      OfferModel.countDocuments(filter),
    ]);
    const ranked = rankMatches(candidates, offer.fields).slice(0, MAX_MATCHES);
    const [profiles, requests] = await Promise.all([
      ownerProfiles(ranked.map(({ offer: o }) => o.owner)),
      SwapRequestModel.find({ requester: userId, offer: { $in: ranked.map(({ offer: o }) => o._id) } }, "offer").lean(),
    ]);
    const requested = new Set(requests.map((r) => String(r.offer)));

    return done({
      action: "find_matches",
      message: total
        ? `${plural(total, "open offer from someone else sells", "open offers from other people sell")} ${want} for ${have}.`
        : `No open offers sell ${want} for ${have} yet. Post yours so the next person looking finds it.`,
      fields: offer.fields,
      complete: offer.complete,
      warnings: offer.warnings,
      rawInput: text.trim(),
      filters: { have, need: want },
      total,
      matches: ranked.map(({ offer: o, reasons }) => ({
        ...o,
        ownerProfile: profiles[o.owner] ?? null,
        reasons,
        requested: requested.has(String(o._id)),
      })),
    });
  }

  return done(help(undefined, warnings));
}

module.exports = { handleMessage, planFromRules, searchFilters, EXAMPLES };
