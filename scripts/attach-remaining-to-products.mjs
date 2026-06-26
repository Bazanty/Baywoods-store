// DISABLED — root cause of the "wrong/cap images in shoe cards" bug.
//
// It took every Cloudinary image not yet referenced and distributed it
// ROUND-ROBIN by array index (products[i % n]) into product_images. Images ended
// up on products they have nothing to do with — caps and clothing inside shoe
// cards — because the mapping was positional, not content-aware.
//
// Images must be connected to products by product.id with a real mapping, never
// by index. The misattached rows are removed by the migration
// supabase/migrations/20260624120000_purge_round_robin_image_pollution.sql and
// filtered defensively in lib/supabase/queries.ts (mapProduct).

console.error(
  "\n✗ attach-remaining-to-products.mjs is permanently disabled.\n" +
    "  It attached images to products by array index, mixing unrelated photos\n" +
    "  into the wrong product galleries. Attach images per-product with an\n" +
    "  explicit productId → url mapping instead.\n"
);
process.exit(1);
