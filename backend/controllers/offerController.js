const crypto = require("crypto");
const mongoose = require("mongoose");
const OfferModel = require('../models/Offer');
const SwapRequestModel = require('../models/SwapRequest');
const { CURRENCIES, isCurrencyCode } = require("../utils/currencies");
const { validateOffer, normalizeCode } = require("../utils/validateOffer");
const { parseOffer, MAX_TEXT_LENGTH } = require("../services/offerParser");
const { ownerProfiles } = require("../services/ownerProfiles");
const { takeLlmSlot } = require("../utils/llmQuota");

// Supported currencies, so the frontend builds its dropdowns from the same list the API validates against
exports.getCurrencies = (req, res) => {
  res.json({ success: true, currencies: CURRENCIES });
};

// Create an offer owned by the logged-in user
exports.createOffer = async (req, res) => {
  const { value, errors } = validateOffer(req.body ?? {});
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({ success: false, message: Object.values(errors)[0], errors });
  }

  // When the parser filled the form, keep what was pasted and who read it (rules or LLM), so a bad
  // parse can be traced back to its input. Anything else is recorded as typed into the form.
  const { source, rawInput } = req.body ?? {};
  const parsed = ["rules", "llm"].includes(source) && typeof rawInput === "string"
    && rawInput.trim() && rawInput.length <= MAX_TEXT_LENGTH;

  // Owner always comes from the verified token, never from the request body
  const offer = await OfferModel.create({
    ...value,
    ...(parsed ? { source, rawInput: rawInput.trim() } : { source: "form" }),
    owner: req.user.userId,
    ownerName: req.user.name,
  });

  res.status(201).json({ success: true, message: "Offer posted successfully", offer });
};

// Read a pasted offer ("j'ai 250 euros, je cherche 370 dollars canadiens") into form fields.
// Never creates an offer: the frontend fills the form and the user posts it.
exports.parseOffer = async (req, res) => {
  const text = String(req.body?.text ?? "").trim();
  if (!text) return res.status(422).json({ success: false, message: "Paste or type an offer first." });
  if (text.length > MAX_TEXT_LENGTH) {
    return res.status(422).json({ success: false, message: `Keep it under ${MAX_TEXT_LENGTH} characters.` });
  }
  if (!/\d/.test(text)) {
    return res.status(422).json({ success: false, message: "Write the amount in numbers, like 250 euros." });
  }

  const started = Date.now();
  const result = await parseOffer(text, { allowLlm: () => takeLlmSlot(req.user.userId) });

  // One line per parse, to see how often rules are enough and where parses come back incomplete.
  // The text itself isn't logged.
  console.log(JSON.stringify({
    event: "offer_parse", reqId: crypto.randomUUID(), userId: req.user.userId, source: result.source,
    llm: result.meta.llm, ms: Date.now() - started, complete: result.complete, missing: result.missing,
  }));

  res.json({
    success: true,
    source: result.source,
    complete: result.complete,
    fields: result.fields,
    warnings: result.warnings,
  });
};

// Open offers, newest first, each with its owner's profile. Optional ?give=USD&want=CAD filters.
exports.getOffers = async (req, res) => {
  const filter = { status: "open" };

  for (const [param, field] of [["give", "giveCurrency"], ["want", "wantCurrency"]]) {
    if (!req.query[param]) continue;
    const code = normalizeCode(req.query[param]);
    if (!isCurrencyCode(code)) {
      return res.status(400).json({ success: false, message: `Unsupported currency: ${code}` });
    }
    filter[field] = code;
  }

  const offers = await OfferModel.find(filter).sort({ createdAt: -1 }).limit(100);
  const profiles = await ownerProfiles(offers.map((offer) => offer.owner));
  res.json({
    success: true,
    count: offers.length,
    offers: offers.map((offer) => ({ ...offer.toObject(), ownerProfile: profiles[offer.owner] ?? null })),
  });
};

// One offer by id
exports.getOfferById = async (req, res) => {
  // A malformed id can't match anything; answer 404 instead of letting Mongoose throw a CastError (500)
  const offer = mongoose.isValidObjectId(req.params.id) && await OfferModel.findById(req.params.id);
  if (!offer) return res.status(404).json({ success: false, message: "Offer not found" });

  res.json({ success: true, offer });
};

// Delete an offer; only its owner can
exports.deleteOffer = async (req, res) => {
  const offer = mongoose.isValidObjectId(req.params.id) && await OfferModel.findById(req.params.id);
  if (!offer) return res.status(404).json({ success: false, message: "Offer not found" });

  if (!offer.owner.equals(req.user.userId)) {
    return res.status(403).json({ success: false, message: "You can only delete your own offers" });
  }
  // An accepted request still points at a matched offer; both people rely on it
  if (offer.status !== "open") {
    return res.status(409).json({ success: false, message: "This offer was already matched and can't be deleted" });
  }

  await offer.deleteOne();
  // Anyone still waiting on this offer gets an answer instead of a request stuck on pending
  await SwapRequestModel.updateMany({ offer: offer._id, status: "pending" }, { status: "declined" });
  res.json({ success: true, message: "Offer deleted" });
};
