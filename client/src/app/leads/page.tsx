"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface Lead {
  _id: string;
  name: string;
  email: string;
  phone: string;
  serviceType: string;
  status: string;
  notes: string;
  aiPriceQuote?: number;
  aiFollowUpDraft?: string;
  createdAt?: string;
}

interface LeadFormValues {
  name: string;
  email: string;
  phone: string;
  serviceType: string;
  status: string;
  notes: string;
  aiPriceQuote: string;
  aiFollowUpDraft: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const LEAD_STATUSES = [
  "חדש",
  "יצרו איתו קשר",
  "בטיפול",
  "לקוח משלם",
  "לא רלוונטי",
];

const EMPTY_FORM: LeadFormValues = {
  name: "",
  email: "",
  phone: "",
  serviceType: "",
  status: "חדש",
  notes: "",
  aiPriceQuote: "",
  aiFollowUpDraft: "",
};

function formatPhone(phone: string) {
  const trimmedPhone = phone.trim();
  if (!/^(?:0[2-4]|0[89]|05\d|07[2-9])-?\d{7}$/.test(trimmedPhone)) {
    return phone;
  }

  const digits = trimmedPhone.replace("-", "");
  const prefixLength =
    digits.startsWith("05") || digits.startsWith("07") ? 3 : 2;
  return `${digits.slice(0, prefixLength)}-${digits.slice(prefixLength)}`;
}

function statusStyle(status: string) {
  switch (status) {
    case "חדש":
      return "bg-blue-50 text-blue-700";
    case "יצרו איתו קשר":
      return "bg-amber-50 text-amber-700";
    case "בטיפול":
      return "bg-indigo-50 text-indigo-700";
    case "לקוח משלם":
      return "bg-emerald-50 text-emerald-700";
    case "לא רלוונטי":
      return "bg-slate-100 text-slate-600";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

async function readResponse(response: Response) {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new Error(
      `השרת החזיר תשובה לא תקינה (HTTP ${response.status}). בדקו שהשרת פעיל.`,
    );
  }
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "הפעולה נכשלה. נסו שוב.");
  }
  return data;
}

