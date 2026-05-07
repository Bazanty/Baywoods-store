// Reports which products are missing price / description / sizes / colors
// so we know where to backfill.

import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const envRaw = await readFile(resolve(process.cwd(), ".env.local"), "utf8");
for (const line of envRaw.split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const { data: products } = await sb
  .from("products")
  .select(`
    id, slug, name, base_price, description, short_description,
    categories(slug),
    product_variants(
      id, is_active,
      variant_options(option_name, option_value)
    ),
    inventory(quantity)
  `)
  .order("slug");

const stats = {
  total: products.length,
  noPrice: 0,
  noDescription: 0,
  noShortDesc: 0,
  noSizes: 0,
  noColors: 0,
  noStock: 0,
};

const samples = [];
for (const p of products) {
  const sizes = new Set();
  const colors = new Set();
  for (const v of p.product_variants ?? []) {
    if (!v.is_active) continue;
    for (const o of v.variant_options ?? []) {
      if (o.option_name === "Size") sizes.add(o.option_value);
      if (o.option_name === "Color") colors.add(o.option_value);
    }
  }
  const stock = (p.inventory ?? []).reduce((a, r) => a + (r.quantity ?? 0), 0);

  if (!p.base_price || p.base_price === 0) stats.noPrice++;
  if (!p.description) stats.noDescription++;
  if (!p.short_description) stats.noShortDesc++;
  if (sizes.size === 0) stats.noSizes++;
  if (colors.size === 0) stats.noColors++;
  if (stock === 0) stats.noStock++;

  if (samples.length < 6) {
    samples.push({
      slug: p.slug,
      brand: p.categories?.slug,
      price: p.base_price,
      sizes: [...sizes],
      colors: [...colors],
      desc: (p.description ?? "").slice(0, 60),
      shortDesc: (p.short_description ?? "").slice(0, 60),
      stock,
    });
  }
}

console.log(`Total products: ${stats.total}\n`);
console.log("Missing data counts:");
console.log(`  no base_price:       ${stats.noPrice}`);
console.log(`  no description:      ${stats.noDescription}`);
console.log(`  no short_desc:       ${stats.noShortDesc}`);
console.log(`  no size variants:    ${stats.noSizes}`);
console.log(`  no color variants:   ${stats.noColors}`);
console.log(`  no inventory stock:  ${stats.noStock}`);

console.log("\nSample products:");
for (const s of samples) {
  console.log(`\n  ${s.slug}  [${s.brand}]`);
  console.log(`    price:  ${s.price ?? "—"}    stock: ${s.stock}`);
  console.log(`    sizes:  [${s.sizes.join(", ") || "none"}]`);
  console.log(`    colors: [${s.colors.join(", ") || "none"}]`);
  console.log(`    desc:   ${s.desc || "(empty)"}`);
}
