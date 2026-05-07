"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { PackageX, Pencil } from "lucide-react";
import { bulkToggleProducts, bulkDeleteProducts } from "../actions";
import ProductRowActions from "@/components/admin/ProductRowActions";
import { formatPrice } from "@/lib/utils";

interface ProductRow {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  comparePrice: number | null;
  isActive: boolean;
  categoryName: string | null;
  thumb: string | null;
  stock: number;
}

export default function BulkActions({ products }: { products: ProductRow[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  const allSelected = selected.size === products.length && products.length > 0;
  const someSelected = selected.size > 0;

  const toggle = (id: string) => {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(products.map((p) => p.id)));
  };

  const ids = Array.from(selected);

  const handleBulkPublish = () => startTransition(async () => {
    await bulkToggleProducts(ids, true);
    setSelected(new Set());
  });

  const handleBulkDraft = () => startTransition(async () => {
    await bulkToggleProducts(ids, false);
    setSelected(new Set());
  });

  const handleBulkDelete = () => {
    if (!confirm(`Delete ${ids.length} product(s)? This cannot be undone.`)) return;
    startTransition(async () => {
      await bulkDeleteProducts(ids);
      setSelected(new Set());
    });
  };

  return (
    <>
      {someSelected && (
        <div className="flex items-center gap-3 px-5 py-2.5 bg-stone/30 border-b border-stone">
          <span className="text-xs text-muted">{selected.size} selected</span>
          <button
            onClick={handleBulkPublish}
            disabled={isPending}
            className="text-xs bg-forest text-white px-3 py-1 hover:bg-forest-dark transition-colors disabled:opacity-50"
          >
            Publish
          </button>
          <button
            onClick={handleBulkDraft}
            disabled={isPending}
            className="text-xs border border-ink text-ink px-3 py-1 hover:bg-ink hover:text-white transition-colors disabled:opacity-50"
          >
            Draft
          </button>
          <button
            onClick={handleBulkDelete}
            disabled={isPending}
            className="text-xs text-danger border border-danger/40 px-3 py-1 hover:bg-danger hover:text-white transition-colors disabled:opacity-50"
          >
            Delete
          </button>
        </div>
      )}

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-stone text-left">
            <th className="pl-5 pr-2 py-3.5 w-8">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                className="accent-forest"
              />
            </th>
            <th className="px-4 py-3.5 text-xs font-medium text-muted tracking-wider uppercase w-12" />
            <th className="px-4 py-3.5 text-xs font-medium text-muted tracking-wider uppercase">Product</th>
            <th className="px-4 py-3.5 text-xs font-medium text-muted tracking-wider uppercase">Category</th>
            <th className="px-4 py-3.5 text-xs font-medium text-muted tracking-wider uppercase text-right">Price</th>
            <th className="px-4 py-3.5 text-xs font-medium text-muted tracking-wider uppercase text-right">Stock</th>
            <th className="px-4 py-3.5 text-xs font-medium text-muted tracking-wider uppercase">Status</th>
            <th className="px-4 py-3.5" />
          </tr>
        </thead>
        <tbody>
          {products.map((p, i) => (
            <tr
              key={p.id}
              className={`hover:bg-stone/20 transition-colors ${
                i < products.length - 1 ? "border-b border-stone/50" : ""
              } ${selected.has(p.id) ? "bg-forest/[0.03]" : ""}`}
            >
              <td className="pl-5 pr-2 py-3">
                <input
                  type="checkbox"
                  checked={selected.has(p.id)}
                  onChange={() => toggle(p.id)}
                  className="accent-forest"
                />
              </td>
              <td className="px-4 py-3">
                {p.thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.thumb} alt={p.name} className="w-10 h-10 object-cover rounded bg-stone-light" />
                ) : (
                  <div className="w-10 h-10 bg-stone-light rounded flex items-center justify-center">
                    <PackageX size={14} className="text-muted" />
                  </div>
                )}
              </td>
              <td className="px-4 py-3">
                <p className="font-medium text-ink">{p.name}</p>
                <p className="text-xs text-muted font-mono">{p.slug}</p>
              </td>
              <td className="px-4 py-3 text-muted capitalize">{p.categoryName ?? "—"}</td>
              <td className="px-4 py-3 text-right">
                <span className="font-medium text-ink">{formatPrice(p.basePrice)}</span>
                {p.comparePrice && (
                  <span className="block text-xs text-muted line-through">{formatPrice(p.comparePrice)}</span>
                )}
              </td>
              <td className="px-4 py-3 text-right">
                <span className={
                  p.stock === 0 ? "text-danger font-medium" :
                  p.stock <= 5 ? "text-amber-600 font-medium" : "text-ink"
                }>
                  {p.stock}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className={`inline-block text-[11px] px-2 py-0.5 rounded-sm font-medium ${
                  p.isActive ? "bg-forest/10 text-forest" : "bg-stone-light text-muted"
                }`}>
                  {p.isActive ? "Active" : "Draft"}
                </span>
              </td>
              <td className="px-4 py-3">
                <ProductRowActions productId={p.id} isActive={p.isActive} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
