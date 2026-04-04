"use client";

import { useState, useMemo, useEffect } from "react";
import { notFound } from "next/navigation";
import { getProductsByCategory } from "@/lib/supabase/queries";
import { Product, SortOption } from "@/lib/types";
import ProductCard from "@/components/shop/ProductCard";
import SortDropdown from "@/components/shop/SortDropdown";

const VALID_CATEGORIES = [
  { slug: "shoes", label: "Shoes" },
  { slug: "hoodies", label: "Hoodies" },
  { slug: "jorts", label: "Jorts" },
  { slug: "joggers", label: "Joggers" },
  { slug: "sweatpants", label: "Sweatpants" },
  { slug: "shirts", label: "Shirts" },
  { slug: "caps", label: "Caps" },
  { slug: "belts", label: "Belts" },
  { slug: "accessories", label: "Accessories" },
];

export default function CategoryPage({ params }: { params: { category: string } }) {
  const { category } = params;
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortOption>("newest");

  const catMeta = VALID_CATEGORIES.find((c) => c.slug === category);
  if (!catMeta) notFound();

  useEffect(() => {
    getProductsByCategory(category)
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, [category]);

  const sorted = useMemo(() => {
    let list = [...products];
    if (sort === "price-asc") list.sort((a, b) => (a.salePrice ?? a.price) - (b.salePrice ?? b.price));
    if (sort === "price-desc") list.sort((a, b) => (b.salePrice ?? b.price) - (a.salePrice ?? a.price));
    if (sort === "rating") list.sort((a, b) => b.rating - a.rating);
    return list;
  }, [products, sort]);

  return (
    <div className="pt-24 lg:pt-28">
      <div className="container-px py-8 border-b border-stone">
        <p className="text-[10px] font-semibold tracking-[0.25em] uppercase text-forest mb-1">
          Shop
        </p>
        <h1 className="font-serif text-4xl lg:text-5xl text-ink capitalize">
          {catMeta.label}
        </h1>
        <p className="text-sm text-muted mt-2">
          {loading ? "Loading…" : `${sorted.length} products`}
        </p>
      </div>

      <div className="container-px py-8">
        <div className="flex justify-end mb-6">
          <SortDropdown value={sort} onChange={setSort} />
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-stone/40 animate-pulse" />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="text-center py-20 text-muted text-sm">
            No products in this category yet.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-5">
            {sorted.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
