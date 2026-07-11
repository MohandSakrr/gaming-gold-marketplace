import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useLocation } from "wouter";
import { Loader2, Check, MailCheck } from "lucide-react";
import { useLocale } from "@/lib/locale";
import { useAuth, AuthError } from "@/lib/auth";

const PENDING_KEY = "rarumble-pending-verify";

export function setPendingVerify(email: string, devCode?: string) {
  try { sessionStorage.setItem(PENDING_KEY, JSON.stringify({ email, devCode })); } catch { /* unavailable */ }
}

function loadPending(): { email: string; devCode?: string } | null {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* unavailable */ }
  return null;
}

export default function VerifyPage() {
  const { t } = useLocale();
  const { verify, resendCode } = useAuth();
  const [, navigate] = useLocation();

  const pending = loadPending();
  const [darkMode] = useState(() => {
    try { return localStorage.getItem("rarumble-theme") !== "light"; } catch { return true; }
  });

  const [digits, setDigits] = useState(["", "", "", ""]);
  const [devCode, setDevCode] = useState<string | undefined>(pending?.devCode);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  // No pending signup — bounce to signup
  useEffect(() => {
    if (!pending?.email) navigate("/signup");
    else inputs.current[0]?.focus();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Resend cooldown countdown
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const c = darkMode
    ? { pageBg: "#0a0a12", heading: "#ffffff", sub: "rgba(255,255,255,0.5)", box: "rgba(255,255,255,0.04)", border: "rgba(255,255,255,0.14)" }
    : { pageBg: "#f5f3ee", heading: "#1a1a2e", sub: "rgba(0,0,0,0.5)", box: "#ffffff", border: "rgba(0,0,0,0.14)" };

  const submit = async (code: string) => {
    if (!pending?.email || submitting || success) return;
    setError(null);
    setSubmitting(true);
    try {
      await verify(pending.email, code);
      try { sessionStorage.removeItem(PENDING_KEY); } catch { /* unavailable */ }
      setSubmitting(false);
      setSuccess(true);
      setTimeout(() => navigate("/"), 1200);
    } catch (err) {
      setSubmitting(false);
      const codeErr = err instanceof AuthError ? err.code : "server_error";
      setError(codeErr === "invalid_code" ? t("authErrCode")
        : codeErr === "code_expired" ? t("authErrExpired")
        : t("authErrServer"));
      setDigits(["", "", "", ""]);
      inputs.current[0]?.focus();
    }
  };

  const setDigit = (i: number, val: string) => {
    const clean = val.replace(/\D/g, "");
    if (!clean) { setDigits(d => { const n = [...d]; n[i] = ""; return n; }); return; }
    // Handle paste of the whole code
    if (clean.length > 1) {
      const arr = clean.slice(0, 4).split("");
      const next = ["", "", "", ""].map((_, idx) => arr[idx] ?? "");
      setDigits(next);
      if (next.every(x => x)) submit(next.join(""));
      else inputs.current[Math.min(arr.length, 3)]?.focus();
      return;
    }
    setDigits(d => {
      const n = [...d]; n[i] = clean;
      if (i < 3) inputs.current[i + 1]?.focus();
      if (n.every(x => x)) submit(n.join(""));
      return n;
    });
  };

  const onKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) inputs.current[i - 1]?.focus();
  };

  const handleResend = async () => {
    if (!pending?.email || cooldown > 0) return;
    setError(null);
    setCooldown(60);
    const res = await resendCode(pending.email);
    if (res.devCode) { setDevCode(res.devCode); setPendingVerify(pending.email, res.devCode); }
    setNotice(t("verifyResent"));
    setTimeout(() => setNotice(null), 4000);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 relative overflow-hidden transition-colors duration-300" style={{ background: c.pageBg }}>
      <div className="absolute pointer-events-none" style={{ width: "620px", height: "620px", borderRadius: "50%", background: "radial-gradient(circle, rgba(213,173,104,0.08), transparent 65%)", top: "50%", left: "50%", transform: "translate(-50%, -55%)" }} />

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="w-full relative text-center" style={{ maxWidth: "400px" }}>

        <Link href="/" className="flex justify-center mb-6 cursor-pointer">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "rgba(213,173,104,0.12)", border: "1px solid rgba(213,173,104,0.3)" }}>
            <MailCheck className="w-6 h-6" style={{ color: "#D5AD68" }} />
          </div>
        </Link>

        <h1 className="text-[24px] font-bold font-heading mb-2" style={{ color: c.heading }}>{t("verifyTitle")}</h1>
        <p className="text-[13px] mb-1" style={{ color: c.sub }}>{t("verifySub")}</p>
        <p className="text-[14px] font-semibold mb-7" style={{ color: "#D5AD68" }}>{pending?.email}</p>

        {devCode && (
          <div className="rounded-xl px-4 py-2.5 mb-5 text-[13px]" style={{ background: "rgba(213,173,104,0.10)", border: "1px solid rgba(213,173,104,0.35)", color: "#D5AD68" }}>
            {t("verifyDevNote")} <span className="font-bold tracking-widest">{devCode}</span>
          </div>
        )}

        {/* 4 code inputs */}
        <div className="flex justify-center gap-3 mb-5">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={el => { inputs.current[i] = el; }}
              value={d}
              onChange={e => setDigit(i, e.target.value)}
              onKeyDown={e => onKeyDown(i, e)}
              inputMode="numeric"
              maxLength={4}
              className="w-14 h-16 text-center text-[26px] font-bold rounded-xl outline-none transition-all"
              style={{ background: c.box, border: `1px solid ${error ? "#ef4444" : c.border}`, color: c.heading }}
              onFocus={e => (e.currentTarget.style.borderColor = "#D5AD68")}
              onBlur={e => (e.currentTarget.style.borderColor = error ? "#ef4444" : c.border)}
            />
          ))}
        </div>

        {error && <p className="text-[13px] font-medium mb-4" style={{ color: "#ef4444" }}>{error}</p>}
        {notice && <p className="text-[13px] font-medium mb-4" style={{ color: "#22c55e" }}>{notice}</p>}

        <button onClick={() => submit(digits.join(""))} disabled={digits.some(d => !d) || submitting || success}
          className="w-full h-12 rounded-full font-bold text-[15px] transition-all flex items-center justify-center gap-2 mb-4"
          style={{
            background: success ? "#22c55e" : "linear-gradient(135deg, #D5AD68 0%, #e8c586 100%)",
            color: success ? "#052e13" : "#1a1100",
            opacity: (digits.some(d => !d) && !submitting && !success) ? 0.55 : 1,
            cursor: (digits.some(d => !d) || submitting || success) ? "default" : "pointer",
          }}>
          {success ? <><Check className="w-4 h-4" strokeWidth={3} /> {t("authSuccess")}</>
            : submitting ? <Loader2 className="w-4 h-4 animate-spin" />
            : t("verifyBtn")}
        </button>

        <button onClick={handleResend} disabled={cooldown > 0}
          className="text-[13px] font-semibold transition-opacity block mx-auto mb-2"
          style={{ color: cooldown > 0 ? c.sub : "#D5AD68", cursor: cooldown > 0 ? "default" : "pointer", opacity: cooldown > 0 ? 0.7 : 1 }}
          onMouseEnter={e => { if (cooldown <= 0) e.currentTarget.style.opacity = "0.8"; }}
          onMouseLeave={e => { if (cooldown <= 0) e.currentTarget.style.opacity = "1"; }}>
          {cooldown > 0 ? `${t("verifyResend")} (${cooldown}s)` : t("verifyResend")}
        </button>
        <button onClick={() => { try { sessionStorage.removeItem(PENDING_KEY); } catch { /* unavailable */ } navigate("/signup"); }}
          className="text-[12px] transition-opacity hover:opacity-80" style={{ color: c.sub }}>
          {t("verifyChangeEmail")}
        </button>
      </motion.div>
    </div>
  );
}
