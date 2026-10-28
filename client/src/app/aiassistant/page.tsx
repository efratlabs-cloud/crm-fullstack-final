"use client";

import React, { useState, useEffect } from "react";

interface Lead {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  status?: string;
  service?: string;
  notes?: string;
}

export default function AiAssistantPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<string>("");
  const [messageType, setMessageType] = useState<
    "whatsapp" | "email" | "quote"
  >("whatsapp");
  const [tone, setTone] = useState<"friendly" | "formal" | "sales">("friendly");
  const [customNotes, setCustomNotes] = useState<string>("");

  const [generatedMessage, setGeneratedMessage] = useState<string>("");
  const [loadingLeads, setLoadingLeads] = useState<boolean>(true);
  const [generating, setGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  // שליפת רשימת הלידים מהשרת בטעינת העמוד
  useEffect(() => {
    const fetchLeads = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/api/leads`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error("שגיאה בטעינת רשימת הלידים");
        const data = await res.json();
        const leadsList = Array.isArray(data) ? data : data.leads || [];
        setLeads(leadsList);
        if (leadsList.length > 0) {
          setSelectedLeadId(leadsList[0]._id);
        }
      } catch (err: unknown) {
        console.error(err);
        setError("לא הצלחנו לטעון את רשימת הלידים מהשרת.");
      } finally {
        setLoadingLeads(false);
      }
    };

    fetchLeads();
  }, [API_URL]);

  // שליחת בקשה לסוכן ה-AI בשרת
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeadId) {
      setError("יש לבחור ליד מהרשימה תחילה");
      return;
    }

    setError("");
    setGenerating(true);
    setCopied(false);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/ai/followup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          leadId: selectedLeadId,
          messageType,
          tone,
          customNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "שגיאה ביצירת ההודעה");
      }

      setGeneratedMessage(data.message);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "שגיאה בחיבור לעוזר החכם";
      setError(msg);
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!generatedMessage) return;
    navigator.clipboard.writeText(generatedMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const selectedLead = leads.find((l) => l._id === selectedLeadId);

  return (
    <>
      <div className="space-y-6" dir="rtl">
        {/* כותרת העמוד */}
        <div className="border-b border-gray-200 pb-4">
          <h1 className="text-2xl font-bold text-gray-900">
            עוזר חכם (AI) – מחולל הודעות פולואפ והצעות מחיר
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            בחרו ליד ממסד הנתונים והעוזר החכם ינסח עבורכם הודעה מותאמת אישית
            לוואטסאפ או לאימייל.
          </p>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* צד ימין: טופס הגדרת הבקשה */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              1. הגדרות יצירת ההודעה
            </h2>

            <form onSubmit={handleGenerate} className="space-y-5">
              {/* בחירת ליד */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  בחירת ליד מתוך המערכת
                </label>
                {loadingLeads ? (
                  <div className="text-sm text-gray-500 py-2">
                    טוען לידים ממסד הנתונים...
                  </div>
                ) : leads.length === 0 ? (
                  <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
                    לא נמצאו לידים במערכת. הוסיפו ליד בעמוד &quot;ניהול
                    לידים&quot; כדי להתחיל.
                  </div>
                ) : (
                  <select
                    value={selectedLeadId}
                    onChange={(e) => setSelectedLeadId(e.target.value)}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  >
                    {leads.map((lead) => (
                      <option key={lead._id} value={lead._id}>
                        {lead.name} {lead.status ? `(${lead.status})` : ""}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* הצגת תקציר נתוני הליד שנבחר */}
              {selectedLead && (
                <div className="rounded-xl bg-indigo-50/60 border border-indigo-100 p-3.5 text-xs text-gray-700 space-y-1">
                  <div className="font-semibold text-indigo-900">
                    פרטי הליד שנשלפים ל-Prompt:
                  </div>
                  <div>
                    <span className="font-medium">שם:</span> {selectedLead.name}
                  </div>
                  {selectedLead.email && (
                    <div>
                      <span className="font-medium">אימייל:</span>{" "}
                      {selectedLead.email}
                    </div>
                  )}
                  {selectedLead.phone && (
                    <div>
                      <span className="font-medium">טלפון:</span>{" "}
                      {selectedLead.phone}
                    </div>
                  )}
                  {selectedLead.notes && (
                    <div>
                      <span className="font-medium">הערות שמורות:</span>{" "}
                      {selectedLead.notes}
                    </div>
                  )}
                </div>
              )}

              {/* בחירת סוג הודעה */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  סוג ההודעה
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: "whatsapp", label: "וואטסאפ קצר" },
                    { id: "email", label: "אימייל רשמי" },
                    { id: "quote", label: "הצעת מחיר" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() =>
                        setMessageType(
                          item.id as "whatsapp" | "email" | "quote",
                        )
                      }
                      className={`py-2.5 px-3 rounded-xl text-xs font-medium border transition ${
                        messageType === item.id
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                          : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* בחירת טון דיבור */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  סגנון וטון דיבור
                </label>
                <select
                  value={tone}
                  onChange={(e) =>
                    setTone(e.target.value as "friendly" | "formal" | "sales")
                  }
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="friendly">חברי, אישי ובגובה העיניים</option>
                  <option value="formal">רשמי ומקצועי</option>
                  <option value="sales">שיווקי ומניע לסגירת עסקה</option>
                </select>
              </div>

              {/* דגשים נוספים */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  דגשים ספציפיים להודעה (אופציונלי)
                </label>
                <textarea
                  rows={3}
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  placeholder="למשל: להזכיר שדיברנו אתמול, להציע 10% הנחה על בניית אתר תדמית..."
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                />
              </div>

              <button
                type="submit"
                disabled={generating || leads.length === 0}
                className="w-full rounded-xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {generating
                  ? "העוזר החכם מנסח הודעה..."
                  : "✨ צור הודעה חכמה עם AI"}
              </button>
            </form>
          </div>

          {/* צד שמאל: תוצאת ה-AI, עריכה והעתקה */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-800">
                  2. תוצאת הסוכן (ניתנת לעריכה)
                </h2>
                {generatedMessage && (
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition"
                  >
                    {copied ? "✓ הועתק ללוח!" : "העתק טקסט"}
                  </button>
                )}
              </div>

              {generating ? (
                <div className="h-64 flex flex-col items-center justify-center text-gray-500 space-y-3">
                  <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm">
                    מעבד את נתוני הליד ומייצר נוסח מותאם...
                  </p>
                </div>
              ) : generatedMessage ? (
                <textarea
                  rows={12}
                  value={generatedMessage}
                  onChange={(e) => setGeneratedMessage(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-800 leading-relaxed focus:bg-white focus:border-indigo-500 focus:outline-none"
                />
              ) : (
                <div className="h-64 flex items-center justify-center rounded-xl border-2 border-dashed border-gray-200 text-center p-6">
                  <p className="text-sm text-gray-400">
                    בחרו ליד ולחצו על &quot;צור הודעה חכמה עם AI&quot; כדי לראות
                    כאן את הטקסט המנוסח.
                  </p>
                </div>
              )}
            </div>

            {generatedMessage &&
              selectedLead?.phone &&
              messageType === "whatsapp" && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <a
                    href={`https://wa.me/${selectedLead.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(generatedMessage)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition"
                  >
                    שלח ישירות לוואטסאפ של {selectedLead.name}
                  </a>
                </div>
              )}
          </div>
        </div>
      </div>
    </>
  );
}
