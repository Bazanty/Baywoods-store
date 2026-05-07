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

const { data: rows } = await sb
  .from("products")
  .select(`
    id, slug,
    categories(slug),
    product_images(url, is_primary, sort_order)
  `)
  .order("slug");

const counts = new Map();
const samples = new Map();
for (const p of rows ?? []) {
  const brand = p.categories?.slug ?? "(none)";
  const n = p.product_images?.length ?? 0;
  if (!counts.has(brand)) counts.set(brand, { products: 0, imgs: 0, zero: 0 });
  const c = counts.get(brand);
  c.products++;
  c.imgs += n;
  if (n === 0) c.zero++;
  if (!samples.has(brand) && p.product_images?.[0]) {
    samples.set(brand, p.product_images[0].url);
  }
}

console.log("brand              products  images  no-img   sample");
for (const [brand, c] of [...counts.entries()].sort()) {
  console.log(
    `  ${brand.padEnd(16)} ${String(c.products).padStart(4)}    ${String(c.imgs).padStart(4)}     ${String(c.zero).padStart(3)}    ${(samples.get(brand) ?? "").slice(0, 80)}`
  );
}
