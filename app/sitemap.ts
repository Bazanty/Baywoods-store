import type { MetadataRoute } from "next";
import { createClient } from "@supabase/supabase-js";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://baywoods.co.ke";

const STATIC_PATHS: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "/",             priority: 1.0, changeFrequency: "daily" },
  { path: "/shop",         priority: 0.9, changeFrequency: "daily" },
  { path: "/new-arrivals", priority: 0.9, changeFrequency: "daily" },
  { path: "/sale",         priority: 0.9, changeFrequency: "daily" },
  { path: "/about",        priority: 0.5, changeFrequency: "monthly" },
  { path: "/contact",      priority: 0.5, changeFrequency: "monthly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map(({ path, priority, changeFrequency }) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));

  // Pull dynamic data — fall back gracefully if env or network fails
  let products: { slug: string; updated_at: string | null }[] = [];
  let categories: { slug: string }[] = [];

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    try {
      const db = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );

      const [productsRes, categoriesRes] = await Promise.all([
        db
          .from("products")
          .select("slug, updated_at")
          .eq("is_active", true),
        db
          .from("categories")
          .select("slug")
          .eq("is_active", true),
      ]);

      products = productsRes.data ?? [];
      categories = categoriesRes.data ?? [];
    } catch {
      // Empty fallback — sitemap still serves static routes
    }
  }

  const productEntries: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${SITE_URL}/product/${p.slug}`,
    lastModified: p.updated_at ? new Date(p.updated_at) : now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const categoryEntries: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${SITE_URL}/shop/${c.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticEntries, ...categoryEntries, ...productEntries];
}
