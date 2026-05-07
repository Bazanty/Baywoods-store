-- Allow restoring inventory at the variant level when payments fail.
-- order_items already exists from earlier schema setup; we just need the
-- column to exist so the orders route can persist it and the failure paths
-- can read it back.

ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_order_items_variant_id ON order_items(variant_id);
