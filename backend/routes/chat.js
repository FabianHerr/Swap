// backend/routes/chat.js
const express = require("express");
const initFirebaseAdmin = require("../config/firebaseAdmin");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();
const admin = initFirebaseAdmin();

router.post("/firebase-token", authMiddleware, async (req, res) => {
  try {
    // authMiddleware should set req.user (your Mongo user)
    const userId = String(req.user.id || req.user._id);
    const firebaseToken = await admin.auth().createCustomToken(userId); // Create Firebase custom token using MongoDB user ID
    res.json({ firebaseToken }); // Return the Firebase token to the client
  } catch (err) {
    console.error("Failed creating firebase custom token:", err);
    res.status(500).json({ message: "Failed to create firebase token" });
  }
});

module.exports = router;