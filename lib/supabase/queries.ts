/**
 * Supabase data-fetching layer.
 *
 * Color convention in variant_options:
 *   option_name = "Color"     → color display name  (e.g. "Black")
 *   option_name = "Color Hex" → hex value           (e.g. "#111111")
 *   option_name = "Size"      → size value           (e.g. "XL", "42")
 */

import { supabase } from "./client";
import type { Category, Order, Product, ProductColor, ProductVariant, Review } from "../types";
import { normalizeOrderStatus } from "../orderStatus";

// ---------------------------------------------------------------------------
// Internal DB shape returned by the nested select
// ---------------------------------------------------------------------------

export type RawProduct = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  material_care?: string | null;
  base_price: number;
  compare_price: number | null;
  is_featured: boolean;
  verification_status?: Product["verificationStatus"] | null;
  verification_notes?: string | null;
  verified_at?: string | null;
  verified_by?: string | null;
  created_at: string;
  categories: { slug: string; name: string; parent: { slug: string } | null } | null;
  product_images: { url: string; is_primary: boolean; sort_order: number }[];
  inventory: { quantity: number; reserved: number }[];
  product_variants: {
    id: string;
    is_active: boolean;
    variant_options: { option_name: string; option_value: string }[];
  }[];
  reviews: { rating: number }[];
};

// ---------------------------------------------------------------------------
// Mapper: DB row → app Product type
// ---------------------------------------------------------------------------

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export function mapProduct(raw: RawProduct): Product {
  // Images — primary first, then by sort_order
  const images = [...raw.product_images]
    .sort((a, b) => {
      if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
      return a.sort_order - b.sort_order;
    })
    .map((i) => i.url);

  // Sizes + colors from active variants' options
  const sizesSet = new Set<string>();
  const colorsMap = new Map<string, string>(); // name → hex
  const variants: ProductVariant[] = [];

  for (const variant of raw.product_variants ?? []) {
    if (!variant.is_active) continue;
    const opts = variant.variant_options ?? [];
    const colorName = opts.find((o) => o.option_name === "Color")?.option_value;
    const colorHex = opts.find((o) => o.option_name === "Color Hex")?.option_value;
    const size = opts.find((o) => o.option_name === "Size")?.option_value;
    if (size) sizesSet.add(size);
    if (colorName && colorHex && !colorsMap.has(colorName)) {
      colorsMap.set(colorName, colorHex);
    }
    variants.push({ id: variant.id, size, colorName });
  }

  const colors: ProductColor[] = Array.from(colorsMap.entries()).map(([name, hex]) => ({
    name,
    hex,
  }));

  // Rating
  const ratings = (raw.reviews ?? []).map((r) => r.rating);
  const rating =
    ratings.length > 0
      ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
      : 0;

  // Stock from base-product inventory row (variant_id IS NULL)
  const availableStock = (raw.inventory ?? []).reduce(
    (sum, stock) => sum + Math.max(0, stock.quantity - stock.reserved),
    0
  );

  // Badge priority: sale → hot → new → undefined
  let badge: Product["badge"];
  if (raw.compare_price != null) {
    badge = "sale";
  } else if (raw.is_featured) {
    badge = "hot";
  } else if (Date.now() - new Date(raw.created_at).getTime() < THIRTY_DAYS_MS) {
    badge = "new";
  }

  const hasComparePrice =
    raw.compare_price != null && Number(raw.compare_price) > Number(raw.base_price);

  return {
    id: raw.id,
    name: raw.name,
    slug: raw.slug,
    category: ((raw.categories?.parent?.slug ?? raw.categories?.slug) ?? "accessories") as Category,
    brand: raw.categories?.parent ? raw.categories?.name ?? undefined : undefined,
    price: hasComparePrice ? Number(raw.compare_price) : Number(raw.base_price),
    salePrice: hasComparePrice ? Number(raw.base_price) : undefined,
    images,
    sizes: Array.from(sizesSet),
    colors,
    variants,
    description: raw.description ?? "",
    materialCare: raw.material_care ?? undefined,
    badge,
    rating,
    reviewCount: ratings.length,
    inStock: availableStock > 0,
    stockCount: availableStock > 0 ? availableStock : undefined,
    verificationStatus: raw.verification_status ?? "PENDING",
    verificationNotes: raw.verification_notes,
    verifiedAt: raw.verified_at,
    verifiedBy: raw.verified_by,
  };
}

// ---------------------------------------------------------------------------
// Shared select string (keeps queries DRY)
// ---------------------------------------------------------------------------

export const PRODUCT_SELECT_WITHOUT_VERIFICATION = `
  id,
  name,
  slug,
  description,
  material_care,
  base_price,
  compare_price,
  is_featured,
  created_at,
  categories!category_id ( slug, name, parent:categories!parent_id ( slug ) ),
  product_images ( url, is_primary, sort_order ),
  inventory ( quantity, reserved ),
  product_variants (
    id,
    is_active,
    variant_options ( option_name, option_value )
  ),
  reviews ( rating )
` as const;

