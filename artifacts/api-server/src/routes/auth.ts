import { Router, type IRouter, type Request, type Response, type NextFunction, type RequestHandler } from "express";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const JWT_SECRET = process.env["JWT_SECRET"] ?? "";
if (!JWT_SECRET) {
  logger.warn(
    "JWT_SECRET is not set — using an insecure development fallback. Set JWT_SECRET in production!",
  );
}
const SECRET = JWT_SECRET || "dev-secret-do-not-use-in-production";
const TOKEN_TTL = "30d";
const CODE_TTL_MS = 15 * 60 * 1000; // verification code valid for 15 minutes

// Wrap async handlers so any thrown error is logged and returns a clean JSON
// 500 instead of a generic HTML "Internal Server Error".
const wrap = (fn: (req: Request, res: Response) => Promise<void>): RequestHandler =>
  (req, res) => {
    fn(req, res).catch((err) => {
      logger.error({ err, path: req.path }, "Auth route failed");
      if (!res.headersSent) res.status(500).json({ error: "server_error" });
    });
  };

// The users table (and all other tables) are created on boot by ensureSchema()
// in index.ts, so no per-route bootstrap is needed here.

// ── Email (SMTP / Gmail) ─────────────────────────────────────────────────────
const SMTP_USER = process.env["SMTP_USER"] ?? "";
const SMTP_PASS = process.env["SMTP_PASS"] ?? "";
const SMTP_HOST = process.env["SMTP_HOST"] ?? "smtp.gmail.com";
const SMTP_PORT = Number(process.env["SMTP_PORT"] ?? "465");
const SMTP_FROM = process.env["SMTP_FROM"] ?? SMTP_USER;
const EMAIL_ENABLED = Boolean(SMTP_USER && SMTP_PASS);

const mailer = EMAIL_ENABLED
  ? nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
      // Fail fast instead of hanging the request if Gmail is unreachable
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 10000,
    })
  : null;

if (!EMAIL_ENABLED) {
  logger.warn("SMTP not configured — verification codes will be logged, not emailed. Set SMTP_USER and SMTP_PASS.");
}

