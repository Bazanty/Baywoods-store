"use client";

import { useMemo, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Category, FilterState, Product, SortOption } from "@/lib/types";
import FilterSidebar from "@/components/shop/FilterSidebar";
import ProductCard from "@/components/shop/ProductCard";
import SortDropdown from "@/components/shop/SortDropdown";

const VALID_SORTS: SortOption[] = ["newest", "price-asc", "price-desc", "best-selling", "rating"];

function parseFilters(
  params: ReturnType<typeof useSearchParams>,
  priceMax: number
): FilterState {
  return {
    categories: [],
    brands: params?.getAll("brand") ?? [],
    sizes: params?.getAll("size") ?? [],
    colors: params?.getAll("color") ?? [],
    priceRange: [0, Number(params?.get("priceMax")) || priceMax],
    inStockOnly: params?.get("inStock") === "1",
  };
}

function buildParams(filters: FilterState, sort: SortOption, priceMax: number): string {
  const p = new URLSearchParams();
  if (sort !== "newest") p.set("sort", sort);
  filters.brands.forEach((b) => p.append("brand", b));
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
  onClearType: (type: "brands" | "sizes" | "colors" | "stock") => void;
}) {
  const chips: { label: string; type: "brands" | "sizes" | "colors" | "stock" }[] = [
    ...(filters.brands.length > 0
      ? [{ label: filters.brands.join(", "), type: "brands" as const }]
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
    <div className="py-20 text-center border-y border-ink/15">
      <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted mb-2">/ 404</p>
      <p className="font-display text-2xl tracking-[-0.02em] text-ink mb-2">Nothing matches.</p>
      <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-muted mb-6">
        Try dropping a filter
      </p>
      {chips.length > 0 && (
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {chips.map((chip) => (
            <button
              key={chip.type}
              onClick={() => onClearType(chip.type)}
              className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.16em] uppercase border border-ink/30 px-3 py-1.5 text-ink/70 hover:border-ink hover:text-ink transition-colors"
            >
              <X size={10} />
              {chip.label}
            </button>
          ))}
        </div>
      )}
      <button onClick={onReset} className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink hover:text-citrine underline-citrine">
        Clear all
      </button>
    </div>
  );
}

function CategoryInner({
  label,
  initialProducts,
}: {
  category: Category;
  label: string;
  initialProducts: Product[];
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const { availableBrands, availableSizes, availableColors, priceMax } = useMemo(() => {
    const brandSet = new Set<string>();
    const sizes = new Set<string>();
    const colorMap = new Map<string, string>();
    let max = 0;
    for (const p of initialProducts) {
      if (p.brand) brandSet.add(p.brand);
      p.sizes.forEach((s) => sizes.add(s));
      p.colors.forEach((c) => colorMap.set(c.name, c.hex));
      const price = p.salePrice ?? p.price;
      if (price > max) max = price;
    }
    return {
      availableBrands: Array.from(brandSet).sort((a, b) => a.localeCompare(b)),
      availableSizes: Array.from(sizes),
      availableColors: Array.from(colorMap.entries()).map(([name, hex]) => ({ name, hex })),
      priceMax: Math.ceil(max / 1000) * 1000 || 15000,
    };
  }, [initialProducts]);

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
    pushURL({ categories: [], brands: [], sizes: [], colors: [], priceRange: [0, priceMax], inStockOnly: false }, sort);
  }, [pushURL, sort, priceMax]);

  const clearType = useCallback(
    (type: "brands" | "sizes" | "colors" | "stock") => {
      const updated = { ...filters };
      if (type === "brands") updated.brands = [];
      if (type === "sizes") updated.sizes = [];
      if (type === "colors") updated.colors = [];
      if (type === "stock") updated.inStockOnly = false;
      setFilters(updated);
    },
    [filters, setFilters]
  );

  const sorted = useMemo(() => {
    let list = initialProducts.filter((p) => {
      const price = p.salePrice ?? p.price;
      return (
        (filters.brands.length === 0 || (p.brand != null && filters.brands.includes(p.brand))) &&
        (filters.sizes.length === 0 || p.sizes.some((s) => filters.sizes.includes(s))) &&
        (filters.colors.length === 0 || p.colors.some((c) => filters.colors.includes(c.name))) &&
        (!filters.inStockOnly || p.inStock) &&
        price >= filters.priceRange[0] &&
        price <= filters.priceRange[1]
      );
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
  }, [initialProducts, filters, sort]);

  const activeCount =
    filters.brands.length +
    filters.sizes.length +
    filters.colors.length +
    (filters.inStockOnly ? 1 : 0) +
    (filters.priceRange[1] < priceMax ? 1 : 0);

  return (
    <div className="pt-20 lg:pt-24">
      <div className="container-px py-10 border-b border-ink/15">
        <div className="flex items-baseline justify-between mb-4 font-mono text-[10px] tracking-[0.2em] uppercase text-muted">
          <span><span className="text-ink">/ SHOP</span> &nbsp; → &nbsp; {label.toUpperCase()}</span>
        </div>
        <h1 className="font-display font-medium tracking-[-0.025em] leading-[0.92] text-ink text-5xl sm:text-6xl lg:text-7xl capitalize">
          {label}.
        </h1>
        <div className="mt-4 flex items-baseline gap-6 font-mono text-[11px] tracking-[0.14em] uppercase">
          <span className="text-ink">{String(sorted.length).padStart(3, "0")} pieces</span>
          {activeCount > 0 && (
            <span className="text-muted">
              · {activeCount} filter{activeCount > 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

      <div className="container-px py-8">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="lg:hidden flex items-center gap-2 font-mono text-[10px] tracking-[0.18em] uppercase border border-ink/30 px-3 py-2.5 text-ink hover:border-ink transition-colors"
          >
            <SlidersHorizontal size={12} />
            Filters
            {activeCount > 0 && (
              <span className="bg-ink text-citrine font-mono text-[10px] w-4 h-4 flex items-center justify-center leading-none">
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
              showCategories={false}
              availableBrands={availableBrands}
              availableSizes={availableSizes}
              availableColors={availableColors}
              priceMax={priceMax}
            />
          </div>

          <div className="flex-1 min-w-0">
            {sorted.length === 0 ? (
              <EmptyState filters={filters} onReset={resetFilters} onClearType={clearType} />
            ) : (
              <motion.div
                layout
                className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-5"
              >
                <AnimatePresence>
                  {sorted.map((product) => (
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
              className="fixed top-0 left-0 bottom-0 w-[min(320px,90vw)] bg-cream z-50 overflow-y-auto p-6 lg:hidden border-r border-ink/20"
            >
              <div className="flex items-center justify-between mb-6 border-b border-ink pb-3">
                <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink">/ Filters</p>
                <button onClick={() => setMobileFiltersOpen(false)} aria-label="Close filters">
                  <X size={16} />
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
                showCategories={false}
                availableBrands={availableBrands}
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

export default function CategoryClient(props: {
  category: Category;
  label: string;
  initialProducts: Product[];
}) {
  return (
    <Suspense fallback={<div className="pt-32 text-center text-muted text-sm">Loading…</div>}>
      <CategoryInner {...props} />
    </Suspense>
  );
}
