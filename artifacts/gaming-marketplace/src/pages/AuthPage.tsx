import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import { Eye, EyeOff, Loader2, Check, ShieldCheck, BadgeCheck, Headphones, LogIn, UserPlus, ChevronRight } from "lucide-react";
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
  const borderColor = error ? "#ef4444" : "rgba(255,255,255,0.12)";
  return (
    <label className="block">
      <span className="block text-[13px] font-semibold mb-1.5" style={{ color: "rgba(255,255,255,0.75)" }}>{label}</span>
      <div className="relative">
        <input
          type={toggle ? (toggle.shown ? "text" : "password") : type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="w-full h-11 px-4 rounded-xl text-sm text-white outline-none transition-all"
          style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${borderColor}`, paddingRight: toggle ? "42px" : undefined }}
          onFocus={e => (e.currentTarget.style.borderColor = error ? "#ef4444" : "#D5AD68")}
          onBlur={e => (e.currentTarget.style.borderColor = borderColor)}
        />
        {toggle && (
          <button type="button" onClick={toggle.onToggle} tabIndex={-1}
            className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
            style={{ color: "rgba(255,255,255,0.4)" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#D5AD68")}
            onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}>
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

// 0-1 none, 2 weak, 3 medium, 4+ strong
function passwordScore(pw: string): number {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^a-zA-Z0-9]/.test(pw)) score++;
  return score;
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

  const score = passwordScore(password);
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
    <div className="min-h-screen flex relative overflow-hidden" style={{ background: "#0a0a12" }}>

      {/* Page-wide decorative layer — continuous across both halves, no seam */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(900px 500px at 15% 110%, rgba(213,173,104,0.08), transparent), radial-gradient(800px 400px at 75% -10%, rgba(213,173,104,0.06), transparent)" }} />
      <motion.svg viewBox="0 0 100 100" className="absolute pointer-events-none" style={{ width: "380px", top: "-80px", left: "30%", opacity: 0.05, fill: "#D5AD68" }}
        animate={{ y: [0, -14, 0], rotate: [0, 4, 0] }} transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}>
        <polygon points="50 5 95 27.5 95 72.5 50 95 5 72.5 5 27.5" />
      </motion.svg>
      <motion.svg viewBox="0 0 100 100" className="absolute pointer-events-none" style={{ width: "240px", bottom: "-40px", left: "-70px", opacity: 0.04, fill: "#D5AD68" }}
        animate={{ y: [0, 12, 0], rotate: [0, -5, 0] }} transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}>
        <polygon points="50 5 95 27.5 95 72.5 50 95 5 72.5 5 27.5" />
      </motion.svg>
      <motion.svg viewBox="0 0 100 100" className="absolute pointer-events-none" style={{ width: "180px", top: "20%", right: "-60px", opacity: 0.04, fill: "#D5AD68" }}
        animate={{ y: [0, 10, 0], rotate: [0, 6, 0] }} transition={{ duration: 13, repeat: Infinity, ease: "easeInOut" }}>
        <polygon points="50 5 95 27.5 95 72.5 50 95 5 72.5 5 27.5" />
      </motion.svg>

      {/* ── Left brand panel (desktop only) ── */}
      <div className="hidden lg:flex flex-col justify-between relative p-12" style={{ width: "44%" }}>
        {/* Logo */}
        <Link href="/" className="relative flex items-center gap-2.5 cursor-pointer w-fit">
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

        {/* Middle: headline + trust bullets */}
        <div className="relative">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h2 className="font-heading font-bold text-white leading-tight mb-3" style={{ fontSize: "36px" }}>
              {t("faqDiscover")} <span style={{ color: "#D5AD68" }}>RaRumble:</span><br />
              {t("faqPlatform")}
            </h2>
            <p className="text-[15px] mb-10" style={{ color: "rgba(255,255,255,0.5)", lineHeight: 1.7, maxWidth: "380px" }}>
              {t("footerJoin")}
            </p>
            {/* Login / Sign up switcher cards */}
            <div className="flex flex-col gap-4" style={{ maxWidth: "380px" }}>
              {[
                { active: !isSignup, path: "/login", icon: LogIn, title: t("authLoginTitle"), sub: t("authLoginSub") },
                { active: isSignup, path: "/signup", icon: UserPlus, title: t("authSignupTitle"), sub: t("authSignupSub") },
              ].map(({ active, path, icon: Icon, title, sub }, i) => (
                <motion.button
                  key={path}
                  onClick={() => navigate(path)}
                  initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.15 }}
                  className="flex items-center gap-4 p-4 rounded-2xl text-left transition-all cursor-pointer group"
                  style={{
                    background: active ? "rgba(213,173,104,0.10)" : "rgba(255,255,255,0.03)",
                    border: active ? "1px solid rgba(213,173,104,0.55)" : "1px solid rgba(255,255,255,0.08)",
                    boxShadow: active ? "0 0 28px rgba(213,173,104,0.10)" : "none",
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.borderColor = "rgba(213,173,104,0.3)"; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
                >
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"
                    style={{ background: active ? "rgba(213,173,104,0.2)" : "rgba(213,173,104,0.10)", border: active ? "1px solid rgba(213,173,104,0.5)" : "1px solid rgba(213,173,104,0.2)" }}>
                    <Icon className="w-5 h-5" style={{ color: "#D5AD68" }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[15px] font-bold leading-tight" style={{ color: active ? "#D5AD68" : "#ffffff" }}>{title}</p>
                    <p className="text-[12px] mt-0.5 leading-snug" style={{ color: "rgba(255,255,255,0.5)" }}>{sub}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 ml-auto shrink-0 transition-transform group-hover:translate-x-0.5"
                    style={{ color: active ? "#D5AD68" : "rgba(255,255,255,0.3)" }} />
                </motion.button>
              ))}
            </div>

            {/* Trust row */}
            <div className="flex items-center gap-6 mt-10">
              {[
                { icon: BadgeCheck, label: t("statVerified") },
                { icon: ShieldCheck, label: t("statFraud") },
                { icon: Headphones, label: t("statSupport") },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2">
                  <Icon className="w-4 h-4 shrink-0" style={{ color: "rgba(213,173,104,0.7)" }} />
                  <span className="text-[11px] font-medium" style={{ color: "rgba(255,255,255,0.45)" }}>{label}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Bottom: copyright */}
        <p className="relative text-[12px]" style={{ color: "rgba(255,255,255,0.3)" }}>{t("copyright")}</p>
      </div>

      {/* ── Right: form ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-10 relative">

        {/* Mobile logo */}
        <Link href="/" className="flex lg:hidden items-center gap-2.5 mb-8 cursor-pointer">
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
              {/* Strength meter — signup only */}
              {isSignup && password.length > 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 mt-2">
                  <div className="flex gap-1 flex-1">
                    {[1, 2, 3].map(bar => (
                      <div key={bar} className="h-1 flex-1 rounded-full transition-all duration-300"
                        style={{ background: bar <= strength.bars ? strength.color : "rgba(255,255,255,0.1)" }} />
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
                  <div className="w-4.5 h-4.5 rounded flex items-center justify-center transition-all"
                    style={{ width: "18px", height: "18px", background: remember ? "#D5AD68" : "rgba(255,255,255,0.06)", border: remember ? "1px solid #D5AD68" : "1px solid rgba(255,255,255,0.25)" }}>
                    {remember && <Check className="w-3 h-3" style={{ color: "#1a1100" }} strokeWidth={3.5} />}
                  </div>
                  <span className="text-[12px] font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>{t("authRemember")}</span>
                </button>
                <a href="#" className="text-[12px] font-semibold transition-opacity hover:opacity-80" style={{ color: "#D5AD68" }}>
                  {t("authForgot")}
                </a>
              </div>
            )}

            <button type="submit" disabled={submitting || success}
              className="h-11 rounded-xl font-bold text-[14px] transition-all mt-1 flex items-center justify-center gap-2"
              style={{
                background: success ? "#22c55e" : "linear-gradient(135deg, #D5AD68 0%, #e8c586 100%)",
                color: success ? "#052e13" : "#1a1100",
                boxShadow: success ? "0 4px 20px rgba(34,197,94,0.3)" : "0 4px 20px rgba(213,173,104,0.3)",
                opacity: submitting ? 0.8 : 1,
                cursor: submitting || success ? "default" : "pointer",
              }}>
              {success ? (
                <><Check className="w-4 h-4" strokeWidth={3} /> {t("authSuccess")}</>
              ) : submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                isSignup ? t("authSignupBtn") : t("login")
              )}
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
              className="font-bold transition-opacity hover:opacity-80 cursor-pointer" style={{ color: "#D5AD68" }}>
              {isSignup ? t("login") : t("authSignup")}
            </button>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
