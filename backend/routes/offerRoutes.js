const express = require("express");
const router = express.Router();
const offerController = require("../controllers/offerController");

// Routes
router.post("/", offerController.createOffer);
router.get("/", offerController.getOffers);
router.get("/:id", offerController.getOfferById);
router.delete("/:id", offerController.deleteOffer);

module.exports = router;
