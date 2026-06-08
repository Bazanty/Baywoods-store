"use client";

import { useState, useTransition, useMemo } from "react";
import Link from "next/link";
import { PackageX, Search, X } from "lucide-react";
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
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "draft" | "low-stock" | "out-of-stock">("all");

  const visible = useMemo(() => {
    let list = products;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) => p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q) || (p.categoryName ?? "").toLowerCase().includes(q)
      );
    }
    if (statusFilter === "active") list = list.filter((p) => p.isActive);
    if (statusFilter === "draft") list = list.filter((p) => !p.isActive);
    if (statusFilter === "low-stock") list = list.filter((p) => p.stock > 0 && p.stock <= 5);
    if (statusFilter === "out-of-stock") list = list.filter((p) => p.stock === 0);
    return list;
  }, [products, search, statusFilter]);

  const allSelected = selected.size === visible.length && visible.length > 0;
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
    else setSelected(new Set(visible.map((p) => p.id)));
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
      {/* Search + filter bar */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-stone flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, slug, category…"
            className="w-full text-xs border border-stone bg-cream pl-7 pr-7 py-2 text-ink outline-none focus:border-ink placeholder:text-muted"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-ink">
              <X size={12} />
            </button>
          )}
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="text-xs border border-stone bg-cream px-2.5 py-2 text-ink outline-none focus:border-ink"
        >
          <option value="all">All ({products.length})</option>
          <option value="active">Active ({products.filter(p => p.isActive).length})</option>
          <option value="draft">Draft ({products.filter(p => !p.isActive).length})</option>
          <option value="low-stock">Low stock ({products.filter(p => p.stock > 0 && p.stock <= 5).length})</option>
          <option value="out-of-stock">Out of stock ({products.filter(p => p.stock === 0).length})</option>
        </select>
        {(search || statusFilter !== "all") && (
          <span className="text-xs text-muted">{visible.length} result{visible.length !== 1 ? "s" : ""}</span>
        )}
      </div>

      {someSelected && (
        <div className="flex items-center gap-3 px-5 py-2.5 bg-stone/30 border-b border-stone">
          <span className="text-xs text-muted">{selected.size} selected</span>
          <button
            onClick={handleBulkPublish}
            disabled={isPending}
            className="text-xs bg-ink text-cream px-3 py-1 hover:bg-forest-dark transition-colors disabled:opacity-50"
          >
            Publish
          </button>
          <button
            onClick={handleBulkDraft}
            disabled={isPending}
            className="text-xs border border-ink text-ink px-3 py-1 hover:bg-ink hover:text-cream transition-colors disabled:opacity-50"
          >
            Draft
          </button>
          <button
            onClick={handleBulkDelete}
            disabled={isPending}
            className="text-xs text-danger border border-danger/40 px-3 py-1 hover:bg-danger hover:text-cream transition-colors disabled:opacity-50"
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
          {visible.length === 0 && (
            <tr>
              <td colSpan={8} className="px-5 py-12 text-center text-sm text-muted">
                No products match your search.
              </td>
            </tr>
          )}
          {visible.map((p, i) => (
            <tr
              key={p.id}
              className={`hover:bg-stone/20 transition-colors ${
                i < visible.length - 1 ? "border-b border-stone/50" : ""
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
