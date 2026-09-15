const express = require("express");
const router = express.Router();
const requestController = require("../controllers/requestController");
const authMiddleware = require("../middleware/authMiddleware");

// Every request route is about the logged-in user
router.use(authMiddleware);

router.post("/", requestController.createRequest);
router.get("/incoming", requestController.getIncoming);
router.get("/outgoing", requestController.getOutgoing);
router.patch("/:id", requestController.updateStatus);

module.exports = router;
