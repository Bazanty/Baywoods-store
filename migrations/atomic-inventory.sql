-- Atomic inventory decrement: checks and decrements in one statement.
-- Returns true if stock was sufficient and decremented, false otherwise.
CREATE OR REPLACE FUNCTION decrement_inventory(
  p_product_id UUID,
  p_qty        INTEGER
) RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  rows_affected INTEGER;
BEGIN
  UPDATE inventory
     SET quantity   = quantity - p_qty,
         updated_at = now()
   WHERE product_id = p_product_id
     AND variant_id IS NULL
     AND quantity - reserved >= p_qty;

  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  RETURN rows_affected > 0;
END;
$$;

-- Restore inventory (used on rollback when order insert fails)
CREATE OR REPLACE FUNCTION restore_inventory(
  p_product_id UUID,
  p_qty        INTEGER
) RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE inventory
     SET quantity   = quantity + p_qty,
         updated_at = now()
   WHERE product_id = p_product_id
     AND variant_id IS NULL;
END;
$$;
