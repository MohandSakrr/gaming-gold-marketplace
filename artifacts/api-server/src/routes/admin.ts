import { Router, type IRouter, type Request, type Response } from "express";
import { z } from "zod";
import { desc, eq, ilike, or, sql } from "drizzle-orm";
import { db, usersTable, listingsTable, ordersTable } from "@workspace/db";
import { requireAuth, requireAdmin } from "./auth";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const wrap = (fn: (req: Request, res: Response) => Promise<void>) =>
  (req: Request, res: Response) => {
    fn(req, res).catch((err) => {
      logger.error({ err, path: req.path }, "Admin route failed");
      if (!res.headersSent) res.status(500).json({ error: "server_error" });
    });
  };

// Every admin route requires a valid session AND admin role.
router.use("/admin", requireAuth, requireAdmin);

// ── Dashboard stats ──────────────────────────────────────────────────────────
router.get("/admin/stats", wrap(async (_req, res) => {
  const [userCount] = await db.select({ n: sql<number>`count(*)::int` }).from(usersTable);
  const [sellerCount] = await db.select({ n: sql<number>`count(*)::int` }).from(usersTable).where(eq(usersTable.role, "seller"));
  const [bannedCount] = await db.select({ n: sql<number>`count(*)::int` }).from(usersTable).where(eq(usersTable.banned, true));
  const [listingCount] = await db.select({ n: sql<number>`count(*)::int` }).from(listingsTable);
  const [activeListings] = await db.select({ n: sql<number>`count(*)::int` }).from(listingsTable).where(eq(listingsTable.status, "active"));
  const [orderCount] = await db.select({ n: sql<number>`count(*)::int` }).from(ordersTable);
  const [openOrders] = await db.select({ n: sql<number>`count(*)::int` }).from(ordersTable).where(or(eq(ordersTable.status, "paid"), eq(ordersTable.status, "delivered")));
  const [disputes] = await db.select({ n: sql<number>`count(*)::int` }).from(ordersTable).where(eq(ordersTable.status, "disputed"));
  const [revenue] = await db.select({ cents: sql<number>`coalesce(sum(total_cents),0)::int` }).from(ordersTable).where(eq(ordersTable.status, "completed"));

  res.json({
    users: userCount?.n ?? 0,
    sellers: sellerCount?.n ?? 0,
    banned: bannedCount?.n ?? 0,
    listings: listingCount?.n ?? 0,
    activeListings: activeListings?.n ?? 0,
    orders: orderCount?.n ?? 0,
    openOrders: openOrders?.n ?? 0,
    disputes: disputes?.n ?? 0,
    revenueCents: revenue?.cents ?? 0,
  });
}));

// ── Users list ───────────────────────────────────────────────────────────────
router.get("/admin/users", wrap(async (req, res) => {
  const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
  const rows = await db.select({
    id: usersTable.id,
    email: usersTable.email,
    username: usersTable.username,
    role: usersTable.role,
    verified: usersTable.verified,
    banned: usersTable.banned,
    balanceCents: usersTable.balanceCents,
    salesCount: usersTable.salesCount,
    createdAt: usersTable.createdAt,
    lastLoginAt: usersTable.lastLoginAt,
  })
    .from(usersTable)
    .where(q ? or(ilike(usersTable.email, `%${q}%`), ilike(usersTable.username, `%${q}%`)) : undefined)
    .orderBy(desc(usersTable.createdAt))
    .limit(100);
  res.json({ users: rows });
}));

// ── User actions ─────────────────────────────────────────────────────────────
const actionSchema = z.object({
  action: z.enum([
    "ban", "unban", "verify", "unverify",
    "make_user", "make_seller", "make_moderator", "make_support",
    "make_finance", "make_admin", "make_super_admin",
  ]),
});

const ROLE_ACTIONS = new Set(["make_user", "make_seller", "make_moderator", "make_support", "make_finance", "make_admin", "make_super_admin"]);

router.post("/admin/users/:id", wrap(async (req, res) => {
  const parsed = actionSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "invalid_input" }); return; }
  const id = String(req.params.id);
  const action = parsed.data.action;
  const selfId = (req as Request & { userId?: string }).userId;
  const callerRole = (req as Request & { staffRole?: string }).staffRole;

  // Only super_admin may change roles; other staff can moderate but not grant power.
  if (ROLE_ACTIONS.has(action) && callerRole !== "super_admin") {
    res.status(403).json({ error: "only_super_admin" });
    return;
  }

  const [target] = await db.select().from(usersTable).where(eq(usersTable.id, id)).limit(1);
  if (!target) { res.status(404).json({ error: "not_found" }); return; }
  // Guardrail: you cannot ban or demote yourself.
  if (id === selfId && (action === "ban" || (ROLE_ACTIONS.has(action) && action !== "make_super_admin"))) {
    res.status(400).json({ error: "cannot_modify_self" });
    return;
  }

  const patch = {
    ban: { banned: true },
    unban: { banned: false },
    verify: { verified: true },
    unverify: { verified: false },
    make_user: { role: "user" as const },
    make_seller: { role: "seller" as const },
    make_moderator: { role: "moderator" as const },
    make_support: { role: "support" as const },
    make_finance: { role: "finance" as const },
    make_admin: { role: "admin" as const },
    make_super_admin: { role: "super_admin" as const },
  }[action];

  await db.update(usersTable).set(patch).where(eq(usersTable.id, id));
  logger.info({ adminId: selfId, targetId: id, action }, "admin action");
  res.json({ ok: true });
}));

// ── Listings list (moderation) ───────────────────────────────────────────────
router.get("/admin/listings", wrap(async (req, res) => {
  const status = typeof req.query.status === "string" ? req.query.status : "";
  const rows = await db.select()
    .from(listingsTable)
    .where(status ? eq(listingsTable.status, status as "active" | "paused" | "sold_out" | "deleted") : undefined)
    .orderBy(desc(listingsTable.createdAt))
    .limit(100);
  res.json({ listings: rows });
}));

// ── Orders list ──────────────────────────────────────────────────────────────
router.get("/admin/orders", wrap(async (req, res) => {
  const status = typeof req.query.status === "string" ? req.query.status : "";
  const rows = await db.select()
    .from(ordersTable)
    .where(status ? eq(ordersTable.status, status as "pending" | "paid" | "delivered" | "completed" | "disputed" | "refunded" | "cancelled") : undefined)
    .orderBy(desc(ordersTable.createdAt))
    .limit(100);
  res.json({ orders: rows });
}));

export default router;
