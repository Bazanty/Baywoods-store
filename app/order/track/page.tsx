"use client";

import { useState } from "react";
import { Package, MapPin, Check, Truck, FileDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Button from "@/components/ui/Button";
import { formatPrice } from "@/lib/utils";

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

const STEPS = ["pending", "processing", "shipped", "delivered"] as const;

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

  const currentStep = order ? STEPS.indexOf(order.status as (typeof STEPS)[number]) : -1;

  return (
    <div className="pt-24 pb-20 container-px max-w-3xl mx-auto">
      <h1 className="font-serif text-display-lg text-ink mb-2">Track your order</h1>
      <p className="text-sm text-muted mb-10">
        Enter your order ID and the email address used at checkout.
      </p>

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
        <Button type="submit" loading={loading}>
          Track
        </Button>
      </form>

      {error && (
        <div className="bg-danger/10 border border-danger/20 text-danger text-sm px-4 py-3 mb-8">
          {error}
        </div>
      )}

      <AnimatePresence>
        {order && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="border border-stone p-8"
          >
            <div className="flex items-start justify-between mb-8 gap-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted">Order</p>
                <p className="font-mono text-sm text-ink">{order.id.slice(0, 8)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-wider text-muted">Total</p>
                <p className="font-serif text-xl text-ink">{formatPrice(order.total)}</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="relative flex justify-between mb-2">
              {STEPS.map((step, i) => {
                const reached = i <= currentStep;
                return (
                  <div key={step} className="flex flex-col items-center z-10 flex-1">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-colors ${
                        reached
                          ? "bg-forest border-forest text-white"
                          : "bg-white border-stone text-muted"
                      }`}
                    >
                      {step === "pending" && <Package size={15} />}
                      {step === "processing" && <Check size={15} />}
                      {step === "shipped" && <Truck size={15} />}
                      {step === "delivered" && <MapPin size={15} />}
                    </div>
                    <span className="text-[10px] mt-1.5 uppercase tracking-wider text-muted capitalize">
                      {step}
                    </span>
                  </div>
                );
              })}
              <div className="absolute left-0 right-0 top-[18px] h-[2px] bg-stone -z-0" />
              <div
                className="absolute left-0 top-[18px] h-[2px] bg-forest -z-0 transition-all duration-500"
                style={{ width: `${Math.max(0, currentStep) * 33.3}%` }}
              />
            </div>

            {order.tracking_number && (
              <p className="text-sm text-muted mt-6">
                Tracking: <span className="font-mono text-ink">{order.tracking_number}</span>
              </p>
            )}

            <a
              href={`/api/invoice/${order.id}?email=${encodeURIComponent(email)}`}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-2 mt-6 text-xs font-medium text-forest hover:text-forest-dark underline underline-offset-4"
            >
              <FileDown size={13} />
              Download invoice (PDF)
            </a>

            <div className="mt-8 pt-6 border-t border-stone">
              <p className="text-xs uppercase tracking-wider text-muted mb-3">Items</p>
              <div className="space-y-2">
                {order.order_items.map((it, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span className="text-ink">
                      {it.product_name}
                      {it.variant_name && <span className="text-muted"> • {it.variant_name}</span>}
                      <span className="text-muted"> × {it.quantity}</span>
                    </span>
                    <span className="text-ink">{formatPrice(it.line_total)}</span>
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
