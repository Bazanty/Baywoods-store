-- Purge round-robin image pollution + link orphan shoe brands.
--
-- Root cause: scripts/attach-lookbook-to-products.mjs and
-- scripts/attach-remaining-to-products.mjs distributed unmatched Cloudinary
-- images round-robin (products[i % n]) into product_images, stamping
-- alt_text = product.slug and is_primary = false. This scattered cap/clothing/
-- lookbook photos — and other shoes' photos — across unrelated product
-- galleries, so shoe cards showed caps and mixed/wrong images.
--
-- Signature of a polluted row: alt_text = the owning product's slug AND it is
-- not the primary image. Legit images use alt_text "<name> — N" or NULL and
-- never equal the slug. Verified before running: 0 products are left without an
-- image after the purge (every product keeps its primary plus any legit
-- secondary shots).
--
-- Both attach scripts have been permanently disabled so this cannot recur, and
-- lib/supabase/queries.ts (mapProduct) filters the same signature defensively.

-- 1. Reversible snapshot of every row we are about to delete.
create table if not exists product_images_pollution_backup_20260624 as
select pi.*
from product_images pi
join products p on p.id = pi.product_id
where pi.alt_text = p.slug
  and pi.is_primary = false;

-- 2. Delete the round-robin pollution.
delete from product_images pi
using products p
where pi.product_id = p.id
  and pi.alt_text = p.slug
  and pi.is_primary = false;

-- 3. Parent the orphan shoe brands under "shoes" so they appear at /shop/shoes
--    and resolve to category "shoes" in the app mapper.
update categories
set parent_id = (
  select id from categories where slug = 'shoes' and parent_id is null limit 1
)
where slug in ('puma', 'timberland')
  and parent_id is null;
