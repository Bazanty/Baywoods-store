-- Per-product override for the "Material & Care" accordion on the PDP.
-- NULL = the PDP falls back to the site-wide default copy.

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS material_care TEXT;
