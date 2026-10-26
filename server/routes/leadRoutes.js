const express = require("express");
const router = express.Router();
const {
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
} = require("../controllers/leadController");

const { protect } = require("../middlewares/authMiddleware");

//כיון שכולם צריכים להיות מחוברים כדי לגשת ללידים, נשתמש במידלוור של ההגנה על כל הנתיבים
router.use(protect);

// @route POST /api/leads
router.post("/", createLead);

// @route GET /api/leads
router.get("/", getLeads);

// @route GET /api/leads/:id
router.get("/:id", getLeadById);

// @route PUT /api/leads/:id
router.put("/:id", updateLead);

// @route DELETE /api/leads/:id
router.delete("/:id", deleteLead);

module.exports = router;
