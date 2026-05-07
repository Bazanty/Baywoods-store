"use client";

import { useMemo, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { Product, FilterState, SortOption, Category } from "@/lib/types";
import FilterSidebar from "@/components/shop/FilterSidebar";
import SortDropdown from "@/components/shop/SortDropdown";
import ProductCard from "@/components/shop/ProductCard";
import { motion, AnimatePresence } from "framer-motion";

const VALID_SORTS: SortOption[] = ["newest", "price-asc", "price-desc", "best-selling", "rating"];

function parseFilters(
  params: ReturnType<typeof useSearchParams>,
  priceMax: number
): FilterState {
  return {
    categories: (params?.getAll("cat") as Category[]) ?? [],
    sizes: params?.getAll("size") ?? [],
    colors: params?.getAll("color") ?? [],
    priceRange: [0, Number(params?.get("priceMax")) || priceMax],
    inStockOnly: params?.get("inStock") === "1",
  };
}

function buildParams(filters: FilterState, sort: SortOption, priceMax: number): string {
  const p = new URLSearchParams();
  if (sort !== "newest") p.set("sort", sort);
  filters.categories.forEach((c) => p.append("cat", c));
  filters.sizes.forEach((s) => p.append("size", s));
  filters.colors.forEach((c) => p.append("color", c));
  if (filters.priceRange[1] < priceMax) p.set("priceMax", String(filters.priceRange[1]));
  if (filters.inStockOnly) p.set("inStock", "1");
  const qs = p.toString();
  return qs ? `?${qs}` : "";
}

function EmptyState({
  filters,
  onReset,
  onClearType,
}: {
  filters: FilterState;
  onReset: () => void;
  onClearType: (type: "categories" | "sizes" | "colors" | "stock") => void;
}) {
  const chips: { label: string; type: "categories" | "sizes" | "colors" | "stock" }[] = [
    ...(filters.categories.length > 0
      ? [{ label: filters.categories.join(", "), type: "categories" as const }]
      : []),
    ...(filters.sizes.length > 0
      ? [{ label: `Size: ${filters.sizes.join(", ")}`, type: "sizes" as const }]
      : []),
    ...(filters.colors.length > 0
      ? [{ label: `Color: ${filters.colors.join(", ")}`, type: "colors" as const }]
      : []),
    ...(filters.inStockOnly ? [{ label: "In stock only", type: "stock" as const }] : []),
  ];

  return (
    <div className="py-16 text-center">
      <p className="text-ink font-medium mb-1">No products match your filters</p>
      <p className="text-sm text-muted mb-5">Try removing one of the active filters below</p>
      {chips.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {chips.map((chip) => (
            <button
              key={chip.type}
              onClick={() => onClearType(chip.type)}
              className="flex items-center gap-1.5 text-xs border border-stone px-3 py-1.5 text-ink/70 hover:border-ink hover:text-ink transition-colors"
            >
              <X size={11} />
              {chip.label}
            </button>
          ))}
        </div>
      )}
      <button onClick={onReset} className="text-xs text-forest underline underline-offset-2">
        Clear all filters
      </button>
    </div>
  );
}

