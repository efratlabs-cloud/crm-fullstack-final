"use server";

import { libraryAssistantAgent } from "@/lib/agents";
import { getSessionUser } from "@/lib/auth";
import { run, MemorySession } from "@openai/agents"; 
import connectDB from "@/lib/db";
import Lead from "@/models/Lead";
import Project from "@/models/Project";
import User from "@/models/User";
import Conversation from "@/models/Conversation"; 

const MAX_MESSAGE_LENGTH = 1000;

export async function askAssistantAction(prevState, formData) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return { answer: "", error: "כדי להשתמש בעוזר החכם צריך קודם להתחבר למערכת." };
  }
  
  const message = String(formData.get("message") || "").trim();
  if (!message) {
    return { answer: "", error: "נא לכתוב הודעה." };
  }
  
  if (message.length > MAX_MESSAGE_LENGTH) {
    return { answer: "", error: `ההודעה ארוכה מידי, ניתן לשלוח עד ${MAX_MESSAGE_LENGTH} תווים.` };
  }

  try {
    await connectDB();
    
    // --- 1. שילוב נתוני הלידים והפרויקטים של העסק ---
    const dbUser = await User.findById(sessionUser.id).lean();
    
    // שליפת כל הלידים והפרויקטים כדי לתת לסוכן את ההקשר העסקי המלא
    const leads = await Lead.find({}).lean();
    const projects = await Project.find({}).lean();
    
    // הרכבת רשימת לידים חכמה עבור הסוכן
    const leadsList = leads.length > 0 
      ? leads.map(l => `- שם: ${l.name}, סטטוס: ${l.status || "חדש"}, שירות מבוקש: ${l.service || "כללי"}, הערות: ${l.notes || "אין"}`).join("\n")
      : "אין לידים במערכת כרגע.";

    // הרכבת רשימת פרויקטים חכמה עבור הסוכן
    const projectsList = projects.length > 0
      ? projects.map(p => `- פרויקט: ${p.name || p.title}, סטטוס: ${p.status || "פעיל"}, לקוח: ${p.client || "לא צוין"}`).join("\n")
      : "אין פרויקטים פעילים כרגע.";

    const enrichedMessage = `
הנה הנתונים העדכניים מתוך מערכת ה-CRM של הסטודיו (Studio CRM):

[רשימת לידים]:
${leadsList}

[רשימת פרויקטים]:
${projectsList}

פרטי המשתמש המחובר: שם: ${dbUser?.name || sessionUser.name}, תפקיד: ${dbUser?.role || "user"}

הודעת המשתמש אליך:
${message}
`;

    // --- 2. ניהול ההיסטוריה מול מונגו ---
    let dbConv = await Conversation.findOne({ userId: sessionUser.id });
    if (!dbConv) {
      dbConv = await Conversation.create({ userId: sessionUser.id, items: [] });
    }

    const memorySession = new MemorySession();
    if (dbConv.items && dbConv.items.length > 0) {
      await memorySession.addItems(dbConv.items);
    }
    
    // הרצת סוכן ה-AI
    const result = await run(libraryAssistantAgent, enrichedMessage, { session: memorySession });

    // --- 3. שמירת ההודעות למסד הנתונים ---
    const userMessage = {
      role: "user",
      content: [{ type: "input_text", text: message }],
    };
    const assistantMessage = {
      role: "assistant",
      content: [{ type: "output_text", text: result.finalOutput }],
    };

    dbConv.items.push(userMessage, assistantMessage);
    await dbConv.save();

    return {
      answer: result.finalOutput,
      error: "",
    };
  } catch (error) {
    console.error("שגיאת סוכן CRM:", error);
    return { answer: "", error: "העוזר החכם לא הצליח לענות כרגע, נסה שוב בעוד רגע." };
  }
}

export async function clearAssistantChatAction() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) {
    return { success: false, error: "כדי לנקות את השיחה צריך קודם להתחבר." };
  }

  try {
    await connectDB();
    await Conversation.findOneAndDelete({ userId: sessionUser.id });
    return { success: true, error: "" };
  } catch (error) {
    console.error(error);
    return { success: false, error: "לא הצלחנו לנקות את השיחה, נסה שוב." };
  }
}