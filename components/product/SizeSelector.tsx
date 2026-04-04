"use client";

import { cn } from "@/lib/utils";

interface SizeSelectorProps {
  sizes: string[];
  selected: string;
  onSelect: (size: string) => void;
  onGuideOpen: () => void;
}

export default function SizeSelector({
  sizes,
  selected,
  onSelect,
  onGuideOpen,
}: SizeSelectorProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <label className="label-base">Size</label>
        <button
          onClick={onGuideOpen}
          className="text-xs text-forest underline underline-offset-2 hover:text-forest-dark transition-colors"
        >
          Size Guide
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {sizes.map((size) => (
          <button
            key={size}
            onClick={() => onSelect(size)}
            className={cn(
              "px-3 py-2 text-sm border transition-all duration-150 min-w-[44px] text-center",
              selected === size
                ? "bg-ink text-white border-ink"
                : "border-stone text-ink hover:border-ink"
            )}
          >
            {size}
          </button>
        ))}
      </div>
      {!selected && (
        <p className="text-xs text-danger mt-2">Please select a size</p>
      )}
    </div>
  );
}
