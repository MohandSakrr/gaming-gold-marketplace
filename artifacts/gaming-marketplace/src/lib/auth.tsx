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

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
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
  useEffect(() => {
    const stored = loadStored();
    if (!stored) return;
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

  const login = async (email: string, password: string) => {
    persist(await authRequest("/auth/login", email, password));
  };

  const register = async (email: string, password: string) => {
    persist(await authRequest("/auth/register", email, password));
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
    <AuthContext.Provider value={{ user: auth?.user ?? null, token: auth?.token ?? null, login, register, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
