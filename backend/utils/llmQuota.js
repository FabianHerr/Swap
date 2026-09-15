// The LLM fallback runs on a free quota, so one person can't spend it all: 10 AI reads a minute each,
// shared by the offer parser and the assistant.
// In memory on purpose: one server, and losing the counts on restart costs nothing.
const LLM_CALLS_PER_MINUTE = 10;
const llmCalls = new Map();

function takeLlmSlot(userId) {
  const key = String(userId);
  const now = Date.now();
  const recent = (llmCalls.get(key) ?? []).filter((t) => now - t < 60_000);
  const allowed = recent.length < LLM_CALLS_PER_MINUTE;
  if (allowed) recent.push(now);
  llmCalls.set(key, recent);
  return allowed;
}

module.exports = { takeLlmSlot };
