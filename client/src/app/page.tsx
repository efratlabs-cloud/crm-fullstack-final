"use client";

import Link from "next/link";

export default function Home() {
  return (
    <>
      <div className="py-6">
        {/* כותרת ראשית */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">
            ברוכים הבאים למערכת ה-CRM
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            ניהול לידים, פרויקטים וסיוע חכם בעזרת בינה מלאכותית במקום אחד.
          </p>
        </div>

        {/* קוביות ניווט מהירות */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* כרטיס לידים */}
          <Link
            href="/leads"
            className="rounded-xl bg-white p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
          >
            <h2 className="text-xl font-bold text-indigo-600">ניהול לידים</h2>
            <p className="mt-2 text-sm text-gray-600">
              מעקב אחר פניות חדשות, עדכון סטטוסים והוספת לקוחות פוטנציאליים.
            </p>
          </Link>

          {/* כרטיס פרויקטים */}
          <Link
            href="/projects"
            className="rounded-xl bg-white p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
          >
            <h2 className="text-xl font-bold text-indigo-600">
              פרויקטים פעילים
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              צפייה בפרויקטים של הלקוחות, מעקב התקדמות ודד-ליינים.
            </p>
          </Link>

          {/* כרטיס AI Assistant */}
          <Link
            href="/aiassistant"
            className="rounded-xl bg-white p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
          >
            <h2 className="text-xl font-bold text-indigo-600">עוזר חכם (AI)</h2>
            <p className="mt-2 text-sm text-gray-600">
              מחולל הודעות מעקב והצעות מחיר מותאמות אישית ללקוחות.
            </p>
          </Link>
        </div>
      </div>
    </>
  );
}
