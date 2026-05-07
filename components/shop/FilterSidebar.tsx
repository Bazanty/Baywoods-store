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
  availableSizes?: string[];
  availableColors?: { name: string; hex: string }[];
  priceMax?: number;
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-b border-stone py-4">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-sm font-medium text-ink"
      >
        {title}
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
    <div className="mb-3">
      <p className="text-[10px] font-semibold tracking-widest uppercase text-muted mb-2">{label}</p>
      <div className="flex flex-wrap gap-1.5">
        {sizes.map((size) => (
          <button
            key={size}
            onClick={() => onToggle(size)}
            className={cn(
              "px-2.5 py-1 text-xs border transition-colors duration-150",
              selected.includes(size)
                ? "bg-ink text-white border-ink"
                : "border-stone text-ink hover:border-ink"
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

  const activeCount =
    (showCategories ? filters.categories.length : 0) +
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
    <aside className="w-56 shrink-0">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold tracking-widest uppercase text-ink">Filters</p>
        {activeCount > 0 && (
          <button
            onClick={onReset}
            className="flex items-center gap-1 text-xs text-muted hover:text-danger transition-colors"
          >
            <X size={12} /> Clear ({activeCount})
          </button>
        )}
      </div>

      {showCategories && categories.length > 0 && (
        <FilterGroup title="Category">
          <div className="space-y-2.5">
            {categories.map(({ value, label }) => (
              <label key={value} className="flex items-center gap-2.5 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={filters.categories.includes(value)}
                  onChange={() => toggleCategory(value)}
                  className="w-3.5 h-3.5 accent-forest cursor-pointer"
                />
                <span className="text-sm text-ink/70 group-hover:text-ink transition-colors">
                  {label}
                </span>
              </label>
            ))}
          </div>
        </FilterGroup>
      )}

      {allSizes.length > 0 && (
        <FilterGroup title="Size">
          <SizeGroup label="Clothing" sizes={clothing} selected={filters.sizes} onToggle={toggleSize} />
          <SizeGroup label="Bottoms" sizes={waist} selected={filters.sizes} onToggle={toggleSize} />
          <SizeGroup label="Shoes (EU)" sizes={shoes} selected={filters.sizes} onToggle={toggleSize} />
          <SizeGroup label="Other" sizes={other} selected={filters.sizes} onToggle={toggleSize} />
        </FilterGroup>
      )}

      {colors.length > 0 && (
        <FilterGroup title="Color">
          <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
            {colors.map(({ name, hex }) => (
              <label key={name} className="flex items-center gap-2 cursor-pointer group">
                <span
                  className={cn(
                    "w-4 h-4 rounded-full border-2 shrink-0 transition-all",
                    filters.colors.includes(name)
                      ? "border-ink scale-110"
                      : "border-transparent ring-1 ring-stone group-hover:ring-ink"
                  )}
                  style={{ backgroundColor: hex }}
                />
                <span className="text-xs text-ink/70 group-hover:text-ink transition-colors truncate">
                  {name}
                </span>
              </label>
            ))}
          </div>
        </FilterGroup>
      )}

      <FilterGroup title="Price">
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
            className="w-full accent-forest"
          />
          <div className="flex justify-between text-xs text-muted">
            <span>KSh 0</span>
            <span>KSh {filters.priceRange[1].toLocaleString()}</span>
          </div>
        </div>
      </FilterGroup>

      <FilterGroup title="Availability">
        <label className="flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={filters.inStockOnly}
            onChange={(e) => onChange({ ...filters, inStockOnly: e.target.checked })}
            className="w-3.5 h-3.5 accent-forest"
          />
          <span className="text-sm text-ink/70">In Stock Only</span>
        </label>
      </FilterGroup>
    </aside>
  );
}
