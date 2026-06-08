import { createSupabaseAdminClient } from "./server";
import { mapProduct, runProductQuery, type RawProduct } from "./queries";
import type { Product, Review } from "../types";

function db() {
  return createSupabaseAdminClient();
}

export async function getAllProductsServer(): Promise<Product[]> {
  const data = await runProductQuery<RawProduct[]>(
    (select) =>
      db()
        .from("products")
        .select(select)
        .eq("is_active", true)
        .order("created_at", { ascending: false }),
    "getAllProductsServer"
  );

  return (data ?? []).map(mapProduct);
}

export async function getProductsByCategoryServer(categorySlug: string): Promise<Product[]> {
  const client = db();

  const { data: parent, error: parentErr } = await client
    .from("categories")
    .select("id")
    .eq("slug", categorySlug)
    .maybeSingle();

  if (parentErr) throw new Error(`getProductsByCategoryServer: ${parentErr.message}`);
  if (!parent) return [];

  const { data: children } = await client
    .from("categories")
    .select("id")
    .eq("parent_id", parent.id);

  const categoryIds = [parent.id, ...(children ?? []).map((c: { id: string }) => c.id)];

  const data = await runProductQuery<RawProduct[]>(
    (select) =>
      client
        .from("products")
        .select(select)
        .eq("is_active", true)
        .in("category_id", categoryIds)
        .order("created_at", { ascending: false }),
    "getProductsByCategoryServer"
  );

  return (data ?? []).map(mapProduct);
}

export async function getProductBySlugServer(slug: string): Promise<Product | null> {
  const data = await runProductQuery<RawProduct>(
    (select) =>
      db()
        .from("products")
        .select(select)
        .eq("slug", slug)
        .eq("is_active", true)
        .single(),
    "getProductBySlugServer",
    { allowMissingRow: true }
  );

  return data ? mapProduct(data as unknown as RawProduct) : null;
}

export async function getRelatedProductsServer(
  productId: string,
  categorySlug: string,
  limit = 4
): Promise<Product[]> {
  const data = await runProductQuery<RawProduct[]>(
    (select) =>
      db()
        .from("products")
        .select(select)
        .eq("is_active", true)
        .neq("id", productId)
        .order("created_at", { ascending: false }),
    "getRelatedProductsServer"
  );

  return (data ?? [])
    .filter((p) => p.categories?.slug === categorySlug)
    .slice(0, limit)
    .map(mapProduct);
}

export async function getProductsBySlugsServer(slugs: string[]): Promise<Product[]> {
  if (!slugs || slugs.length === 0) return [];
  const data = await runProductQuery<RawProduct[]>(
    (select) =>
      db()
        .from("products")
        .select(select)
        .eq("is_active", true)
        .in("slug", slugs),
    "getProductsBySlugsServer"
  );
  const map = new Map<string, Product>();
  for (const raw of data ?? []) map.set(raw.slug, mapProduct(raw));
  // Preserve the requested order (most recent first).
  return slugs.map((s) => map.get(s)).filter((p): p is Product => Boolean(p));
}

export async function getProductReviewsServer(productId: string): Promise<Review[]> {
  const { data, error } = await db()
    .from("reviews")
    .select(`
      id, rating, title, body, is_verified, is_approved, created_at,
      users ( first_name, last_name )
    `)
    .eq("product_id", productId)
    .eq("is_approved", true)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`getProductReviewsServer: ${error.message}`);

  return (data ?? []).map((r: any) => ({
    id: r.id,
    author: r.users ? `${r.users.first_name} ${r.users.last_name[0]}.` : "Anonymous",
    rating: r.rating,
    date: r.created_at.slice(0, 10),
    title: r.title ?? "",
    body: r.body ?? "",
    verified: r.is_verified ?? false,
    helpful: 0,
  }));
}
