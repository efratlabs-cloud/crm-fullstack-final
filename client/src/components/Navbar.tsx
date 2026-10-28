"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react"; // הוספנו סטייט ואפקט

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [greeting, setGreeting] = useState(""); // סטייט לניהול הברכה

  useEffect(() => {
    const hour = new Date().getHours();
    const currentGreeting =
      hour < 12 ? "בוקר טוב" : hour < 17 ? "צהריים טובים" : "ערב טוב";
    setGreeting(currentGreeting);
  }, []);

  const navLinks = [
    { name: "דאשבורד", href: "/dashboard" },
    { name: "ניהול לידים", href: "/leads" },
    { name: "פרויקטים", href: "/projects" },
    { name: "עוזר חכם (AI)", href: "/ai-assistant" },
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

          <div className="flex items-center space-x-4 space-x-reverse">
            {user && (
              <span className="text-sm font-medium text-gray-700">
                {greeting} {user.name}
                {user.role === "admin" && (
                  <span className="mr-2 rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">
                    Admin
                  </span>
                )}
              </span>
            )}
            <button
              onClick={logout}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
            >
              התנתק
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
