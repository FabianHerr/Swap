const mongoose = require("mongoose");
const OfferModel = require('../models/Offer');
const SwapRequestModel = require('../models/SwapRequest');
const { CURRENCIES, isCurrencyCode } = require("../utils/currencies");
const { validateOffer, normalizeCode } = require("../utils/validateOffer");

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

  // Owner always comes from the verified token, never from the request body
  const offer = await OfferModel.create({
    ...value,
    owner: req.user.userId,
    ownerName: req.user.name,
  });

  res.status(201).json({ success: true, message: "Offer posted successfully", offer });
};

// Open offers, newest first. Optional ?give=USD&want=CAD filters.
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
  res.json({ success: true, count: offers.length, offers });
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