export const PRODUCT_SELECT = `
  id,
  name,
  slug,
  description,
  material_care,
  base_price,
  compare_price,
  is_featured,
  verification_status,
  verification_notes,
  verified_at,
  verified_by,
  created_at,
  categories!category_id ( slug, name, parent:categories!parent_id ( slug ) ),
  product_images ( url, is_primary, sort_order ),
  inventory ( quantity, reserved ),
  product_variants (
    id,
    is_active,
    variant_options ( option_name, option_value )
  ),
  reviews ( rating )
` as const;

type ProductQueryError = { code?: string; message?: string } | null;

export function isMissingProductVerificationColumns(error: ProductQueryError): boolean {
  const message = error?.message ?? "";
  return message.includes("products.verification_status") || message.includes("verification_status");
}

export async function runProductQuery<T>(
  buildQuery: (select: string) => PromiseLike<any>,
  label: string,
  options: { allowMissingRow?: boolean } = {}
): Promise<T | null> {
  const primary = (await buildQuery(PRODUCT_SELECT)) as {
    data: T | null;
    error: ProductQueryError;
  };
  if (!primary.error) return primary.data as T;
  if (options.allowMissingRow && primary.error.code === "PGRST116") return null;
  if (!isMissingProductVerificationColumns(primary.error)) {
    throw new Error(`${label}: ${primary.error.message}`);
  }

  const fallback = (await buildQuery(PRODUCT_SELECT_WITHOUT_VERIFICATION)) as {
    data: T | null;
    error: ProductQueryError;
  };
  if (!fallback.error) return fallback.data as T;
  if (options.allowMissingRow && fallback.error.code === "PGRST116") return null;
  throw new Error(`${label}: ${fallback.error.message}`);
}

// ---------------------------------------------------------------------------
// Product queries
// ---------------------------------------------------------------------------

export async function getAllProducts(): Promise<Product[]> {
  const data = await runProductQuery<RawProduct[]>(
    (select) =>
      supabase
        .from("products")
        .select(select)
        .eq("is_active", true)
        .order("created_at", { ascending: false }),
    "getAllProducts"
  );

  return (data ?? []).map(mapProduct);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const data = await runProductQuery<RawProduct>(
    (select) =>
      supabase
        .from("products")
        .select(select)
        .eq("slug", slug)
        .eq("is_active", true)
        .single(),
    "getProductBySlug",
    { allowMissingRow: true }
  );
  if (!data) return null;
  return mapProduct(data as unknown as RawProduct);
}

export async function getProductsByCategory(categorySlug: string): Promise<Product[]> {
  // Resolve the target category and any of its sub-categories (e.g. "shoes"
  // has nike/vans/… as children). A product belongs if its category_id is
  // either the parent or any of the children.
  const { data: parent, error: parentErr } = await supabase
    .from("categories")
    .select("id")
    .eq("slug", categorySlug)
    .maybeSingle();

  if (parentErr) throw new Error(`getProductsByCategory: ${parentErr.message}`);
  if (!parent) return [];

  const { data: children } = await supabase
    .from("categories")
    .select("id")
    .eq("parent_id", parent.id);

  const categoryIds = [parent.id, ...(children ?? []).map((c) => c.id)];

  const data = await runProductQuery<RawProduct[]>(
    (select) =>
      supabase
        .from("products")
        .select(select)
        .eq("is_active", true)
        .in("category_id", categoryIds)
        .order("created_at", { ascending: false }),
    "getProductsByCategory"
  );

  return (data ?? []).map(mapProduct);
}

export async function getFeaturedProducts(limit = 8): Promise<Product[]> {
  const data = await runProductQuery<RawProduct[]>(
    (select) =>
      supabase
        .from("products")
        .select(select)
        .eq("is_active", true)
        .eq("is_featured", true)
        .order("created_at", { ascending: false })
        .limit(limit),
    "getFeaturedProducts"
  );

  return (data ?? []).map(mapProduct);
}

export async function getNewArrivals(limit = 12): Promise<Product[]> {
  const data = await runProductQuery<RawProduct[]>(
    (select) =>
      supabase
        .from("products")
        .select(select)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(limit),
    "getNewArrivals"
  );

  return (data ?? [])
    .map(mapProduct)
    .filter((p) => p.badge === "new");
}

export async function getSaleProducts(): Promise<Product[]> {
  const data = await runProductQuery<RawProduct[]>(
    (select) =>
      supabase
        .from("products")
        .select(select)
        .eq("is_active", true)
        .not("compare_price", "is", null)
        .order("created_at", { ascending: false }),
    "getSaleProducts"
  );

  return (data ?? []).map(mapProduct);
}

export async function getRelatedProducts(
  productId: string,
  categorySlug: string,
  limit = 4
): Promise<Product[]> {
  const data = await runProductQuery<RawProduct[]>(
    (select) =>
      supabase
        .from("products")
        .select(select)
        .eq("is_active", true)
        .neq("id", productId)
        .order("created_at", { ascending: false }),
    "getRelatedProducts"
  );

  return (data ?? [])
    .filter((p) => p.categories?.slug === categorySlug)
    .slice(0, limit)
    .map(mapProduct);
}

