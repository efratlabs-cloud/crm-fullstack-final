"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Greeting from "./Greeting";

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navLinks = [
    { name: "דאשבורד", href: "/dashboard" },
    { name: "ניהול לידים", href: "/leads" },
    { name: "פרויקטים", href: "/projects" },
    { name: "עוזר חכם (AI)", href: "/aiassistant" },
  ];

  const isAuthPage = pathname === "/login" || pathname === "/register";

  if (isAuthPage) {
    return (
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <span className="text-xl font-bold text-indigo-600">
              Studio CRM
            </span>
            <Link
              href={pathname === "/login" ? "/register" : "/login"}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-800"
            >
              {pathname === "/login" ? "הרשמה" : "התחברות"}
            </Link>
          </div>
        </div>
      </nav>
    );
  }

  const userInitial = user?.name
    ? user.name.trim().charAt(0).toUpperCase()
    : "U";

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case "Super-Admin":
      case "super-admin":
        return {
          label: "Super Admin",
          classes: "bg-purple-50 text-purple-700 border-purple-200",
        };
      case "Company-Admin":
      case "admin":
        return {
          label: "Admin",
          classes: "bg-indigo-50 text-indigo-700 border-indigo-200",
        };
      case "Company-HR":
        return {
          label: "HR",
          classes: "bg-amber-50 text-amber-700 border-amber-200",
        };
      default:
        return {
          label: "Team",
          classes: "bg-emerald-50 text-emerald-700 border-emerald-200",
        };
    }
  };

  const roleBadge = getRoleBadge(user?.role);

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-8 space-x-reverse">
            <div className="shrink-0 flex items-center">
              <span className="text-xl font-bold text-indigo-600">
                Studio CRM
              </span>
            </div>
            <div className="hidden md:flex space-x-4 space-x-reverse">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-indigo-50 text-indigo-600"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    {link.name}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-3" dir="rtl">
            {user && (
              <div className="flex items-center gap-3 pl-2 border-l border-gray-200">
                <div className="flex flex-col items-end text-right leading-tight">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-900">
                      {user.name}
                    </span>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide ${roleBadge.classes}`}
                    >
                      {roleBadge.label}
                    </span>
                  </div>

                  <span className="text-[11px] font-medium text-gray-500 mt-0.5">
                    <Greeting /> כיף לראות אותך פה!
                  </span>
                </div>

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-700 border-2 border-amber-700/80 text-white font-bold text-base shadow-xs select-none">
                  {userInitial}
                </div>
              </div>
            )}

            <button
              onClick={logout}
              title="התנתק מהמערכת"
              aria-label="התנתק מהמערכת"
              className="p-2 rounded-xl text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}