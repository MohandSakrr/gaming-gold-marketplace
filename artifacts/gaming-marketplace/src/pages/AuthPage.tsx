import { useState } from "react";
import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import { Eye, EyeOff, Loader2, Check, ShieldCheck, BadgeCheck, Headphones } from "lucide-react";
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
          className="w-full h-12 px-4 rounded-xl text-sm text-white outline-none transition-all"
          style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${borderColor}`, paddingRight: toggle ? "42px" : undefined }}
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

// Kawaii hexagon mascot — RaRumble's answer to the competitor's plush toy
function HexMascot() {
  return (
    <div className="relative" style={{ width: "150px", height: "150px" }}>
      {/* Glow */}
      <div className="absolute inset-0 rounded-full" style={{ background: "radial-gradient(circle, rgba(213,173,104,0.25), transparent 65%)", filter: "blur(8px)" }} />
      {/* Body — gentle float */}
      <motion.svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full"
        animate={{ y: [0, -8, 0], rotate: [0, -3, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}>
        <polygon points="50 4 96 27 96 73 50 96 4 73 4 27" fill="#D5AD68" />
        <polygon points="50 10 90 30 90 70 50 90 10 70 10 30" fill="#15151f" />
        {/* Eyes — blink via scaleY keyframes */}
        <motion.g
          animate={{ scaleY: [1, 1, 0.08, 1, 1] }}
          transition={{ duration: 3.4, repeat: Infinity, times: [0, 0.42, 0.47, 0.52, 1] }}
          style={{ originY: "48%" as unknown as number, originX: "50%" as unknown as number }}>
          <circle cx="38" cy="47" r="5.5" fill="#D5AD68" />
          <circle cx="62" cy="47" r="5.5" fill="#D5AD68" />
          <circle cx="39.8" cy="45.2" r="1.8" fill="#15151f" />
          <circle cx="63.8" cy="45.2" r="1.8" fill="#15151f" />
        </motion.g>
        {/* Smile */}
        <path d="M40 62 Q50 71 60 62" stroke="#D5AD68" strokeWidth="3.2" strokeLinecap="round" fill="none" />
        {/* Blush */}
        <circle cx="29" cy="57" r="3.4" fill="#D5AD68" opacity="0.28" />
        <circle cx="71" cy="57" r="3.4" fill="#D5AD68" opacity="0.28" />
      </motion.svg>
      {/* Sparkles */}
      {[
        { top: "-4px", right: "10px", size: 14, delay: 0 },
        { bottom: "8px", left: "-8px", size: 10, delay: 0.9 },
        { top: "34%", right: "-14px", size: 8, delay: 1.7 },
      ].map((s, i) => (
        <motion.svg key={i} viewBox="0 0 24 24" className="absolute"
          style={{ width: s.size, height: s.size, top: s.top, right: s.right, bottom: s.bottom, left: s.left, fill: "#D5AD68" }}
          animate={{ opacity: [0.15, 1, 0.15], scale: [0.7, 1.15, 0.7] }}
          transition={{ duration: 2.2, repeat: Infinity, delay: s.delay, ease: "easeInOut" }}>
          <path d="M12 0l2.6 9.4L24 12l-9.4 2.6L12 24l-2.6-9.4L0 12l9.4-2.6z" />
        </motion.svg>
      ))}
    </div>
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
    <div className="min-h-screen flex flex-row-reverse relative overflow-hidden" style={{ background: "#0a0a12" }}>

      {/* ── Greeting panel on the RIGHT with a slanted diagonal edge ── */}
      <div className="hidden lg:flex flex-col relative overflow-hidden p-10 pl-20"
        style={{ width: "44%", background: "linear-gradient(200deg, #16161f 0%, #101018 100%)", clipPath: "polygon(12% 0, 100% 0, 100% 100%, 0 100%)" }}>

        {/* Panel decorations */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(600px 400px at 70% 100%, rgba(213,173,104,0.08), transparent)" }} />
        <div className="absolute pointer-events-none" style={{ top: 0, bottom: 0, left: "8%", width: "2px", background: "linear-gradient(180deg, transparent, rgba(213,173,104,0.35), transparent)", transform: "skewX(6deg)" }} />
        <motion.svg viewBox="0 0 100 100" className="absolute pointer-events-none" style={{ width: "300px", bottom: "-80px", right: "-80px", opacity: 0.05, fill: "#D5AD68" }}
          animate={{ rotate: [0, 6, 0] }} transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}>
          <polygon points="50 5 95 27.5 95 72.5 50 95 5 72.5 5 27.5" />
        </motion.svg>

        {/* Logo — prominent, with gold glow */}
        <Link href="/" className="relative flex items-center gap-3.5 cursor-pointer w-fit group">
          <div className="w-14 h-14 transition-transform duration-300 group-hover:scale-105"
            style={{ filter: "drop-shadow(0 0 14px rgba(213,173,104,0.45))" }}>
            <svg viewBox="0 0 100 100" className="w-full h-full" style={{ fill: "#D5AD68" }}>
              <polygon points="50 5 95 27.5 95 72.5 50 95 5 72.5 5 27.5" />
              <polygon points="50 20 80 37 80 63 50 80 20 63 20 37" style={{ fill: "#101018" }} />
              <polygon points="50 35 65 45 65 55 50 65 35 55 35 45" style={{ fill: "#D5AD68" }} />
            </svg>
          </div>
          <div>
            <span className="block font-heading font-bold text-[32px] leading-none tracking-tight text-white"
              style={{ textShadow: "0 2px 20px rgba(0,0,0,0.6)" }}>
              Ra<span style={{ color: "#D5AD68" }}>Rumble</span>
            </span>
            <span className="block text-[10px] font-semibold uppercase mt-1.5" style={{ color: "rgba(213,173,104,0.75)", letterSpacing: "0.32em" }}>
              {t("faqPlatform")}
            </span>
          </div>
        </Link>

        {/* Center: HELLO + mascot */}
        <div className="relative flex-1 flex items-center">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: "easeOut" }}
            className="flex items-center gap-8 flex-wrap">
            <div>
              <h2 className="font-heading font-black leading-none mb-4"
                style={{ fontSize: "clamp(56px, 6vw, 88px)", letterSpacing: "-0.02em", backgroundImage: "linear-gradient(120deg, #ffffff 30%, #D5AD68 75%, #f0d9a8 100%)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent" }}>
                {t("authHello")}
              </h2>
              <p className="font-heading font-medium uppercase" style={{ fontSize: "clamp(18px, 2vw, 28px)", color: "rgba(255,255,255,0.85)", letterSpacing: "0.08em" }}>
                {t("authWelcome").toUpperCase()}
              </p>
              <div className="mt-4 h-1 w-24 rounded-full" style={{ background: "linear-gradient(90deg, #D5AD68, transparent)" }} />
            </div>
            <HexMascot />
          </motion.div>
        </div>

        {/* Bottom: trust row */}
        <div className="relative flex items-center gap-6 flex-wrap">
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
      </div>

      {/* ── Right: form floats directly on the background ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-10 relative">
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(700px 400px at 70% -10%, rgba(213,173,104,0.05), transparent)" }} />

        {/* Mobile logo */}
        <Link href="/" className="flex lg:hidden items-center gap-2.5 mb-8 cursor-pointer relative">
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
          className="w-full relative"
          style={{ maxWidth: "420px" }}
        >
          {/* Title + switch link */}
          <h1 className="text-[28px] font-bold text-white mb-1.5 font-heading">
            {isSignup ? t("authSignupTitle") : t("authLoginTitle")}
          </h1>
          <p className="text-[13px] mb-7" style={{ color: "rgba(255,255,255,0.5)" }}>
            {isSignup ? t("authHaveAccount") : t("authNoAccount")}{" "}
            <button onClick={() => navigate(isSignup ? "/login" : "/signup")}
              className="font-bold transition-opacity hover:opacity-80 cursor-pointer" style={{ color: "#D5AD68" }}>
              {isSignup ? t("login") : t("authSignup")}
            </button>
          </p>

          {/* Big Google button */}
          <button className="w-full h-12 rounded-full flex items-center justify-center gap-3 text-[14px] font-semibold text-white transition-all mb-4"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.14)" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(213,173,104,0.5)"; e.currentTarget.style.background = "rgba(213,173,104,0.06)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.14)"; e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}>
            <svg viewBox="0 0 18 18" className="w-5 h-5">
              <path d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 01-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" fill="#4285F4" />
              <path d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 009 18z" fill="#34A853" />
              <path d="M3.97 10.72A5.41 5.41 0 013.68 9c0-.6.1-1.18.29-1.72V4.95H.96A9 9 0 000 9c0 1.45.35 2.83.96 4.05l3.01-2.33z" fill="#FBBC05" />
              <path d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 00.96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" fill="#EA4335" />
            </svg>
            {t("authGoogle")}
          </button>

          {/* Social circles */}
          <div className="flex items-center justify-center gap-4 mb-6">
            {/* Discord */}
            <button className="w-11 h-11 rounded-full flex items-center justify-center transition-transform hover:scale-110" style={{ background: "#5865F2" }} title="Discord">
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#ffffff">
                <path d="M20.317 4.37a19.79 19.79 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128c.126-.094.252-.192.372-.292a.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
            </button>
            {/* X */}
            <button className="w-11 h-11 rounded-full flex items-center justify-center transition-transform hover:scale-110" style={{ background: "#ffffff" }} title="X">
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="#000000">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </button>
            {/* Facebook */}
            <button className="w-11 h-11 rounded-full flex items-center justify-center transition-transform hover:scale-110" style={{ background: "#1877F2" }} title="Facebook">
              <svg viewBox="0 0 24 24" className="w-5 h-5" fill="#ffffff">
                <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
              </svg>
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6">
            <div className="flex-1" style={{ height: "1px", background: "rgba(255,255,255,0.08)" }} />
            <span className="text-[11px] uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.35)" }}>{t("authOrEmail")}</span>
            <div className="flex-1" style={{ height: "1px", background: "rgba(255,255,255,0.08)" }} />
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
                  <div className="rounded flex items-center justify-center transition-all"
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

            {/* Big pill CTA */}
            <button type="submit" disabled={submitting || success}
              className="h-12 rounded-full font-bold text-[15px] transition-all mt-2 flex items-center justify-center gap-2"
              style={{
                background: success ? "#22c55e" : "linear-gradient(135deg, #D5AD68 0%, #e8c586 100%)",
                color: success ? "#052e13" : "#1a1100",
                boxShadow: success ? "0 6px 24px rgba(34,197,94,0.35)" : "0 6px 24px rgba(213,173,104,0.35)",
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

          {isSignup && (
            <p className="text-[11px] mt-5 leading-relaxed text-center" style={{ color: "rgba(255,255,255,0.4)" }}>
              {t("authTerms")}{" "}
              <a href="#" className="font-semibold underline underline-offset-2" style={{ color: "#D5AD68" }}>{t("linkTerms")}</a>
              {" "}{t("authAnd")}{" "}
              <a href="#" className="font-semibold underline underline-offset-2" style={{ color: "#D5AD68" }}>{t("linkPrivacy")}</a>
            </p>
          )}
        </motion.div>
      </div>
    </div>
  );
}
