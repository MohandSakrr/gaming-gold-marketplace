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
      password_hash text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `);
}
ensureUsersTable().catch((err) => {
  logger.error({ err }, "Failed to ensure users table exists");
});

const credentialsSchema = z.object({
  email: z.string().email().max(254).transform((v) => v.trim().toLowerCase()),
  password: z.string().min(8).max(128),
});

function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, SECRET, { expiresIn: TOKEN_TTL });
}

function publicUser(user: { id: string; email: string; createdAt: Date }) {
  return { id: user.id, email: user.email, createdAt: user.createdAt };
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
  const [user] = await db.insert(usersTable).values({ email, passwordHash }).returning();
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
    const created = await db.insert(usersTable).values({ email, passwordHash: placeholderHash }).returning();
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
