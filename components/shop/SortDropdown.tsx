"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { SortOption } from "@/lib/types";
import { cn } from "@/lib/utils";

const options: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "best-selling", label: "Best Selling" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating", label: "Top Rated" },
];

interface SortDropdownProps {
  value: SortOption;
  onChange: (val: SortOption) => void;
}

export default function SortDropdown({ value, onChange }: SortDropdownProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-2 text-sm text-ink border border-stone px-3 py-2 hover:border-ink transition-colors"
      >
        <span className="text-muted text-xs">Sort:</span>
        {selected?.label}
        <ChevronDown
          size={14}
          className={cn("text-muted transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 w-48 bg-cream border border-stone shadow-lg z-20" role="listbox">
            {options.map((opt) => (
              <button
                key={opt.value}
                role="option"
                aria-selected={opt.value === value}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={cn(
                  "w-full text-left px-4 py-2.5 text-sm transition-colors",
                  opt.value === value
                    ? "text-forest font-medium bg-forest-muted"
                    : "text-ink hover:bg-stone/50"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
