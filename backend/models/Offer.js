const mongoose = require("mongoose");

const OfferSchema = new mongoose.Schema({
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "Users", required: true },
    // Copied from the token at creation so Browse can show a name without a lookup per offer
    ownerName: { type: String, required: true, trim: true },
    // The owner gives `amount` of giveCurrency and wants wantCurrency in return
    amount: { type: Number, required: true, min: 0 },
    giveCurrency: { type: String, required: true, uppercase: true, trim: true },
    wantCurrency: { type: String, required: true, uppercase: true, trim: true },
    status: { type: String, enum: ["open", "matched"], default: "open" },
    // How the offer was entered: typed in the form, or filled by the parser (rules or LLM)
    source: { type: String, enum: ["form", "rules", "llm"], default: "form" },
    rawInput: { type: String, maxlength: 500 },
}, { timestamps: true });

// Browse lists open offers newest first, optionally filtered by currency pair
OfferSchema.index({ status: 1, createdAt: -1 });

const OfferModel = mongoose.model("Offers", OfferSchema);
module.exports = OfferModel;
