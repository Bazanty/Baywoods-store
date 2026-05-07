CREATE TABLE IF NOT EXISTS cart_reservations (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id  TEXT NOT NULL,
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity    INTEGER NOT NULL CHECK (quantity > 0),
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reservations_expires ON cart_reservations(expires_at);
CREATE INDEX IF NOT EXISTS idx_reservations_session ON cart_reservations(session_id);

-- Atomically reserve stock: bump inventory.reserved and log the reservation.
-- Returns true when the reservation fits within available stock.
CREATE OR REPLACE FUNCTION reserve_stock(
  p_session_id TEXT,
  p_product_id UUID,
  p_qty        INTEGER,
  p_ttl_mins   INTEGER DEFAULT 15
) RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  rows_affected INTEGER;
BEGIN
  UPDATE inventory
     SET reserved  = reserved + p_qty,
         updated_at = now()
   WHERE product_id = p_product_id
     AND variant_id IS NULL
     AND quantity - reserved >= p_qty;

  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  IF rows_affected = 0 THEN
    RETURN false;
  END IF;

  INSERT INTO cart_reservations (session_id, product_id, quantity, expires_at)
  VALUES (p_session_id, p_product_id, p_qty, now() + make_interval(mins => p_ttl_mins));

  RETURN true;
END;
$$;

-- Release a specific reservation (called on cart item remove / order completion).
CREATE OR REPLACE FUNCTION release_reservation(p_reservation_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  r cart_reservations%ROWTYPE;
BEGIN
  SELECT * INTO r FROM cart_reservations WHERE id = p_reservation_id;
  IF NOT FOUND THEN RETURN; END IF;

  UPDATE inventory
     SET reserved  = GREATEST(0, reserved - r.quantity),
         updated_at = now()
   WHERE product_id = r.product_id
     AND variant_id IS NULL;

  DELETE FROM cart_reservations WHERE id = p_reservation_id;
END;
$$;

-- Sweep expired reservations — called by the /api/cron/expire-reservations endpoint.
CREATE OR REPLACE FUNCTION expire_reservations()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  expired RECORD;
  count_expired INTEGER := 0;
BEGIN
  FOR expired IN
    SELECT id, product_id, quantity FROM cart_reservations WHERE expires_at < now()
  LOOP
    UPDATE inventory
       SET reserved  = GREATEST(0, reserved - expired.quantity),
           updated_at = now()
     WHERE product_id = expired.product_id
       AND variant_id IS NULL;
    DELETE FROM cart_reservations WHERE id = expired.id;
    count_expired := count_expired + 1;
  END LOOP;
  RETURN count_expired;
END;
$$;
