import { pgTable, text, timestamp, uuid, smallint, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { listingsTable } from "./listings";
import { ordersTable } from "./orders";

// A buyer's review of a seller, tied to a completed order (one per order)
export const reviewsTable = pgTable("reviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id").notNull().references(() => ordersTable.id, { onDelete: "cascade" }),
  listingId: uuid("listing_id").notNull().references(() => listingsTable.id, { onDelete: "cascade" }),
  sellerId: uuid("seller_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  buyerId: uuid("buyer_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),

  rating: smallint("rating").notNull(), // 1-5 stars
  comment: text("comment"),

  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  oneReviewPerOrder: unique("reviews_order_unique").on(t.orderId),
}));

export const insertReviewSchema = createInsertSchema(reviewsTable)
  .omit({ id: true, createdAt: true })
  .extend({ rating: z.number().int().min(1).max(5) });
export type InsertReview = z.infer<typeof insertReviewSchema>;
export type Review = typeof reviewsTable.$inferSelect;
