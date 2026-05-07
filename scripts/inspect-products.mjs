// Quick read of what's currently in products / categories so we know where
// the Cloudinary brand images need to land.
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

const { data: cats } = await sb.from("categories").select("id, name, slug, parent_id").order("name");
console.log("CATEGORIES:");
cats?.forEach((c) => console.log(`  ${c.slug.padEnd(20)} ${c.name}`));

const { data: products } = await sb
  .from("products")
  .select("id, name, slug, category_id, categories(slug)")
  .order("name");

console.log(`\nPRODUCTS (${products?.length ?? 0}):`);
const byBrand = new Map();
for (const p of products ?? []) {
  const slug = p.categories?.slug ?? "(none)";
  if (!byBrand.has(slug)) byBrand.set(slug, []);
  byBrand.get(slug).push(p);
}
for (const [brand, list] of [...byBrand.entries()].sort()) {
  console.log(`\n  ${brand} (${list.length}):`);
  list.slice(0, 8).forEach((p) => console.log(`    - ${p.slug}  →  ${p.name}`));
  if (list.length > 8) console.log(`    … ${list.length - 8} more`);
}

const { count } = await sb
  .from("product_images")
  .select("id", { count: "exact", head: true });
console.log(`\nCurrent product_images count: ${count}`);
