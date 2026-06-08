"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";
import {
  ORDER_STATUSES,
  ORDER_STATUS_STYLES,
  normalizeOrderStatus,
  orderStatusLabel,
} from "@/lib/orderStatus";
import { formatPrice } from "@/lib/utils";
import OrderStatusControl from "./OrderStatusControl";

interface OrderItem {
  id: string;
  product_name: string;
  variant_name: string | null;
  quantity: number;
  unit_price: number;
}

interface Payment {
  status: string;
  mpesa_receipt: string | null;
  mpesa_phone: string | null;
  mpesa_amount: number | null;
  checkout_request_id: string | null;
  merchant_request_id: string | null;
}

interface Order {
  id: string;
  status: string;
  payment_status: string;
  total: number;
  shipping_name: string;
  shipping_line1: string;
  shipping_city: string;
  shipping_state: string | null;
  shipping_country: string;
  shipping_phone: string;
  email: string;
  tracking_number: string | null;
  shipping_method: string;
  created_at: string;
  payments: Payment[];
  order_items: OrderItem[];
}

const ALL_STATUSES = ["all", ...ORDER_STATUSES];

export default function OrdersClient({ orders }: { orders: Order[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const visible = useMemo(() => {
    let list = orders;
    if (statusFilter !== "all") {
      list = list.filter((order) => normalizeOrderStatus(order.status) === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((order) => {
        const payment = order.payments?.[0];
        return (
          order.id.toLowerCase().includes(q) ||
          order.shipping_name.toLowerCase().includes(q) ||
          order.email.toLowerCase().includes(q) ||
          order.shipping_phone.toLowerCase().includes(q) ||
          (order.tracking_number ?? "").toLowerCase().includes(q) ||
          (payment?.mpesa_receipt ?? "").toLowerCase().includes(q)
        );
      });
    }
    return list;
  }, [orders, search, statusFilter]);

  const countByStatus = (status: string) =>
    orders.filter((order) => normalizeOrderStatus(order.status) === status).length;

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-56">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone, receipt, order ID, tracking..."
            className="w-full text-xs border border-stone bg-cream pl-7 pr-7 py-2 text-ink outline-none focus:border-ink placeholder:text-muted"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-ink"
            >
              <X size={12} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {ALL_STATUSES.map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`text-[11px] px-2.5 py-1 border transition-colors ${
                statusFilter === status
                  ? "bg-ink text-cream border-ink"
                  : "border-stone text-muted hover:border-ink hover:text-ink"
              }`}
            >
              {status === "all"
                ? `All (${orders.length})`
                : `${orderStatusLabel(status)} (${countByStatus(status)})`}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="bg-cream rounded py-16 text-center text-sm text-muted">
          No orders match your filters.
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((order) => {
            const status = normalizeOrderStatus(order.status);
            const payment = order.payments?.[0];
            const firstItem = order.order_items?.[0];

            return (
              <div key={order.id} className="bg-cream rounded overflow-hidden">
                <div className="flex items-start justify-between px-5 py-4 gap-5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="font-mono text-xs text-ink hover:text-citrine transition-colors underline-citrine"
                      >
                        {order.id.slice(0, 8).toUpperCase()}
                      </Link>
                      <span className={`inline-block text-[11px] px-2 py-0.5 rounded-sm font-medium ${ORDER_STATUS_STYLES[status]}`}>
                        {orderStatusLabel(status)}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-ink">{order.shipping_name}</p>
                    <p className="text-xs text-muted">{order.email} / {order.shipping_phone}</p>
                    <p className="text-xs text-muted">
                      {order.shipping_line1}, {order.shipping_city}
                      {order.shipping_state ? `, ${order.shipping_state}` : ""} / {order.shipping_method}
                    </p>
                    {firstItem && (
                      <p className="text-xs text-ink mt-2">
                        {firstItem.product_name}
                        {firstItem.variant_name ? ` / ${firstItem.variant_name}` : ""}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-medium text-ink">{formatPrice(order.total)}</p>
                    <p className="text-[11px] text-muted mt-0.5">
                      Payment: {payment?.status ?? order.payment_status}
                    </p>
                    {payment?.mpesa_receipt && (
                      <p className="text-[11px] font-mono text-forest mt-0.5">{payment.mpesa_receipt}</p>
                    )}
                    <p className="text-xs text-muted mt-0.5">
                      {new Date(order.created_at).toLocaleDateString("en-KE", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                <div className="px-5 pb-1 space-y-0.5">
                  {(order.order_items ?? []).map((item) => (
                    <p key={item.id} className="text-xs text-muted">
                      {item.quantity}x {item.product_name}
                      {item.variant_name ? ` / ${item.variant_name}` : ""}{" "}
                      <span className="text-muted/60">({formatPrice(item.unit_price)})</span>
                    </p>
                  ))}
                </div>

                <div className="px-5 py-3 border-t border-stone/50 mt-2">
                  <OrderStatusControl
                    orderId={order.id}
                    currentStatus={status}
                    currentTracking={order.tracking_number ?? ""}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
