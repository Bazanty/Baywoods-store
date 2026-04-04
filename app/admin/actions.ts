"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";

function db() { return createSupabaseAdminClient(); }

export interface UploadedImage {
  url: string;
  publicId: string;
  isPrimary: boolean;
}

export interface ColorOption {
  name: string;
  hex: string;
}

export interface ProductPayload {
  name: string;
  description: string;
  shortDescription: string;
  categorySlug: string;
  basePrice: number;
  comparePrice?: number;
  sku?: string;
  isFeatured: boolean;
  isActive: boolean;
  images: UploadedImage[];
  sizes: string[];
  colors: ColorOption[];
  stockQuantity: number;
}

// ---------------------------------------------------------------------------
// Create product
// ---------------------------------------------------------------------------
export async function createProduct(payload: ProductPayload) {
  const slug = slugify(payload.name);

  // 1. Resolve category id
  const { data: category } = await db()
    .from("categories")
    .select("id")
    .eq("slug", payload.categorySlug)
    .single();

  // 2. Insert product
  const { data: product, error: productError } = await db()
    .from("products")
    .insert({
      name: payload.name,
      slug,
      description: payload.description || null,
      short_description: payload.shortDescription || null,
      category_id: category?.id ?? null,
      base_price: payload.basePrice,
      compare_price: payload.comparePrice ?? null,
      sku: payload.sku || null,
      is_featured: payload.isFeatured,
      is_active: payload.isActive,
    })
    .select("id")
    .single();

  if (productError) throw new Error(productError.message);
  const productId = product.id;

  // 3. Insert images
  if (payload.images.length > 0) {
    await db().from("product_images").insert(
      payload.images.map((img, i) => ({
        product_id: productId,
        url: img.url,
        is_primary: img.isPrimary,
        sort_order: i,
      }))
    );
  }

  // 4. Insert variants (sizes × colors cartesian product)
  await insertVariants(productId, payload.sizes, payload.colors);

  // 5. Insert inventory
  await db().from("inventory").insert({
    product_id: productId,
    variant_id: null,
    quantity: payload.stockQuantity,
    reserved: 0,
  });

  revalidatePath("/admin/products");
  return { productId, slug };
}

// ---------------------------------------------------------------------------
// Update product
// ---------------------------------------------------------------------------
export async function updateProduct(productId: string, payload: ProductPayload) {
  const { data: category } = await db()
    .from("categories")
    .select("id")
    .eq("slug", payload.categorySlug)
    .single();

  const { error } = await db()
    .from("products")
    .update({
      name: payload.name,
      description: payload.description || null,
      short_description: payload.shortDescription || null,
      category_id: category?.id ?? null,
      base_price: payload.basePrice,
      compare_price: payload.comparePrice ?? null,
      sku: payload.sku || null,
      is_featured: payload.isFeatured,
      is_active: payload.isActive,
    })
    .eq("id", productId);

  if (error) throw new Error(error.message);

  // Replace images — delete old, insert new
  await db().from("product_images").delete().eq("product_id", productId);
  if (payload.images.length > 0) {
    await db().from("product_images").insert(
      payload.images.map((img, i) => ({
        product_id: productId,
        url: img.url,
        is_primary: img.isPrimary,
        sort_order: i,
      }))
    );
  }

  // Replace variants
  const { data: existingVariants } = await db()
    .from("product_variants")
    .select("id")
    .eq("product_id", productId);

  if (existingVariants?.length) {
    const ids = existingVariants.map((v) => v.id);
    await db().from("variant_options").delete().in("variant_id", ids);
    await db().from("product_variants").delete().eq("product_id", productId);
  }

  await insertVariants(productId, payload.sizes, payload.colors);

  // Update inventory quantity
  await db()
    .from("inventory")
    .update({ quantity: payload.stockQuantity })
    .eq("product_id", productId)
    .is("variant_id", null);

  const { data: updated } = await db().from("products").select("slug").eq("id", productId).single();
  revalidatePath("/admin/products");
  if (updated?.slug) revalidatePath(`/product/${updated.slug}`);
}

// ---------------------------------------------------------------------------
// Toggle active / draft
// ---------------------------------------------------------------------------
export async function toggleProductActive(productId: string, active: boolean) {
  await db().from("products").update({ is_active: active }).eq("id", productId);
  revalidatePath("/admin/products");
}

// ---------------------------------------------------------------------------
// Hard-delete product (removes all related rows via cascade)
// ---------------------------------------------------------------------------
export async function deleteProduct(productId: string) {
  await db().from("products").delete().eq("id", productId);
  revalidatePath("/admin/products");
}

// ---------------------------------------------------------------------------
// Admin product list
// ---------------------------------------------------------------------------
export async function getAdminProducts() {
  const { data, error } = await db()
    .from("products")
    .select(`
      id, name, slug, base_price, compare_price, is_active, is_featured, created_at,
      categories!category_id ( name ),
      product_images ( url, is_primary ),
      inventory ( quantity, reserved )
    `)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

// ---------------------------------------------------------------------------
// Admin stats for dashboard
// ---------------------------------------------------------------------------
export async function getAdminStats() {
  try {
    const [products, orders, outOfStock] = await Promise.all([
      db()
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true),
      db()
        .from("orders")
        .select("id", { count: "exact", head: true }),
      db()
        .from("inventory")
        .select("id", { count: "exact", head: true })
        .eq("quantity", 0),
    ]);

    const { data: recentOrders } = await db()
      .from("orders")
      .select("id, status, total, created_at, shipping_name")
      .order("created_at", { ascending: false })
      .limit(5);

    return {
      productCount: products.count ?? 0,
      orderCount: orders.count ?? 0,
      outOfStockCount: outOfStock.count ?? 0,
      recentOrders: recentOrders ?? [],
    };
  } catch {
    return { productCount: 0, orderCount: 0, outOfStockCount: 0, recentOrders: [] };
  }
}

// ---------------------------------------------------------------------------
// Helper: create variants from sizes × colors
// ---------------------------------------------------------------------------
async function insertVariants(
  productId: string,
  sizes: string[],
  colors: ColorOption[]
) {
  if (sizes.length === 0 && colors.length === 0) return;

  type Combo = { size: string | null; color: ColorOption | null };
  let combos: Combo[];

  if (sizes.length > 0 && colors.length > 0) {
    combos = sizes.flatMap((size) => colors.map((color) => ({ size, color })));
  } else if (sizes.length > 0) {
    combos = sizes.map((size) => ({ size, color: null }));
  } else {
    combos = colors.map((color) => ({ size: null, color }));
  }

  for (let i = 0; i < combos.length; i++) {
    const { size, color } = combos[i];
    const variantName = [size, color?.name].filter(Boolean).join(" / ");

    const { data: variant, error } = await db()
      .from("product_variants")
      .insert({ product_id: productId, name: variantName, sort_order: i })
      .select("id")
      .single();

    if (error || !variant) continue;

    const options: { variant_id: string; option_name: string; option_value: string }[] = [];
    if (size) options.push({ variant_id: variant.id, option_name: "Size", option_value: size });
    if (color) {
      options.push({ variant_id: variant.id, option_name: "Color", option_value: color.name });
      options.push({ variant_id: variant.id, option_name: "Color Hex", option_value: color.hex });
    }
    if (options.length) await db().from("variant_options").insert(options);
  }
}
