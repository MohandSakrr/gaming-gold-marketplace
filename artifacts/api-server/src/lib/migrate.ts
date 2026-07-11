import { pool } from "@workspace/db";
import { logger } from "./logger";

// Creates every marketplace table + enum on boot so a fresh Railway Postgres
// is fully set up with no manual `drizzle-kit push`. All statements are
// idempotent (IF NOT EXISTS / guarded enum creation), so this is safe to run
// on every deploy.
export async function ensureSchema() {
  // ── Enums ──────────────────────────────────────────────────────────────────
  const enums: Array<[string, string[]]> = [
    ["user_role", ["user", "seller", "admin"]],
    ["listing_category", ["currency", "accounts", "items", "boosting", "topup", "giftcards"]],
    ["listing_status", ["active", "paused", "sold_out", "deleted"]],
    ["order_status", ["pending", "paid", "delivered", "completed", "disputed", "refunded", "cancelled"]],
    ["wallet_tx_type", ["deposit", "withdrawal", "purchase", "sale", "refund", "fee"]],
    ["wallet_tx_status", ["pending", "completed", "failed"]],
  ];
  for (const [name, values] of enums) {
    const labels = values.map((v) => `'${v}'`).join(", ");
    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE ${name} AS ENUM (${labels});
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);
  }

  // ── Users (base + verification + marketplace columns) ───────────────────────
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      email text NOT NULL UNIQUE,
      username text,
      password_hash text NOT NULL,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `);
  const userColumns = [
    `username text`,
    `verified boolean NOT NULL DEFAULT false`,
    `verification_code text`,
    `verification_expires timestamptz`,
    `role user_role NOT NULL DEFAULT 'user'`,
    `display_name text`,
    `avatar_url text`,
    `bio text`,
    `country text`,
    `balance_cents integer NOT NULL DEFAULT 0`,
    `rating_sum integer NOT NULL DEFAULT 0`,
    `rating_count integer NOT NULL DEFAULT 0`,
    `sales_count integer NOT NULL DEFAULT 0`,
    `banned boolean NOT NULL DEFAULT false`,
    `suspended_until timestamptz`,
    `admin_note text`,
    `last_login_at timestamptz`,
    `signup_ip text`,
  ];
  for (const col of userColumns) {
    const colName = col.split(" ")[0];
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS ${col}`);
    void colName;
  }
  await pool.query(`UPDATE users SET username = 'Player' || substr(md5(random()::text), 1, 8) WHERE username IS NULL`);
  await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS users_username_unique ON users (username)`);

  // ── Games ───────────────────────────────────────────────────────────────────
  await pool.query(`
    CREATE TABLE IF NOT EXISTS games (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      slug text NOT NULL UNIQUE,
      name text NOT NULL,
      image_url text,
      active boolean NOT NULL DEFAULT true,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  // ── Listings ─────────────────────────────────────────────────────────────────
  await pool.query(`
    CREATE TABLE IF NOT EXISTS listings (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      seller_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      game_id uuid NOT NULL REFERENCES games(id) ON DELETE RESTRICT,
      category listing_category NOT NULL,
      title text NOT NULL,
      description text,
      price_cents integer NOT NULL,
      unit_label text,
      stock integer NOT NULL DEFAULT 1,
      min_quantity integer NOT NULL DEFAULT 1,
      delivery_minutes integer NOT NULL DEFAULT 0,
      status listing_status NOT NULL DEFAULT 'active',
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  // ── Orders ───────────────────────────────────────────────────────────────────
  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE RESTRICT,
      buyer_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      seller_id uuid NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
      quantity integer NOT NULL DEFAULT 1,
      unit_price_cents integer NOT NULL,
      total_cents integer NOT NULL,
      status order_status NOT NULL DEFAULT 'pending',
      delivery_note text,
      created_at timestamptz NOT NULL DEFAULT now(),
      paid_at timestamptz,
      delivered_at timestamptz,
      completed_at timestamptz
    )
  `);

  // ── Reviews ──────────────────────────────────────────────────────────────────
  await pool.query(`
    CREATE TABLE IF NOT EXISTS reviews (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
      seller_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      buyer_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      rating smallint NOT NULL,
      comment text,
      created_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT reviews_order_unique UNIQUE (order_id)
    )
  `);

  // ── Conversations + Messages ─────────────────────────────────────────────────
  await pool.query(`
    CREATE TABLE IF NOT EXISTS conversations (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      buyer_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      seller_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      listing_id uuid REFERENCES listings(id) ON DELETE SET NULL,
      created_at timestamptz NOT NULL DEFAULT now(),
      last_message_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT conversations_unique_thread UNIQUE (buyer_id, seller_id, listing_id)
    )
  `);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS messages (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      sender_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      body text NOT NULL,
      read_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  // ── Wallet ledger ────────────────────────────────────────────────────────────
  await pool.query(`
    CREATE TABLE IF NOT EXISTS wallet_transactions (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type wallet_tx_type NOT NULL,
      amount_cents integer NOT NULL,
      status wallet_tx_status NOT NULL DEFAULT 'completed',
      order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
      note text,
      created_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  // ── Favorites ────────────────────────────────────────────────────────────────
  await pool.query(`
    CREATE TABLE IF NOT EXISTS favorites (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      listing_id uuid NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
      created_at timestamptz NOT NULL DEFAULT now(),
      CONSTRAINT favorites_user_listing_unique UNIQUE (user_id, listing_id)
    )
  `);

  logger.info("Database schema ready (all marketplace tables)");
}
