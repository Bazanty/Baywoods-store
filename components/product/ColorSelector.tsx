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
      <div className="flex items-center gap-2 mb-3">
        <label className="label-base">Color</label>
        <span className="text-xs text-muted">{selected.name}</span>
      </div>
      <div className="flex gap-2.5">
        {colors.map((color) => (
          <button
            key={color.name}
            onClick={() => onSelect(color)}
            title={color.name}
            className={cn(
              "w-8 h-8 rounded-full border-2 transition-all duration-150 relative",
              selected.name === color.name
                ? "border-ink scale-110"
                : "border-transparent hover:border-stone"
            )}
            style={{ backgroundColor: color.hex }}
          >
            {color.name === "White" || color.hex === "#FFFFFF" ? (
              <span className="absolute inset-0 rounded-full border border-stone/40" />
            ) : null}
          </button>
        ))}
      </div>
    </div>
  );
}
