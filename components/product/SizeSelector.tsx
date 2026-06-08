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
      <div className="flex items-baseline justify-between mb-3">
        <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-muted">
          <span className="text-ink">02</span> / Size
        </p>
        <button
          onClick={onGuideOpen}
          className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink hover:text-citrine transition-colors"
        >
          Size guide →
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {sizes.map((size) => (
          <button
            key={size}
            onClick={() => onSelect(size)}
            className={cn(
              "min-w-[3rem] px-3 py-2.5 font-mono text-[11px] tracking-[0.12em] uppercase border transition-colors duration-150",
              selected === size
                ? "bg-ink text-citrine border-ink"
                : "border-ink/25 text-ink hover:border-ink"
            )}
          >
            {size}
          </button>
        ))}
      </div>
      {!selected && (
        <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-danger mt-3">
          / Pick a size to add
        </p>
      )}
    </div>
  );
}
