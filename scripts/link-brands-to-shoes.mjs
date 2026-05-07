// Link every brand category (Nike, Vans, etc.) under a parent "shoes" category
// so the /shop/shoes PLP can show all of them.
// Run: node --env-file=.env.local scripts/link-brands-to-shoes.mjs

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

const BRAND_SLUGS = ["nike", "vans", "new-balance", "adidas", "asics", "birkenstock"];

async function main() {
  // 1. Ensure a parent "shoes" category exists
  let { data: shoes } = await supabase
    .from("categories")
    .select("id")
    .eq("slug", "shoes")
    .maybeSingle();

  if (!shoes) {
    const { data, error } = await supabase
      .from("categories")
      .insert({ name: "Shoes", slug: "shoes", is_active: true, sort_order: 0 })
      .select("id")
      .single();
    if (error) throw new Error(`create shoes parent: ${error.message}`);
    shoes = data;
    console.log("✓ created parent category 'shoes'");
  } else {
    console.log("◦ parent 'shoes' already exists");
  }

  // 2. Point every known brand category at the shoes parent
  const { data: brandRows, error: brandErr } = await supabase
    .from("categories")
    .select("id, name, slug, parent_id")
    .in("slug", BRAND_SLUGS);

  if (brandErr) throw new Error(`fetch brands: ${brandErr.message}`);
  if (!brandRows?.length) {
    console.log("! no brand categories found — nothing to link");
    return;
  }

  for (const brand of brandRows) {
    if (brand.parent_id === shoes.id) {
      console.log(`  ↷ ${brand.name} already linked`);
      continue;
    }
    const { error } = await supabase
      .from("categories")
      .update({ parent_id: shoes.id })
      .eq("id", brand.id);
    if (error) {
      console.log(`  ! ${brand.name}: ${error.message}`);
      continue;
    }
    console.log(`  ✓ ${brand.name} → parent = shoes`);
  }

  console.log("\nDone.");
}

main().catch((err) => {
  console.error("\n✗ Fatal:", err);
  process.exit(1);
});
