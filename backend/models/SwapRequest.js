const mongoose = require("mongoose");

// Someone asking an offer's owner to swap. Replaces chat: every step is a status you can inspect.
const SwapRequestSchema = new mongoose.Schema({
    offer: { type: mongoose.Schema.Types.ObjectId, ref: "Offers", required: true },
    requester: { type: mongoose.Schema.Types.ObjectId, ref: "Users", required: true },
    // Copied from the offer so "incoming requests" is a single indexed query
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "Users", required: true },
    message: { type: String, trim: true, maxlength: 280, default: "" },
    status: { type: String, enum: ["pending", "accepted", "declined", "cancelled"], default: "pending" },
}, { timestamps: true });

// One request per person per offer; also stops a double-click from creating two
SwapRequestSchema.index({ offer: 1, requester: 1 }, { unique: true });
SwapRequestSchema.index({ owner: 1, createdAt: -1 });
SwapRequestSchema.index({ requester: 1, createdAt: -1 });

const SwapRequestModel = mongoose.model("SwapRequests", SwapRequestSchema);
module.exports = SwapRequestModel;
