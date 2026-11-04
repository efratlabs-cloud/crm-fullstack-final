"use client";

import Script from "next/script";
import { useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";

interface GoogleCredentialResponse {
  credential: string;
}

type GoogleCredentialHandler = (
  response: GoogleCredentialResponse,
) => void | Promise<void>;

declare global {
  interface Window {
    googleCredentialHandler?: GoogleCredentialHandler;
    googleInitializedClientId?: string;
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
          }) => void;
          renderButton: (
            element: HTMLElement,
            options: {
              theme: "outline";
              size: "large";
              width: number;
              text: "signin_with";
              locale: "he";
            },
          ) => void;
        };
      };
    };
  }
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

export default function GoogleButton() {
  const buttonRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleCredential = async (response: GoogleCredentialResponse) => {
    setError("");
    setLoading(true);

    try {
      const result = await fetch(`${API_URL}/api/auth/google-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: response.credential }),
      });
      const contentType = result.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        throw new Error(`השרת החזיר תשובה לא תקינה (HTTP ${result.status}).`);
      }
      const data = await result.json();

      if (!result.ok) {
        throw new Error(data.message || "ההתחברות עם Google נכשלה.");
      }

      login(data.token, {
        _id: data._id,
        name: data.name,
        email: data.email,
        role: data.role,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "שגיאה בהתחברות עם Google.",
      );
    } finally {
      setLoading(false);
    }
  };

  const initializeGoogle = () => {
    if (!GOOGLE_CLIENT_ID) {
      setError("יש להגדיר NEXT_PUBLIC_GOOGLE_CLIENT_ID כדי להתחבר עם Google.");
      return;
    }
    if (!buttonRef.current || !window.google) {
      setError("לא ניתן לטעון כרגע את שירות ההתחברות של Google.");
      return;
    }

    if (
      window.googleInitializedClientId &&
      window.googleInitializedClientId !== GOOGLE_CLIENT_ID
    ) {
      setError("הוגדר בדפדפן מזהה Google Client ID שונה. רעננו את העמוד.");
      return;
    }

    window.googleCredentialHandler = handleCredential;
    if (!window.googleInitializedClientId) {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: (response) => window.googleCredentialHandler?.(response),
      });
      window.googleInitializedClientId = GOOGLE_CLIENT_ID;
    }

    buttonRef.current.replaceChildren();
    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: "outline",
      size: "large",
      width: Math.max(240, Math.floor(buttonRef.current.clientWidth)),
      text: "signin_with",
      locale: "he",
    });
  };

  return (
    <div className="space-y-2">
      {GOOGLE_CLIENT_ID ? (
        <>
          <Script
            src="https://accounts.google.com/gsi/client"
            strategy="afterInteractive"
            onReady={initializeGoogle}
            onError={() =>
              setError("לא ניתן לטעון את שירות ההתחברות של Google.")
            }
          />
          <div
            ref={buttonRef}
            className="flex min-h-11 justify-center"
            aria-busy={loading}
          />
          {loading && (
            <p className="text-center text-sm text-slate-500">
              מתחבר עם Google...
            </p>
          )}
        </>
      ) : (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-center text-sm text-amber-800">
          יש להגדיר NEXT_PUBLIC_GOOGLE_CLIENT_ID כדי להפעיל התחברות עם Google.
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}
    </div>
  );
}
