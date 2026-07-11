import { pgTable, text, timestamp, uuid, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { gamesTable } from "./games";

// The marketplace categories, matching the storefront's category bar
export const categoryEnum = pgEnum("listing_category", [
  "currency",
  "accounts",
  "items",
  "boosting",
  "topup",
  "giftcards",
]);

export const listingStatusEnum = pgEnum("listing_status", [
  "active",
  "paused",
  "sold_out",
  "deleted",
]);

// A single offer a seller lists for sale
export const listingsTable = pgTable("listings", {
  id: uuid("id").primaryKey().defaultRandom(),
  sellerId: uuid("seller_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  gameId: uuid("game_id").notNull().references(() => gamesTable.id, { onDelete: "restrict" }),
  category: categoryEnum("category").notNull(),

  title: text("title").notNull(),
  description: text("description"),

  // Price per unit in cents (USD base); FX conversion happens at display time.
  priceCents: integer("price_cents").notNull(),
  // For divisible goods (e.g. "per 1M gold"); null/1 for whole items/accounts.
  unitLabel: text("unit_label"),
  stock: integer("stock").notNull().default(1),
  minQuantity: integer("min_quantity").notNull().default(1),

  // Estimated delivery time in minutes (0 = instant)
  deliveryMinutes: integer("delivery_minutes").notNull().default(0),

  status: listingStatusEnum("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertListingSchema = createInsertSchema(listingsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertListing = z.infer<typeof insertListingSchema>;
export type Listing = typeof listingsTable.$inferSelect;
