const crypto = require("crypto");
const { handleMessage } = require("../services/assistant");
const { MAX_TEXT_LENGTH } = require("../services/offerParser");
const { takeLlmSlot } = require("../utils/llmQuota");

// One message to "Ask Swap". Returns what to show and what the person can click; changes nothing.
exports.ask = async (req, res) => {
  const text = String(req.body?.message ?? "").trim();
  if (!text) return res.status(422).json({ success: false, message: "Type a request first." });
  if (text.length > MAX_TEXT_LENGTH) {
    return res.status(422).json({ success: false, message: `Keep it under ${MAX_TEXT_LENGTH} characters.` });
  }

  const started = Date.now();
  const { meta, ...result } = await handleMessage(text, {
    userId: req.user.userId,
    allowLlm: () => takeLlmSlot(req.user.userId),
  });

  // One line per message: which intents people use and how often the rules were enough. No message text.
  console.log(JSON.stringify({
    event: "assistant", reqId: crypto.randomUUID(), userId: req.user.userId, intent: meta.intent,
    source: result.source, llm: meta.llm, action: result.action, ms: Date.now() - started,
    matches: result.matches?.length,
  }));

  res.json({ success: true, ...result });
};
