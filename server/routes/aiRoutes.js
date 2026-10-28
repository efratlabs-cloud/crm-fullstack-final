const express = require("express");
const router = express.Router();
const { askAssistant, clearChat } = require("../controllers/aiController");

const { protect } = require("../middlewares/authMiddleware");

router.post("/ask", protect, askAssistant);
router.post("/clear", protect, clearChat);

module.exports = router;
