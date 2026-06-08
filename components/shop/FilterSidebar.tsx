"use client";

import { useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Category, FilterState } from "@/lib/types";

const CLOTHING_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "One Size"];
const WAIST_SIZES = ["28", "30", "32", "34", "36", "38"];
const SHOE_SIZES = ["39", "40", "41", "42", "43", "44", "45"];

const ALL_CATEGORIES: { value: Category; label: string }[] = [
  { value: "shoes", label: "Shoes" },
  { value: "hoodies", label: "Hoodies" },
  { value: "jorts", label: "Jorts" },
  { value: "joggers", label: "Joggers" },
  { value: "sweatpants", label: "Sweatpants" },
  { value: "shirts", label: "Shirts" },
  { value: "caps", label: "Caps" },
  { value: "belts", label: "Belts" },
  { value: "accessories", label: "Accessories" },
];

interface FilterSidebarProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  onReset: () => void;
  showCategories?: boolean;
  availableCategories?: Category[];
  availableBrands?: string[];
  availableSizes?: string[];
  availableColors?: { name: string; hex: string }[];
  priceMax?: number;
}

function FilterGroup({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-b border-ink/15 py-5">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-ink group"
      >
        <span className="flex items-baseline gap-2">
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted">{n}</span>
          <span className="font-display text-base tracking-[-0.01em]">{title}</span>
        </span>
        <ChevronDown
          size={14}
          className={cn("text-muted transition-transform duration-200", open && "rotate-180")}
        />
      </button>
      {open && <div className="mt-4">{children}</div>}
    </div>
  );
}

