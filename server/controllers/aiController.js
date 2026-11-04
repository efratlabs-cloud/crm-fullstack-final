const { crmAssistantAgent, getUserMemorySession } = require("../lib/agents");
const { run } = require("@openai/agents");
const mongoose = require("mongoose");
const Lead = require("../models/Lead");
const Project = require("../models/Project");
const User = require("../models/User");

const generateFollowup = async (req, res) => {
  try {
    const { leadId, messageType, tone, customNotes = "" } = req.body || {};

    if (!mongoose.isValidObjectId(leadId)) {
      return res.status(400).json({ message: "מזהה הליד אינו תקין." });
    }

    if (!["whatsapp", "email", "quote"].includes(messageType)) {
      return res.status(400).json({ message: "סוג ההודעה אינו תקין." });
    }

    if (!["friendly", "formal", "sales"].includes(tone)) {
      return res.status(400).json({ message: "סגנון הכתיבה אינו תקין." });
    }

    if (typeof customNotes !== "string" || customNotes.length > 500) {
      return res
        .status(400)
        .json({ message: "ההערות חייבות להיות עד 500 תווים." });
    }

    const lead = await Lead.findById(leadId).lean();
    if (!lead) {
      return res.status(404).json({ message: "הליד שנבחר לא נמצא." });
    }

    const messageTypeLabel = {
      whatsapp: "הודעת WhatsApp קצרה",
      email: "הודעת אימייל מקצועית",
      quote: "הצעת מחיר",
    }[messageType];
    const toneLabel = {
      friendly: "ידידותי וחם",
      formal: "רשמי ומקצועי",
      sales: "מכירתי ומשכנע, ללא לחץ",
    }[tone];
    const userName = req.user.name.trim();

    const prompt = `
נסח ${messageTypeLabel} עבור הליד הבא.
שם: ${lead.name}
שירות מבוקש: ${lead.serviceType}
סטטוס: ${lead.status}
הערות קיימות: ${lead.notes || "אין"}
סגנון מבוקש: ${toneLabel}
הנחיות נוספות: ${customNotes.trim() || "אין"}
שם המשתמש שיש לחתום בו: ${userName}

החזר רק את נוסח ההודעה המוכן לשליחה, בעברית, וסיים אותו בחתימה בשם המשתמש.
`;

    const result = await run(crmAssistantAgent, prompt);
    if (!result.finalOutput) {
      throw new Error("AI agent returned an empty response");
    }

    return res.status(200).json({ message: result.finalOutput });
  } catch (error) {
    console.error("AI Follow-up Error:", error);
    return res.status(500).json({ message: "שגיאה ביצירת הודעת המעקב בשרת." });
  }
};

const askAssistant = async (req, res) => {
  try {
    // מזהה המשתמש מגיע לרוב מה-Middleware של האימות (למשל req.user.id או req.userId)
    const userId = req.user?.id || req.userId || req.body.userId;
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ message: "נא לכתוב הודעה לסוכן." });
    }

    // שליפת נתונים ממונגו להעשרה של הסוכן
    const dbUser = userId ? await User.findById(userId).lean() : null;
    const leads = await Lead.find({}).lean();
    const projects = await Project.find({}).lean();

    const leadsList =
      leads.length > 0
        ? leads
            .map(
              (l) =>
                `- שם: ${l.name}, סטטוס: ${l.status || "חדש"}, שירות: ${l.service || "כללי"}, הערות: ${l.notes || "אין"}`,
            )
            .join("\n")
        : "אין לידים במערכת.";

    const projectsList =
      projects.length > 0
        ? projects
            .map(
              (p) =>
                `- פרויקט: ${p.name || p.title}, סטטוס: ${p.status || "פעיל"}`,
            )
            .join("\n")
        : "אין פרויקטים פעילים.";

    const enrichedMessage = `
[רשימת לידים במערכת]:
${leadsList}

[רשימת פרויקטים]:
${projectsList}

פרטי משתמש: ${dbUser?.name || "מנהל מערכת"}

הודעת המשתמש:
${message}
`;

    const memorySession = getUserMemorySession(userId || "default-user");
    const result = await run(crmAssistantAgent, enrichedMessage, {
      session: memorySession,
    });

    res.json({ answer: result.finalOutput });
  } catch (error) {
    console.error("AI Controller Error:", error);
    res.status(500).json({ message: "שגיאה בהפעלת העוזר החכם בשרת" });
  }
};

const clearChat = async (req, res) => {
  try {
    const userId = req.user?.id || req.userId || req.body.userId;
    const memorySession = getUserMemorySession(userId || "default-user");
    await memorySession.clearSession();
    res.json({ success: true });
  } catch (error) {
    console.error("Clear Chat Error:", error);
    res.status(500).json({ message: "שגיאה בניקוי השיחה" });
  }
};

module.exports = { askAssistant, generateFollowup, clearChat };
