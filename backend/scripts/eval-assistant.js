// Checks "Ask Swap" without a database or network: the intent rules against scripts/assistant-fixtures.json,
// and the match ranking against a small in-memory list of offers.
//   npm run eval:assistant
// Rerun it after changing intent words or the ranking; it exits non-zero when a case fails.
const { planFromRules, searchFilters } = require("../services/assistant");
const { finalize } = require("../services/offerParser");
const { rankMatches } = require("../services/matching");
const { intents, matching } = require("./assistant-fixtures.json");

const FIELDS = ["giveAmount", "giveCurrency", "wantAmount", "wantCurrency"];
let failed = 0;

function report(ok, label, detail, why) {
  if (!ok) failed += 1;
  console.log(`${ok ? "pass" : "FAIL"}  ${label}`);
  if (detail) console.log(`      ${detail}`);
  if (!ok) console.log(`      -> ${why}`);
}

console.log("Intents (rules only)\n");
for (const c of intents) {
  const plan = planFromRules(c.text);
  let why = null;
  if (plan.intent !== c.intent) why = `intent: got ${plan.intent}, expected ${c.intent}`;
  else if (plan.wantsLlm !== c.llm) why = `asks the LLM: got ${plan.wantsLlm}, expected ${c.llm}`;
  else if (c.filters) {
    const got = searchFilters(plan, plan.rules.fields, "rules");
    if (JSON.stringify(got) !== JSON.stringify(c.filters)) why = `filters: got ${JSON.stringify(got)}, expected ${JSON.stringify(c.filters)}`;
  } else if (c.fields) {
    const { fields } = finalize(plan.rules.fields, plan.rules.warnings);
    const wrong = FIELDS.find((k) => fields[k] !== c.fields[k]);
    if (wrong) why = `${wrong}: got ${fields[wrong] ?? "nothing"}, expected ${c.fields[wrong] ?? "nothing"}`;
  }
  report(!why, `[${String(plan.intent).padEnd(12)}] ${c.text}`, null, why);
}

console.log("\nMatching\n");
const order = (ranked) => ranked.map((r) => r.offer._id);

const ranked = rankMatches(matching.offers, matching.you);
report(
  JSON.stringify(order(ranked)) === JSON.stringify(matching.expectedOrder),
  "closest amount and rate first",
  order(ranked).join(" > "),
  `expected ${matching.expectedOrder.join(" > ")}`,
);
report(
  JSON.stringify(ranked[0].reasons) === JSON.stringify(matching.expectedFirstReasons),
  "reasons state the differences, from the offers' own numbers",
  ranked.map((r) => `${r.offer._id}: ${r.reasons.join(" / ")}`).join("\n      "),
  `expected first reasons ${JSON.stringify(matching.expectedFirstReasons)}`,
);

const noAmounts = rankMatches(matching.offers, { giveCurrency: "CAD", wantCurrency: "COP" });
report(
  JSON.stringify(order(noAmounts)) === JSON.stringify(matching.newestFirstWithoutAmounts),
  "no amounts: newest first, like the Offers page",
  order(noAmounts).join(" > "),
  `expected ${matching.newestFirstWithoutAmounts.join(" > ")}`,
);

const total = intents.length + 3;
console.log(`\n${total - failed}/${total} passed`);
process.exit(failed ? 1 : 0);
