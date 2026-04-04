"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, Package, Truck, MapPin, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getUserOrders } from "@/lib/supabase/queries";
import { useAuthStore } from "@/lib/authStore";
import { formatPrice } from "@/lib/utils";
import { Order } from "@/lib/types";

const STATUS_STEPS = ["pending", "processing", "shipped", "delivered"];
const STATUS_LABELS: Record<string, string> = {
  pending: "Order Placed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
};
const STATUS_ICONS = [Package, RefreshCw, Truck, MapPin];

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) return;
    getUserOrders(user.id)
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [user]);

  const getStatusIdx = (status: Order["status"]) => STATUS_STEPS.indexOf(status);

  return (
    <div className="pt-24 lg:pt-28 pb-24">
      <div className="container-px py-8 max-w-3xl">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/account" className="text-muted hover:text-ink transition-colors">
            <ChevronLeft size={18} />
          </Link>
          <h1 className="font-serif text-3xl text-ink">My Orders</h1>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 bg-stone/40 animate-pulse" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <Package size={48} className="text-stone mx-auto mb-4" strokeWidth={1} />
            <p className="text-ink font-medium mb-2">No orders yet</p>
            <p className="text-sm text-muted mb-6">Your orders will appear here once you shop.</p>
            <Link href="/shop" className="btn-primary">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-cream border border-stone overflow-hidden">
                <button
                  onClick={() => setExpanded(expanded === order.id ? null : order.id)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-stone/20 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    {order.items[0]?.product.images[0] && (
                      <div className="w-12 h-14 relative bg-beige overflow-hidden shrink-0">
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
                      <p className="text-sm font-semibold text-ink">{order.id}</p>
                      <p className="text-xs text-muted mt-0.5">
                        {new Date(order.date).toLocaleDateString("en-KE", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                      <p className="text-xs text-muted">
                        {order.items.length} {order.items.length === 1 ? "item" : "items"} ·{" "}
                        {formatPrice(order.total)}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-semibold tracking-wide uppercase px-2.5 py-1 shrink-0 ${
                      order.status === "delivered"
                        ? "bg-forest-muted text-forest-dark"
                        : order.status === "shipped"
                        ? "bg-amber-50 text-amber-700"
                        : "bg-stone text-muted"
                    }`}
                  >
                    {order.status}
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
                      <div className="px-5 pb-5 border-t border-stone space-y-5 pt-5">
                        {order.status !== "cancelled" && (
                          <div className="flex items-center justify-between">
                            {STATUS_STEPS.map((s, i) => {
                              const Icon = STATUS_ICONS[i];
                              const active = i <= getStatusIdx(order.status);
                              const current = i === getStatusIdx(order.status);
                              return (
                                <div key={s} className="flex-1 flex flex-col items-center gap-1.5">
                                  <div
                                    className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                                      active ? "bg-forest text-white" : "bg-stone text-muted"
                                    } ${current ? "ring-2 ring-forest ring-offset-2" : ""}`}
                                  >
                                    <Icon size={13} />
                                  </div>
                                  <p className="text-[10px] text-muted text-center hidden sm:block">
                                    {STATUS_LABELS[s]}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {order.trackingNumber && (
                          <p className="text-xs text-muted">
                            Tracking:{" "}
                            <span className="font-mono font-semibold text-ink">{order.trackingNumber}</span>
                          </p>
                        )}

                        <div className="space-y-3">
                          {order.items.map((item, i) => (
                            <div key={i} className="flex gap-3">
                              {item.product.images[0] && (
                                <div className="relative w-14 h-16 bg-beige shrink-0 overflow-hidden">
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
                                <p className="text-sm font-medium text-ink">{item.product.name}</p>
                                <p className="text-xs text-muted">
                                  {item.size}{item.color.name ? ` · ${item.color.name}` : ""} · Qty {item.quantity}
                                </p>
                                <p className="text-sm font-semibold mt-0.5">
                                  {formatPrice((item.product.salePrice ?? item.product.price) * item.quantity)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="flex gap-3 pt-2 border-t border-stone">
                          {order.status === "delivered" && (
                            <button className="text-xs text-forest underline underline-offset-2">
                              Request Return
                            </button>
                          )}
                          <button className="text-xs text-ink underline underline-offset-2">Reorder</button>
                          <button className="text-xs text-ink underline underline-offset-2">Get Invoice</button>
                        </div>
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