async function sendVerificationEmail(email: string, code: string) {
  if (!mailer) {
    logger.info({ email, code }, "DEV verification code (email disabled)");
    return;
  }
  await mailer.sendMail({
    from: `RaRumble <${SMTP_FROM}>`,
    to: email,
    subject: `Your RaRumble verification code: ${code}`,
    text: `Welcome to RaRumble!\n\nYour verification code is: ${code}\n\nIt expires in 15 minutes. If you didn't request this, ignore this email.`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:32px;background:#0e0e1a;border-radius:16px;color:#fff">
        <h1 style="color:#D5AD68;font-size:22px;margin:0 0 8px">RaRumble</h1>
        <p style="color:rgba(255,255,255,0.7);font-size:14px;margin:0 0 24px">Confirm your email to activate your account.</p>
        <div style="background:rgba(213,173,104,0.12);border:1px solid rgba(213,173,104,0.4);border-radius:12px;padding:20px;text-align:center;margin-bottom:24px">
          <div style="font-size:36px;font-weight:800;letter-spacing:10px;color:#D5AD68">${code}</div>
        </div>
        <p style="color:rgba(255,255,255,0.45);font-size:12px;margin:0">This code expires in 15 minutes. If you didn't sign up, you can ignore this email.</p>
      </div>`,
  });
}

// Send the verification email in the background so the HTTP response returns
// immediately even if the SMTP server is slow or unreachable.
function fireVerificationEmail(email: string, code: string) {
  sendVerificationEmail(email, code).catch((err) => {
    logger.error({ err, email }, "Failed to send verification email");
  });
}

// ── Usernames ────────────────────────────────────────────────────────────────
const USERNAME_ADJECTIVES = [
  "Swift", "Shadow", "Golden", "Iron", "Mystic", "Turbo", "Silent", "Crimson",
  "Frost", "Storm", "Neon", "Lucky", "Savage", "Cosmic", "Blazing", "Phantom",
];
const USERNAME_NOUNS = [
  "Dragon", "Wolf", "Falcon", "Knight", "Ninja", "Raider", "Hunter", "Wizard",
  "Titan", "Ghost", "Samurai", "Viper", "Phoenix", "Golem", "Ranger", "Reaper",
];

async function generateUsername(): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt++) {
    const adj = USERNAME_ADJECTIVES[Math.floor(Math.random() * USERNAME_ADJECTIVES.length)];
    const noun = USERNAME_NOUNS[Math.floor(Math.random() * USERNAME_NOUNS.length)];
    const num = Math.floor(1000 + Math.random() * 9000);
    const candidate = `${adj}${noun}${num}`;
    const taken = await db.select().from(usersTable).where(eq(usersTable.username, candidate)).limit(1);
    if (taken.length === 0) return candidate;
  }
  return `Player${crypto.randomUUID().slice(0, 8)}`;
}

function generateCode(): string {
  return String(crypto.randomInt(1000, 10000)); // 4 digits, 1000-9999
}

const credentialsSchema = z.object({
  email: z.string().email().max(254).transform((v) => v.trim().toLowerCase()),
  password: z.string().min(8).max(128),
});

const verifySchema = z.object({
  email: z.string().email().max(254).transform((v) => v.trim().toLowerCase()),
  code: z.string().regex(/^\d{4}$/),
});

const emailSchema = z.object({
  email: z.string().email().max(254).transform((v) => v.trim().toLowerCase()),
});

function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, SECRET, { expiresIn: TOKEN_TTL });
}

function publicUser(user: { id: string; email: string; username: string; role?: string; createdAt: Date }) {
  return { id: user.id, email: user.email, username: user.username, role: user.role ?? "user", createdAt: user.createdAt };
}

// The root super-admin: only the owner of this env var gets full access
// initially, and only they can grant staff roles. Set ADMIN_EMAIL in Railway.
const ADMIN_EMAIL = (process.env["ADMIN_EMAIL"] ?? "").trim().toLowerCase();

// Every staff tier (all can reach the admin panel; each sees a scoped subset).
export const STAFF_ROLES = ["moderator", "support", "finance", "admin", "super_admin"] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

// ── Register: create an unverified account and email a 4-digit code ──────────
router.post("/auth/register", wrap(async (req, res) => {
  const parsed = credentialsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_input" });
    return;
  }
  const { email, password } = parsed.data;

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  const code = generateCode();
  const expires = new Date(Date.now() + CODE_TTL_MS);

  if (existing) {
    if (existing.verified) {
      res.status(409).json({ error: "email_exists" });
      return;
    }
    // Unverified account exists — refresh its password + code and resend
    const passwordHash = await bcrypt.hash(password, 10);
    await db.update(usersTable)
      .set({ passwordHash, verificationCode: code, verificationExpires: expires })
      .where(eq(usersTable.id, existing.id));
    fireVerificationEmail(email, code);
    res.status(200).json({ needsVerification: true, email, devCode: EMAIL_ENABLED ? undefined : code });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const username = await generateUsername();
  await db.insert(usersTable).values({
    email, username, passwordHash, verified: false, verificationCode: code, verificationExpires: expires,
  });
  fireVerificationEmail(email, code);
  res.status(201).json({ needsVerification: true, email, devCode: EMAIL_ENABLED ? undefined : code });
}));

// ── Verify: check the code, activate the account, return a session token ─────
router.post("/auth/verify", wrap(async (req, res) => {
  const parsed = verifySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_input" });
    return;
  }
  const { email, code } = parsed.data;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (!user) {
    res.status(404).json({ error: "not_found" });
    return;
  }
  if (user.verified) {
    res.json({ token: signToken(user.id), user: publicUser(user) });
    return;
  }
  if (!user.verificationCode || user.verificationCode !== code) {
    res.status(400).json({ error: "invalid_code" });
    return;
  }
  if (!user.verificationExpires || user.verificationExpires.getTime() < Date.now()) {
    res.status(400).json({ error: "code_expired" });
    return;
  }

  await db.update(usersTable)
    .set({ verified: true, verificationCode: null, verificationExpires: null })
    .where(eq(usersTable.id, user.id));

  res.json({ token: signToken(user.id), user: publicUser(user) });
}));

// ── Resend: generate a fresh code for an unverified account ──────────────────
router.post("/auth/resend", wrap(async (req, res) => {
  const parsed = emailSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_input" });
    return;
  }
  const { email } = parsed.data;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (!user || user.verified) {
    res.json({ ok: true }); // don't reveal whether the account exists
    return;
  }
  const code = generateCode();
  await db.update(usersTable)
    .set({ verificationCode: code, verificationExpires: new Date(Date.now() + CODE_TTL_MS) })
    .where(eq(usersTable.id, user.id));
  await sendVerificationEmail(email, code);
  res.json({ ok: true, devCode: EMAIL_ENABLED ? undefined : code });
}));

// ── Login: reject unverified accounts ────────────────────────────────────────
router.post("/auth/login", wrap(async (req, res) => {
  const parsed = credentialsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_input" });
    return;
  }
  const { email, password } = parsed.data;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    res.status(401).json({ error: "invalid_credentials" });
    return;
  }
  const isOwner = Boolean(ADMIN_EMAIL && user.email === ADMIN_EMAIL);
  // The owner (ADMIN_EMAIL) is trusted — they skip email verification.
  if (!user.verified && !isOwner) {
    res.status(403).json({ error: "not_verified", email: user.email });
    return;
  }
  if (user.banned) {
    res.status(403).json({ error: "banned" });
    return;
  }

  // Owner is auto-verified + promoted to SUPER ADMIN; everyone records last login.
  const patch: Record<string, unknown> = { lastLoginAt: new Date() };
  if (isOwner && !user.verified) patch.verified = true;
  if (isOwner && user.role !== "super_admin") patch.role = "super_admin";
  await db.update(usersTable).set(patch).where(eq(usersTable.id, user.id));
  const fresh = isOwner ? { ...user, verified: true, role: "super_admin" as const } : user;

  res.json({ token: signToken(fresh.id), user: publicUser(fresh) });
}));

const GOOGLE_CLIENT_ID = process.env["GOOGLE_CLIENT_ID"] ?? "";

router.post("/auth/google", wrap(async (req, res) => {
  if (!GOOGLE_CLIENT_ID) {
    res.status(501).json({ error: "google_not_configured" });
    return;
  }
  const accessToken =
    typeof (req.body as { accessToken?: unknown })?.accessToken === "string"
      ? (req.body as { accessToken: string }).accessToken
      : "";
  if (!accessToken) {
    res.status(400).json({ error: "invalid_input" });
    return;
  }

  const infoRes = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(accessToken)}`,
  );
  if (!infoRes.ok) {
    res.status(401).json({ error: "invalid_google_token" });
    return;
  }
  const info = (await infoRes.json()) as { aud?: string; azp?: string };
  if (info.aud !== GOOGLE_CLIENT_ID && info.azp !== GOOGLE_CLIENT_ID) {
    res.status(401).json({ error: "invalid_google_token" });
    return;
  }

  const profileRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!profileRes.ok) {
    res.status(401).json({ error: "invalid_google_token" });
    return;
  }
  const profile = (await profileRes.json()) as { email?: string; email_verified?: boolean };
  if (!profile.email || profile.email_verified === false) {
    res.status(401).json({ error: "invalid_google_token" });
    return;
  }
  const email = profile.email.trim().toLowerCase();

  let [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (!user) {
    // Google already verified the email — mark the account verified immediately.
    const placeholderHash = await bcrypt.hash(crypto.randomUUID(), 10);
    const username = await generateUsername();
    const created = await db.insert(usersTable)
      .values({ email, username, passwordHash: placeholderHash, verified: true })
      .returning();
    user = created[0];
  } else if (!user.verified) {
    await db.update(usersTable).set({ verified: true }).where(eq(usersTable.id, user.id));
    user = { ...user, verified: true };
  }
  if (!user) {
    res.status(500).json({ error: "server_error" });
    return;
  }

  res.json({ token: signToken(user.id), user: publicUser(user) });
}));

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
  if (!token) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  try {
    const payload = jwt.verify(token, SECRET);
    if (typeof payload === "object" && typeof payload.sub === "string") {
      (req as Request & { userId?: string }).userId = payload.sub;
      next();
      return;
    }
  } catch {
    // fall through to 401
  }
  res.status(401).json({ error: "unauthorized" });
}

