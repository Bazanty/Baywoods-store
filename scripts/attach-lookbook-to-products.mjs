// DISABLED — this script is the root cause of the "wrong/cap images in shoe
// cards" bug and must not be run again.
//
// It pulled a generic "Baywoods images" lookbook from Cloudinary and attached
// those shots to products ROUND-ROBIN by array index (products[i % n]), with no
// relationship between image content and product. That scattered caps, clothing
// and other shoes' photos across unrelated product galleries (stamped with
// alt_text = product.slug, is_primary = false).
//
// Images must be connected to products by a real, content-aware mapping keyed on
// product.id — never by index. The misattached rows are removed by the migration
// supabase/migrations/20260624120000_purge_round_robin_image_pollution.sql and
// filtered defensively in lib/supabase/queries.ts (mapProduct).
//
// If you genuinely need to add gallery images, do it per-product with an explicit
// { productId, url } mapping (see scripts/seed-products.mjs for the correct
// per-product upload pattern).

console.error(
  "\n✗ attach-lookbook-to-products.mjs is permanently disabled.\n" +
    "  It attached images to products by array index, which mixes unrelated\n" +
    "  photos (caps/clothing) into shoe galleries. Attach images per-product\n" +
    "  with an explicit productId → url mapping instead.\n"
);
process.exit(1);