function ShopInner({ allProducts }: { allProducts: Product[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const { availableCategories, availableSizes, availableColors, priceMax } = useMemo(() => {
    const cats = new Set<Category>();
    const sizes = new Set<string>();
    const colorMap = new Map<string, string>();
    let max = 0;
    for (const p of allProducts) {
      cats.add(p.category);
      p.sizes.forEach((s) => sizes.add(s));
      p.colors.forEach((c) => colorMap.set(c.name, c.hex));
      const price = p.salePrice ?? p.price;
      if (price > max) max = price;
    }
    return {
      availableCategories: Array.from(cats),
      availableSizes: Array.from(sizes),
      availableColors: Array.from(colorMap.entries()).map(([name, hex]) => ({ name, hex })),
      priceMax: Math.ceil(max / 1000) * 1000 || 15000,
    };
  }, [allProducts]);

  const sort = (VALID_SORTS.includes(searchParams?.get("sort") as SortOption)
    ? searchParams?.get("sort")
    : "newest") as SortOption;

  const filters = useMemo(
    () => parseFilters(searchParams, priceMax),
    [searchParams, priceMax]
  );

  const pushURL = useCallback(
    (newFilters: FilterState, newSort: SortOption) => {
      router.replace(`${pathname}${buildParams(newFilters, newSort, priceMax)}`, { scroll: false });
    },
    [router, pathname, priceMax]
  );

  const setFilters = useCallback(
    (f: FilterState) => pushURL(f, sort),
    [pushURL, sort]
  );

  const setSort = useCallback(
    (s: SortOption) => pushURL(filters, s),
    [pushURL, filters]
  );

  const resetFilters = useCallback(() => {
    pushURL({ categories: [], sizes: [], colors: [], priceRange: [0, priceMax], inStockOnly: false }, sort);
  }, [pushURL, sort, priceMax]);

  const clearType = useCallback(
    (type: "categories" | "sizes" | "colors" | "stock") => {
      const updated = { ...filters };
      if (type === "categories") updated.categories = [];
      if (type === "sizes") updated.sizes = [];
      if (type === "colors") updated.colors = [];
      if (type === "stock") updated.inStockOnly = false;
      setFilters(updated);
    },
    [filters, setFilters]
  );

  const filtered = useMemo(() => {
    let list = [...allProducts];
    if (filters.categories.length > 0)
      list = list.filter((p) => filters.categories.includes(p.category));
    if (filters.sizes.length > 0)
      list = list.filter((p) => p.sizes.some((s) => filters.sizes.includes(s)));
    if (filters.colors.length > 0)
      list = list.filter((p) => p.colors.some((c) => filters.colors.includes(c.name)));
    if (filters.inStockOnly) list = list.filter((p) => p.inStock);
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
    }
    return list;
  }, [allProducts, filters, sort]);

  const activeCount =
    filters.categories.length +
    filters.sizes.length +
    filters.colors.length +
    (filters.inStockOnly ? 1 : 0) +
    (filters.priceRange[1] < priceMax ? 1 : 0);

  return (
    <div className="pt-24 lg:pt-28">
      <div className="container-px py-8 border-b border-stone">
        <p className="text-[10px] font-semibold tracking-[0.25em] uppercase text-forest mb-1">
          Browse
        </p>
        <h1 className="font-serif text-4xl lg:text-5xl text-ink">All Products</h1>
        <p className="text-sm text-muted mt-2">
          {filtered.length} {filtered.length === 1 ? "product" : "products"}
          {activeCount > 0 && (
            <span className="text-muted/70">
              {" "}· {activeCount} filter{activeCount > 1 ? "s" : ""} active
            </span>
          )}
        </p>
      </div>

      <div className="container-px py-8">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="lg:hidden flex items-center gap-2 text-sm border border-stone px-3 py-2 text-ink hover:border-ink transition-colors"
          >
            <SlidersHorizontal size={14} />
            Filters
            {activeCount > 0 && (
              <span className="bg-forest text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full leading-none">
                {activeCount}
              </span>
            )}
          </button>
          <div className="ml-auto">
            <SortDropdown value={sort} onChange={setSort} />
          </div>
        </div>

        <div className="flex gap-10">
          <div className="hidden lg:block">
            <FilterSidebar
              filters={filters}
              onChange={setFilters}
              onReset={resetFilters}
              availableCategories={availableCategories}
              availableSizes={availableSizes}
              availableColors={availableColors}
              priceMax={priceMax}
            />
          </div>

          <div className="flex-1 min-w-0">
            {filtered.length === 0 ? (
              <EmptyState filters={filters} onReset={resetFilters} onClearType={clearType} />
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
              className="fixed top-0 left-0 bottom-0 w-[min(288px,85vw)] bg-cream z-50 overflow-y-auto p-6 lg:hidden"
            >
              <div className="flex items-center justify-between mb-6">
                <p className="font-medium text-sm">Filters</p>
                <button onClick={() => setMobileFiltersOpen(false)} aria-label="Close filters">
                  <X size={18} />
                </button>
              </div>
              <FilterSidebar
                filters={filters}
                onChange={(f) => {
                  setFilters(f);
                }}
                onReset={() => {
                  resetFilters();
                  setMobileFiltersOpen(false);
                }}
                availableCategories={availableCategories}
                availableSizes={availableSizes}
                availableColors={availableColors}
                priceMax={priceMax}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ShopClient({ allProducts }: { allProducts: Product[] }) {
  return (
    <Suspense fallback={<div className="pt-32 text-center text-muted text-sm">Loading…</div>}>
      <ShopInner allProducts={allProducts} />
    </Suspense>
  );
}
