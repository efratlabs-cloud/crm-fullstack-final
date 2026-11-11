const { crmAssistantAgent, getUserMemorySession } = require("../lib/agents");
const { run } = require("@openai/agents");
const mongoose = require("mongoose");
const Lead = require("../models/Lead");
const Project = require("../models/Project");
const User = require("../models/User");

// פונקציית עזר לחילוץ מחיר מתוך טקסט
const extractPriceFromText = (text = "") => {
  if (!text) return null;
  const priceMatch =
    text.match(/(?:מחיר|עלות|סה"כ|תקציב)[^\d\n]*(\d[\d,]*)/) ||
    text.match(/(\d[\d,]+)\s*(?:ש"ח|שח|₪)/);

  if (priceMatch && priceMatch[1]) {
    const parsed = Number(priceMatch[1].replace(/,/g, ""));
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
};

// חילוץ טקסט נקי (string) מכל מבנה של פריט ב-Conversation (כולל אובייקטים של @openai/agents)
const extractItemText = (item) => {
  if (!item) return "";
  if (typeof item === "string") return item;
  if (typeof item.text === "string") return item.text;
  if (typeof item.content === "string") return item.content;

  // אם content הוא מערך של אובייקטים כמו [{ type, text, providerData }]
  if (Array.isArray(item.content)) {
    return item.content
      .map((part) => {
        if (typeof part === "string") return part;
        if (part && typeof part.text === "string") return part.text;
        return "";
      })
      .filter(Boolean)
      .join("\n");
  }

  // אם content או text הם אובייקט בודד עם שדה text
  if (item.content && typeof item.content.text === "string") {
    return item.content.text;
  }
  if (item.text && typeof item.text.text === "string") {
    return item.text.text;
  }

  return "";
};

// המרת פריטי Conversation לטקסט היסטוריה קריא עבור ה-AI
const formatHistoryForPrompt = (items = []) => {
  if (!Array.isArray(items) || items.length === 0) {
    return "אין היסטוריית שיחות קודמת עם משתמש זה.";
  }
  const lines = items
    .slice(-10)
    .map((item) => {
      const text = extractItemText(item).trim();
      if (!text) return null;
      const roleName = item.role === "user" ? "משתמש" : "העוזר החכם";
      return `${roleName}: ${text}`;
    })
    .filter(Boolean);

  return lines.length > 0
    ? lines.join("\n")
    : "אין היסטוריית שיחות קודמת עם משתמש זה.";
};

const generateFollowup = async (req, res) => {
  try {
    const { leadId, messageType, tone, customNotes = "" } = req.body || {};
    const userId = req.user?._id || req.user?.id || req.userId;

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

    const lead = await Lead.findById(leadId);
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

    const userName = req.user?.name ? req.user.name.trim() : "צוות Studio CRM";

    const memorySession = userId ? getUserMemorySession(userId) : null;
    const pastItems = memorySession ? await memorySession.getItems(10) : [];
    const conversationHistoryText = formatHistoryForPrompt(pastItems);

    const prompt = `
נסח ${messageTypeLabel} עבור הליד הבא, תוך הסתמכות על שיחות קודמות והיסטוריית הליד.

[פרטי הליד הנוכחי]:
שם: ${lead.name}
שירות מבוקש: ${lead.serviceType}
סטטוס: ${lead.status}
הערות קיימות: ${lead.notes || "אין"}
הודעת מעקב / טיוטה אחרונה שנשלחה לליד זה: ${lead.aiFollowUpDraft || "טרם נשלחה הודעה קודמת"}
הצעת מחיר אחרונה שניתנה לליד זה: ${lead.aiPriceQuote ? `${lead.aiPriceQuote} ש"ח` : "טרם ניתנה הצעת מחיר"}

[היסטוריית שיחות אחרונות עם המשתמש במערכת]:
${conversationHistoryText}

[דרישות להודעה הנוכחית]:
סגנון מבוקש: ${toneLabel}
הנחיות חדשות מהמשתמש: ${customNotes.trim() || "אין"}
שם המשתמש שיש לחתום בו: ${userName}

הנחיה חשובה: אם קיימת הודעה קודמת או הצעת מחיר קודמת לליד זה, או מידע רלוונטי בהיסטוריית השיחות, המשך את השיחה באופן טבעי והתייחס אליהם בהתאם.
החזר רק את נוסח ההודעה המוכן לשליחה, בעברית, וסיים אותו בחתימה בשם המשתמש.
`;

    const result = await run(crmAssistantAgent, prompt);
    if (!result.finalOutput) {
      throw new Error("AI agent returned an empty response");
    }

    const cleanOutput = String(result.finalOutput).replace(/\*\*/g, "").trim();

    lead.aiFollowUpDraft = cleanOutput.slice(0, 1000);
    const detectedPrice =
      extractPriceFromText(cleanOutput) ?? extractPriceFromText(customNotes);
    if (detectedPrice !== null) {
      lead.aiPriceQuote = detectedPrice;
    }
    await lead.save();

    if (memorySession) {
      await memorySession.addItems([
        {
          role: "user",
          text: `בקשה ליצירת ${messageTypeLabel} עבור ${lead.name}${customNotes ? `: ${customNotes}` : ""}`,
          createdAt: new Date(),
        },
        {
          role: "assistant",
          text: cleanOutput,
          createdAt: new Date(),
        },
      ]);
    }

    return res.status(200).json({
      message: cleanOutput,
      aiFollowUpDraft: lead.aiFollowUpDraft,
      aiPriceQuote: lead.aiPriceQuote,
    });
  } catch (error) {
    console.error("AI Follow-up Error:", error);
    return res.status(500).json({ message: "שגיאה ביצירת הודעת המעקב בשרת." });
  }
};

const updateLeadAiDraft = async (req, res) => {
  try {
    const { leadId, draft, priceQuote } = req.body || {};
    const userId = req.user?._id || req.user?.id || req.userId;

    if (!mongoose.isValidObjectId(leadId)) {
      return res.status(400).json({ message: "מזהה הליד אינו תקין." });
    }

    const lead = await Lead.findById(leadId);
    if (!lead) {
      return res.status(404).json({ message: "הליד לא נמצא." });
    }

    if (typeof draft === "string") {
      lead.aiFollowUpDraft = draft.slice(0, 1000);
      const extracted = extractPriceFromText(draft);
      if (extracted !== null) {
        lead.aiPriceQuote = extracted;
      }
    }

    if (typeof priceQuote === "number" && !Number.isNaN(priceQuote)) {
      lead.aiPriceQuote = priceQuote;
    }

    await lead.save();

    if (userId && typeof draft === "string") {
      const memorySession = getUserMemorySession(userId);
      await memorySession.addItems([
        {
          role: "user",
          text: `עדכנתי סופית את ההודעה עבור הליד ${lead.name} (מחיר מעודכן: ${lead.aiPriceQuote || 0} ש"ח):\n${draft}`,
          createdAt: new Date(),
        },
      ]);
    }

    return res.status(200).json({
      success: true,
      aiFollowUpDraft: lead.aiFollowUpDraft,
      aiPriceQuote: lead.aiPriceQuote,
    });
  } catch (error) {
    console.error("Update AI Draft Error:", error);
    return res.status(500).json({ message: "שגיאה בעדכון נתוני ה-AI בליד." });
  }
};

const askAssistant = async (req, res) => {
  try {
    const userId =
      req.user?._id || req.user?.id || req.userId || req.body.userId;
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ message: "נא לכתוב הודעה לסוכן." });
    }

    const dbUser = userId ? await User.findById(userId).lean() : null;
    const leads = await Lead.find({}).lean();
    const projects = await Project.find({}).lean();

    const memorySession = getUserMemorySession(userId);
    const pastItems = await memorySession.getItems(15);
    const conversationHistoryText = formatHistoryForPrompt(pastItems);

    const leadsList =
      leads.length > 0
        ? leads
            .map(
              (l) =>
                `- שם: ${l.name}, סטטוס: ${l.status || "חדש"}, שירות: ${l.serviceType || "כללי"}, הערות: ${l.notes || "אין"}, הצעת מחיר אחרונה: ${l.aiPriceQuote || 0} ש"ח, הודעה אחרונה שנשלחה: "${l.aiFollowUpDraft ? l.aiFollowUpDraft.slice(0, 120) + "..." : "אין"}"`
            )
            .join("\n")
        : "אין לידים במערכת.";

    const projectsList =
      projects.length > 0
        ? projects
            .map(
              (p) =>
                `- פרויקט: ${p.name || p.title}, סטטוס: ${p.status || "פעיל"}, תקציב: ${p.budget || 0} ש"ח`
            )
            .join("\n")
        : "אין פרויקטים פעילים.";

    const enrichedMessage = `
[רשימת לידים במערכת (כולל היסטוריית הודעות והצעות מחיר)]:
${leadsList}

[רשימת פרויקטים]:
${projectsList}

[היסטוריית השיחה הקודמת שלנו (זכור אותה וענה בהתאם להקשר!)]:
${conversationHistoryText}

פרטי המשתמש המחובר: ${dbUser?.name || req.user?.name || "מנהל מערכת"}

הודעת המשתמש הנוכחית:
${message}
`;

    const result = await run(crmAssistantAgent, enrichedMessage);
    const answerText = String(result.finalOutput || "")
      .replace(/\*\*/g, "")
      .trim();

    await memorySession.addItems([
      { role: "user", text: String(message), createdAt: new Date() },
      { role: "assistant", text: answerText, createdAt: new Date() },
    ]);

    res.json({ answer: answerText });
  } catch (error) {
    console.error("AI Controller Error:", error);
    res.status(500).json({ message: "שגיאה בהפעלת העוזר החכם בשרת" });
  }
};

// שליפת היסטוריית השיחה מה-DB והמרתה למחרוזות טקסט נקיות עבור React
const getChatHistory = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id || req.userId;
    if (!userId) return res.json({ messages: [] });

    const memorySession = getUserMemorySession(userId);
    const items = await memorySession.getItems(50);

    const messages = items
      .map((item) => {
        const cleanText = extractItemText(item).trim();
        if (!cleanText) return null;
        return {
          role: item.role === "user" ? "user" : "assistant",
          text: cleanText,
        };
      })
      .filter(Boolean);

    res.json({ messages });
  } catch (error) {
    console.error("Get History Error:", error);
    res.status(500).json({ message: "שגיאה בטעינת היסטוריית השיחה" });
  }
};

const clearChat = async (req, res) => {
  try {
    const userId =
      req.user?._id || req.user?.id || req.userId || req.body.userId;
    const memorySession = getUserMemorySession(userId);
    await memorySession.clearSession();
    res.json({ success: true });
  } catch (error) {
    console.error("Clear Chat Error:", error);
    res.status(500).json({ message: "שגיאה בניקוי השיחה" });
  }
};

module.exports = {
  askAssistant,
  generateFollowup,
  updateLeadAiDraft,
  getChatHistory,
  clearChat,
};