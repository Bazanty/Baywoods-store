"use client";

import { useState, useTransition } from "react";
import { Check, Plus, Minus } from "lucide-react";
import { restockInventory } from "@/app/admin/actions";

interface Row {
  id: string;
  productId: string;
  variantId?: string | null;
  variantName?: string | null;
  productName: string;
  quantity: number;
  reserved: number;
  available: number;
}

export default function RestockRow({ row }: { row: Row }) {
  const [delta, setDelta] = useState(0);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  const apply = () => {
    if (delta === 0) return;
    startTransition(async () => {
      await restockInventory(row.id, delta);
      setDelta(0);
      setSaved(true);
      setTimeout(() => setSaved(false), 1600);
    });
  };

  const tone =
    row.available <= 0 ? "text-danger" : row.available <= 5 ? "text-amber-600" : "text-ink";

  return (
    <tr className="border-b border-stone/60 hover:bg-cream/40">
      <td className="px-5 py-3 text-ink">
        {row.productName}
        {row.variantName && (
          <span className="block font-mono text-[10px] tracking-[0.14em] uppercase text-muted">
            {row.variantName}
          </span>
        )}
      </td>
      <td className="px-5 py-3 text-right tabular-nums">{row.quantity}</td>
      <td className="px-5 py-3 text-right tabular-nums text-muted">{row.reserved}</td>
      <td className={`px-5 py-3 text-right tabular-nums font-medium ${tone}`}>
        {row.available}
      </td>
      <td className="px-5 py-3">
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setDelta((d) => d - 1)}
            className="w-7 h-7 border border-stone hover:bg-cream flex items-center justify-center"
          >
            <Minus size={12} />
          </button>
          <input
            type="number"
            value={delta}
            onChange={(e) => setDelta(Number(e.target.value) || 0)}
            className="w-14 h-7 border border-stone text-center tabular-nums text-sm"
          />
          <button
            type="button"
            onClick={() => setDelta((d) => d + 1)}
            className="w-7 h-7 border border-stone hover:bg-cream flex items-center justify-center"
          >
            <Plus size={12} />
          </button>
          <button
            type="button"
            onClick={apply}
            disabled={isPending || delta === 0}
            className="ml-2 px-3 h-7 bg-ink text-cream text-xs disabled:opacity-40 flex items-center gap-1"
          >
            {saved ? <Check size={12} /> : isPending ? "…" : "Apply"}
          </button>
        </div>
      </td>
    </tr>
  );
}
