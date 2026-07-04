import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import { Eye, EyeOff } from "lucide-react";
import { useLocale } from "@/lib/locale";

function Field({
  label, type, placeholder, value, onChange, toggle,
}: {
  label: string;
  type: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  toggle?: { shown: boolean; onToggle: () => void };
}) {
  return (
    <label className="block">
      <span className="block text-[13px] font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.75)" }}>{label}</span>
      <div className="relative">
        <input
          type={toggle ? (toggle.shown ? "text" : "password") : type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full h-11 px-4 rounded-xl text-sm text-white outline-none transition-all"
          style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", paddingRight: toggle ? "42px" : undefined }}
          onFocus={e => (e.currentTarget.style.borderColor = "#D5AD68")}
          onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)")}
        />
        {toggle && (
          <button type="button" onClick={toggle.onToggle}
            className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
            style={{ color: "rgba(255,255,255,0.4)" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#D5AD68")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}>
            {toggle.shown ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
    </label>
  );
}

export default function AuthPage({ mode }: { mode: "login" | "signup" }) {
  const { t } = useLocale();
  const [, navigate] = useLocation();
  const isSignup = mode === "signup";

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-10"
      style={{ background: "radial-gradient(1000px 500px at 50% -10%, rgba(213,173,104,0.10), transparent), #0a0a12" }}>

      {/* Logo → home */}
      <Link href="/" className="flex items-center gap-2.5 mb-8 cursor-pointer">
        <div className="w-11 h-11">
          <svg viewBox="0 0 100 100" className="w-full h-full" style={{ fill: "#D5AD68" }}>
            <polygon points="50 5 95 27.5 95 72.5 50 95 5 72.5 5 27.5" />
            <polygon points="50 20 80 37 80 63 50 80 20 63 20 37" style={{ fill: "#0a0a12" }} />
            <polygon points="50 35 65 45 65 55 50 65 35 55 35 45" style={{ fill: "#D5AD68" }} />
          </svg>
        </div>
        <span className="font-heading font-bold text-2xl tracking-tight text-white">
          Ra<span style={{ color: "#D5AD68" }}>Rumble</span>
        </span>
      </Link>

      <motion.div
        key={mode}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="w-full rounded-2xl p-6 md:p-8"
        style={{ maxWidth: "440px", background: "#111120", border: "1px solid rgba(213,173,104,0.25)", boxShadow: "0 24px 80px rgba(0,0,0,0.6)" }}
      >
        <h1 className="text-[24px] font-bold text-white mb-1 font-heading">
          {isSignup ? t("authSignupTitle") : t("authLoginTitle")}
        </h1>
        <p className="text-[13px] mb-6" style={{ color: "rgba(255,255,255,0.5)" }}>
          {isSignup ? t("authSignupSub") : t("authLoginSub")}
        </p>

        <form onSubmit={e => e.preventDefault()} className="flex flex-col gap-4">
          {isSignup && (
            <Field label={t("authUsername")} type="text" placeholder="ShadowStriker" value={username} onChange={setUsername} />
          )}
          <Field label={t("authEmail")} type="email" placeholder="you@example.com" value={email} onChange={setEmail} />
          <Field label={t("authPassword")} type="password" placeholder="••••••••" value={password} onChange={setPassword}
            toggle={{ shown: showPw, onToggle: () => setShowPw(s => !s) }} />
          {isSignup && (
            <Field label={t("authConfirm")} type="password" placeholder="••••••••" value={confirm} onChange={setConfirm}
              toggle={{ shown: showConfirm, onToggle: () => setShowConfirm(s => !s) }} />
          )}

          {!isSignup && (
            <a href="#" className="text-[12px] font-semibold self-end -mt-1 transition-opacity hover:opacity-80" style={{ color: "#D5AD68" }}>
              {t("authForgot")}
            </a>
          )}

          <button type="submit"
            className="h-11 rounded-xl font-bold text-[14px] transition-all hover:opacity-90 hover:scale-[1.01] mt-1"
            style={{ background: "linear-gradient(135deg, #D5AD68 0%, #e8c586 100%)", color: "#1a1100", boxShadow: "0 4px 20px rgba(213,173,104,0.3)" }}>
            {isSignup ? t("authSignupBtn") : t("login")}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-5">
          <div className="flex-1" style={{ height: "1px", background: "rgba(255,255,255,0.08)" }} />
          <span className="text-[11px] uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.35)" }}>{t("authOr")}</span>
          <div className="flex-1" style={{ height: "1px", background: "rgba(255,255,255,0.08)" }} />
        </div>

        {/* Social */}
        <div className="grid grid-cols-2 gap-3">
          <button className="h-11 rounded-xl flex items-center justify-center gap-2 text-[13px] font-semibold text-white transition-all"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)" }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(213,173,104,0.4)")}
            onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)")}>
            <svg viewBox="0 0 18 18" className="w-4 h-4">
              <path d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 01-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" fill="#4285F4" />
              <path d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 009 18z" fill="#34A853" />
              <path d="M3.97 10.72A5.41 5.41 0 013.68 9c0-.6.1-1.18.29-1.72V4.95H.96A9 9 0 000 9c0 1.45.35 2.83.96 4.05l3.01-2.33z" fill="#FBBC05" />
              <path d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 00.96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" fill="#EA4335" />
            </svg>
            Google
          </button>
          <button className="h-11 rounded-xl flex items-center justify-center gap-2 text-[13px] font-semibold text-white transition-all"
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)" }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(213,173,104,0.4)")}
            onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)")}>
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="#5865F2">
              <path d="M20.317 4.37a19.79 19.79 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128c.126-.094.252-.192.372-.292a.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
            </svg>
            Discord
          </button>
        </div>

        {isSignup && (
          <p className="text-[11px] mt-5 leading-relaxed text-center" style={{ color: "rgba(255,255,255,0.4)" }}>
            {t("authTerms")}{" "}
            <a href="#" className="font-semibold underline underline-offset-2" style={{ color: "#D5AD68" }}>{t("linkTerms")}</a>
            {" "}{t("authAnd")}{" "}
            <a href="#" className="font-semibold underline underline-offset-2" style={{ color: "#D5AD68" }}>{t("linkPrivacy")}</a>
          </p>
        )}

        {/* Switch mode */}
        <p className="text-[13px] mt-6 text-center" style={{ color: "rgba(255,255,255,0.5)" }}>
          {isSignup ? t("authHaveAccount") : t("authNoAccount")}{" "}
          <button onClick={() => navigate(isSignup ? "/login" : "/signup")}
            className="font-bold transition-opacity hover:opacity-80" style={{ color: "#D5AD68" }}>
            {isSignup ? t("login") : t("authSignup")}
          </button>
        </p>
      </motion.div>
    </div>
  );
}
