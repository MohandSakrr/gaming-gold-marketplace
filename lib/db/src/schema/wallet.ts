import { pgTable, text, timestamp, uuid, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { ordersTable } from "./orders";

export const walletTxTypeEnum = pgEnum("wallet_tx_type", [
  "deposit",     // user added funds
  "withdrawal",  // user cashed out
  "purchase",    // buyer paid for an order (funds leave balance into escrow)
  "sale",        // seller received funds from a completed order
  "refund",      // funds returned to buyer
  "fee",         // platform commission
]);

export const walletTxStatusEnum = pgEnum("wallet_tx_status", [
  "pending",
  "completed",
  "failed",
]);

// An immutable ledger entry for every movement of money on a user's balance
export const walletTransactionsTable = pgTable("wallet_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  type: walletTxTypeEnum("type").notNull(),
  // Signed amount in cents: positive = credit, negative = debit
  amountCents: integer("amount_cents").notNull(),
  status: walletTxStatusEnum("status").notNull().default("completed"),
  orderId: uuid("order_id").references(() => ordersTable.id, { onDelete: "set null" }),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertWalletTransactionSchema = createInsertSchema(walletTransactionsTable).omit({ id: true, createdAt: true });
export type InsertWalletTransaction = z.infer<typeof insertWalletTransactionSchema>;
export type WalletTransaction = typeof walletTransactionsTable.$inferSelect;
