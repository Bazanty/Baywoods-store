"use client";

import { useState, useMemo } from "react";
import { Search, X } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface Customer {
  email: string;
  userId: string | null;
  name: string;
  orderCount: number;
  totalSpent: number;
  lastOrderAt: string;
}

export default function CustomersClient({ customers }: { customers: Customer[] }) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"spent" | "orders" | "recent">("recent");

  const visible = useMemo(() => {
    let list = [...customers];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          (c.email ?? "").toLowerCase().includes(q)
      );
    }

    if (sort === "spent") list.sort((a, b) => b.totalSpent - a.totalSpent);
    else if (sort === "orders") list.sort((a, b) => b.orderCount - a.orderCount);
    else list.sort((a, b) => new Date(b.lastOrderAt).getTime() - new Date(a.lastOrderAt).getTime());

    return list;
  }, [customers, search, sort]);

  const totalRevenue = customers.reduce((s, c) => s + c.totalSpent, 0);

  return (
    <>
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total customers", value: customers.length },
          { label: "Total revenue", value: formatPrice(totalRevenue) },
          { label: "Avg. order value", value: customers.length > 0 ? formatPrice(totalRevenue / customers.reduce((s, c) => s + c.orderCount, 0) || 0) : "—" },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded p-4">
            <p className="text-xs text-muted uppercase tracking-wider mb-1">{label}</p>
            <p className="font-serif text-xl text-ink">{value}</p>
          </div>
        ))}
      </div>

      {/* Search + sort */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-56">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            className="w-full text-xs border border-stone bg-white pl-7 pr-7 py-2 text-ink outline-none focus:border-ink placeholder:text-muted"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-ink">
              <X size={12} />
            </button>
          )}
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as typeof sort)}
          className="text-xs border border-stone bg-white px-2.5 py-2 text-ink outline-none focus:border-ink"
        >
          <option value="recent">Sort: Most recent</option>
          <option value="spent">Sort: Highest spend</option>
          <option value="orders">Sort: Most orders</option>
        </select>
        {search && (
          <span className="text-xs text-muted">{visible.length} result{visible.length !== 1 ? "s" : ""}</span>
        )}
      </div>

      {/* Table */}
      <div className="border border-stone bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-cream border-b border-stone">
            <tr className="text-left text-xs uppercase tracking-wider text-muted">
              <th className="px-5 py-3">Name</th>
              <th className="px-5 py-3">Email</th>
              <th className="px-5 py-3 text-right">Orders</th>
              <th className="px-5 py-3 text-right">Total spent</th>
              <th className="px-5 py-3">Last order</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-sm text-muted">
                  No customers match your search.
                </td>
              </tr>
            )}
            {visible.map((c) => (
              <tr key={c.email || c.userId} className="border-b border-stone/60 hover:bg-cream/40">
                <td className="px-5 py-3 text-ink">{c.name || "—"}</td>
                <td className="px-5 py-3">
                  <a href={`mailto:${c.email}`} className="text-muted hover:text-forest transition-colors text-xs">
                    {c.email || "guest"}
                  </a>
                </td>
                <td className="px-5 py-3 text-right tabular-nums">{c.orderCount}</td>
                <td className="px-5 py-3 text-right tabular-nums text-ink font-medium">
                  {formatPrice(c.totalSpent)}
                </td>
                <td className="px-5 py-3 text-muted text-xs">
                  {new Date(c.lastOrderAt).toLocaleDateString("en-KE", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
