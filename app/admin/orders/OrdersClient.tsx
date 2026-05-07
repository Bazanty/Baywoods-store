"use client";

import { useState, useMemo } from "react";
import { Search, X } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import OrderStatusControl from "./OrderStatusControl";

const STATUS_STYLES: Record<string, string> = {
  pending:    "bg-amber-50 text-amber-700",
  confirmed:  "bg-blue-50 text-blue-700",
  processing: "bg-blue-50 text-blue-700",
  shipped:    "bg-purple-50 text-purple-700",
  delivered:  "bg-forest/10 text-forest",
  cancelled:  "bg-danger/10 text-danger",
  refunded:   "bg-stone-light text-muted",
};

interface OrderItem {
  id: string;
  product_name: string;
  variant_name: string | null;
  quantity: number;
  unit_price: number;
}

interface Order {
  id: string;
  status: string;
  total: number;
  shipping_name: string;
  shipping_city: string;
  shipping_country: string;
  shipping_phone: string;
  email: string;
  tracking_number: string | null;
  shipping_method: string;
  created_at: string;
  order_items: OrderItem[];
}

const ALL_STATUSES = ["all", "pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"];

export default function OrdersClient({ orders }: { orders: Order[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const visible = useMemo(() => {
    let list = orders;
    if (statusFilter !== "all") list = list.filter((o) => o.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (o) =>
          o.id.toLowerCase().includes(q) ||
          o.shipping_name.toLowerCase().includes(q) ||
          o.email.toLowerCase().includes(q) ||
          (o.tracking_number ?? "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [orders, search, statusFilter]);

  const countByStatus = (s: string) => orders.filter((o) => o.status === s).length;

  return (
    <>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-56">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, order ID, tracking…"
            className="w-full text-xs border border-stone bg-white pl-7 pr-7 py-2 text-ink outline-none focus:border-ink placeholder:text-muted"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-ink">
              <X size={12} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {ALL_STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`text-[11px] px-2.5 py-1 border capitalize transition-colors ${
                statusFilter === s
                  ? "bg-ink text-white border-ink"
                  : "border-stone text-muted hover:border-ink hover:text-ink"
              }`}
            >
              {s === "all" ? `All (${orders.length})` : `${s} (${countByStatus(s)})`}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="bg-white rounded py-16 text-center text-sm text-muted">
          No orders match your filters.
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((order) => (
            <div key={order.id} className="bg-white rounded overflow-hidden">
              <div className="flex items-start justify-between px-5 py-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-mono text-xs text-muted">
                      {order.id.slice(0, 8).toUpperCase()}
                    </span>
                    <span className={`inline-block text-[11px] px-2 py-0.5 rounded-sm capitalize font-medium ${STATUS_STYLES[order.status] ?? "bg-stone-light text-muted"}`}>
                      {order.status}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-ink">{order.shipping_name}</p>
                  <p className="text-xs text-muted">{order.email} · {order.shipping_phone}</p>
                  <p className="text-xs text-muted">{order.shipping_city}, {order.shipping_country} · {order.shipping_method}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-medium text-ink">{formatPrice(order.total)}</p>
                  <p className="text-xs text-muted mt-0.5">
                    {new Date(order.created_at).toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
              </div>

              <div className="px-5 pb-1 space-y-0.5">
                {(order.order_items ?? []).map((item) => (
                  <p key={item.id} className="text-xs text-muted">
                    {item.quantity}× {item.product_name}
                    {item.variant_name ? ` · ${item.variant_name}` : ""}{" "}
                    <span className="text-muted/60">({formatPrice(item.unit_price)})</span>
                  </p>
                ))}
              </div>

              <div className="px-5 py-3 border-t border-stone/50 mt-2">
                <OrderStatusControl
                  orderId={order.id}
                  currentStatus={order.status}
                  currentTracking={order.tracking_number ?? ""}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
