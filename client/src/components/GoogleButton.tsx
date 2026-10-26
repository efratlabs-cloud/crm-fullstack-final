import { FcGoogle } from "react-icons/fc";

export default function GoogleButton() {
  return (
    <a
      href="/api/auth/google"
      className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
    >
      <FcGoogle size={22} />
      <span>התחברות עם Google</span>
    </a>
  );
}
