// המרת מספר טלפון לפורמט בינלאומי תקין עבור WhatsApp (למשל 97254...)
export const formatWhatsAppPhone = (phone?: string): string => {
  if (!phone) return "";
  const digits = phone.replace(/[^0-9]/g, "");
  if (digits.startsWith("0")) {
    return `972${digits.slice(1)}`;
  }
  return digits;
};

// פירוק שורת הנושא מגוף המייל וסידור הטקסט ל-RTL מובהק
export const parseEmailContent = (rawText: string, leadName: string) => {
  const lines = rawText.trim().split("\n");
  let subject = `בהמשך לשיחתנו - ${leadName}`;
  const bodyLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (/^(נושא|subject)\s*:/i.test(trimmed)) {
      subject = trimmed.replace(/^(נושא|subject)\s*:\s*/i, "").trim();
    } else {
      bodyLines.push(line);
    }
  }

  while (bodyLines.length > 0 && bodyLines[0].trim() === "") {
    bodyLines.shift();
  }

  const rtlBody = bodyLines
    .map((line) => (line.trim() ? `\u200F${line}` : ""))
    .join("\n");

  return {
    subject,
    body: rtlBody,
  };
};