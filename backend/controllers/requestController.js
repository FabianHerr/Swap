const mongoose = require("mongoose");
const OfferModel = require("../models/Offer");
const SwapRequestModel = require("../models/SwapRequest");

const MAX_MESSAGE_LENGTH = 280;

// Which status changes each side of a request may make (only while it's pending)
const ALLOWED_CHANGES = {
  owner: ["accepted", "declined"],
  requester: ["cancelled"],
};

// Shape a request for one viewer. The counterpart is the requester when you own the offer, the owner otherwise.
// Contact details are only revealed once the owner accepts: this is the rule the whole feature rests on,
// so it lives here on the server, not in the UI.
function toViewerRequest(request, viewerId) {
  const isOwner = request.owner._id.equals(viewerId);
  const counterpart = isOwner ? request.requester : request.owner;
  const { offer } = request;

  return {
    _id: request._id,
    role: isOwner ? "owner" : "requester",
    status: request.status,
    message: request.message,
    createdAt: request.createdAt,
    updatedAt: request.updatedAt,
    // null when the offer was deleted after the request was made
    offer: offer && {
      _id: offer._id,
      amount: offer.amount,
      giveCurrency: offer.giveCurrency,
      wantCurrency: offer.wantCurrency,
      status: offer.status,
    },
    counterpart: {
      _id: counterpart._id,
      name: counterpart.name,
      ...(request.status === "accepted" && { email: counterpart.email }),
    },
  };
}

const populateRequest = (query) => query
  .populate("offer", "amount giveCurrency wantCurrency status")
  .populate("requester", "name email")
  .populate("owner", "name email");

// Ask to swap with an offer's owner, with an optional note
exports.createRequest = async (req, res) => {
  const { offerId } = req.body ?? {};
  const message = String(req.body?.message ?? "").trim();

  if (message.length > MAX_MESSAGE_LENGTH) {
    return res.status(400).json({ success: false, message: `Keep the note under ${MAX_MESSAGE_LENGTH} characters` });
  }

  const offer = mongoose.isValidObjectId(offerId) && await OfferModel.findById(offerId);
  if (!offer) return res.status(404).json({ success: false, message: "Offer not found" });

  if (offer.owner.equals(req.user.userId)) {
    return res.status(400).json({ success: false, message: "You can't request your own offer" });
  }
  if (offer.status !== "open") {
    return res.status(409).json({ success: false, message: "This offer is no longer open" });
  }

  try {
    const request = await SwapRequestModel.create({
      offer: offer._id,
      requester: req.user.userId,
      owner: offer.owner,
      message,
    });
    const populated = await populateRequest(SwapRequestModel.findById(request._id));
    res.status(201).json({ success: true, message: "Request sent", request: toViewerRequest(populated, req.user.userId) });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ success: false, message: "You already requested this offer" });
    throw err;
  }
};

// Requests on offers you own
exports.getIncoming = async (req, res) => {
  const requests = await populateRequest(SwapRequestModel.find({ owner: req.user.userId }).sort({ createdAt: -1 }));
  res.json({ success: true, requests: requests.map((r) => toViewerRequest(r, req.user.userId)) });
};

// Requests you sent
exports.getOutgoing = async (req, res) => {
  const requests = await populateRequest(SwapRequestModel.find({ requester: req.user.userId }).sort({ createdAt: -1 }));
  res.json({ success: true, requests: requests.map((r) => toViewerRequest(r, req.user.userId)) });
};

// Owner accepts or declines; requester cancels
exports.updateStatus = async (req, res) => {
  const { status } = req.body ?? {};
  const request = mongoose.isValidObjectId(req.params.id) && await SwapRequestModel.findById(req.params.id);
  if (!request) return res.status(404).json({ success: false, message: "Request not found" });

  const role = request.owner.equals(req.user.userId) ? "owner"
    : request.requester.equals(req.user.userId) ? "requester"
    : null;
  if (!role) return res.status(403).json({ success: false, message: "This request isn't yours" });

  if (!ALLOWED_CHANGES[role].includes(status)) {
    const allowed = ALLOWED_CHANGES[role].join(" or ");
    return res.status(400).json({ success: false, message: `As the ${role} you can only set status to ${allowed}` });
  }
  if (request.status !== "pending") {
    return res.status(409).json({ success: false, message: `This request was already ${request.status}` });
  }

  if (status === "accepted") {
    // Claim the offer only if it's still open, so two requests can't both be accepted
    const offer = await OfferModel.findOneAndUpdate({ _id: request.offer, status: "open" }, { status: "matched" });
    if (!offer) return res.status(409).json({ success: false, message: "This offer is no longer open" });

    const claimed = await SwapRequestModel.findOneAndUpdate({ _id: request._id, status: "pending" }, { status });
    if (!claimed) {
      // The requester cancelled in the meantime: give the offer back
      await OfferModel.updateOne({ _id: request.offer }, { status: "open" });
      return res.status(409).json({ success: false, message: "This request was cancelled" });
    }

    // One swap per offer: everyone else still waiting gets a clear answer
    await SwapRequestModel.updateMany(
      { offer: request.offer, _id: { $ne: request._id }, status: "pending" },
      { status: "declined" }
    );
  } else {
    const updated = await SwapRequestModel.findOneAndUpdate({ _id: request._id, status: "pending" }, { status });
    if (!updated) return res.status(409).json({ success: false, message: "This request was already answered" });
  }

  const populated = await populateRequest(SwapRequestModel.findById(request._id));
  res.json({ success: true, request: toViewerRequest(populated, req.user.userId) });
};