// Gate for any staff member (any admin tier). Runs after requireAuth.
export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const userId = (req as Request & { userId?: string }).userId;
  if (!userId) { res.status(401).json({ error: "unauthorized" }); return; }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user || user.banned) { res.status(403).json({ error: "forbidden" }); return; }
  const isOwner = Boolean(ADMIN_EMAIL && user.email === ADMIN_EMAIL);
  if (!isOwner && !STAFF_ROLES.includes(user.role as StaffRole)) {
    res.status(403).json({ error: "forbidden" });
    return;
  }
  // Expose the caller's role to downstream handlers
  (req as Request & { staffRole?: string }).staffRole = isOwner ? "super_admin" : user.role;
  next();
}

// Stricter gate — only super_admin (or the owner) may pass.
export async function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  const userId = (req as Request & { userId?: string }).userId;
  if (!userId) { res.status(401).json({ error: "unauthorized" }); return; }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user || user.banned) { res.status(403).json({ error: "forbidden" }); return; }
  const isOwner = Boolean(ADMIN_EMAIL && user.email === ADMIN_EMAIL);
  if (!isOwner && user.role !== "super_admin") {
    res.status(403).json({ error: "forbidden" });
    return;
  }
  next();
}

router.get("/auth/me", requireAuth, wrap(async (req, res) => {
  const userId = (req as Request & { userId?: string }).userId!;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  if (user.banned) { res.status(403).json({ error: "banned" }); return; }
  // Promote the owner if not already done (e.g. session predates ADMIN_EMAIL).
  if (ADMIN_EMAIL && user.email === ADMIN_EMAIL && user.role !== "super_admin") {
    await db.update(usersTable).set({ role: "super_admin" }).where(eq(usersTable.id, user.id));
    res.json({ user: publicUser({ ...user, role: "super_admin" }) });
    return;
  }
  res.json({ user: publicUser(user) });
}));

export default router;
