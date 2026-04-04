"use client";

import { useState, useMemo, useEffect } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { getAllProducts } from "@/lib/supabase/queries";
import { Product, FilterState, SortOption } from "@/lib/types";
import FilterSidebar from "@/components/shop/FilterSidebar";
import SortDropdown from "@/components/shop/SortDropdown";
import ProductCard from "@/components/shop/ProductCard";
import { motion, AnimatePresence } from "framer-motion";

const DEFAULT_FILTERS: FilterState = {
  categories: [],
  sizes: [],
  colors: [],
  priceRange: [0, 15000],
  inStockOnly: false,
};

export default function ShopPage() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [sort, setSort] = useState<SortOption>("newest");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    getAllProducts()
      .then(setAllProducts)
      .catch(() => setAllProducts([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = [...allProducts];

    if (filters.categories.length > 0) {
      list = list.filter((p) => filters.categories.includes(p.category));
    }
    if (filters.sizes.length > 0) {
      list = list.filter((p) => p.sizes.some((s) => filters.sizes.includes(s)));
    }
    if (filters.inStockOnly) {
      list = list.filter((p) => p.inStock);
    }
    list = list.filter((p) => {
      const price = p.salePrice ?? p.price;
      return price >= filters.priceRange[0] && price <= filters.priceRange[1];
    });

    switch (sort) {
      case "price-asc":
        list.sort((a, b) => (a.salePrice ?? a.price) - (b.salePrice ?? b.price));
        break;
      case "price-desc":
        list.sort((a, b) => (b.salePrice ?? b.price) - (a.salePrice ?? a.price));
        break;
      case "rating":
        list.sort((a, b) => b.rating - a.rating);
        break;
      case "best-selling":
        list.sort((a, b) => b.reviewCount - a.reviewCount);
        break;
      default:
        break;
    }

    return list;
  }, [allProducts, filters, sort]);

  return (
    <div className="pt-24 lg:pt-28">
      <div className="container-px py-8 border-b border-stone">
        <p className="text-[10px] font-semibold tracking-[0.25em] uppercase text-forest mb-1">
          Browse
        </p>
        <h1 className="font-serif text-4xl lg:text-5xl text-ink">All Products</h1>
      </div>

      <div className="container-px py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileFiltersOpen(true)}
              className="lg:hidden flex items-center gap-2 text-sm border border-stone px-3 py-2 text-ink hover:border-ink transition-colors"
            >
              <SlidersHorizontal size={14} />
              Filters
            </button>
            <p className="text-sm text-muted">
              {loading ? "Loading…" : `${filtered.length} ${filtered.length === 1 ? "product" : "products"}`}
            </p>
          </div>
          <SortDropdown value={sort} onChange={setSort} />
        </div>

        <div className="flex gap-10">
          <div className="hidden lg:block">
            <FilterSidebar
              filters={filters}
              onChange={setFilters}
              onReset={() => setFilters(DEFAULT_FILTERS)}
            />
          </div>

          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-5">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="aspect-[3/4] bg-stone/40 animate-pulse" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-muted text-sm">No products match your filters.</p>
                <button
                  onClick={() => setFilters(DEFAULT_FILTERS)}
                  className="mt-4 text-xs text-forest underline underline-offset-2"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <motion.div
                layout
                className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-5"
              >
                <AnimatePresence>
                  {filtered.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence>
        {mobileFiltersOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-ink/30 z-40 lg:hidden"
              onClick={() => setMobileFiltersOpen(false)}
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="fixed top-0 left-0 bottom-0 w-72 bg-cream z-50 overflow-y-auto p-6 lg:hidden"
            >
              <div className="flex items-center justify-between mb-6">
                <p className="font-medium text-sm">Filters</p>
                <button onClick={() => setMobileFiltersOpen(false)}>
                  <X size={18} />
                </button>
              </div>
              <FilterSidebar
                filters={filters}
                onChange={setFilters}
                onReset={() => {
                  setFilters(DEFAULT_FILTERS);
                  setMobileFiltersOpen(false);
                }}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
