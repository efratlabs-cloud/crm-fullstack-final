"use client";

import { useEffect, useRef, useState } from "react";

const initialState = {
  answer: "",
  error: "",
};

export default function AssistantForm({ initialMessages = [] }) {
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState(initialMessages);
  const [isPending, setIsPending] = useState(false);
  const [state, setState] = useState(initialState);

  const latestPromptRef = useRef("");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // טיפול בשליחת הודעה לשרת ה-Node (פורט 5000)
  const handleSubmit = async (e) => {
    e.preventDefault();
    const prompt = draft.trim();
    if (!prompt || isPending) return;

    latestPromptRef.current = prompt;
    setIsPending(true);
    setState({ answer: "", error: "" });

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: prompt }),
      });

      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || "שגיאה בתקשורת עם העוזר החכם");

      setMessages((prev) => [
        ...prev,
        { role: "user", text: prompt },
        { role: "assistant", text: data.answer },
      ]);
      setDraft("");
      latestPromptRef.current = "";
    } catch (err) {
      setState({ answer: "", error: err.message || "אירעה שגיאה" });
    } finally {
      setIsPending(false);
    }
  };

  const handleClear = async () => {
    try {
      const token = localStorage.getItem("token");
      await fetch("http://localhost:5000/api/ai/clear", {
        method: "POST",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      setMessages([]);
      setDraft("");
    } catch (err) {
      console.error(err);
    }
  };

  // גלילה אוטומטית למטה
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isPending]);

  const canShowChat = messages.length > 0 || state.error;

  return (
    <div
      className={`flex ${
        canShowChat ? "max-h-[60vh] min-h-40" : "h-40"
      } flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300`}
      dir="rtl"
    >
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3">
        <div>
          <div className="text-sm font-bold text-slate-800">עוזר חכם (AI)</div>
          <div className="text-[11px] text-slate-500">
            ניתוח לידים וניסוח מעקב
          </div>
        </div>

        <button
          type="button"
          onClick={handleClear}
          className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-[11px] font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-100"
        >
          נקה שיחה
        </button>
      </div>

      {canShowChat ? (
        <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50/50 p-4">
          {messages.map((message, index) => {
            const isUser = message.role === "user";
            return (
              <div
                key={index}
                className={`flex ${isUser ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
                    isUser
                      ? "bg-indigo-600 text-white"
                      : "border border-slate-200 bg-white text-slate-800"
                  }`}
                >
                  <div
                    className={`mb-1 text-[10px] font-bold tracking-[0.12em] uppercase ${
                      isUser ? "text-white/80" : "text-slate-500"
                    }`}
                  >
                    {isUser ? "את/ה" : "העוזר החכם"}
                  </div>
                  <div className="whitespace-pre-line text-sm leading-7">
                    {message.text}
                  </div>
                </div>
              </div>
            );
          })}

          {state.error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {state.error}
            </div>
          )}

          {isPending && (
            <div className="flex justify-start">
              <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.2s]" />
                  <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.1s]" />
                  <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-slate-400" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center bg-slate-50 px-6 text-center text-sm text-slate-500">
          עוד לא התחלת שיחה. שאל את העוזר על הלידים או הפרויקטים שלך.
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="flex items-end gap-3 border-t border-slate-200 bg-white p-3"
      >
        <textarea
          ref={inputRef}
          rows={1}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
          required
          placeholder="כתוב כאן מה תרצה שהסוכן יכין או יבדוק..."
          className="min-h-11 flex-1 resize-none rounded-2xl border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-100"
        />

        <button
          type="submit"
          disabled={isPending}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-600 text-lg font-bold text-white transition hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isPending ? "…" : "➤"}
        </button>
      </form>
    </div>
  );
}
