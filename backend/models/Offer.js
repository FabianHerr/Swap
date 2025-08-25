const mongoose = require("mongoose");

const OfferSchema = new mongoose.Schema({
    amount: Number,
    currency: String,
    currencyToReceive: String,
});

const OfferModel = mongoose.model("Offers", OfferSchema);
module.exports = OfferModel;
