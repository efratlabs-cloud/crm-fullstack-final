"use client";

import React, { useRef } from "react";
import { formatWhatsAppPhone, parseEmailContent } from "@/lib/aiHelpers";

export interface Lead {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  status?: string;
  serviceType?: string;
  service?: string;
  notes?: string;
  aiFollowUpDraft?: string;
  aiPriceQuote?: number;
}

interface AiResultCardProps {
  generatedMessage: string;
  setGeneratedMessage: (msg: string) => void;
  generating: boolean;
  messageType: "whatsapp" | "email" | "quote";
  selectedLead?: Lead;
  copied: boolean;
  savedStatus: boolean;
  onCopy: () => void;
  onPrintQuote: () => void;
  onSaveDraft: (text: string) => void;
}

export default function AiResultCard({
  generatedMessage,
  setGeneratedMessage,
  generating,
  messageType,
  selectedLead,
  copied,
  savedStatus,
  onCopy,
  onPrintQuote,
  onSaveDraft,
}: AiResultCardProps) {
  const backdropRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  // זיהוי שדות בסוגריים מרובעים שדורשים השלמה
  const missingPlaceholders = generatedMessage.match(/\[[^\]]+\]/g) || [];

  // סנכרון גלילה בין ה-textarea לשכבת ההדגשה האדומה
  const handleScroll = () => {
    if (textareaRef.current && backdropRef.current) {
      backdropRef.current.scrollTop = textareaRef.current.scrollTop;
      backdropRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  // צביעה באדום של כל חלק בטקסט שמוקף בסוגריים מרובעים [...]
  const renderHighlightedText = (text: string) => {
    const parts = text.split(/(\[[^\]]+\])/g);
    return parts.map((part, index) => {
      if (part.startsWith("[") && part.endsWith("]")) {
        return (
          <mark
            key={index}
            className="bg-red-100 text-red-600 font-bold rounded px-0.5"
          >
            {part}
          </mark>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            2. תוצאת הסוכן (ניתנת לעריכה)
          </h2>
          {generatedMessage && (
            <div className="flex items-center gap-2">
              {savedStatus && (
                <span className="text-xs font-medium text-emerald-600">
                  ✓ נשמר בליד
                </span>
              )}
              <button
                type="button"
                onClick={() => onSaveDraft(generatedMessage)}
                className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition"
              >
                שמור שינויים ב-DB
              </button>
              {messageType === "quote" && (
                <button
                  type="button"
                  onClick={onPrintQuote}
                  className="inline-flex items-center rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-indigo-700"
                >
                  הדפסה / שמירה כ־PDF
                </button>
              )}
              <button
                type="button"
                onClick={onCopy}
                className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition"
              >
                {copied ? "✓ הועתק ללוח!" : "העתק טקסט"}
              </button>
            </div>
          )}
        </div>

        {/* באנר התראה באדום אם קיימים שדות חסרים בסוגריים מרובעים */}
        {missingPlaceholders.length > 0 && !generating && (
          <div className="mb-3 rounded-xl border border-red-300 bg-red-50 p-3 text-xs text-red-800 shadow-xs">
            <div className="font-bold flex items-center gap-1.5 text-red-700 mb-1">
              <span>
                ⚠️ שימו לב – יש להשלים פרטים חסרים בטקסט לפני השליחה:
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {missingPlaceholders.map((item, idx) => (
                <span
                  key={idx}
                  className="inline-block rounded-md bg-red-100 border border-red-300 px-2 py-0.5 font-bold text-red-700"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        )}

        {generating ? (
          <div className="h-64 flex flex-col items-center justify-center text-gray-500 space-y-3">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm">מעבד את נתוני הליד ומייצר נוסח מותאם...</p>
          </div>
        ) : generatedMessage ? (
          /* עורך טקסט דו-שכבתי */
          <div className="relative w-full h-72 rounded-xl border border-gray-200 bg-gray-50 focus-within:bg-white focus-within:border-indigo-500 overflow-hidden">
            <div
              ref={backdropRef}
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 overflow-y-auto p-4 text-sm leading-relaxed whitespace-pre-wrap break-words text-gray-800 font-sans"
            >
              {renderHighlightedText(generatedMessage)}
              {generatedMessage.endsWith("\n") ? "\n" : ""}
            </div>

            <textarea
              ref={textareaRef}
              value={generatedMessage}
              onChange={(e) => setGeneratedMessage(e.target.value)}
              onBlur={() => onSaveDraft(generatedMessage)}
              onScroll={handleScroll}
              className="relative z-10 w-full h-full resize-none overflow-y-auto bg-transparent p-4 text-sm leading-relaxed whitespace-pre-wrap break-words text-transparent caret-gray-900 selection:bg-indigo-200/50 focus:outline-none font-sans"
            />
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center rounded-xl border-2 border-dashed border-gray-200 text-center p-6">
            <p className="text-sm text-gray-400">
              בחרו ליד ולחצו על &quot;צור הודעה חכמה עם AI&quot; כדי לראות כאן
              את הטקסט המנוסח.
            </p>
          </div>
        )}
      </div>

      {/* כפתור שליחה לוואטסאפ */}
      {generatedMessage &&
        selectedLead?.phone &&
        messageType === "whatsapp" && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <a
              href={`https://wa.me/${formatWhatsAppPhone(selectedLead.phone)}?text=${encodeURIComponent(generatedMessage)}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => onSaveDraft(generatedMessage)}
              className="flex w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 transition"
            >
              שלח ישירות לוואטסאפ של {selectedLead.name}
            </a>
          </div>
        )}

      {/* כפתורי שליחה לאימייל */}
      {generatedMessage &&
        selectedLead?.email &&
        messageType === "email" &&
        (() => {
          const { subject, body } = parseEmailContent(
            generatedMessage,
            selectedLead.name
          );
          return (
            <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col sm:flex-row gap-3">
              <a
                href={`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(selectedLead.email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}&rm=rtl`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onSaveDraft(generatedMessage)}
                className="flex flex-1 items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition"
              >
                פתח ב-Gmail מוכן לשליחה ל-{selectedLead.name}
              </a>
              <a
                href={`mailto:${selectedLead.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`}
                onClick={() => onSaveDraft(generatedMessage)}
                className="flex items-center justify-center rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 transition"
              >
                פתח בתוכנת מייל
              </a>
            </div>
          );
        })()}
    </div>
  );
}