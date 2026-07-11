import { pgTable, text, timestamp, uuid, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { listingsTable } from "./listings";

// Escrow-style order lifecycle (like Eldorado's TradeShield): the buyer's
// funds are held until they confirm delivery, then released to the seller.
export const orderStatusEnum = pgEnum("order_status", [
  "pending",    // created, awaiting payment
  "paid",       // funds held in escrow
  "delivered",  // seller marked as delivered
  "completed",  // buyer confirmed, funds released
  "disputed",   // buyer or seller opened a dispute
  "refunded",   // funds returned to buyer
  "cancelled",
]);

export const ordersTable = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  listingId: uuid("listing_id").notNull().references(() => listingsTable.id, { onDelete: "restrict" }),
  buyerId: uuid("buyer_id").notNull().references(() => usersTable.id, { onDelete: "restrict" }),
  sellerId: uuid("seller_id").notNull().references(() => usersTable.id, { onDelete: "restrict" }),

  quantity: integer("quantity").notNull().default(1),
  // Snapshot of unit price at purchase time (cents), so later edits don't change history
  unitPriceCents: integer("unit_price_cents").notNull(),
  totalCents: integer("total_cents").notNull(),

  status: orderStatusEnum("status").notNull().default("pending"),
  deliveryNote: text("delivery_note"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  deliveredAt: timestamp("delivered_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const insertOrderSchema = createInsertSchema(ordersTable).omit({ id: true, createdAt: true });
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof ordersTable.$inferSelect;
