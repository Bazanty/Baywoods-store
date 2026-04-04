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
  const [wishlisted, setWishlisted] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (wishlist.length === 0) {
      setWishlisted([]);
      setLoading(false);
      return;
    }
    getAllProducts()
      .then((all) => setWishlisted(all.filter((p) => wishlist.includes(p.id))))
      .catch(() => setWishlisted([]))
      .finally(() => setLoading(false));
  }, [wishlist]);

  return (
    <div className="pt-24 lg:pt-28 pb-24">
      <div className="container-px py-8">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/account" className="text-muted hover:text-ink transition-colors">
            <ChevronLeft size={18} />
          </Link>
          <h1 className="font-serif text-3xl text-ink">
            Wishlist
            {wishlisted.length > 0 && (
              <span className="text-muted text-lg ml-2">({wishlisted.length})</span>
            )}
          </h1>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-stone/40 animate-pulse" />
            ))}
          </div>
        ) : wishlisted.length === 0 ? (
          <div className="text-center py-20">
            <Heart size={48} className="text-stone mx-auto mb-4" strokeWidth={1} />
            <p className="text-ink font-medium mb-2">Your wishlist is empty</p>
            <p className="text-sm text-muted mb-6">
              Save items you love by tapping the heart on any product.
            </p>
            <Link href="/shop" className="btn-primary">
              Browse Shop
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
