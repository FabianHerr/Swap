const express = require("express");
const router = express.Router();
const offerController = require("../controllers/offerController");
const authMiddleware = require("../middleware/authMiddleware");

// Reading is public; creating and deleting need a logged-in user
router.get("/", offerController.getOffers);
router.post("/", authMiddleware, offerController.createOffer);
// Reads pasted text into form fields; creates nothing
router.post("/parse", authMiddleware, offerController.parseOffer);
// Declared before "/:id" so "currencies" isn't treated as an offer id
router.get("/currencies", offerController.getCurrencies);
router.get("/:id", offerController.getOfferById);
router.delete("/:id", authMiddleware, offerController.deleteOffer);

module.exports = router;
