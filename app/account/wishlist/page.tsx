"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Heart } from "lucide-react";
import { getAllProducts } from "@/lib/supabase/queries";
import { useCartStore } from "@/lib/store";
import { Product } from "@/lib/types";
import ProductCard from "@/components/shop/ProductCard";

export default function WishlistPage() {
  const { wishlist } = useCartStore();
  const toggleWishlist = useCartStore((s) => s.toggleWishlist);
  const [wishlisted, setWishlisted] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (wishlist.length === 0) {
      setWishlisted([]);
      setLoading(false);
      return;
    }
    getAllProducts()
      .then((all) => {
        const activeWishlist = all.filter((p) => wishlist.includes(p.id));
        const activeIds = new Set(activeWishlist.map((p) => p.id));
        wishlist.filter((id) => !activeIds.has(id)).forEach(toggleWishlist);
        setWishlisted(activeWishlist);
      })
      .catch(() => setWishlisted([]))
      .finally(() => setLoading(false));
  }, [wishlist, toggleWishlist]);

  return (
    <div className="pt-20 lg:pt-24 pb-24">
      <div className="container-px py-8">
        <Link href="/account" className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted hover:text-ink inline-flex items-center gap-1 mb-2">
          <ChevronLeft size={12} /> Account
        </Link>
        <div className="border-b border-ink/15 pb-6 mb-8 flex items-end justify-between flex-wrap gap-4">
          <div>
            <p className="section-kicker mb-4">WISHLIST</p>
            <h1 className="font-display font-medium tracking-[-0.025em] leading-[0.92] text-ink text-5xl">
              Saved.
            </h1>
          </div>
          {wishlisted.length > 0 && (
            <p className="font-mono text-[11px] tracking-[0.14em] uppercase text-ink">
              {String(wishlisted.length).padStart(2, "0")} {wishlisted.length === 1 ? "piece" : "pieces"}
            </p>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-beige-dark animate-pulse" />
            ))}
          </div>
        ) : wishlisted.length === 0 ? (
          <div className="text-center py-20 border border-ink/15">
            <Heart size={36} className="text-muted mx-auto mb-4" strokeWidth={1.25} />
            <p className="font-display text-2xl tracking-[-0.02em] text-ink mb-2">Empty wishlist.</p>
            <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-muted mb-6">
              / Tap the heart on any product to save
            </p>
            <Link href="/shop" className="btn-primary">
              Browse shop
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-5">
            {wishlisted.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
