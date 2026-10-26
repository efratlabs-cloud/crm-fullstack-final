const Lead = require("../models/Lead.js");

// @desc שליפת כל הלידים (עם אפשרות לסינון לפי סטטוס או חיפוש)
// @route GET /api/leads
const getLeads = async (req, res) => {
  try {
    const { status, serviceType } = req.query;
    let filter = {};
    if (status) {
      filter.status = status;
    }
    if (serviceType) {
      filter.serviceType = serviceType;
    }
    const leads = await Lead.find(filter)
      .populate("assignedTo", "name email phone") // Populate the assignedTo field with user details
      .sort({ createdAt: -1 });
    res.status(200).json(leads);
  } catch (error) {
    console.error("שגיאה בשליפת לידים:", error);
    res.status(500).json({ message: "שגיאת שרת", error: error.message });
  }
};

// @desc שליפת ליד בודד לפי מזהה (ID)
// @route GET /api/leads/:id
const getLeadById = async (req, res) => {
  try {
    const leadId = req.params.id;
    const leadData = await Lead.findById(leadId).populate(
      "assignedTo",
      "name email phone",
    );
    if (!leadData) {
      return res.status(404).json({ message: "הליד לא נמצא" });
    }
    res.status(200).json(leadData);
  } catch (error) {
    console.error("שגיאה בשליפת ליד:", error);
    res.status(500).json({ message: "שגיאת שרת", error: error.message });
  }
};

// @desc יצירת ליד חדש
// @route POST /api/leads
const createLead = async (req, res) => {
  try {
    const { name, email, phone, status, notes, serviceType } = req.body;
    const newLead = new Lead({
      name,
      email,
      phone,
      status: status || "חדש", // Default to "חדש" if not provided
      notes: notes || "",
      serviceType,
      assignedTo: req.user ? req.user._id : null,
    });
    const savedLead = await newLead.save();
    res.status(201).json(savedLead);
  } catch (error) {
    console.error("שגיאה ביצירת ליד:", error);
    res.status(500).json({ message: "שגיאת שרת", error: error.message });
  }
};

// @desc עדכון ליד קיים (שינוי סטטוס, עריכת פרטים או שמירת טקסט AI)
// @route PUT /api/leads/:id
const updateLead = async (req, res) => {
  try {
    const leadId = req.params.id;
    const lead = await Lead.findById(leadId);
    if (!lead) {
      return res.status(404).json({ message: "הליד לעדכון לא נמצא" });
    }
    const updateData = req.body;
    const updatedLead = await Lead.findByIdAndUpdate(leadId, updateData, {
      new: true,
    }).populate("assignedTo", "name email phone");

    if (!updatedLead) {
      return res.status(404).json({ message: "הליד לעדכון לא נמצא" });
    }
    res.status(200).json(updatedLead);
  } catch (error) {
    console.error("שגיאה בעדכון ליד:", error);
    res.status(500).json({ message: "שגיאת שרת", error: error.message });
  }
};

// @desc מחיקת ליד
// @route DELETE /api/leads/:id
const deleteLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ message: "הליד למחיקה לא נמצא" });
    }
    //כאן ניתן למחוק את הפרויקטים של אותו הליד אם רוצים, או להשאיר אותם. כרגע נמחק רק את הליד עצמו.
    await lead.deleteOne();
    res.status(200).json({ message: "הליד נמחק בהצלחה", id: req.params.id });
  } catch (error) {
    res
      .status(500)
      .json({ message: "שגיאה במחיקת הליד", error: error.message });
  }
};

module.exports = {
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
};
