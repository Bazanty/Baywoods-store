"use client";

import { useState } from "react";
import { Package, MapPin, Check, Truck, FileDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatPrice } from "@/lib/utils";
import { normalizeOrderStatus, orderStatusLabel, type OrderStatus } from "@/lib/orderStatus";

interface TrackedOrder {
  id: string;
  status: string;
  payment_status: string;
  total: number;
  shipping_name: string;
  shipping_city: string;
  tracking_number: string | null;
  created_at: string;
  shipped_at: string | null;
  delivered_at: string | null;
  order_items: {
    product_name: string;
    variant_name: string | null;
    quantity: number;
    unit_price: number;
    line_total: number;
  }[];
}

const STEPS: OrderStatus[] = ["PAID", "VERIFIED", "PACKED", "OUT_FOR_DELIVERY", "DELIVERED"];

export default function OrderTrackingPage() {
  const [orderId, setOrderId] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [order, setOrder] = useState<TrackedOrder | null>(null);

  async function lookup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setOrder(null);

    const res = await fetch("/api/order-track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: orderId.trim(), email: email.trim() }),
    });
    const json = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(json.error ?? "Lookup failed");
      return;
    }
    setOrder(json.order);
  }

  const currentStep = order ? Math.max(0, STEPS.indexOf(normalizeOrderStatus(order.status))) : -1;

  return (
    <div className="pt-20 lg:pt-24 pb-20 container-px max-w-3xl mx-auto">
      <div className="border-b border-ink/15 pb-6 mb-10">
        <p className="section-kicker mb-4">TRACK</p>
        <h1 className="font-display font-medium tracking-[-0.025em] leading-[0.92] text-ink text-5xl sm:text-6xl">
          Where&apos;s my <br className="hidden sm:inline" />order?
        </h1>
        <p className="font-mono text-[11px] tracking-[0.14em] uppercase text-muted mt-4">
          / Enter your order ID and email used at checkout.
        </p>
      </div>

      <form onSubmit={lookup} className="grid sm:grid-cols-[1fr_1fr_auto] gap-3 mb-10">
        <input
          required
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
          placeholder="Order ID"
          className="input-base"
        />
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="input-base"
        />
        <button type="submit" disabled={loading} className="btn-primary disabled:opacity-50">
          {loading ? "Tracking…" : "Track →"}
        </button>
      </form>

      {error && (
        <div className="border-l-2 border-danger pl-4 py-2 mb-8">
          <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-danger">/ {error}</p>
        </div>
      )}

      <AnimatePresence>
        {order && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="border border-ink/20 bg-cream p-8"
          >
            <div className="flex items-start justify-between mb-8 gap-4">
              <div>
                <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted">/ Order</p>
                <p className="font-mono text-sm tracking-[0.1em] uppercase text-ink mt-1">#BW-{order.id.slice(0, 8).toUpperCase()}</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted">/ Total</p>
                <p className="font-display text-2xl tracking-[-0.02em] text-ink mt-1 tabular-nums">{formatPrice(order.total)}</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="relative flex justify-between mb-2">
              {STEPS.map((step, i) => {
                const reached = i <= currentStep;
                const active = i === currentStep;
                return (
                  <div key={step} className="flex flex-col items-center z-10 flex-1">
                    <div
                      className={`w-9 h-9 flex items-center justify-center transition-colors ${
                        active
                          ? "bg-ink text-citrine"
                          : reached
                          ? "bg-ink text-cream"
                          : "border border-ink/25 bg-cream text-muted"
                      }`}
                    >
                      {step === "PAID" && <Package size={14} />}
                      {step === "VERIFIED" && <Check size={14} />}
                      {step === "PACKED" && <Check size={14} />}
                      {step === "OUT_FOR_DELIVERY" && <Truck size={14} />}
                      {step === "DELIVERED" && <MapPin size={14} />}
                    </div>
                    <span className={`font-mono text-[10px] tracking-[0.16em] uppercase mt-2 text-center ${reached ? "text-ink" : "text-muted"}`}>
                      {orderStatusLabel(step)}
                    </span>
                  </div>
                );
              })}
              <div className="absolute left-0 right-0 top-[18px] h-px bg-ink/15 -z-0" />
              <div
                className="absolute left-0 top-[18px] h-px bg-ink -z-0 transition-all duration-500"
                style={{ width: `${Math.max(0, currentStep) * 25}%` }}
              />
            </div>

            {order.tracking_number && (
              <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-muted mt-8">
                / Tracking <span className="text-ink">{order.tracking_number}</span>
              </p>
            )}

            <a
              href={`/api/invoice/${order.id}?email=${encodeURIComponent(email)}`}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-2 mt-4 font-mono text-[10px] tracking-[0.18em] uppercase text-ink hover:text-citrine underline-citrine"
            >
              <FileDown size={11} />
              Download invoice (PDF)
            </a>

            <div className="mt-8 pt-6 border-t border-ink/15">
              <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-muted mb-4">/ Items</p>
              <div className="space-y-2 font-mono text-xs">
                {order.order_items.map((it, i) => (
                  <div key={i} className="flex justify-between gap-3">
                    <span className="text-ink">
                      <span className="text-muted">/{String(i + 1).padStart(2, "0")}</span> {it.product_name}
                      {it.variant_name && <span className="text-muted"> · {it.variant_name}</span>}
                      <span className="text-muted"> × {it.quantity}</span>
                    </span>
                    <span className="tabular-nums text-ink">{formatPrice(it.line_total)}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
