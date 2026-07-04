import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import { Eye, EyeOff, Loader2, Check } from "lucide-react";
import { useLocale } from "@/lib/locale";

function Field({
  label, type, placeholder, value, onChange, error, toggle, autoComplete,
}: {
  label: string;
  type: string;
  placeholder?: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  toggle?: { shown: boolean; onToggle: () => void };
  autoComplete?: string;
}) {
  const borderColor = error ? "#ef4444" : "rgba(255,255,255,0.10)";
  return (
    <label className="block">
      <span className="block text-[13px] font-medium mb-1.5" style={{ color: "rgba(255,255,255,0.65)" }}>{label}</span>
      <div className="relative">
        <input
          type={toggle ? (toggle.shown ? "text" : "password") : type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="w-full h-12 px-4 rounded-xl text-sm text-white outline-none transition-all"
          style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${borderColor}`, paddingRight: toggle ? "42px" : undefined }}
          onFocus={e => { e.currentTarget.style.borderColor = error ? "#ef4444" : "#D5AD68"; e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
          onBlur={e => { e.currentTarget.style.borderColor = borderColor; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
        />
        {toggle && (
          <button type="button" onClick={toggle.onToggle} tabIndex={-1}
            className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
            style={{ color: "rgba(255,255,255,0.35)" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#D5AD68")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.35)")}>
            {toggle.shown ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      {error && (
        <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
          className="text-[12px] mt-1.5 font-medium" style={{ color: "#ef4444" }}>
          {error}
        </motion.p>
      )}
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
  const [remember, setRemember] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const score = (() => {
    let s = 0;
    if (password.length >= 8) s++;
    if (password.length >= 12) s++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) s++;
    if (/\d/.test(password)) s++;
    if (/[^a-zA-Z0-9]/.test(password)) s++;
    return s;
  })();
  const strength = score >= 4 ? { label: t("authStrong"), color: "#22c55e", bars: 3 }
    : score >= 3 ? { label: t("authMedium"), color: "#eab308", bars: 2 }
    : { label: t("authWeak"), color: "#ef4444", bars: 1 };

  const clearError = (key: string) => setErrors(prev => {
    if (!(key in prev)) return prev;
    const next = { ...prev };
    delete next[key];
    return next;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || success) return;
    const errs: Record<string, string> = {};
    if (isSignup && username.trim().length < 3) errs.username = t("authErrUsername");
    if (!/^\S+@\S+\.\S+$/.test(email)) errs.email = t("authErrEmail");
    if (password.length < 8) errs.password = t("authErrPassword");
    if (isSignup && confirm !== password) errs.confirm = t("authErrConfirm");
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    // No backend yet — simulate the request, then land back home
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSuccess(true);
      setTimeout(() => navigate("/"), 1400);
    }, 1500);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden" style={{ background: "#0a0a12" }}>

      {/* Single soft glow behind the form — the only decoration */}
      <div className="absolute pointer-events-none" style={{ width: "640px", height: "640px", borderRadius: "50%", background: "radial-gradient(circle, rgba(213,173,104,0.07), transparent 65%)", top: "50%", left: "50%", transform: "translate(-50%, -55%)" }} />

      <motion.div
        key={mode}
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full relative"
        style={{ maxWidth: "400px" }}
      >
        {/* Logo */}
        <Link href="/" className="flex justify-center mb-8 cursor-pointer">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10">
              <svg viewBox="0 0 100 100" className="w-full h-full" style={{ fill: "#D5AD68" }}>
                <polygon points="50 5 95 27.5 95 72.5 50 95 5 72.5 5 27.5" />
                <polygon points="50 20 80 37 80 63 50 80 20 63 20 37" style={{ fill: "#0a0a12" }} />
                <polygon points="50 35 65 45 65 55 50 65 35 55 35 45" style={{ fill: "#D5AD68" }} />
              </svg>
            </div>
            <span className="font-heading font-bold text-2xl tracking-tight text-white">
              Ra<span style={{ color: "#D5AD68" }}>Rumble</span>
            </span>
          </div>
        </Link>

        {/* Title */}
        <h1 className="text-[26px] font-bold text-white text-center mb-2 font-heading">
          {isSignup ? t("authSignupTitle") : t("authLoginTitle")}
        </h1>
        <p className="text-[13px] text-center mb-8" style={{ color: "rgba(255,255,255,0.5)" }}>
          {isSignup ? t("authHaveAccount") : t("authNoAccount")}{" "}
          <button onClick={() => navigate(isSignup ? "/login" : "/signup")}
            className="font-semibold transition-opacity hover:opacity-80 cursor-pointer" style={{ color: "#D5AD68" }}>
            {isSignup ? t("login") : t("authSignup")}
          </button>
        </p>

        {/* Google */}
        <button className="w-full h-12 rounded-xl flex items-center justify-center gap-3 text-[14px] font-semibold text-white transition-all mb-6"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)" }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(213,173,104,0.5)"; e.currentTarget.style.background = "rgba(213,173,104,0.05)"; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}>
          <svg viewBox="0 0 18 18" className="w-4.5 h-4.5" style={{ width: "18px", height: "18px" }}>
            <path d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 01-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" fill="#4285F4" />
            <path d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 009 18z" fill="#34A853" />
            <path d="M3.97 10.72A5.41 5.41 0 013.68 9c0-.6.1-1.18.29-1.72V4.95H.96A9 9 0 000 9c0 1.45.35 2.83.96 4.05l3.01-2.33z" fill="#FBBC05" />
            <path d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 00.96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" fill="#EA4335" />
          </svg>
          {t("authGoogle")}
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1" style={{ height: "1px", background: "rgba(255,255,255,0.07)" }} />
          <span className="text-[11px] uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.3)" }}>{t("authOrEmail")}</span>
          <div className="flex-1" style={{ height: "1px", background: "rgba(255,255,255,0.07)" }} />
        </div>

        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
          {isSignup && (
            <Field label={t("authUsername")} type="text" placeholder="ShadowStriker" autoComplete="username"
              value={username} onChange={v => { setUsername(v); clearError("username"); }} error={errors.username} />
          )}
          <Field label={t("authEmail")} type="email" placeholder="you@example.com" autoComplete="email"
            value={email} onChange={v => { setEmail(v); clearError("email"); }} error={errors.email} />
          <div>
            <Field label={t("authPassword")} type="password" placeholder="••••••••"
              autoComplete={isSignup ? "new-password" : "current-password"}
              value={password} onChange={v => { setPassword(v); clearError("password"); }} error={errors.password}
              toggle={{ shown: showPw, onToggle: () => setShowPw(s => !s) }} />
            {isSignup && password.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 mt-2">
                <div className="flex gap-1 flex-1">
                  {[1, 2, 3].map(bar => (
                    <div key={bar} className="h-1 flex-1 rounded-full transition-all duration-300"
                      style={{ background: bar <= strength.bars ? strength.color : "rgba(255,255,255,0.08)" }} />
                  ))}
                </div>
                <span className="text-[11px] font-semibold shrink-0" style={{ color: strength.color }}>{strength.label}</span>
              </motion.div>
            )}
          </div>
          {isSignup && (
            <Field label={t("authConfirm")} type="password" placeholder="••••••••" autoComplete="new-password"
              value={confirm} onChange={v => { setConfirm(v); clearError("confirm"); }} error={errors.confirm}
              toggle={{ shown: showConfirm, onToggle: () => setShowConfirm(s => !s) }} />
          )}

          {!isSignup && (
            <div className="flex items-center justify-between -mt-1">
              <button type="button" onClick={() => setRemember(r => !r)} className="flex items-center gap-2 cursor-pointer">
                <div className="rounded flex items-center justify-center transition-all"
                  style={{ width: "17px", height: "17px", background: remember ? "#D5AD68" : "transparent", border: remember ? "1px solid #D5AD68" : "1px solid rgba(255,255,255,0.25)" }}>
                  {remember && <Check className="w-3 h-3" style={{ color: "#1a1100" }} strokeWidth={3.5} />}
                </div>
                <span className="text-[12px]" style={{ color: "rgba(255,255,255,0.55)" }}>{t("authRemember")}</span>
              </button>
              <a href="#" className="text-[12px] font-medium transition-opacity hover:opacity-80" style={{ color: "#D5AD68" }}>
                {t("authForgot")}
              </a>
            </div>
          )}

          <button type="submit" disabled={submitting || success}
            className="h-12 rounded-xl font-bold text-[14px] transition-all mt-2 flex items-center justify-center gap-2"
            style={{
              background: success ? "#22c55e" : "#D5AD68",
              color: success ? "#052e13" : "#1a1100",
              opacity: submitting ? 0.8 : 1,
              cursor: submitting || success ? "default" : "pointer",
            }}
            onMouseEnter={e => { if (!submitting && !success) e.currentTarget.style.background = "#e0bc7d"; }}
            onMouseLeave={e => { if (!submitting && !success) e.currentTarget.style.background = "#D5AD68"; }}>
            {success ? (
              <><Check className="w-4 h-4" strokeWidth={3} /> {t("authSuccess")}</>
            ) : submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              isSignup ? t("authSignupBtn") : t("login")
            )}
          </button>
        </form>

        {isSignup && (
          <p className="text-[11px] mt-6 leading-relaxed text-center" style={{ color: "rgba(255,255,255,0.35)" }}>
            {t("authTerms")}{" "}
            <a href="#" className="font-medium underline underline-offset-2" style={{ color: "rgba(213,173,104,0.9)" }}>{t("linkTerms")}</a>
            {" "}{t("authAnd")}{" "}
            <a href="#" className="font-medium underline underline-offset-2" style={{ color: "rgba(213,173,104,0.9)" }}>{t("linkPrivacy")}</a>
          </p>
        )}
      </motion.div>

      {/* Footer line */}
      <p className="relative mt-10 text-[11px]" style={{ color: "rgba(255,255,255,0.25)" }}>{t("copyright")}</p>
    </div>
  );
}
