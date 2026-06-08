"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Package,
  Heart,
  MapPin,
  Settings,
  LogOut,
  CreditCard,
  ArrowUpRight,
} from "lucide-react";
import { useAuthStore } from "@/lib/authStore";
import { useCartStore } from "@/lib/store";
import { formatPrice } from "@/lib/utils";
import { getUserOrders } from "@/lib/supabase/queries";
import { supabase } from "@/lib/supabase/client";
import { ORDER_STATUS_STYLES, orderStatusLabel, normalizeOrderStatus } from "@/lib/orderStatus";
import type { Order } from "@/lib/types";
import RecentlyViewed from "@/components/product/RecentlyViewed";

export default function AccountPage() {
  const { user, signOut } = useAuthStore();
  const wishlistCount = useCartStore((s) => s.wishlist.length);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [addressCount, setAddressCount] = useState(0);
  const router = useRouter();

  const meta = user?.user_metadata ?? {};
  const firstName = meta.first_name ?? "";
  const lastName = meta.last_name ?? "";
  const fullName = [firstName, lastName].filter(Boolean).join(" ") || "My Account";
  const initials = [firstName[0], lastName[0]].filter(Boolean).join("").toUpperCase() || "?";
  const email = user?.email ?? "";
  const paymentCount: number = Array.isArray(meta.mpesa_numbers) ? meta.mpesa_numbers.length : 0;

  const cards = [
    { n: "01", icon: Package, label: "Orders", href: "/account/orders", count: orders.length },
    { n: "02", icon: Heart, label: "Wishlist", href: "/account/wishlist", count: wishlistCount },
    { n: "03", icon: MapPin, label: "Addresses", href: "/account/addresses", count: addressCount },
    { n: "04", icon: CreditCard, label: "Payment", href: "/account/payments", count: paymentCount },
  ];

  useEffect(() => {
    if (!user) return;
    setOrdersLoading(true);
    getUserOrders(user.id)
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setOrdersLoading(false));

    let cancelled = false;
    supabase
      .from("addresses")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .then(({ count }) => {
        if (!cancelled) setAddressCount(count ?? 0);
      });
    return () => { cancelled = true; };
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <div className="pt-20 lg:pt-24 pb-24">
      <div className="container-px py-8">
        {/* Header */}
        <div className="border-b border-ink/15 pb-8 mb-10">
          <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted mb-4">
            <span className="text-ink">/</span> ACCOUNT
          </p>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="flex items-center gap-5"
          >
            <div className="w-14 h-14 bg-ink flex items-center justify-center">
              <span className="font-mono text-base tracking-[0.1em] text-citrine">{initials}</span>
            </div>
            <div>
              <h1 className="font-display font-medium text-3xl sm:text-4xl tracking-[-0.025em] text-ink">{fullName}</h1>
              <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted mt-1">{email}</p>
            </div>
          </motion.div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-ink/15 mb-12">
          {cards.map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
            >
              <Link
                href={card.href}
                className="block p-5 bg-cream hover:bg-beige-dark transition-colors group h-full"
              >
                <div className="flex items-baseline justify-between mb-4">
                  <p className="font-mono text-[10px] tracking-[0.2em] text-muted">/ {card.n}</p>
                  <ArrowUpRight size={13} className="text-muted group-hover:text-ink transition-colors" />
                </div>
                <card.icon size={18} strokeWidth={1.5} className="text-ink mb-3" />
                <p className="font-display text-lg tracking-[-0.01em] text-ink">{card.label}</p>
                {card.count > 0 && (
                  <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted mt-1">
                    {card.count} {card.count === 1 ? "item" : "items"}
                  </p>
                )}
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Recent orders */}
        <div className="mb-12">
          <div className="flex items-end justify-between mb-5 border-b border-ink/15 pb-3">
            <div>
              <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted">/ Recent</p>
              <h2 className="font-display text-2xl tracking-[-0.02em] text-ink mt-1">Orders</h2>
            </div>
            <Link href="/account/orders" className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink hover:text-citrine">
              View all →
            </Link>
          </div>
          {ordersLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-20 bg-beige-dark animate-pulse" />
              ))}
            </div>
          ) : orders.length > 0 ? (
            <div className="border border-ink/15 divide-y divide-ink/10">
              {orders.slice(0, 3).map((order, i) => (
                <Link
                  key={order.id}
                  href={`/order/${order.id}`}
                  className="flex items-center justify-between gap-4 p-4 hover:bg-beige-dark transition-colors group"
                >
                  <div className="flex items-baseline gap-4 min-w-0">
                    <span className="font-mono text-[10px] tracking-[0.16em] text-muted">/{String(i + 1).padStart(2, "0")}</span>
                    <div className="min-w-0">
                      <p className="font-mono text-sm tracking-[0.06em] text-ink">#BW-{order.id.slice(0, 8).toUpperCase()}</p>
                      <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted mt-1">
                        {order.date} · {order.items.length} {order.items.length === 1 ? "item" : "items"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`font-mono text-[9px] tracking-[0.18em] uppercase px-2 py-1 ${ORDER_STATUS_STYLES[normalizeOrderStatus(order.status)]}`}>
                      {orderStatusLabel(order.status)}
                    </span>
                    <p className="price text-sm font-medium text-ink mt-2">{formatPrice(order.total)}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-muted py-10 text-center border border-ink/15">
              / No orders yet.{" "}
              <Link href="/shop" className="text-ink underline-citrine">
                Start shopping →
              </Link>
            </p>
          )}
        </div>

        <RecentlyViewed />

        <div className="border-t border-ink/15 pt-5 space-y-1">
          <Link
            href="/account/settings"
            className="flex items-center gap-3 py-3 font-mono text-[11px] tracking-[0.16em] uppercase text-ink hover:text-citrine transition-colors"
          >
            <Settings size={14} className="text-muted" />
            Account settings
          </Link>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 py-3 font-mono text-[11px] tracking-[0.16em] uppercase text-danger hover:text-ink transition-colors"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
