"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

interface Customer {
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

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

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

function getWhatsAppUrl(phone: string) {
  const digits = phone.replace(/\D/g, "");
  const internationalDigits =
    digits.startsWith("0") ? `972${digits.slice(1)}` : digits;
  return `https://wa.me/${internationalDigits}`;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `${API_URL}/api/leads?status=${encodeURIComponent("לקוח משלם")}`,
          {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          },
        );
        const data = await readResponse(response);
        if (!Array.isArray(data)) {
          throw new Error("התקבלה תשובה לא צפויה מהשרת בעת טעינת הלקוחות.");
        }
        setCustomers(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "שגיאה בטעינת הלקוחות.");
      } finally {
        setLoading(false);
      }
    };

    void fetchCustomers();
  }, []);

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("he");
    if (!query) return customers;

    return customers.filter((customer) =>
      [customer.name, customer.email, customer.phone, customer.serviceType]
        .join(" ")
        .toLocaleLowerCase("he")
        .includes(query),
    );
  }, [customers, search]);

  if (loading) {
    return (
      <div className="py-16 text-center text-sm text-slate-500">
        טוען את רשימת הלקוחות...
      </div>
    );
  }

  return (
    <div className="space-y-7 py-6" dir="rtl">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold text-indigo-600">Studio CRM</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">
            לקוחות קיימים
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            רשימת הלידים שהסטטוס שלהם הוא לקוח משלם.
          </p>
        </div>
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

      <section
        aria-label="סיכום לקוחות"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2"
      >
        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <p className="text-sm font-medium text-slate-500">סה״כ לקוחות</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">
              {customers.length}
            </p>
          </div>
          <span
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-lg text-emerald-600"
            aria-hidden="true"
          >
            ✓
          </span>
        </div>
        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div>
            <p className="text-sm font-medium text-slate-500">לקוחות מוצגים</p>
            <p className="mt-1 text-3xl font-bold text-slate-900">
              {filteredCustomers.length}
            </p>
          </div>
          <span
            className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-lg text-indigo-600"
            aria-hidden="true"
          >
            🔍
          </span>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <h2 className="text-lg font-bold text-slate-900">רשימת לקוחות</h2>
            <p className="mt-1 text-sm text-slate-500">
              מוצגים {filteredCustomers.length} מתוך {customers.length} לקוחות
            </p>
          </div>
          <label className="sr-only" htmlFor="customer-search">
            חיפוש לקוחות
          </label>
          <input
            id="customer-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="חיפוש לפי שם, אימייל, טלפון או שירות"
            className="min-w-0 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 sm:w-72"
          />
        </div>

        {filteredCustomers.length === 0 ? (
          <div className="px-5 py-14 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-2xl">
              ✓
            </div>
            <h3 className="mt-4 font-semibold text-slate-900">
              {customers.length === 0
                ? "עדיין אין לקוחות משלמים"
                : "לא נמצאו לקוחות"}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {customers.length === 0
                ? <>שנו סטטוס ליד ל&ldquo;לקוח משלם&rdquo; כדי להציג אותו כאן.</>
                : "נסו לשנות את מילות החיפוש."}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 p-4 sm:p-5 lg:grid-cols-2">
            {filteredCustomers.map((customer) => (
              <article
                key={customer._id}
                className="rounded-2xl border border-slate-200 p-4 transition hover:border-indigo-200 hover:shadow-sm sm:p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-lg font-bold text-indigo-700">
                      {customer.name.trim().charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate font-bold text-slate-900">
                        {customer.name}
                      </h3>
                      <p className="mt-0.5 truncate text-sm text-slate-500">
                        {customer.serviceType}
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    לקוח משלם
                  </span>
                </div>

                <div className="mt-4 grid gap-2 text-sm text-slate-600">
                  <a
                    href={`mailto:${customer.email}`}
                    className="truncate hover:text-indigo-700"
                  >
                    <span className="ml-2 text-slate-400" aria-hidden="true">
                      ✉
                    </span>
                    {customer.email}
                  </a>
                  <a
                    href={`tel:${customer.phone}`}
                    className="truncate hover:text-indigo-700"
                  >
                    <span className="ml-2 text-slate-400" aria-hidden="true">
                      ☎
                    </span>
                    {customer.phone}
                  </a>
                </div>

                {customer.notes && (
                  <p className="mt-4 line-clamp-2 rounded-xl bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-600">
                    {customer.notes}
                  </p>
                )}

                <div className="mt-4 space-y-3 rounded-xl border border-indigo-100 bg-indigo-50/50 p-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-slate-600">
                      הצעת מחיר
                    </span>
                    <span className="text-sm font-bold text-slate-900">
                      {customer.aiPriceQuote && customer.aiPriceQuote > 0
                        ? `₪${customer.aiPriceQuote.toLocaleString("he-IL")}`
                        : "לא הוגדרה"}
                    </span>
                  </div>
                  {customer.aiFollowUpDraft?.trim() && (
                    <div className="border-t border-indigo-100 pt-3">
                      <p className="text-sm font-medium text-slate-600">
                        טיוטת הודעת מעקב
                      </p>
                      <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700">
                        {customer.aiFollowUpDraft}
                      </p>
                    </div>
                  )}
                </div>

                {customer.createdAt && (
                  <div className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-400">
                    הועבר ללקוח ב-
                    {new Date(customer.createdAt).toLocaleDateString("he-IL")}
                  </div>
                )}

                <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                  <Link
                    href={`/customers/${customer._id}`}
                    className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
                  >
                    פרטי לקוח
                  </Link>
                  <a
                    href={`tel:${customer.phone}`}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    ☎ שיחה
                  </a>
                  <a
                    href={getWhatsAppUrl(customer.phone)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                  >
                    WhatsApp
                  </a>
                  <a
                    href={`mailto:${customer.email}`}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    ✉ אימייל
                  </a>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
