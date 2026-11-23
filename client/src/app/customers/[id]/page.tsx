"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

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
  updatedAt?: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function getWhatsAppUrl(phone: string) {
  const digits = phone.replace(/\D/g, "");
  const internationalDigits =
    digits.startsWith("0") ? `972${digits.slice(1)}` : digits;
  return `https://wa.me/${internationalDigits}`;
}

export default function CustomerDetailsPage() {
  const params = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_URL}/api/leads/${params.id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const contentType = response.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
          throw new Error("השרת החזיר תשובה לא תקינה.");
        }
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "לא ניתן לטעון את פרטי הלקוח.");
        }
        if (data.status !== "לקוח משלם") {
          throw new Error("הליד אינו מוגדר כלקוח משלם.");
        }
        setCustomer(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "שגיאה בטעינת הלקוח.");
      } finally {
        setLoading(false);
      }
    };

    if (params.id) void fetchCustomer();
  }, [params.id]);

  if (loading) {
    return (
      <div className="py-16 text-center text-sm text-slate-500">
        טוען את פרטי הלקוח...
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="mx-auto max-w-xl py-10 text-center" dir="rtl">
        <div className="rounded-2xl border border-red-200 bg-white p-8 shadow-sm">
          <h1 className="text-xl font-bold text-slate-900">הלקוח לא נמצא</h1>
          <p className="mt-2 text-sm text-red-600">{error}</p>
          <Link
            href="/customers"
            className="mt-5 inline-flex rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            חזרה ללקוחות
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 py-6" dir="rtl">
      <Link
        href="/customers"
        className="inline-flex text-sm font-medium text-slate-500 hover:text-indigo-700"
      >
        &larr; חזרה ללקוחות
      </Link>

      <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-xl font-bold text-indigo-700">
              {customer.name.trim().charAt(0)}
            </div>
            <div>
              <p className="text-sm font-semibold text-emerald-600">לקוח משלם</p>
              <h1 className="mt-1 text-2xl font-extrabold text-slate-900">
                {customer.name}
              </h1>
              <p className="mt-1 text-sm text-slate-500">{customer.serviceType}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <a
              href={`tel:${customer.phone}`}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              ☎ שיחה
            </a>
            <a
              href={`mailto:${customer.email}`}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              ✉ אימייל
            </a>
            <a
              href={getWhatsAppUrl(customer.phone)}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              WhatsApp
            </a>
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="font-bold text-slate-900">פרטי קשר</h2>
          <dl className="mt-4 grid gap-4 text-sm">
            <div>
              <dt className="text-slate-500">אימייל</dt>
              <dd className="mt-1 font-medium text-slate-900">{customer.email}</dd>
            </div>
            <div>
              <dt className="text-slate-500">טלפון</dt>
              <dd className="mt-1 font-medium text-slate-900">{customer.phone}</dd>
            </div>
            <div>
              <dt className="text-slate-500">שירות מבוקש</dt>
              <dd className="mt-1 font-medium text-slate-900">
                {customer.serviceType}
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-5 shadow-sm">
          <h2 className="font-bold text-slate-900">פרטי עסקה</h2>
          <dl className="mt-4 grid gap-4 text-sm">
            <div>
              <dt className="text-slate-500">הצעת מחיר</dt>
              <dd className="mt-1 text-xl font-bold text-slate-900">
                {customer.aiPriceQuote && customer.aiPriceQuote > 0
                  ? `₪${customer.aiPriceQuote.toLocaleString("he-IL")}`
                  : "לא הוגדרה"}
              </dd>
            </div>
            {customer.createdAt && (
              <div>
                <dt className="text-slate-500">הועבר ללקוח</dt>
                <dd className="mt-1 font-medium text-slate-900">
                  {new Date(customer.createdAt).toLocaleDateString("he-IL")}
                </dd>
              </div>
            )}
          </dl>
        </section>

        {customer.notes && (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
            <h2 className="font-bold text-slate-900">הערות</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">
              {customer.notes}
            </p>
          </section>
        )}

        {customer.aiFollowUpDraft?.trim() && (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2">
            <h2 className="font-bold text-slate-900">טיוטת הודעת מעקב</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">
              {customer.aiFollowUpDraft}
            </p>
          </section>
        )}
      </div>
    </div>
  );
}
