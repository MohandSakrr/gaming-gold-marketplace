import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, pool, usersTable } from "@workspace/db";
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

// Create the users table on boot so a fresh database works without a
// separate migration step (drizzle-kit push remains the source of truth).
async function ensureUsersTable() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      email text NOT NULL UNIQUE,
      username text,
      password_hash text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  // Upgrade path for databases created before usernames existed
  await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS username text`);
  await pool.query(`
    UPDATE users SET username = 'Player' || substr(md5(random()::text), 1, 8)
    WHERE username IS NULL
  `);
  await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS users_username_unique ON users (username)`);
}
ensureUsersTable().catch((err) => {
  logger.error({ err }, "Failed to ensure users table exists");
});

// Random gamer-style username for new accounts, e.g. "ShadowFalcon2841"
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

const credentialsSchema = z.object({
  email: z.string().email().max(254).transform((v) => v.trim().toLowerCase()),
  password: z.string().min(8).max(128),
});

function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, SECRET, { expiresIn: TOKEN_TTL });
}

function publicUser(user: { id: string; email: string; username: string; createdAt: Date }) {
  return { id: user.id, email: user.email, username: user.username, createdAt: user.createdAt };
}

router.post("/auth/register", async (req, res) => {
  const parsed = credentialsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "invalid_input" });
    return;
  }
  const { email, password } = parsed.data;

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (existing.length > 0) {
    res.status(409).json({ error: "email_exists" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const username = await generateUsername();
  const [user] = await db.insert(usersTable).values({ email, username, passwordHash }).returning();
  if (!user) {
    res.status(500).json({ error: "server_error" });
    return;
  }

  res.status(201).json({ token: signToken(user.id), user: publicUser(user) });
});

router.post("/auth/login", async (req, res) => {
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

  res.json({ token: signToken(user.id), user: publicUser(user) });
});

const GOOGLE_CLIENT_ID = process.env["GOOGLE_CLIENT_ID"] ?? "";

router.post("/auth/google", async (req, res) => {
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

  // Verify the token with Google and confirm it was issued for OUR client id
  // (prevents tokens minted for other apps from being replayed here).
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
    // OAuth-only account: store an unguessable random hash so password login
    // stays impossible until the user sets one via a future reset flow.
    const placeholderHash = await bcrypt.hash(crypto.randomUUID(), 10);
    const username = await generateUsername();
    const created = await db.insert(usersTable).values({ email, username, passwordHash: placeholderHash }).returning();
    user = created[0];
  }
  if (!user) {
    res.status(500).json({ error: "server_error" });
    return;
  }

  res.json({ token: signToken(user.id), user: publicUser(user) });
});

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

router.get("/auth/me", requireAuth, async (req, res) => {
  const userId = (req as Request & { userId?: string }).userId!;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  res.json({ user: publicUser(user) });
});

export default router;