function SizeGroup({ label, sizes, selected, onToggle }: {
  label: string;
  sizes: string[];
  selected: string[];
  onToggle: (s: string) => void;
}) {
  if (sizes.length === 0) return null;
  return (
    <div className="mb-4 last:mb-0">
      <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-muted mb-2">/ {label}</p>
      <div className="flex flex-wrap gap-1">
        {sizes.map((size) => (
          <button
            key={size}
            onClick={() => onToggle(size)}
            className={cn(
              "min-w-[2.25rem] px-2 py-1.5 font-mono text-[10px] tracking-[0.12em] uppercase border transition-colors duration-150",
              selected.includes(size)
                ? "bg-ink text-citrine border-ink"
                : "border-ink/25 text-ink hover:border-ink"
            )}
          >
            {size}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function FilterSidebar({
  filters,
  onChange,
  onReset,
  showCategories = true,
  availableCategories,
  availableBrands,
  availableSizes,
  availableColors,
  priceMax = 15000,
}: FilterSidebarProps) {
  const categories = availableCategories
    ? ALL_CATEGORIES.filter((c) => availableCategories.includes(c.value))
    : ALL_CATEGORIES;

  const allSizes = availableSizes ?? [
    ...CLOTHING_SIZES, ...WAIST_SIZES, ...SHOE_SIZES,
  ];

  const clothing = allSizes.filter((s) => CLOTHING_SIZES.includes(s));
  const waist = allSizes.filter((s) => WAIST_SIZES.includes(s)).sort((a, b) => +a - +b);
  const shoes = allSizes.filter((s) => SHOE_SIZES.includes(s)).sort((a, b) => +a - +b);
  const other = allSizes.filter(
    (s) => !CLOTHING_SIZES.includes(s) && !WAIST_SIZES.includes(s) && !SHOE_SIZES.includes(s)
  );

  const colors = availableColors ?? [];
  const brands = availableBrands ?? [];

  const activeCount =
    (showCategories ? filters.categories.length : 0) +
    filters.brands.length +
    filters.sizes.length +
    filters.colors.length +
    (filters.inStockOnly ? 1 : 0) +
    (filters.priceRange[1] < priceMax ? 1 : 0);

  const toggleCategory = (cat: Category) => {
    const exists = filters.categories.includes(cat);
    onChange({
      ...filters,
      categories: exists
        ? filters.categories.filter((c) => c !== cat)
        : [...filters.categories, cat],
    });
  };

  const toggleBrand = (brand: string) => {
    const exists = filters.brands.includes(brand);
    onChange({
      ...filters,
      brands: exists
        ? filters.brands.filter((b) => b !== brand)
        : [...filters.brands, brand],
    });
  };

  const toggleSize = (size: string) => {
    const exists = filters.sizes.includes(size);
    onChange({
      ...filters,
      sizes: exists ? filters.sizes.filter((s) => s !== size) : [...filters.sizes, size],
    });
  };

  const toggleColor = (color: string) => {
    const exists = filters.colors.includes(color);
    onChange({
      ...filters,
      colors: exists ? filters.colors.filter((c) => c !== color) : [...filters.colors, color],
    });
  };

  return (
    <aside className="w-60 shrink-0">
      <div className="flex items-baseline justify-between mb-1 border-b border-ink pb-2">
        <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink">/ Filters</p>
        {activeCount > 0 && (
          <button
            onClick={onReset}
            className="flex items-center gap-1 font-mono text-[10px] tracking-[0.16em] uppercase text-muted hover:text-ink transition-colors"
          >
            <X size={10} /> Clear ({activeCount})
          </button>
        )}
      </div>

      {showCategories && categories.length > 0 && (
        <FilterGroup n="01" title="Category">
          <div className="space-y-2">
            {categories.map(({ value, label }) => {
              const active = filters.categories.includes(value);
              return (
                <label
                  key={value}
                  className={cn(
                    "flex items-center justify-between cursor-pointer group py-0.5",
                  )}
                >
                  <span className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={() => toggleCategory(value)}
                      className="appearance-none w-3 h-3 border border-ink/40 checked:bg-ink checked:border-ink cursor-pointer"
                    />
                    <span className={cn("text-sm transition-colors", active ? "text-ink" : "text-ink/70 group-hover:text-ink")}>
                      {label}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </FilterGroup>
      )}

      {brands.length > 0 && (
        <FilterGroup n="02" title="Brand">
          <div className="space-y-2">
            {brands.map((brand) => {
              const active = filters.brands.includes(brand);
              return (
                <label
                  key={brand}
                  className="flex items-center justify-between cursor-pointer group py-0.5"
                >
                  <span className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={() => toggleBrand(brand)}
                      className="appearance-none w-3 h-3 border border-ink/40 checked:bg-ink checked:border-ink cursor-pointer"
                    />
                    <span className={cn("text-sm transition-colors", active ? "text-ink" : "text-ink/70 group-hover:text-ink")}>
                      {brand}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        </FilterGroup>
      )}

      {allSizes.length > 0 && (
        <FilterGroup n="03" title="Size">
          <SizeGroup label="Clothing" sizes={clothing} selected={filters.sizes} onToggle={toggleSize} />
          <SizeGroup label="Bottoms" sizes={waist} selected={filters.sizes} onToggle={toggleSize} />
          <SizeGroup label="Shoes (EU)" sizes={shoes} selected={filters.sizes} onToggle={toggleSize} />
          <SizeGroup label="Other" sizes={other} selected={filters.sizes} onToggle={toggleSize} />
        </FilterGroup>
      )}

      {colors.length > 0 && (
        <FilterGroup n="04" title="Color">
          <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
            {colors.map(({ name, hex }) => {
              const active = filters.colors.includes(name);
              return (
                <label key={name} className="flex items-center gap-2 cursor-pointer group">
                  <button
                    type="button"
                    onClick={() => toggleColor(name)}
                    className={cn(
                      "w-4 h-4 shrink-0 transition-all border",
                      active ? "border-ink ring-1 ring-ink ring-offset-2 ring-offset-cream" : "border-ink/30 group-hover:border-ink"
                    )}
                    style={{ backgroundColor: hex }}
                    aria-pressed={active}
                  />
                  <span className={cn("text-xs transition-colors truncate", active ? "text-ink" : "text-ink/70 group-hover:text-ink")}>
                    {name}
                  </span>
                </label>
              );
            })}
          </div>
        </FilterGroup>
      )}

      <FilterGroup n="05" title="Price">
        <div className="space-y-3">
          <input
            type="range"
            min={0}
            max={priceMax}
            step={500}
            value={filters.priceRange[1]}
            onChange={(e) =>
              onChange({
                ...filters,
                priceRange: [filters.priceRange[0], Number(e.target.value)],
              })
            }
            className="w-full accent-ink"
          />
          <div className="flex justify-between font-mono text-[10px] tracking-[0.14em] uppercase text-muted">
            <span>KSh 0</span>
            <span className="text-ink">KSh {filters.priceRange[1].toLocaleString()}</span>
          </div>
        </div>
      </FilterGroup>

      <FilterGroup n="06" title="Availability">
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.inStockOnly}
            onChange={(e) => onChange({ ...filters, inStockOnly: e.target.checked })}
            className="appearance-none w-3 h-3 border border-ink/40 checked:bg-ink checked:border-ink cursor-pointer"
          />
          <span className="text-sm text-ink/70">In stock only</span>
        </label>
      </FilterGroup>
    </aside>
  );
}
