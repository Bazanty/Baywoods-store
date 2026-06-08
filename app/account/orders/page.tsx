"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, Package, Truck, MapPin, RefreshCw, Download, RotateCcw, ShoppingCart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getUserOrders, getProductBySlug } from "@/lib/supabase/queries";
import { useAuthStore } from "@/lib/authStore";
import { useCartStore } from "@/lib/store";
import { formatPrice } from "@/lib/utils";
import { Order } from "@/lib/types";
import { ORDER_STATUS_STYLES, normalizeOrderStatus, orderStatusLabel, type OrderStatus } from "@/lib/orderStatus";

const STATUS_STEPS: OrderStatus[] = ["PAID", "VERIFIED", "PACKED", "OUT_FOR_DELIVERY", "DELIVERED"];
const STATUS_LABELS: Record<string, string> = {
  PAID: "Paid",
  VERIFIED: "Verified",
  PACKED: "Packed",
  OUT_FOR_DELIVERY: "Out",
  DELIVERED: "Delivered",
};
const STATUS_ICONS = [Package, Check, RefreshCw, Truck, MapPin];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [returnMsg, setReturnMsg] = useState<Record<string, { type: "success" | "error"; text: string }>>({});
  const [returnOpen, setReturnOpen] = useState<string | null>(null);
  const [returnReason, setReturnReason] = useState<Record<string, string>>({});
  const [returnSubmitting, setReturnSubmitting] = useState<string | null>(null);
  const [reordering, setReordering] = useState<string | null>(null);
  const [reorderMsg, setReorderMsg] = useState<Record<string, { type: "success" | "error"; text: string }>>({});
  const { user } = useAuthStore();
  const { addItem } = useCartStore();
  const router = useRouter();

  const reorderItems = async (order: Order) => {
    setReordering(order.id);
    setReorderMsg((m) => {
      const { [order.id]: _omit, ...rest } = m;
      return rest;
    });
    let added = 0;
    let skipped = 0;
    for (const item of order.items) {
      try {
        const fresh = await getProductBySlug(item.product.slug);
        if (!fresh || !fresh.inStock) {
          skipped++;
          continue;
        }
        const size = fresh.sizes.includes(item.size)
          ? item.size
          : fresh.sizes[0] ?? "";
        const color =
          fresh.colors.find((c) => c.name === item.color.name) ??
          fresh.colors[0] ??
          null;
        if (!size || !color) {
          skipped++;
          continue;
        }
        addItem(fresh, size, color);
        added++;
      } catch {
        skipped++;
      }
    }
    setReordering(null);
    if (added === 0) {
      setReorderMsg((m) => ({
        ...m,
        [order.id]: { type: "error", text: "Nothing left in stock from this order." },
      }));
      return;
    }
    if (skipped > 0) {
      setReorderMsg((m) => ({
        ...m,
        [order.id]: {
          type: "success",
          text: `Added ${added} item${added === 1 ? "" : "s"}; ${skipped} unavailable.`,
        },
      }));
    }
    router.push("/cart");
  };

  const submitReturn = async (orderId: string) => {
    const reason = (returnReason[orderId] ?? "").trim();
    if (reason.length < 5) {
      setReturnMsg((m) => ({ ...m, [orderId]: { type: "error", text: "Add a brief reason (5+ chars)." } }));
      return;
    }
    setReturnSubmitting(orderId);
    try {
      const res = await fetch("/api/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, reason }),
      });
      const data = await res.json();
      if (!res.ok) {
        setReturnMsg((m) => ({ ...m, [orderId]: { type: "error", text: data.error ?? "Could not submit." } }));
      } else {
        setReturnMsg((m) => ({ ...m, [orderId]: { type: "success", text: "Return request submitted. We'll be in touch." } }));
        setReturnOpen(null);
      }
    } catch {
      setReturnMsg((m) => ({ ...m, [orderId]: { type: "error", text: "Network error. Please try again." } }));
    } finally {
      setReturnSubmitting(null);
    }
  };

  useEffect(() => {
    if (!user) return;
    getUserOrders(user.id)
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [user]);

  const getStatusIdx = (status: Order["status"]) => {
    const normalized = normalizeOrderStatus(status);
    if (normalized === "PENDING_PAYMENT" || normalized === "FAILED" || normalized === "CANCELLED") return 0;
    if (normalized === "VERIFICATION_PENDING") return 1;
    return Math.max(0, STATUS_STEPS.indexOf(normalized));
  };

  return (
    <div className="pt-20 lg:pt-24 pb-24">
      <div className="container-px py-8 max-w-3xl">
        <div className="flex items-center gap-3 mb-2">
          <Link href="/account" className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted hover:text-ink inline-flex items-center gap-1">
            <ChevronLeft size={12} /> Account
          </Link>
        </div>
        <div className="border-b border-ink/15 pb-6 mb-8">
          <p className="section-kicker mb-4">ORDERS</p>
          <h1 className="font-display font-medium tracking-[-0.025em] leading-[0.92] text-ink text-5xl">
            My orders.
          </h1>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 bg-beige-dark animate-pulse" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 border border-ink/15">
            <Package size={36} className="text-muted mx-auto mb-4" strokeWidth={1.25} />
            <p className="font-display text-2xl tracking-[-0.02em] text-ink mb-2">No orders yet.</p>
            <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-muted mb-6">
              / Your orders will appear here
            </p>
            <Link href="/shop" className="btn-primary">
              Start shopping →
            </Link>
          </div>
        ) : (
          <div className="border border-ink/15 divide-y divide-ink/10">
            {orders.map((order, idx) => (
              <div key={order.id} className="bg-cream">
                <button
                  onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-beige-dark transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <span className="font-mono text-[10px] tracking-[0.16em] text-muted pt-2">
                      /{String(idx + 1).padStart(2, "0")}
                    </span>
                    {order.items[0]?.product.images[0] && (
                      <div className="w-12 h-14 relative bg-beige-dark overflow-hidden shrink-0 border border-ink/10">
                        <Image
                          src={order.items[0].product.images[0]}
                          alt={order.items[0].product.name}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      </div>
                    )}
                    <div>
                      <p className="font-mono text-sm tracking-[0.06em] text-ink">{order.id}</p>
                      <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted mt-1">
                        {new Date(order.date).toLocaleDateString("en-KE", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                      <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted">
                        {order.items.length} {order.items.length === 1 ? "item" : "items"} · <span className="text-ink tabular-nums">{formatPrice(order.total)}</span>
                      </p>
                    </div>
                  </div>
                  <span
                    className={`font-mono text-[9px] tracking-[0.2em] uppercase px-2 py-1 shrink-0 ${
                      ORDER_STATUS_STYLES[normalizeOrderStatus(order.status)]
                    }`}
                  >
                    {orderStatusLabel(order.status)}
                  </span>
                </button>

                <AnimatePresence>
                  {expanded === order.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="px-5 pb-5 border-t border-ink/15 space-y-5 pt-5">
                        {normalizeOrderStatus(order.status) !== "CANCELLED" && (
                          <div className="flex items-center justify-between">
                            {STATUS_STEPS.map((s, i) => {
                              const Icon = STATUS_ICONS[i];
                              const active = i <= getStatusIdx(order.status);
                              const current = i === getStatusIdx(order.status);
                              return (
                                <div key={s} className="flex-1 flex flex-col items-center gap-1.5">
                                  <div
                                    className={`w-7 h-7 flex items-center justify-center transition-colors ${
                                      current ? "bg-ink text-citrine" : active ? "bg-ink text-cream" : "border border-ink/25 bg-cream text-muted"
                                    }`}
                                  >
                                    <Icon size={12} />
                                  </div>
                                  <p className="font-mono text-[9px] tracking-[0.16em] uppercase text-muted text-center hidden sm:block">
                                    {STATUS_LABELS[s]}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {order.trackingNumber && (
                          <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-muted">
                            / Tracking{" "}
                            <span className="text-ink">{order.trackingNumber}</span>
                          </p>
                        )}

                        <div className="space-y-3">
                          {order.items.map((item, i) => (
                            <div key={i} className="flex gap-3">
                              {item.product.images[0] && (
                                <div className="relative w-14 h-16 bg-beige-dark shrink-0 overflow-hidden border border-ink/10">
                                  <Image
                                    src={item.product.images[0]}
                                    alt={item.product.name}
                                    fill
                                    className="object-cover"
                                    sizes="56px"
                                  />
                                </div>
                              )}
                              <div>
                                <p className="font-display text-sm tracking-[-0.01em] text-ink">{item.product.name}</p>
                                <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted mt-1">
                                  {item.size}{item.color.name ? ` · ${item.color.name}` : ""} · Qty {item.quantity}
                                </p>
                                <p className="price text-sm font-medium mt-1">
                                  {formatPrice((item.product.salePrice ?? item.product.price) * item.quantity)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="flex gap-4 pt-3 border-t border-ink/15 flex-wrap">
                          {normalizeOrderStatus(order.status) === "DELIVERED" && (
                            <button
                              onClick={() => setReturnOpen(returnOpen === order.id ? null : order.id)}
                              className="flex items-center gap-2 font-mono text-[10px] tracking-[0.18em] uppercase text-ink hover:text-citrine underline-citrine"
                            >
                              <RotateCcw size={11} /> Return
                            </button>
                          )}
                          <button
                            onClick={() => reorderItems(order)}
                            disabled={reordering === order.id}
                            className="flex items-center gap-2 font-mono text-[10px] tracking-[0.18em] uppercase text-ink hover:text-citrine disabled:opacity-50"
                          >
                            <ShoppingCart size={11} />
                            {reordering === order.id ? "Checking stock…" : "Reorder"}
                          </button>
                          <a
                            href={`/api/invoice/${order.id}?email=${encodeURIComponent(user?.email ?? "")}`}
                            target="_blank"
                            rel="noopener"
                            className="flex items-center gap-2 font-mono text-[10px] tracking-[0.18em] uppercase text-ink hover:text-citrine"
                          >
                            <Download size={11} /> Invoice
                          </a>
                        </div>

                        {returnOpen === order.id && (
                          <div className="mt-4 border border-ink/15 bg-beige-dark/30 p-4 space-y-3">
                            <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-ink">
                              / Reason for return
                            </p>
                            <textarea
                              value={returnReason[order.id] ?? ""}
                              onChange={(e) =>
                                setReturnReason((m) => ({ ...m, [order.id]: e.target.value }))
                              }
                              maxLength={1000}
                              rows={3}
                              placeholder="Wrong size, defect, changed my mind..."
                              className="w-full text-sm bg-cream border border-ink/20 p-3 text-ink outline-none focus:border-ink resize-none placeholder:text-muted"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => submitReturn(order.id)}
                                disabled={returnSubmitting === order.id}
                                className="font-mono text-[10px] tracking-[0.18em] uppercase bg-ink text-citrine px-4 py-2 hover:bg-forest-dark transition-colors disabled:opacity-50"
                              >
                                {returnSubmitting === order.id ? "Submitting…" : "Submit return →"}
                              </button>
                              <button
                                onClick={() => setReturnOpen(null)}
                                className="font-mono text-[10px] tracking-[0.18em] uppercase border border-ink/30 text-ink px-4 py-2 hover:border-ink transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}

                        {returnMsg[order.id] && (
                          <p
                            className={`mt-3 font-mono text-[10px] tracking-[0.14em] uppercase border-l-2 pl-3 py-2 ${
                              returnMsg[order.id].type === "success"
                                ? "text-ink border-citrine"
                                : "text-danger border-danger"
                            }`}
                          >
                            / {returnMsg[order.id].text}
                          </p>
                        )}

                        {reorderMsg[order.id] && (
                          <p
                            className={`mt-3 font-mono text-[10px] tracking-[0.14em] uppercase border-l-2 pl-3 py-2 ${
                              reorderMsg[order.id].type === "success"
                                ? "text-ink border-citrine"
                                : "text-danger border-danger"
                            }`}
                          >
                            / {reorderMsg[order.id].text}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
