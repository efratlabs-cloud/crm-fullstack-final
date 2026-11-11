"use client";

import React, { useState, useEffect } from "react";
import AiResultCard, { Lead } from "@/components/AiResultCard";
import AssistantForm from "@/components/AssistantForm";

export default function AiAssistantPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState<string>("");
  const [messageType, setMessageType] = useState<
    "whatsapp" | "email" | "quote"
  >("whatsapp");
  const [tone, setTone] = useState<"friendly" | "formal" | "sales">("friendly");
  const [customNotes, setCustomNotes] = useState<string>("");

  const [generatedMessage, setGeneratedMessage] = useState<string>("");
  const [quoteDate, setQuoteDate] = useState("");
  const [loadingLeads, setLoadingLeads] = useState<boolean>(true);
  const [generating, setGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);
  const [savedStatus, setSavedStatus] = useState<boolean>(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  const selectedLead = leads.find((l) => l._id === selectedLeadId);

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

  // שמירת הטיוטה והמחיר המעודכן ב-DB של הליד
  const saveDraftToLeadDB = async (textToSave: string) => {
    if (!selectedLeadId || !textToSave) return;

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_URL}/api/ai/followup`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          leadId: selectedLeadId,
          draft: textToSave,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        setLeads((prev) =>
          prev.map((l) =>
            l._id === selectedLeadId
              ? {
                  ...l,
                  aiFollowUpDraft: updated.aiFollowUpDraft,
                  aiPriceQuote: updated.aiPriceQuote,
                }
              : l
          )
        );
        setSavedStatus(true);
        setTimeout(() => setSavedStatus(false), 2500);
      }
    } catch (err) {
      console.error("שגיאה בעדכון הליד ב-DB:", err);
    }
  };

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

      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        throw new Error(
          `השרת החזיר תשובה לא תקינה (HTTP ${res.status}). בדקו שכתובת ה-API נכונה ושהשרת מעודכן.`
        );
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "שגיאה ביצירת ההודעה");
      }

      const cleanMessage = (data.message || "").replace(/\*\*/g, "");
      setGeneratedMessage(cleanMessage);

      // עדכון ה-State המקומי של הליד עם הטיוטה והמחיר שחזרו מהשרת
      setLeads((prev) =>
        prev.map((l) =>
          l._id === selectedLeadId
            ? {
                ...l,
                aiFollowUpDraft: data.aiFollowUpDraft ?? cleanMessage,
                aiPriceQuote: data.aiPriceQuote ?? l.aiPriceQuote,
              }
            : l
        )
      );
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
    saveDraftToLeadDB(generatedMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handlePrintQuote = () => {
    if (!generatedMessage || !selectedLead) return;
    saveDraftToLeadDB(generatedMessage);
    setQuoteDate(new Date().toLocaleDateString("he-IL"));
    window.setTimeout(() => window.print(), 0);
  };

  return (
    <>
      <div className="screen-content space-y-6" dir="rtl">
        <div className="border-b border-gray-200 pb-4">
          <h1 className="text-2xl font-bold text-gray-900">
            עוזר חכם (AI) – מחולל הודעות פולואפ והצעות מחיר
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            בחרו ליד ממסד הנתונים והעוזר החכם ינסח עבורכם הודעה מותאמת אישית
            בהתבסס על שיחות והצעות קודמות.
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
                    onChange={(e) => {
                      setSelectedLeadId(e.target.value);
                      setGeneratedMessage("");
                    }}
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

              {selectedLead && (
                <div className="rounded-xl bg-indigo-50/60 border border-indigo-100 p-3.5 text-xs text-gray-700 space-y-1">
                  <div className="font-semibold text-indigo-900">
                    פרטי הליד והזיכרון שנשלפים ל-Prompt:
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
                  {selectedLead.aiPriceQuote ? (
                    <div className="text-indigo-800 font-semibold">
                      הצעת מחיר אחרונה ב-DB:{" "}
                      {selectedLead.aiPriceQuote.toLocaleString("he-IL")} ש&quot;ח
                    </div>
                  ) : null}
                </div>
              )}

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
                      onClick={() => {
                        setMessageType(
                          item.id as "whatsapp" | "email" | "quote"
                        );
                        setGeneratedMessage("");
                      }}
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

          {/* צד שמאל: קומפוננטת התוצאה והעריכה */}
          <AiResultCard
            generatedMessage={generatedMessage}
            setGeneratedMessage={setGeneratedMessage}
            generating={generating}
            messageType={messageType}
            selectedLead={selectedLead}
            copied={copied}
            savedStatus={savedStatus}
            onCopy={handleCopy}
            onPrintQuote={handlePrintQuote}
            onSaveDraft={saveDraftToLeadDB}
          />
        </div>

        {/* חלק 3: צ'אט חכם מתמשך עם זיכרון */}
        <AssistantForm />
      </div>

      {/* תצוגת הדפסה להצעת מחיר */}
      {messageType === "quote" && generatedMessage && selectedLead && (
        <article className="quote-document" dir="rtl">
          <header className="quote-header">
            <div>
              <p className="quote-brand">Studio CRM</p>
              <h1>הצעת מחיר</h1>
            </div>
            <p>תאריך: {quoteDate}</p>
          </header>

          <section className="quote-recipient">
            <h2>לכבוד</h2>
            <p>{selectedLead.name}</p>
            {selectedLead.email && <p>{selectedLead.email}</p>}
            {selectedLead.phone && <p>{selectedLead.phone}</p>}
          </section>

          {selectedLead.serviceType && (
            <section className="quote-service">               
              <h2>השירות המבוקש</h2>
              <p>{selectedLead.serviceType}</p>
            </section>
          )}

          <section className="quote-body">
            <h2>פרטי ההצעה</h2>
            <p>{generatedMessage}</p>
          </section>
        </article>
      )}
    </>
  );
}