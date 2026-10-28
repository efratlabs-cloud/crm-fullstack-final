"use client";

import { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { GoogleOAuthProvider, useGoogleLogin } from "@react-oauth/google";
import { useAuth } from "@/context/AuthContext";

function GoogleLoginInner() {
  const { login } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setError("");
      setLoading(true);
      try {
        // 1. שליפת פרטי המשתמש מגוגל באמצעות ה-access_token
        const userInfoRes = await fetch(
          "https://www.googleapis.com/oauth2/v3/userinfo",
          {
            headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
          }
        );
        const userInfo = await userInfoRes.json();

        // 2. שליחת הפרטים לשרת שלנו (POST /api/auth/google)
        const res = await fetch("http://localhost:5000/api/auth/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: userInfo.name,
            email: userInfo.email,
            googleId: userInfo.sub,
          }),
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || "שגיאה בהתחברות עם Google");
        }

        // 3. שמירה ב-AuthContext ומעבר לדאשבורד
        login(data.token, {
          _id: data._id || data.userId,
          name: data.name,
          email: data.email,
          role: data.role || "user",
        });
      } catch (err: unknown) {
        const msg =
          err instanceof Error ? err.message : "שגיאה בהתחברות עם Google";
        setError(msg);
      } finally {
        setLoading(false);
      }
    },
    onError: () => {
      setError("ההתחברות עם Google בוטלה או נכשלה");
    },
  });

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => handleGoogleLogin()}
        disabled={loading}
        className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
      >
        <FcGoogle size={22} />
        <span>{loading ? "מתחבר לגוגל..." : "התחברות עם Google"}</span>
      </button>
      {error && <p className="text-center text-xs text-red-600">{error}</p>}
    </div>
  );
}

export default function GoogleButton() {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "missing-client-id";

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <GoogleLoginInner />
    </GoogleOAuthProvider>
  );
}