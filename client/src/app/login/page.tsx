"use client";

import GoogleButton from "@/components/GoogleButton";
import LoginForm from "@/components/LoginForm";
import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-8 sm:px-6 lg:px-8">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_80px_rgba(15,23,42,0.12)] lg:grid-cols-[1.1fr_0.9fr]">
        <section className="hidden bg-linear-to-br from-slate-900 via-slate-800 to-blue-900 p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="mb-8 inline-flex items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium tracking-[0.08em] text-slate-200">
              CRM SYSTEM
            </div>
            <h1 className="text-4xl font-bold leading-tight">
              ניהול לקוחות
              <br />
              בצורה חכמה
            </h1>
            <p className="mt-5 max-w-md text-sm leading-7 text-slate-300">
              מרכזו את העבודה, עקבו אחרי צינורות המכירות, והעניקו שירות מהיר
              יותר לכלל החברה באמצעות פלטפורמה מודרנית אחת.
            </p>
          </div>

          <div className="grid gap-4 text-sm text-slate-200">
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-400/20 text-base text-emerald-300">
                ✓
              </span>
              מעקב בזמן אמת אחרי לקוחות ופניות
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-400/20 text-base text-blue-300">
                ✓
              </span>
              תהליכי עבודה מאובטחים ומותאמים לצוות
            </div>
          </div>
        </section>

        <section className="flex items-center justify-center bg-white p-6 sm:p-8 lg:p-10">
          <div className="w-full max-w-md">
            <div className="mb-7 text-center lg:text-right">
              <p className="text-sm font-medium text-blue-600">ברוכים הבאים</p>
              <h2 className="mt-2 text-3xl font-bold text-slate-900">
                התחברות
              </h2>
            </div>

            <div className="space-y-5">
              <LoginForm />

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-3 text-xs font-medium text-slate-500">
                    או
                  </span>
                </div>
              </div>

              <GoogleButton />
            </div>

           <p className="mt-6 text-center text-sm text-slate-500">
              אין לך חשבון?{" "}
              <Link
                href="/register"
                className="font-semibold text-blue-600 transition hover:text-blue-700"
              >
                צור חשבון חדש
              </Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
