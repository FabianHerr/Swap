const express = require("express");
const router = express.Router();
const assistantController = require("../controllers/assistantController");
const authMiddleware = require("../middleware/authMiddleware");

// Match results and "your offers" depend on who's asking, so the assistant needs a logged-in user
router.post("/", authMiddleware, assistantController.ask);

module.exports = router;
