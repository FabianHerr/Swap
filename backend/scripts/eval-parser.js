// Runs the offer parser over scripts/parser-fixtures.json and prints what passed.
//   npm run eval:parser            rules only: no network, no database, no .env
//   npm run eval:parser -- --llm   the full pipeline, with the Gemini fallback (needs GEMINI_API_KEY)
// Rerun it after every rule change; it exits non-zero when a case fails.
const path = require("path");

const withLlm = process.argv.includes("--llm");
if (withLlm) require("dotenv").config({ path: path.join(__dirname, "..", ".env"), quiet: true });

const { parseOffer, parseRules } = require("../services/offerParser");
const { cases } = require("./parser-fixtures.json");

const FIELDS = ["giveAmount", "giveCurrency", "wantAmount", "wantCurrency"];
// The free Gemini tier allows only a few requests a minute; space the calls out so a 429 isn't a "failure"
const LLM_SPACING_MS = 13_000;
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Why a result doesn't match its case, or null when it does
function problem(testCase, result, rules) {
  if (testCase.expect === "rules") {
    if (rules.needsLlm) return "rules asked for the LLM";
    for (const key of FIELDS) {
      if (result.fields[key] !== testCase.fields[key]) {
        return `${key}: got ${result.fields[key] ?? "nothing"}, expected ${testCase.fields[key] ?? "nothing"}`;
      }
    }
    return null;
  }

  for (const key of FIELDS) {
    if (!(key in result.fields)) continue;
    if (!(testCase.ok[key] ?? []).includes(result.fields[key])) return `${key}: ${result.fields[key]} is a guess`;
  }
  if (result.warnings.length === 0) return "ambiguous text came back with no warning";
  return null;
}

async function main() {
  if (withLlm && !process.env.GEMINI_API_KEY) {
    console.error("--llm needs GEMINI_API_KEY in backend/.env");
    process.exit(1);
  }

  let failed = 0;
  let rulesHits = 0;
  const llmOutcomes = {};

  let lastLlmCall = 0;
  for (const testCase of cases) {
    const rules = parseRules(testCase.text);
    if (!rules.needsLlm) rulesHits += 1;
    if (withLlm && rules.needsLlm) {
      await wait(Math.max(0, lastLlmCall + LLM_SPACING_MS - Date.now()));
      lastLlmCall = Date.now();
    }
    const started = Date.now();
    const result = await parseOffer(testCase.text, { allowLlm: withLlm });
    const ms = Date.now() - started;
    if (result.meta.llm !== "skipped") llmOutcomes[result.meta.llm] = (llmOutcomes[result.meta.llm] ?? 0) + 1;

    const why = problem(testCase, result, rules);
    if (why) failed += 1;
    const label = why ? "FAIL" : "pass";
    const detail = FIELDS.filter((k) => k in result.fields).map((k) => `${k}=${result.fields[k]}`).join(" ") || "no fields";
    console.log(`${label}  [${testCase.expect.padEnd(5)}] ${result.source.padEnd(5)} ${String(ms).padStart(5)}ms  ${testCase.text}`);
    console.log(`      ${detail}${why ? `\n      -> ${why}` : ""}`);
    if (why || testCase.expect === "flag") {
      for (const w of result.warnings) console.log(`      ! ${w.field ? `${w.field}: ` : ""}${w.message}`);
    }
  }

  console.log(`\n${cases.length - failed}/${cases.length} passed`);
  console.log(`Rules settled ${rulesHits}/${cases.length} without help (${Math.round((rulesHits / cases.length) * 100)}%)`);
  console.log(`LLM: ${withLlm ? JSON.stringify(llmOutcomes) : "off (pass --llm to include it)"}`);
  process.exit(failed ? 1 : 0);
}

main();
