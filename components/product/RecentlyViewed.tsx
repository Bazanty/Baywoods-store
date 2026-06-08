"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/utils";
import {
  getRecentlyViewedSlugs,
  trackRecentlyViewed,
} from "@/lib/recentlyViewed";

interface Props {
  // When set, this product is recorded as a view on mount and excluded from
  // the rendered list.
  trackSlug?: string;
  title?: string;
  emptyHint?: string;
  limit?: number;
}

export default function RecentlyViewed({ trackSlug, title = "Recently viewed", emptyHint, limit = 6 }: Props) {
  const [products, setProducts] = useState<Product[] | null>(null);

  useEffect(() => {
    if (trackSlug) trackRecentlyViewed(trackSlug);

    let cancelled = false;
    async function load() {
      const localSlugs = getRecentlyViewedSlugs().filter((s) => s !== trackSlug);

      // Merge server-side history for signed-in users — sendBeacon is fire-
      // and-forget, so we always try GET and merge.
      let remoteSlugs: string[] = [];
      try {
        const res = await fetch("/api/recently-viewed", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.slugs)) {
            remoteSlugs = data.slugs.filter((s: unknown): s is string => typeof s === "string" && s !== trackSlug);
          }
        }
      } catch {
        // ignore
      }

      const merged: string[] = [];
      const seen = new Set<string>();
      for (const s of [...localSlugs, ...remoteSlugs]) {
        if (seen.has(s)) continue;
        seen.add(s);
        merged.push(s);
      }
      const targetSlugs = merged.slice(0, limit);

      if (targetSlugs.length === 0) {
        if (!cancelled) setProducts([]);
        return;
      }

      try {
        const res = await fetch(`/api/products?slugs=${encodeURIComponent(targetSlugs.join(","))}`, {
          cache: "no-store",
        });
        if (!res.ok) {
          if (!cancelled) setProducts([]);
          return;
        }
        const data = await res.json();
        if (cancelled) return;
        const list: Product[] = Array.isArray(data.products) ? data.products : [];
        // Preserve order from targetSlugs
        const byId = new Map(list.map((p) => [p.slug, p]));
        const ordered = targetSlugs
          .map((s) => byId.get(s))
          .filter((p): p is Product => Boolean(p));
        setProducts(ordered);
      } catch {
        if (!cancelled) setProducts([]);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [trackSlug, limit]);

  if (products === null) return null; // suspended — avoid hydration mismatch
  if (products.length === 0) {
    if (!emptyHint) return null;
    return (
      <div className="border border-ink/15 bg-cream p-6 text-center font-mono text-[10px] tracking-[0.16em] uppercase text-muted">
        / {emptyHint}
      </div>
    );
  }

  return (
    <section className="mt-16">
      <div className="flex items-end justify-between mb-5 border-b border-ink/15 pb-3">
        <div>
          <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted">/ History</p>
          <h2 className="font-display text-2xl tracking-[-0.02em] text-ink mt-1">{title}</h2>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {products.map((p) => (
          <Link
            key={p.id}
            href={`/product/${p.slug}`}
            className="group block border border-ink/10 bg-beige-dark"
          >
            <div className="relative aspect-square overflow-hidden">
              {p.images[0] ? (
                <Image
                  src={p.images[0]}
                  alt={p.name}
                  fill
                  sizes="(max-width: 768px) 50vw, 16vw"
                  className="object-cover transition-transform duration-500 ease-out-expo group-hover:scale-[1.04]"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center font-mono text-[10px] uppercase text-muted/60">
                  {p.name.slice(0, 2)}
                </div>
              )}
            </div>
            <div className="px-2 py-2.5">
              <p className="font-display text-sm text-ink truncate group-hover:underline-citrine">
                {p.name}
              </p>
              <p className="price text-xs text-muted mt-0.5">
                {formatPrice(p.salePrice ?? p.price)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
