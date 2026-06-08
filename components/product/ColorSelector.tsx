"use client";

import { ProductColor } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ColorSelectorProps {
  colors: ProductColor[];
  selected: ProductColor;
  onSelect: (color: ProductColor) => void;
}

export default function ColorSelector({ colors, selected, onSelect }: ColorSelectorProps) {
  return (
    <div>
      <div className="flex items-baseline gap-3 mb-3">
        <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-muted">
          <span className="text-ink">01</span> / Colour
        </p>
        <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink">
          {selected.name}
        </span>
      </div>
      <div className="flex gap-1.5">
        {colors.map((color) => {
          const active = selected.name === color.name;
          return (
            <button
              key={color.name}
              onClick={() => onSelect(color)}
              title={color.name}
              className={cn(
                "w-9 h-9 transition-all duration-150 relative border",
                active
                  ? "border-ink ring-1 ring-ink ring-offset-2 ring-offset-cream"
                  : "border-ink/25 hover:border-ink"
              )}
              style={{ backgroundColor: color.hex }}
            >
              {color.name === "White" || color.hex === "#FFFFFF" ? (
                <span className="absolute inset-0 border border-ink/15" />
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