export async function searchProducts(query: string): Promise<Product[]> {
  const data = await runProductQuery<RawProduct[]>(
    (select) =>
      supabase
        .from("products")
        .select(select)
        .eq("is_active", true)
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`),
    "searchProducts"
  );

  return (data ?? []).map(mapProduct);
}

// ---------------------------------------------------------------------------
// Category queries
// ---------------------------------------------------------------------------

export async function getCategories(): Promise<
  { slug: string; label: string; count: number }[]
> {
  const { data, error } = await supabase
    .from("categories")
    .select("slug, name")
    .eq("is_active", true)
    .order("sort_order");

  if (error) throw new Error(`getCategories: ${error.message}`);

  // Fetch per-category product counts
  const slugs = (data ?? []).map((c) => c.slug);
  const counts = await Promise.all(
    slugs.map(async (slug) => {
      const { count } = await supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true)
        .eq("categories.slug", slug);
      return count ?? 0;
    })
  );

  return (data ?? []).map((c, i) => ({
    slug: c.slug,
    label: c.name,
    count: counts[i],
  }));
}

// ---------------------------------------------------------------------------
// Review queries
// ---------------------------------------------------------------------------

export async function getProductReviews(productId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from("reviews")
    .select(`
      id,
      rating,
      title,
      body,
      helpful,
      is_verified,
      is_approved,
      store_reply,
      store_reply_at,
      created_at,
      users ( first_name, last_name )
    `)
    .eq("product_id", productId)
    .eq("is_approved", true)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`getProductReviews: ${error.message}`);

  return (data ?? []).map((r: any) => ({
    id: r.id,
    author: r.users
      ? `${r.users.first_name} ${r.users.last_name[0]}.`
      : "Anonymous",
    rating: r.rating,
    date: r.created_at.slice(0, 10),
    title: r.title ?? undefined,
    body: r.body ?? "",
    verified: r.is_verified,
    helpful: r.helpful ?? 0,
    storeReply: r.store_reply ?? undefined,
    storeReplyAt: r.store_reply_at ?? undefined,
  }));
}

// ---------------------------------------------------------------------------
// Order queries
// ---------------------------------------------------------------------------

export async function getUserOrders(userId: string): Promise<Order[]> {
  const { data, error } = await supabase
    .from("orders")
    .select(`
      id,
      status,
      total,
      tracking_number,
      created_at,
      order_items (
        id,
        product_name,
        variant_name,
        unit_price,
        quantity,
        line_total,
        products (
          id, name, slug, base_price, compare_price,
          categories!category_id ( slug ),
          product_images ( url, is_primary, sort_order )
        )
      )
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`getUserOrders: ${error.message}`);

  return (data ?? []).map((o: any) => ({
    id: o.id,
    date: o.created_at.slice(0, 10),
    status: normalizeOrderStatus(o.status),
    total: o.total,
    trackingNumber: o.tracking_number ?? undefined,
    items: (o.order_items ?? []).map((item: any) => {
      const productImages: { url: string; is_primary: boolean; sort_order: number }[] =
        item.products?.product_images ?? [];
      const primaryImage =
        productImages.find((i) => i.is_primary)?.url ?? productImages[0]?.url ?? "";

      return {
        product: {
          id: item.products?.id ?? "",
          name: item.product_name,
          slug: item.products?.slug ?? "",
          category: (item.products?.categories?.slug ?? "accessories") as Category,
          price: item.products?.base_price ?? item.unit_price,
          salePrice: item.products?.compare_price ?? undefined,
          images: [primaryImage],
          sizes: [],
          colors: [],
          description: "",
          rating: 0,
          reviewCount: 0,
          inStock: true,
        } satisfies Product,
        size: item.variant_name ?? "",
        color: { name: "", hex: "" },
        quantity: item.quantity,
      };
    }),
  }));
}

// ---------------------------------------------------------------------------
// Coupon validation
// ---------------------------------------------------------------------------

export async function validateCoupon(
  code: string,
  orderTotal: number
): Promise<{
  valid: boolean;
  discountAmount: number;
  message?: string;
}> {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("coupons")
    .select("*")
    .eq("code", code.toUpperCase())
    .eq("is_active", true)
    .lte("starts_at", now)
    .single();

  if (error || !data) return { valid: false, discountAmount: 0, message: "Invalid coupon code." };

  if (data.expires_at && data.expires_at < now) {
    return { valid: false, discountAmount: 0, message: "This coupon has expired." };
  }
  if (data.max_uses != null && data.used_count >= data.max_uses) {
    return { valid: false, discountAmount: 0, message: "This coupon has reached its usage limit." };
  }
  if (orderTotal < data.minimum_order) {
    return {
      valid: false,
      discountAmount: 0,
      message: `Minimum order of ${data.minimum_order} required.`,
    };
  }

  const discountAmount =
    data.discount_type === "percentage"
      ? (orderTotal * data.discount_value) / 100
      : data.discount_value;

  return { valid: true, discountAmount: Math.min(discountAmount, orderTotal) };
}
