const OfferModel = require('../models/Offer');

// ✅ Create a new offer
exports.createOffer = async (req, res) => {
  try {
    const { amount, currency, currencyToReceive } = req.body;

    // Validate required fields
    if (!amount || !currency || !currencyToReceive) {
      return res.status(400).json({
        success: false,
        message: "All fields are required (amount, currency, currencyToReceive)"
      });
    }

    // Create offer
    const offer = await OfferModel.create({
      amount,
      currency,
      currencyToReceive,
      // owner: req.user?.userId   // (optional: attach user if you want auth later)
    });

    res.status(201).json({
      success: true,
      message: "Offer posted successfully",
      offer
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || "Failed to post offer"
    });
  }
};

// ✅ Get all offers
exports.getOffers = async (req, res) => {
  try {
    const offers = await OfferModel.find();
    res.json({
      success: true,
      count: offers.length,
      offers
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || "Failed to fetch offers"
    });
  }
};

// ✅ Get one offer by ID
exports.getOfferById = async (req, res) => {
  try {
    const offer = await OfferModel.findById(req.params.id);
    if (!offer) {
      return res.status(404).json({ success: false, message: "Offer not found" });
    }
    res.json({ success: true, offer });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || "Failed to fetch offer"
    });
  }
};

// ✅ Delete offer
exports.deleteOffer = async (req, res) => {
  try {
    const offer = await OfferModel.findByIdAndDelete(req.params.id);
    if (!offer) {
      return res.status(404).json({ success: false, message: "Offer not found" });
    }
    res.json({ success: true, message: "Offer deleted", offer });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || "Failed to delete offer"
    });
  }
};
