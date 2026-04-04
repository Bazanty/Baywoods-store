"use client";

import { useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Category, FilterState } from "@/lib/types";

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

const SIZES = ["XS", "S", "M", "L", "XL", "XXL", "28", "30", "32", "34", "36", "38", "39", "40", "41", "42", "43", "44", "45", "One Size"];

interface FilterSidebarProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  onReset: () => void;
}

function FilterGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-b border-stone py-4">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-sm font-medium text-ink mb-0"
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

export default function FilterSidebar({ filters, onChange, onReset }: FilterSidebarProps) {
  const activeCount =
    filters.categories.length +
    filters.sizes.length +
    (filters.inStockOnly ? 1 : 0) +
    (filters.priceRange[0] > 0 || filters.priceRange[1] < 15000 ? 1 : 0);

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

      <FilterGroup title="Category">
        <div className="space-y-2.5">
          {ALL_CATEGORIES.map(({ value, label }) => (
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

      <FilterGroup title="Size">
        <div className="flex flex-wrap gap-1.5">
          {SIZES.map((size) => (
            <button
              key={size}
              onClick={() => toggleSize(size)}
              className={cn(
                "px-2.5 py-1 text-xs border transition-colors duration-150",
                filters.sizes.includes(size)
                  ? "bg-ink text-white border-ink"
                  : "border-stone text-ink hover:border-ink"
              )}
            >
              {size}
            </button>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Price">
        <div className="space-y-3">
          <input
            type="range"
            min={0}
            max={15000}
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
