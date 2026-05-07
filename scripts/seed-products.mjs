// Baywoods Store — seed products from identified shoe images.
// Run: node --env-file=.env.local scripts/seed-products.mjs
//
// Uploads each file in scripts/seed-products.json to Cloudinary under
// `<cloudinaryFolder>/<brand-slug>`, then inserts products + images + variants
// + inventory into Supabase. Idempotent — skips products whose slug already
// exists (safe to re-run after adding more entries).

import { readFile } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { v2 as cloudinary } from "cloudinary";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
const SEED_FILE  = path.join(__dirname, "seed-products.json");

// -----------------------------------------------------------------------------
// Env
// -----------------------------------------------------------------------------
const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY      = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CLOUDINARY_NAME   = process.env.CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_KEY    = process.env.CLOUDINARY_API_KEY;
const CLOUDINARY_SECRET = process.env.CLOUDINARY_API_SECRET;

const missing = [
  ["NEXT_PUBLIC_SUPABASE_URL", SUPABASE_URL],
  ["SUPABASE_SERVICE_ROLE_KEY", SUPABASE_KEY],
  ["CLOUDINARY_CLOUD_NAME", CLOUDINARY_NAME],
  ["CLOUDINARY_API_KEY", CLOUDINARY_KEY],
  ["CLOUDINARY_API_SECRET", CLOUDINARY_SECRET],
].filter(([, v]) => !v).map(([k]) => k);

if (missing.length) {
  console.error(`\n✗ Missing env vars: ${missing.join(", ")}`);
  console.error("  Run with:  node --env-file=.env.local scripts/seed-products.mjs\n");
  process.exit(1);
}

cloudinary.config({
  cloud_name: CLOUDINARY_NAME,
  api_key:    CLOUDINARY_KEY,
  api_secret: CLOUDINARY_SECRET,
  secure:     true,
});

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------
function slugify(input) {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 160);
}

function uploadBuffer(buffer, folder) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder, resource_type: "image" }, (err, result) => {
        if (err || !result) return reject(err ?? new Error("Cloudinary upload failed"));
        resolve({ url: result.secure_url, publicId: result.public_id });
      })
      .end(buffer);
  });
}

function log(line)  { process.stdout.write(line + "\n"); }
function warn(line) { process.stdout.write("  ! " + line + "\n"); }

// -----------------------------------------------------------------------------
// Category upsert (brand → category row)
// -----------------------------------------------------------------------------
async function upsertBrandCategory(brand) {
  const slug = slugify(brand);
  const { data: existing } = await supabase
    .from("categories")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (existing?.id) return existing.id;

  const { data, error } = await supabase
    .from("categories")
    .insert({ name: brand, slug, is_active: true })
    .select("id")
    .single();

  if (error) throw new Error(`category[${brand}]: ${error.message}`);
  return data.id;
}

// -----------------------------------------------------------------------------
// Variant inserts (sizes × colors cartesian)
// -----------------------------------------------------------------------------
async function insertVariants(productId, sizes, colors) {
  if (!sizes.length && !colors.length) return 0;

  const combos = [];
  if (sizes.length && colors.length) {
    for (const s of sizes) for (const c of colors) combos.push({ size: s, color: c });
  } else if (sizes.length) {
    for (const s of sizes) combos.push({ size: s, color: null });
  } else {
    for (const c of colors) combos.push({ size: null, color: c });
  }

  let inserted = 0;
  for (let i = 0; i < combos.length; i++) {
    const { size, color } = combos[i];
    const variantName = [size, color?.name].filter(Boolean).join(" / ");

    const { data: variant, error } = await supabase
      .from("product_variants")
      .insert({ product_id: productId, name: variantName, sort_order: i, is_active: true })
      .select("id")
      .single();

    if (error || !variant) {
      warn(`variant "${variantName}" failed: ${error?.message ?? "unknown"}`);
      continue;
    }

    const options = [];
    if (size) options.push({ variant_id: variant.id, option_name: "Size", option_value: size });
    if (color) {
      options.push({ variant_id: variant.id, option_name: "Color", option_value: color.name });
      options.push({ variant_id: variant.id, option_name: "Color Hex", option_value: color.hex });
    }
    if (options.length) {
      const { error: optErr } = await supabase.from("variant_options").insert(options);
      if (optErr) warn(`variant_options for "${variantName}": ${optErr.message}`);
    }
    inserted += 1;
  }
  return inserted;
}

