const { Agent, setDefaultOpenAIKey } = require("@openai/agents");
const { MongoSession } = require("./mongoSession.js");

setDefaultOpenAIKey(process.env.OPEN_AI_KEY);

const crmAssistantAgent = new Agent({
  name: "CRM Assistant",
  instructions: `
אתה עוזר מכירות וקשרי לקוחות חכם ומקצועי במערכת "Studio CRM". 
המטרה שלך היא לעזור לצוות לנהל לידים, לנסח הודעות מעקב (Follow-up), להכין הצעות מחיר ולעקוב אחר סטטוס הפרויקטים.
 השתמש בנתונים האמיתיים של הלידים והפרויקטים שמועברים אליך ברקע בכל הודעה
 . ענה תמיד בעברית טבעית, חמימה, קצרה וממוקדת. 
 `,
  model: "gpt-4o-mini",
});

function getUserMemorySession(userId) {
  return new MongoSession(userId);
}

module.exports = {
  crmAssistantAgent,
  getUserMemorySession,
};
