-- Variant-aware stock enforcement + atomic reservation consumption.
-- The original decrement_inventory only matched `variant_id IS NULL`, leaving
-- per-size/color inventory rows unprotected. This migration adds v2 helpers
-- that take an explicit variant_id and a `consume_reservations` RPC that
-- converts a session's reservations into permanent decrements in one shot —
-- avoiding the race where a user's own reservation would block their checkout.

ALTER TABLE cart_reservations
  ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_reservations_session_id ON cart_reservations(session_id);

-- Variant-aware decrement. Treats NULL variant_id as "base product inventory".
CREATE OR REPLACE FUNCTION decrement_inventory_v2(
  p_product_id UUID,
  p_variant_id UUID,
  p_qty        INTEGER
) RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  rows_affected INTEGER;
BEGIN
  IF p_variant_id IS NULL THEN
    UPDATE inventory
       SET quantity   = quantity - p_qty,
           updated_at = now()
     WHERE product_id = p_product_id
       AND variant_id IS NULL
       AND quantity - reserved >= p_qty;
  ELSE
    UPDATE inventory
       SET quantity   = quantity - p_qty,
           updated_at = now()
     WHERE product_id = p_product_id
       AND variant_id = p_variant_id
       AND quantity - reserved >= p_qty;
  END IF;

  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  RETURN rows_affected > 0;
END;
$$;

CREATE OR REPLACE FUNCTION restore_inventory_v2(
  p_product_id UUID,
  p_variant_id UUID,
  p_qty        INTEGER
) RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  IF p_variant_id IS NULL THEN
    UPDATE inventory
       SET quantity   = quantity + p_qty,
           updated_at = now()
     WHERE product_id = p_product_id
       AND variant_id IS NULL;
  ELSE
    UPDATE inventory
       SET quantity   = quantity + p_qty,
           updated_at = now()
     WHERE product_id = p_product_id
       AND variant_id = p_variant_id;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION reserve_stock_v2(
  p_session_id TEXT,
  p_product_id UUID,
  p_variant_id UUID,
  p_qty        INTEGER,
  p_ttl_mins   INTEGER DEFAULT 15
) RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  rows_affected INTEGER;
BEGIN
  IF p_variant_id IS NULL THEN
    UPDATE inventory
       SET reserved   = reserved + p_qty,
           updated_at = now()
     WHERE product_id = p_product_id
       AND variant_id IS NULL
       AND quantity - reserved >= p_qty;
  ELSE
    UPDATE inventory
       SET reserved   = reserved + p_qty,
           updated_at = now()
     WHERE product_id = p_product_id
       AND variant_id = p_variant_id
       AND quantity - reserved >= p_qty;
  END IF;

  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  IF rows_affected = 0 THEN RETURN false; END IF;

  INSERT INTO cart_reservations (session_id, product_id, variant_id, quantity, expires_at)
  VALUES (p_session_id, p_product_id, p_variant_id, p_qty, now() + make_interval(mins => p_ttl_mins));

  RETURN true;
END;
$$;

-- Convert all reservations for a session into permanent decrements atomically.
-- Decrements quantity AND reduces reserved on the same row in one UPDATE so
-- the reservation never blocks its own consumption (avoids the
-- `quantity - reserved >= p_qty` race during checkout).
CREATE OR REPLACE FUNCTION consume_reservations(p_session_id TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  r RECORD;
  consumed INTEGER := 0;
BEGIN
  FOR r IN
    SELECT id, product_id, variant_id, quantity
      FROM cart_reservations
     WHERE session_id = p_session_id
  LOOP
    IF r.variant_id IS NULL THEN
      UPDATE inventory
         SET quantity   = quantity - r.quantity,
             reserved   = GREATEST(0, reserved - r.quantity),
             updated_at = now()
       WHERE product_id = r.product_id
         AND variant_id IS NULL;
    ELSE
      UPDATE inventory
         SET quantity   = quantity - r.quantity,
             reserved   = GREATEST(0, reserved - r.quantity),
             updated_at = now()
       WHERE product_id = r.product_id
         AND variant_id = r.variant_id;
    END IF;
    consumed := consumed + 1;
  END LOOP;

  DELETE FROM cart_reservations WHERE session_id = p_session_id;
  RETURN consumed;
END;
$$;

-- Release every reservation tied to a session (used when the user navigates
-- away from checkout or clears their cart).
CREATE OR REPLACE FUNCTION release_session_reservations(p_session_id TEXT)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT product_id, variant_id, quantity
      FROM cart_reservations
     WHERE session_id = p_session_id
  LOOP
    IF r.variant_id IS NULL THEN
      UPDATE inventory
         SET reserved   = GREATEST(0, reserved - r.quantity),
             updated_at = now()
       WHERE product_id = r.product_id
         AND variant_id IS NULL;
    ELSE
      UPDATE inventory
         SET reserved   = GREATEST(0, reserved - r.quantity),
             updated_at = now()
       WHERE product_id = r.product_id
         AND variant_id = r.variant_id;
    END IF;
  END LOOP;

  DELETE FROM cart_reservations WHERE session_id = p_session_id;
END;
$$;

-- Replace the original expire_reservations to also handle variant rows.
CREATE OR REPLACE FUNCTION expire_reservations()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  expired RECORD;
  count_expired INTEGER := 0;
BEGIN
  FOR expired IN
    SELECT id, product_id, variant_id, quantity
      FROM cart_reservations
     WHERE expires_at < now()
  LOOP
    IF expired.variant_id IS NULL THEN
      UPDATE inventory
         SET reserved   = GREATEST(0, reserved - expired.quantity),
             updated_at = now()
       WHERE product_id = expired.product_id
         AND variant_id IS NULL;
    ELSE
      UPDATE inventory
         SET reserved   = GREATEST(0, reserved - expired.quantity),
             updated_at = now()
       WHERE product_id = expired.product_id
         AND variant_id = expired.variant_id;
    END IF;
    DELETE FROM cart_reservations WHERE id = expired.id;
    count_expired := count_expired + 1;
  END LOOP;
  RETURN count_expired;
END;
$$;
