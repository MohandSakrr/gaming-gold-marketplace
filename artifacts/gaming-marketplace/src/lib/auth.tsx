import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type AuthUser = { id: string; email: string; username?: string; createdAt?: string };

// Railway API base. Set VITE_API_URL in Vercel to the deployed API origin;
// falls back to localhost for local development.
const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? "http://localhost:3000";

const STORAGE_KEY = "rarumble-auth";

export class AuthError extends Error {
  code: string;
  constructor(code: string) {
    super(code);
    this.code = code;
  }
}

export type RegisterResult = { needsVerification: true; email: string; devCode?: string };

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<RegisterResult>;
  verify: (email: string, code: string) => Promise<void>;
  resendCode: (email: string) => Promise<{ devCode?: string }>;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
};

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

// Lazy-load the Google Identity Services script once, on first use
let gisPromise: Promise<void> | null = null;
function loadGis(): Promise<void> {
  const w = window as unknown as { google?: { accounts?: { oauth2?: unknown } } };
  if (w.google?.accounts?.oauth2) return Promise.resolve();
  if (!gisPromise) {
    gisPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => { gisPromise = null; reject(new AuthError("network_error")); };
      document.head.appendChild(script);
    });
  }
  return gisPromise;
}

function requestGoogleAccessToken(): Promise<string> {
  return new Promise((resolve, reject) => {
    type TokenClient = { requestAccessToken: () => void };
    const google = (window as unknown as {
      google: { accounts: { oauth2: { initTokenClient: (cfg: object) => TokenClient } } };
    }).google;
    const client = google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: "openid email profile",
      callback: (resp: { access_token?: string }) => {
        if (resp.access_token) resolve(resp.access_token);
        else reject(new AuthError("google_cancelled"));
      },
      error_callback: () => reject(new AuthError("google_cancelled")),
    });
    client.requestAccessToken();
  });
}

const AuthContext = createContext<AuthContextValue | null>(null);

function loadStored(): { user: AuthUser; token: string } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.token && parsed?.user?.id) return parsed;
  } catch { /* corrupted storage */ }
  return null;
}

// ── Demo fallback ────────────────────────────────────────────────────────────
// When the API is unreachable (not deployed / not configured yet), accounts
// live in this browser's localStorage so the full sign-up → log-in → homepage
// flow still works. Real API is always tried first.
const DEMO_USERS_KEY = "rarumble-demo-users";
const DEMO_ADJ = ["Swift", "Shadow", "Golden", "Iron", "Mystic", "Turbo", "Silent", "Crimson", "Frost", "Storm", "Neon", "Lucky", "Savage", "Cosmic", "Blazing", "Phantom"];
const DEMO_NOUN = ["Dragon", "Wolf", "Falcon", "Knight", "Ninja", "Raider", "Hunter", "Wizard", "Titan", "Ghost", "Samurai", "Viper", "Phoenix", "Golem", "Ranger", "Reaper"];

function demoRandomUsername(): string {
  const adj = DEMO_ADJ[Math.floor(Math.random() * DEMO_ADJ.length)];
  const noun = DEMO_NOUN[Math.floor(Math.random() * DEMO_NOUN.length)];
  return `${adj}${noun}${Math.floor(1000 + Math.random() * 9000)}`;
}

type DemoRecord = { password: string; user: AuthUser; verified: boolean; code?: string };

