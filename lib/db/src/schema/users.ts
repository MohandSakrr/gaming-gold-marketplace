import { pgTable, text, timestamp, uuid, boolean, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const userRoleEnum = pgEnum("user_role", ["user", "seller", "admin"]);

export const usersTable = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  verified: boolean("verified").notNull().default(false),
  verificationCode: text("verification_code"),
  verificationExpires: timestamp("verification_expires", { withTimezone: true }),

  // Marketplace profile
  role: userRoleEnum("role").notNull().default("user"),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  country: text("country"),

  // Wallet balance held on the platform, stored in cents (USD base)
  balanceCents: integer("balance_cents").notNull().default(0),

  // Aggregated seller rating: avg = ratingSum / ratingCount, on a 0-500 scale
  // (i.e. 1-5 stars ×100) so we can display an Eldorado-style percentage.
  ratingSum: integer("rating_sum").notNull().default(0),
  ratingCount: integer("rating_count").notNull().default(0),
  salesCount: integer("sales_count").notNull().default(0),

  // Moderation
  banned: boolean("banned").notNull().default(false),
  suspendedUntil: timestamp("suspended_until", { withTimezone: true }),
  adminNote: text("admin_note"),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  signupIp: text("signup_ip"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
