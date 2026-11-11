const express = require("express");
const router = express.Router();
const {
  askAssistant,
  generateFollowup,
  updateLeadAiDraft,
  getChatHistory,
  clearChat,
} = require("../controllers/aiController");

const { protect } = require("../middlewares/authMiddleware");

router.get("/history", protect, getChatHistory);
router.post("/ask", protect, askAssistant);
router.post("/chat", protect, askAssistant);
router.post("/followup", protect, generateFollowup);
router.put("/followup", protect, updateLeadAiDraft);
router.post("/clear", protect, clearChat);

module.exports = router;