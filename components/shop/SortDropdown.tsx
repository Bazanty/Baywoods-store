"use client";

import { useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { SortOption } from "@/lib/types";
import { cn } from "@/lib/utils";

const options: { value: SortOption; label: string }[] = [
  { value: "newest", label: "Newest" },
  { value: "best-selling", label: "Best Selling" },
  { value: "price-asc", label: "Price ↑" },
  { value: "price-desc", label: "Price ↓" },
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
        className={cn(
          "flex items-center gap-2 font-mono text-[10px] tracking-[0.18em] uppercase text-ink border px-3 py-2.5 transition-colors",
          open ? "border-ink bg-ink text-cream" : "border-ink/30 hover:border-ink"
        )}
      >
        <span className={cn("transition-colors", open ? "text-citrine" : "text-muted")}>Sort /</span>
        {selected?.label}
        <ChevronDown size={12} className={cn("transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-full mt-1 w-52 bg-cream border border-ink z-20"
            role="listbox"
          >
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
                  "w-full text-left px-3 py-2.5 font-mono text-[11px] tracking-[0.14em] uppercase transition-colors flex items-center justify-between",
                  opt.value === value
                    ? "text-ink bg-citrine"
                    : "text-ink hover:bg-beige-dark"
                )}
              >
                {opt.label}
                {opt.value === value && <Check size={12} />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
