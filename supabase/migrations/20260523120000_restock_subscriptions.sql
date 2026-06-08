-- =============================================================
-- Restock Notifications — subscribers wait for stock to return
-- =============================================================

CREATE TABLE IF NOT EXISTS restock_subscriptions (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID         NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  variant_id  UUID         REFERENCES product_variants (id) ON DELETE CASCADE,
  user_id     UUID         REFERENCES users (id) ON DELETE SET NULL,
  email       VARCHAR(255) NOT NULL,
  notified_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Unique per product/variant/email — variant_id is nullable, so we use a
-- partial index instead of a UNIQUE constraint to dedupe both shapes.
CREATE UNIQUE INDEX IF NOT EXISTS uq_restock_sub_variant
  ON restock_subscriptions (product_id, variant_id, email)
  WHERE variant_id IS NOT NULL AND notified_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_restock_sub_base
  ON restock_subscriptions (product_id, email)
  WHERE variant_id IS NULL AND notified_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_restock_sub_product
  ON restock_subscriptions (product_id, notified_at);

CREATE INDEX IF NOT EXISTS idx_restock_sub_email
  ON restock_subscriptions (email);
