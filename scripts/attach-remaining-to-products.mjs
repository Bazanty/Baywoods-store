// Pulls every Cloudinary image NOT already attached to a product and
// distributes it round-robin across products as additional gallery shots.
// Re-runnable: skips any (product_id, url) pair that already exists.

import { v2 as cloudinary } from "cloudinary";
import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const envRaw = await readFile(resolve(process.cwd(), ".env.local"), "utf8");
for (const line of envRaw.split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME?.trim(),
  api_key: process.env.CLOUDINARY_API_KEY?.trim(),
  api_secret: process.env.CLOUDINARY_API_SECRET?.trim(),
  secure: true,
});

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

// 1. Pull every image from Cloudinary
const allCloud = [];
let cursor;
do {
  const res = await cloudinary.search
    .expression("resource_type:image")
    .max_results(500)
    .next_cursor(cursor)
    .execute();
  allCloud.push(...res.resources);
  cursor = res.next_cursor;
} while (cursor);
console.log(`Cloudinary holds ${allCloud.length} total images.`);

// 2. Pull every URL already in product_images so we know what's "used"
const used = new Set();
let from = 0;
const PAGE = 1000;
while (true) {
  const { data, error } = await sb
    .from("product_images")
    .select("url")
    .range(from, from + PAGE - 1);
  if (error) throw error;
  if (!data?.length) break;
  for (const r of data) used.add(r.url);
  if (data.length < PAGE) break;
  from += PAGE;
}
console.log(`product_images already references ${used.size} URLs.`);

// 3. Whatever's in Cloudinary but not yet referenced is fair game
const remaining = allCloud
  .filter((r) => !used.has(r.secure_url))
  .sort((a, b) => a.public_id.localeCompare(b.public_id));

console.log(`\n${remaining.length} unattached Cloudinary images to distribute.`);

// Group by folder for the report
const byFolder = new Map();
for (const r of remaining) {
  const f = r.asset_folder || r.folder || "(root)";
  byFolder.set(f, (byFolder.get(f) ?? 0) + 1);
}
for (const [f, n] of [...byFolder.entries()].sort()) {
  console.log(`  ${f}: ${n}`);
}

// 4. Get every product
const { data: products, error: prodErr } = await sb
  .from("products")
  .select("id, slug, product_images(url, sort_order)")
  .order("slug");
if (prodErr) throw prodErr;
console.log(`\nDistributing across ${products.length} products…`);

// 5. Round-robin
const inserts = [];
let i = 0;
for (const shot of remaining) {
  const product = products[i % products.length];
  const existing = new Set(product.product_images?.map((p) => p.url) ?? []);
  if (!existing.has(shot.secure_url)) {
    const baseSort = product.product_images?.length ?? 0;
    inserts.push({
      product_id: product.id,
      url: shot.secure_url,
      alt_text: product.slug,
      sort_order: baseSort + Math.floor(i / products.length) + 1,
      is_primary: false,
    });
    product.product_images = [...(product.product_images ?? []), { url: shot.secure_url }];
  }
  i++;
}

console.log(`Prepared ${inserts.length} new product_images rows.`);

// 6. Insert in chunks
let inserted = 0;
for (let c = 0; c < inserts.length; c += 100) {
  const chunk = inserts.slice(c, c + 100);
  const { error } = await sb.from("product_images").insert(chunk);
  if (error) {
    console.error(`  chunk ${c}-${c + chunk.length} failed: ${error.message}`);
    continue;
  }
  inserted += chunk.length;
  process.stdout.write(`  inserted ${inserted}/${inserts.length}\r`);
}
console.log(`\nDone — inserted ${inserted} images.`);
