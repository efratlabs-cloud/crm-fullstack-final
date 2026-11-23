"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface Project {
  _id: string;
  name: string;
  status: string;
  budget?: number;
  deadline?: string;
}

interface Lead {
  _id: string;
  name: string;
  email: string;
  phone: string;
  serviceType: string;
  status: string;
  aiPriceQuote?: number;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        // שליפת פרויקטים ולידים במקביל לצורך חישוב סטטיסטיקות
        const [projectsRes, leadsRes] = await Promise.all([
          fetch(`${API_URL}/api/projects`, { headers }),
          fetch(`${API_URL}/api/leads`, { headers }),
        ]);

        const projectsData = await projectsRes.json();
        const leadsData = await leadsRes.json();

        if (!projectsRes.ok) {
          throw new Error(projectsData.message || "שגיאה בטעינת הפרויקטים");
        }
        if (!leadsRes.ok) {
          throw new Error(leadsData.message || "שגיאה בטעינת הלידים");
        }

        setProjects(Array.isArray(projectsData) ? projectsData : []);
        setLeads(Array.isArray(leadsData) ? leadsData : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "שגיאה בטעינת הדאשבורד");
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // חישוב נתונים לכרטיסיות הסיכום
  const activeProjectsCount = projects.filter(
    (p) => p.status === "בביצוע" || !p.status,
  ).length;
  const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0);
  const customers = leads.filter((lead) => lead.status === "לקוח משלם");
  const activeLeads = leads.filter((lead) => lead.status !== "לקוח משלם");
  const totalLeads = activeLeads.length;
  const customerRevenue = customers.reduce(
    (sum, customer) => sum + (customer.aiPriceQuote || 0),
    0,
  );

  if (loading)
    return (
      <div className="p-8 text-center text-slate-600">
        טוען את נתוני הדאשבורד...
      </div>
    );

  return (
    <div className="py-6 space-y-8" dir="rtl">
      {/* כותרת ראשית */}
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900">דאשבורד ראשי</h1>
        <p className="mt-2 text-sm text-gray-600">
          ברוכים הבאים למערכת ה-CRM של Studio CRM. הנה סיכום המצב העסקי כרגע.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      {/* כרטיסיות סטטיסטיקה (KPIs) */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">פרויקטים פעילים</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {activeProjectsCount}
            </p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl font-bold">
            📁
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">
              סך תקציב פרויקטים
            </p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              ₪{totalBudget.toLocaleString()}
            </p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl font-bold">
            💰
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">
              לידים פעילים
            </p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {totalLeads}
            </p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl font-bold">
            👥
          </div>
        </div>

        <Link
          href="/customers"
          className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between hover:border-emerald-300 transition"
        >
          <div>
            <p className="text-sm font-medium text-gray-500">לקוחות משלמים</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">
              {customers.length}
            </p>
            <p className="mt-1 text-xs text-emerald-600">
              ₪{customerRevenue.toLocaleString("he-IL")} בהצעות מחיר
            </p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl font-bold">
            ✓
          </div>
        </Link>
      </div>

      {/* קישורים מהירים לפעולות */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <Link
          href="/projects"
          className="bg-indigo-600 text-white p-6 rounded-2xl shadow-sm hover:bg-indigo-700 transition flex flex-col justify-between"
        >
          <div>
            <h2 className="text-lg font-bold">ניהול פרויקטים</h2>
            <p className="mt-1 text-sm text-indigo-100">
              הוספה, עריכה ומעקב אחר סטטוס הפרויקטים של הלקוחות.
            </p>
          </div>
          <span className="mt-4 inline-block text-xs font-semibold uppercase tracking-wider bg-indigo-500/50 px-3 py-1 rounded-lg w-fit">
            מעבר לפרויקטים &larr;
          </span>
        </Link>

        <Link
          href="/leads"
          className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:border-indigo-300 transition flex flex-col justify-between"
        >
          <div>
            <h2 className="text-lg font-bold text-gray-900">ניהול לידים</h2>
            <p className="mt-1 text-sm text-gray-500">
              צפייה בפניות חדשות, עדכון סטטוסים וטיפול בלידים.
            </p>
          </div>
          <span className="mt-4 inline-block text-xs font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg w-fit">
            מעבר ללידים &larr;
          </span>
        </Link>

        <Link
          href="/aiassistant"
          className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:border-indigo-300 transition flex flex-col justify-between"
        >
          <div>
            <h2 className="text-lg font-bold text-gray-900">עוזר חכם (AI)</h2>
            <p className="mt-1 text-sm text-gray-500">
              מחולל הודעות מעקב, הצעות מחיר וטקסטים שיווקיים.
            </p>
          </div>
          <span className="mt-4 inline-block text-xs font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg w-fit">
            מעבר ל-AI &larr;
          </span>
        </Link>

        <Link
          href="/customers"
          className="bg-emerald-600 text-white p-6 rounded-2xl shadow-sm hover:bg-emerald-700 transition flex flex-col justify-between"
        >
          <div>
            <h2 className="text-lg font-bold">לקוחות קיימים</h2>
            <p className="mt-1 text-sm text-emerald-100">
              צפייה בלקוחות משלם ובפרטי הקשר והעסקה שלהם.
            </p>
          </div>
          <span className="mt-4 inline-block text-xs font-semibold uppercase tracking-wider bg-emerald-500/50 px-3 py-1 rounded-lg w-fit">
            מעבר ללקוחות &larr;
          </span>
        </Link>
      </div>

      {/* לקוחות אחרונים להצגה מהירה */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-gray-900">לקוחות אחרונים</h2>
          <Link
            href="/customers"
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-800"
          >
            לכל הלקוחות &larr;
          </Link>
        </div>
        {customers.length === 0 ? (
          <p className="text-gray-500 text-sm">
            עדיין אין לידים בסטטוס לקוח משלם.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {customers.slice(0, 6).map((customer) => (
              <div
                key={customer._id}
                className="rounded-xl border border-gray-200 p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-sm font-bold text-emerald-700">
                    {customer.name.trim().charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-gray-900">
                      {customer.name}
                    </p>
                    <p className="truncate text-xs text-gray-500">
                      {customer.serviceType}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between gap-2 border-t border-gray-100 pt-3">
                  <span className="truncate text-xs text-gray-500">
                    {customer.phone}
                  </span>
                  <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                    לקוח משלם
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* פרויקטים אחרונים להצגה מהירה */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          פרויקטים אחרונים
        </h2>
        {projects.length === 0 ? (
          <p className="text-gray-500 text-sm">אין פרויקטים להצגה כרגע.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {projects.slice(0, 5).map((project) => (
              <div
                key={project._id}
                className="py-3 flex justify-between items-center"
              >
                <div>
                  <p className="font-semibold text-gray-800 text-sm">
                    {project.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    תקציב: ₪{project.budget || 0}
                  </p>
                </div>
                <span className="px-2.5 py-1 bg-indigo-50 text-indigo-600 text-xs rounded-full font-medium">
                  {project.status || "בביצוע"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
