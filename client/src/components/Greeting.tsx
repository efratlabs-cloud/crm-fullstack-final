"use client";

import { useEffect, useState } from "react";

// קומפוננטה פנימית קטנה שמחשבת את הברכה רק בצד הלקוח כדי למנוע Hydration Mismatch
export default function Greeting() {
  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const hour = new Date().getHours();
      if (hour < 12) setGreeting("בוקר טוב");
      else if (hour < 17) setGreeting("צהריים טובים");
      else setGreeting("ערב טוב");
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  // בזמן הרינדור הראשוני בשרת זה מחזיר ריק, ובדפדפן זה מתמלא מיד
  if (!greeting) return null;

  return <span>{greeting}, </span>;
}