function LeadForm({
  initialLead,
  saving,
  onCancel,
  onSave,
}: {
  initialLead: Lead | null;
  saving: boolean;
  onCancel: () => void;
  onSave: (values: LeadFormValues) => Promise<void>;
}) {
  const [values, setValues] = useState<LeadFormValues>(() =>
    initialLead
      ? {
          name: initialLead.name,
          email: initialLead.email,
          phone: initialLead.phone,
          serviceType: initialLead.serviceType,
          status: initialLead.status,
          notes: initialLead.notes || "",
          aiPriceQuote: initialLead.aiPriceQuote
            ? String(initialLead.aiPriceQuote)
            : "",
          aiFollowUpDraft: initialLead.aiFollowUpDraft || "",
        }
      : EMPTY_FORM,
  );

  const updateField = <K extends keyof LeadFormValues>(
    key: K,
    value: LeadFormValues[K],
  ) => {
    setValues((current) => ({ ...current, [key]: value }));
  };

  const fieldClass =
    "mt-1 w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100";

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void onSave(values);
      }}
      className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            {initialLead ? "עריכת פרטי ליד" : "הוספת ליד חדש"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            שדות המסומנים בכוכבית הם חובה.
          </p>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-slate-100 hover:text-slate-800"
          aria-label="סגירת הטופס"
        >
          ✕
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-slate-700">
          שם מלא *
          <input
            required
            maxLength={60}
            autoComplete="name"
            value={values.name}
            onChange={(event) => updateField("name", event.target.value)}
            className={fieldClass}
            placeholder="שם הלקוח"
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          כתובת אימייל *
          <input
            required
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={(event) => updateField("email", event.target.value)}
            className={fieldClass}
            placeholder="name@example.com"
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          טלפון *
          <input
            required
            type="tel"
            pattern="(?:0[2-4]|0[89]|05\d|07[2-9])-?\d{7}"
            title="יש להזין מספר ישראלי, עם מקף או בלעדיו, לדוגמה: 0501234567"
            maxLength={11}
            autoComplete="tel"
            value={values.phone}
            onChange={(event) => updateField("phone", event.target.value)}
            onBlur={(event) =>
              updateField("phone", formatPhone(event.target.value))
            }
            className={fieldClass}
            placeholder="0501234567, 050-1234567 ,031234567 ,03-1234567"
          />
        </label>
        <label className="text-sm font-medium text-slate-700">
          שירות מבוקש *
          <input
            required
            maxLength={100}
            value={values.serviceType}
            onChange={(event) => updateField("serviceType", event.target.value)}
            className={fieldClass}
            placeholder="למשל: בניית אתר"
          />
        </label>
        <label className="text-sm font-medium text-slate-700 sm:col-span-2">
          סטטוס
          <select
            value={values.status}
            onChange={(event) => updateField("status", event.target.value)}
            className={fieldClass}
          >
            {LEAD_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium text-slate-700 sm:col-span-2">
          הערות
          <textarea
            rows={3}
            maxLength={500}
            value={values.notes}
            onChange={(event) => updateField("notes", event.target.value)}
            className={fieldClass}
            placeholder="מידע נוסף על הפנייה..."
          />
          <span className="mt-1 block text-left text-xs font-normal text-slate-400">
            {values.notes.length}/500
          </span>
        </label>
        <label className="text-sm font-medium text-slate-700">
          הצעת מחיר (₪)
          <input
            type="number"
            min="0"
            step="0.01"
            value={values.aiPriceQuote}
            onChange={(event) =>
              updateField("aiPriceQuote", event.target.value)
            }
            className={fieldClass}
            placeholder="לא הוגדרה"
          />
        </label>
        <label className="text-sm font-medium text-slate-700 sm:col-span-2">
          טיוטת הודעת מעקב
          <textarea
            rows={4}
            maxLength={1000}
            value={values.aiFollowUpDraft}
            onChange={(event) =>
              updateField("aiFollowUpDraft", event.target.value)
            }
            className={fieldClass}
            placeholder="הודעת מעקב שנוצרה עבור הליד..."
          />
          <span className="mt-1 block text-left text-xs font-normal text-slate-400">
            {values.aiFollowUpDraft.length}/1000
          </span>
        </label>
      </div>

      <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row">
        <button
          type="submit"
          disabled={saving}
          className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "שומר..." : initialLead ? "שמירת שינויים" : "הוספת ליד"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
        >
          ביטול
        </button>
      </div>
    </form>
  );
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("הכל");
  const [showForm, setShowForm] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const formSectionRef = useRef<HTMLDivElement>(null);

  const fetchLeads = useCallback(async () => {
    const token = localStorage.getItem("token");
    const response = await fetch(`${API_URL}/api/leads`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const data = await readResponse(response);
    if (!Array.isArray(data)) {
      throw new Error("התקבלה תשובה לא צפויה מהשרת בעת טעינת הלידים.");
    }
    setLeads(data);
  }, []);

  useEffect(() => {
    const loadLeads = async () => {
      try {
        await fetchLeads();
      } catch (err) {
        setError(err instanceof Error ? err.message : "שגיאה בטעינת הלידים.");
      } finally {
        setLoading(false);
      }
    };
    void loadLeads();
  }, [fetchLeads]);

  useEffect(() => {
    if (!showForm) return;

    formSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [showForm, editingLead]);

  const filteredLeads = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("he");
    return leads.filter((lead) => {
      const matchesStatus =
        statusFilter === "הכל" || lead.status === statusFilter;
      const searchableText = [
        lead.name,
        lead.email,
        lead.phone,
        lead.serviceType,
      ]
        .join(" ")
        .toLocaleLowerCase("he");
      return matchesStatus && (!query || searchableText.includes(query));
    });
  }, [leads, search, statusFilter]);

  const closeForm = () => {
    setShowForm(false);
    setEditingLead(null);
  };

  const saveLead = async (values: LeadFormValues) => {
    setSaving(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        editingLead
          ? `${API_URL}/api/leads/${editingLead._id}`
          : `${API_URL}/api/leads`,
        {
          method: editingLead ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            ...values,
            aiPriceQuote: values.aiPriceQuote ? Number(values.aiPriceQuote) : 0,
          }),
        },
      );
      await readResponse(response);
      await fetchLeads();
      closeForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה בשמירת הליד.");
    } finally {
      setSaving(false);
    }
  };

  const deleteLead = async (lead: Lead) => {
    if (
      !window.confirm(`למחוק את הליד "${lead.name}"? לא ניתן לבטל פעולה זו.`)
    ) {
      return;
    }
    setDeletingId(lead._id);
    setError("");
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/api/leads/${lead._id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      await readResponse(response);
      setLeads((current) => current.filter((item) => item._id !== lead._id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "שגיאה במחיקת הליד.");
    } finally {
      setDeletingId(null);
    }
  };

  const newLeadCount = leads.filter((lead) => lead.status === "חדש").length;
  const activeCount = leads.filter(
    (lead) => lead.status === "בטיפול" || lead.status === "יצרו איתו קשר",
  ).length;
  const convertedCount = leads.filter(
    (lead) => lead.status === "לקוח משלם",
  ).length;

  if (loading) {
    return (
      <div className="py-16 text-center text-sm text-slate-500">
        טוען את רשימת הלידים...
      </div>
    );
  }

  return (
    <div className="space-y-7 py-6" dir="rtl">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-indigo-600">Studio CRM</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">
            ניהול לידים
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            כל הפניות, פרטי הקשר והשלבים בתהליך המכירה במקום אחד.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditingLead(null);
            setShowForm((current) => !current);
            setError("");
          }}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
        >
          <span aria-hidden="true">{showForm ? "×" : "+"}</span>
          {showForm ? "סגירת הטופס" : "הוספת ליד"}
        </button>
      </header>

      {error && (
        <div
          role="alert"
          className="flex items-start justify-between gap-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => setError("")}
            className="font-semibold"
            aria-label="סגירת הודעת שגיאה"
          >
            ✕
          </button>
        </div>
      )}

      {showForm && (
        <div ref={formSectionRef} className="scroll-mt-4">
          <LeadForm
            key={editingLead?._id || "new"}
            initialLead={editingLead}
            saving={saving}
            onCancel={closeForm}
            onSave={saveLead}
          />
        </div>
      )}

      <section
        aria-label="סיכום לידים"
        className="grid grid-cols-1 gap-4 sm:grid-cols-3"
      >
        {[
          {
            label: "סך כל הלידים",
            value: leads.length,
            icon: "👥",
            iconClass: "bg-blue-50 text-blue-600",
          },
          {
            label: "דורשים טיפול",
            value: newLeadCount + activeCount,
            icon: "◷",
            iconClass: "bg-amber-50 text-amber-600",
          },
          {
            label: "הפכו ללקוחות",
            value: convertedCount,
            icon: "✓",
            iconClass: "bg-emerald-50 text-emerald-600",
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div>
              <p className="text-sm font-medium text-slate-500">{stat.label}</p>
              <p className="mt-1 text-3xl font-bold text-slate-900">
                {stat.value}
              </p>
            </div>
            <span
              className={`flex h-11 w-11 items-center justify-center rounded-xl text-lg ${stat.iconClass}`}
              aria-hidden="true"
            >
              {stat.icon}
            </span>
          </div>
        ))}
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">רשימת הלידים</h2>
            <p className="mt-1 text-sm text-slate-500">
              מוצגים {filteredLeads.length} מתוך {leads.length} לידים
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="sr-only" htmlFor="lead-search">
              חיפוש לידים
            </label>
            <input
              id="lead-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="חיפוש לפי שם, אימייל, טלפון או שירות"
              className="min-w-0 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 sm:w-72"
            />
            <label className="sr-only" htmlFor="lead-status">
              סינון לפי סטטוס
            </label>
            <select
              id="lead-status"
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
            >
              <option value="הכל">כל הסטטוסים</option>
              {LEAD_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredLeads.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-2xl">
              👥
            </div>
            <h3 className="mt-4 font-semibold text-slate-900">
              {leads.length === 0 ? "עדיין אין לידים" : "לא נמצאו לידים"}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {leads.length === 0
                ? "הוסיפו ליד חדש כדי להתחיל לנהל פניות ולקוחות."
                : "נסו לשנות את מילות החיפוש או את הסינון לפי סטטוס."}
            </p>
            {leads.length === 0 && (
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="mt-5 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                הוספת הליד הראשון
              </button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-2">
            {filteredLeads.map((lead) => (
              <article
                key={lead._id}
                className="rounded-2xl border border-slate-200 p-4 transition hover:border-indigo-200 hover:shadow-sm sm:p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-lg font-bold text-indigo-700">
                      {lead.name.trim().charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate font-bold text-slate-900">
                        {lead.name}
                      </h3>
                      <p className="mt-0.5 truncate text-sm text-slate-500">
                        {lead.serviceType}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle(lead.status)}`}
                  >
                    {lead.status}
                  </span>
                </div>

                <div className="mt-4 grid gap-2 text-sm text-slate-600">
                  <a
                    href={`mailto:${lead.email}`}
                    className="truncate hover:text-indigo-700"
                  >
                    <span className="ml-2 text-slate-400" aria-hidden="true">
                      ✉
                    </span>
                    {lead.email}
                  </a>
                  <a
                    href={`tel:${lead.phone}`}
                    className="truncate hover:text-indigo-700"
                  >
                    <span className="ml-2 text-slate-400" aria-hidden="true">
                      ☎
                    </span>
                    {lead.phone}
                  </a>
                </div>

                {lead.notes && (
                  <p className="mt-4 line-clamp-2 rounded-xl bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-600">
                    {lead.notes}
                  </p>
                )}

                <div className="mt-4 space-y-3 rounded-xl border border-indigo-100 bg-indigo-50/50 p-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-slate-600">
                      הצעת מחיר
                    </span>
                    <span className="text-sm font-bold text-slate-900">
                      {lead.aiPriceQuote && lead.aiPriceQuote > 0
                        ? `₪${lead.aiPriceQuote.toLocaleString("he-IL")}`
                        : "לא הוגדרה"}
                    </span>
                  </div>
                  <div className="border-t border-indigo-100 pt-3">
                    <p className="text-sm font-medium text-slate-600">
                      טיוטת הודעת מעקב
                    </p>
                    {lead.aiFollowUpDraft?.trim() ? (
                      <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                        {lead.aiFollowUpDraft}
                      </p>
                    ) : (
                      <p className="mt-1 text-sm text-slate-400">
                        עדיין לא נוצרה טיוטה
                      </p>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                  <span className="text-xs text-slate-400">
                    {lead.createdAt
                      ? new Date(lead.createdAt).toLocaleDateString("he-IL")
                      : ""}
                  </span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingLead(lead);
                        setShowForm(true);
                        setError("");
                      }}
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
                    >
                      עריכה
                    </button>
                    <button
                      type="button"
                      onClick={() => void deleteLead(lead)}
                      disabled={deletingId === lead._id}
                      className="text-sm font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
                    >
                      {deletingId === lead._id ? "מוחק..." : "מחיקה"}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