// -----------------------------------------------------------------------------
// Product insert
// -----------------------------------------------------------------------------
async function seedProduct(entry, idx, total, sourceDir, folderBase, defaultSizes, defaultStock, brandCategoryIds) {
  const name = `${entry.model} ${entry.colorway}`.trim();
  const slug = slugify(`${entry.brand}-${name}`);
  const tag  = `[${String(idx + 1).padStart(2, "0")}/${total}]`;

  // Idempotency — skip if a product with this slug already exists
  const { data: existing } = await supabase
    .from("products")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (existing?.id) {
    log(`${tag} ↷ skip  ${entry.brand} ${name}  (already exists)`);
    return { skipped: true };
  }

  // 1. Upload images to Cloudinary
  const folder = `${folderBase}/${slugify(entry.brand)}`;
  const uploaded = [];
  for (const file of entry.files) {
    const abs = path.join(sourceDir, file);
    if (!existsSync(abs)) {
      warn(`missing file, skipped: ${file}`);
      continue;
    }
    try {
      const buffer = await readFile(abs);
      const result = await uploadBuffer(buffer, folder);
      uploaded.push(result);
    } catch (err) {
      warn(`upload failed for ${file}: ${err.message}`);
    }
  }

  if (uploaded.length === 0) {
    warn(`${entry.brand} ${name} — no images uploaded, skipping product`);
    return { skipped: true };
  }

  // 2. Insert product row
  const { data: product, error: productErr } = await supabase
    .from("products")
    .insert({
      name,
      slug,
      description:       entry.description ?? null,
      short_description: entry.shortDescription ?? null,
      category_id:       brandCategoryIds[entry.brand],
      base_price:        entry.price,
      compare_price:     entry.comparePrice ?? null,
      is_featured:       entry.isFeatured ?? false,
      is_active:         true,
    })
    .select("id")
    .single();

  if (productErr) {
    warn(`product insert failed: ${productErr.message}`);
    return { skipped: true };
  }

  // 3. Insert product_images
  const imageRows = uploaded.map((img, i) => ({
    product_id: product.id,
    url:        img.url,
    is_primary: i === 0,
    sort_order: i,
    alt_text:   `${name} — ${i + 1}`,
  }));
  const { error: imgErr } = await supabase.from("product_images").insert(imageRows);
  if (imgErr) warn(`product_images: ${imgErr.message}`);

  // 4. Insert variants (sizes × colors)
  const variantCount = await insertVariants(product.id, defaultSizes, entry.colors ?? []);

  // 5. Base inventory row (variant_id = null, product-level stock)
  const { error: invErr } = await supabase.from("inventory").insert({
    product_id: product.id,
    variant_id: null,
    quantity:   defaultStock,
    reserved:   0,
  });
  if (invErr) warn(`inventory: ${invErr.message}`);

  log(`${tag} ✓       ${entry.brand} ${name}  — ${uploaded.length} img, ${variantCount} variants`);
  return { skipped: false };
}

// -----------------------------------------------------------------------------
// Main
// -----------------------------------------------------------------------------
async function main() {
  const raw = readFileSync(SEED_FILE, "utf8");
  const seed = JSON.parse(raw);

  const sourceDir    = seed.sourceDir;
  const folderBase   = seed.cloudinaryFolder || "baywoodstore";
  const sizes        = seed.defaultSizes || [];
  const defaultStock = seed.defaultStockPerProduct ?? 10;
  const products     = seed.products || [];

  if (!existsSync(sourceDir)) {
    console.error(`✗ sourceDir not found: ${sourceDir}`);
    process.exit(1);
  }

  log(`\nBaywoods Store — seeding ${products.length} products`);
  log(`  source:     ${sourceDir}`);
  log(`  cloudinary: ${folderBase}/<brand-slug>`);
  log(`  sizes:      ${sizes.join(", ")}\n`);

  // Collect unique brands and resolve/create each brand's category row
  const brandSet = Array.from(new Set(products.map((p) => p.brand)));
  const brandCategoryIds = {};
  for (const brand of brandSet) {
    try {
      brandCategoryIds[brand] = await upsertBrandCategory(brand);
      log(`  ◦ brand category: ${brand}  (${slugify(brand)})`);
    } catch (err) {
      console.error(`\n✗ ${err.message}`);
      process.exit(1);
    }
  }
  log("");

  let seeded = 0;
  let skipped = 0;
  for (let i = 0; i < products.length; i++) {
    const result = await seedProduct(
      products[i],
      i,
      products.length,
      sourceDir,
      folderBase,
      sizes,
      defaultStock,
      brandCategoryIds
    );
    if (result.skipped) skipped += 1;
    else seeded += 1;
  }

  log(`\nDone — ${seeded} seeded, ${skipped} skipped.\n`);
  log("Verify:");
  log("  1. http://localhost:3000/admin/products");
  log("  2. http://localhost:3000/shop\n");
}

main().catch((err) => {
  console.error("\n✗ Fatal:", err);
  process.exit(1);
});
