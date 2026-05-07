// Attach the 276 Cloudinary "Baywoods images" lookbook shots to existing
// products as additional gallery images. Round-robin so every product gets
// roughly 2-3 extra shots. Existing primary images are left untouched.
//
// Re-runnable: skips inserts where (product_id, url) already exists.

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

// 1. Pull every lookbook shot via the Search API — assets live in dynamic
// folders, so we have to filter on asset_folder, not public_id prefix.
const lookbook = [];
let cursor;
do {
  const res = await cloudinary.search
    .expression('asset_folder="Baywoodstore/Baywoods images"')
    .max_results(500)
    .next_cursor(cursor)
    .execute();
  lookbook.push(...res.resources);
  cursor = res.next_cursor;
} while (cursor);

console.log(`Pulled ${lookbook.length} lookbook shots from Cloudinary.`);

// 2. Get every product + its current images
const { data: products, error: prodErr } = await sb
  .from("products")
  .select("id, slug, product_images(url, sort_order)")
  .order("slug");

if (prodErr) throw prodErr;
console.log(`Found ${products.length} products.\n`);

// 3. Distribute round-robin
const inserts = [];
let i = 0;
for (const shot of lookbook) {
  const product = products[i % products.length];
  const existingUrls = new Set(product.product_images?.map((p) => p.url) ?? []);
  if (existingUrls.has(shot.secure_url)) {
    i++;
    continue;
  }
  const baseSort = product.product_images?.length ?? 0;
  inserts.push({
    product_id: product.id,
    url: shot.secure_url,
    alt_text: product.slug,
    sort_order: baseSort + Math.floor(i / products.length) + 1,
    is_primary: false,
  });
  product.product_images = [...(product.product_images ?? []), { url: shot.secure_url }];
  i++;
}

console.log(`Prepared ${inserts.length} new product_images rows.`);

// 4. Insert in chunks of 100
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

console.log(`\nDone — inserted ${inserted} gallery images.`);
