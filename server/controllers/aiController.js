const { crmAssistantAgent, getUserMemorySession } = require("../lib/agents");
const { run } = require("@openai/agents");
const Lead = require("../models/Lead");
const Project = require("../models/Project");
const User = require("../models/User");

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

module.exports = { askAssistant, clearChat };