function loadDemoUsers(): Record<string, DemoRecord> {
  try {
    const raw = localStorage.getItem(DEMO_USERS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* corrupted storage */ }
  return {};
}

function saveDemoUsers(users: Record<string, DemoRecord>) {
  try { localStorage.setItem(DEMO_USERS_KEY, JSON.stringify(users)); } catch { /* storage unavailable */ }
}

function demoCode(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

// Demo register: creates an unverified account and returns the code to show
// on screen (no email service available in the browser).
function demoRegister(email: string, password: string): RegisterResult {
  const users = loadDemoUsers();
  const key = email.trim().toLowerCase();
  if (users[key]?.verified) throw new AuthError("email_exists");
  const code = demoCode();
  const user: AuthUser = { id: crypto.randomUUID(), email: key, username: demoRandomUsername(), createdAt: new Date().toISOString() };
  users[key] = { password, user, verified: false, code };
  saveDemoUsers(users);
  return { needsVerification: true, email: key, devCode: code };
}

function demoVerify(email: string, code: string): { token: string; user: AuthUser } {
  const users = loadDemoUsers();
  const key = email.trim().toLowerCase();
  const record = users[key];
  if (!record) throw new AuthError("not_found");
  if (!record.verified && record.code !== code) throw new AuthError("invalid_code");
  record.verified = true;
  record.code = undefined;
  users[key] = record;
  saveDemoUsers(users);
  return { token: `demo-${crypto.randomUUID()}`, user: record.user };
}

function demoResend(email: string): { devCode?: string } {
  const users = loadDemoUsers();
  const key = email.trim().toLowerCase();
  const record = users[key];
  if (!record || record.verified) return {};
  record.code = demoCode();
  users[key] = record;
  saveDemoUsers(users);
  return { devCode: record.code };
}

function demoLogin(email: string, password: string): { token: string; user: AuthUser } {
  const users = loadDemoUsers();
  const record = users[email.trim().toLowerCase()];
  if (!record || record.password !== password) throw new AuthError("invalid_credentials");
  if (!record.verified) throw new AuthError("not_verified");
  return { token: `demo-${crypto.randomUUID()}`, user: record.user };
}

async function authRequest(path: string, email: string, password: string) {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/api${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
  } catch {
    throw new AuthError("network_error");
  }
  let body: { error?: string; token?: string; user?: AuthUser } = {};
  try { body = await res.json(); } catch { /* non-JSON error body */ }
  if (!res.ok || !body.token || !body.user) {
    throw new AuthError(body.error ?? "server_error");
  }
  return { token: body.token, user: body.user };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState(loadStored);

  // Re-validate the stored session against the API on boot; drop it if stale.
  // Demo sessions are browser-local — nothing to validate server-side.
  useEffect(() => {
    const stored = loadStored();
    if (!stored || stored.token.startsWith("demo-")) return;
    fetch(`${API_URL}/api/auth/me`, { headers: { Authorization: `Bearer ${stored.token}` } })
      .then(async res => {
        if (res.status === 401) {
          localStorage.removeItem(STORAGE_KEY);
          setAuth(null);
          return;
        }
        if (res.ok) {
          // Refresh the cached profile (e.g. picks up server-assigned username)
          const body = (await res.json()) as { user?: AuthUser };
          if (body.user) {
            const next = { token: stored.token, user: body.user };
            setAuth(next);
            try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* storage unavailable */ }
          }
        }
      })
      .catch(() => { /* offline / API down — keep local session */ });
  }, []);

  const persist = (next: { user: AuthUser; token: string } | null) => {
    setAuth(next);
    try {
      if (next) localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      else localStorage.removeItem(STORAGE_KEY);
    } catch { /* storage unavailable */ }
  };

  const apiUnreachable = (err: unknown) =>
    err instanceof AuthError && (err.code === "network_error" || err.code === "server_error");

  const login = async (email: string, password: string) => {
    try {
      persist(await authRequest("/auth/login", email, password));
    } catch (err) {
      if (apiUnreachable(err)) { persist(demoLogin(email, password)); return; }
      throw err;
    }
  };

  // Register creates an unverified account and triggers a verification code.
  // Does NOT log the user in — they must verify first.
  const register = async (email: string, password: string): Promise<RegisterResult> => {
    let res: Response;
    try {
      res = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
    } catch {
      return demoRegister(email, password); // API unreachable
    }
    let body: { error?: string; needsVerification?: boolean; devCode?: string } = {};
    try { body = await res.json(); } catch { /* non-JSON */ }
    if (res.status >= 500) return demoRegister(email, password);
    if (!res.ok || !body.needsVerification) throw new AuthError(body.error ?? "server_error");
    return { needsVerification: true, email: email.trim().toLowerCase(), devCode: body.devCode };
  };

  const verify = async (email: string, code: string) => {
    let res: Response;
    try {
      res = await fetch(`${API_URL}/api/auth/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
    } catch {
      persist(demoVerify(email, code)); return;
    }
    let body: { error?: string; token?: string; user?: AuthUser } = {};
    try { body = await res.json(); } catch { /* non-JSON */ }
    if (res.status >= 500) { persist(demoVerify(email, code)); return; }
    if (!res.ok || !body.token || !body.user) throw new AuthError(body.error ?? "server_error");
    persist({ token: body.token, user: body.user });
  };

  const resendCode = async (email: string): Promise<{ devCode?: string }> => {
    let res: Response;
    try {
      res = await fetch(`${API_URL}/api/auth/resend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } catch {
      return demoResend(email);
    }
    if (res.status >= 500) return demoResend(email);
    let body: { devCode?: string } = {};
    try { body = await res.json(); } catch { /* non-JSON */ }
    return { devCode: body.devCode };
  };

  const loginWithGoogle = async () => {
    if (!GOOGLE_CLIENT_ID) throw new AuthError("google_not_configured");
    await loadGis();
    const accessToken = await requestGoogleAccessToken();
    let res: Response;
    try {
      res = await fetch(`${API_URL}/api/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken }),
      });
    } catch {
      throw new AuthError("network_error");
    }
    let body: { error?: string; token?: string; user?: AuthUser } = {};
    try { body = await res.json(); } catch { /* non-JSON error body */ }
    if (!res.ok || !body.token || !body.user) {
      throw new AuthError(body.error ?? "server_error");
    }
    persist({ token: body.token, user: body.user });
  };

  const logout = () => persist(null);

  return (
    <AuthContext.Provider value={{ user: auth?.user ?? null, token: auth?.token ?? null, login, register, verify, resendCode, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
