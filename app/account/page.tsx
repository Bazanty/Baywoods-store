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
} from "lucide-react";
import { useAuthStore } from "@/lib/authStore";
import { useCartStore } from "@/lib/store";
import { formatPrice } from "@/lib/utils";
import { getUserOrders } from "@/lib/supabase/queries";
import type { Order } from "@/lib/types";

const statusColors: Record<Order["status"], string> = {
  delivered: "text-forest bg-forest/10",
  shipped: "text-amber-700 bg-amber-50",
  processing: "text-ink bg-stone",
  pending: "text-muted bg-stone/50",
  cancelled: "text-danger bg-red-50",
};

export default function AccountPage() {
  const { user, signOut } = useAuthStore();
  const wishlistCount = useCartStore((s) => s.wishlist.length);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const router = useRouter();

  const meta = user?.user_metadata ?? {};
  const firstName = meta.first_name ?? "";
  const lastName = meta.last_name ?? "";
  const fullName = [firstName, lastName].filter(Boolean).join(" ") || "My Account";
  const initials = [firstName[0], lastName[0]].filter(Boolean).join("").toUpperCase() || "?";
  const email = user?.email ?? "";

  const cards = [
    { icon: Package, label: "Orders", href: "/account/orders", count: orders.length },
    { icon: Heart, label: "Wishlist", href: "/account/wishlist", count: wishlistCount },
    { icon: MapPin, label: "Addresses", href: "/account/addresses", count: 0 },
    { icon: CreditCard, label: "Payment Methods", href: "/account/payments", count: 0 },
  ];

  useEffect(() => {
    if (!user) return;
    setOrdersLoading(true);
    getUserOrders(user.id)
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setOrdersLoading(false));
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <div className="pt-24 lg:pt-28 pb-24">
      <div className="container-px py-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="flex items-center gap-5 mb-10"
        >
          <div className="w-14 h-14 bg-ink rounded-full flex items-center justify-center">
            <span className="font-serif text-xl text-white">{initials}</span>
          </div>
          <div>
            <h1 className="font-serif text-2xl text-ink">{fullName}</h1>
            <p className="text-sm text-muted">{email}</p>
          </div>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {cards.map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
            >
              <Link
                href={card.href}
                className="block p-5 bg-cream border border-stone hover:border-ink transition-colors group"
              >
                <card.icon
                  size={20}
                  className="text-forest mb-3 group-hover:text-forest-dark transition-colors"
                  strokeWidth={1.5}
                />
                <p className="text-sm font-medium text-ink">{card.label}</p>
                {card.count > 0 && (
                  <p className="text-xs text-muted mt-0.5">{card.count} items</p>
                )}
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="mb-10">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-serif text-xl text-ink">Recent Orders</h2>
            <Link href="/account/orders" className="text-xs text-forest underline underline-offset-2">
              View All
            </Link>
          </div>
          {ordersLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-20 bg-stone/40 animate-pulse" />
              ))}
            </div>
          ) : orders.length > 0 ? (
            <div className="border border-stone bg-cream divide-y divide-stone">
              {orders.slice(0, 3).map((order) => (
                <Link
                  key={order.id}
                  href={`/order/${order.id}`}
                  className="flex items-center justify-between gap-4 p-4 hover:bg-stone/30 transition-colors"
                >
                  <div>
                    <p className="text-sm font-medium text-ink">#{order.id.slice(0, 8)}</p>
                    <p className="text-xs text-muted mt-1">
                      {order.date} · {order.items.length} {order.items.length === 1 ? "item" : "items"}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-1 ${statusColors[order.status]}`}>
                      {order.status}
                    </span>
                    <p className="text-sm font-semibold text-ink mt-2">{formatPrice(order.total)}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted py-8 text-center border border-stone bg-cream">
              No orders yet. <Link href="/shop" className="text-forest underline underline-offset-2">Start shopping</Link>
            </p>
          )}
        </div>

        <div className="border-t border-stone pt-6 space-y-1">
          <Link
            href="/account/settings"
            className="flex items-center gap-3 py-3 text-sm text-ink hover:text-forest transition-colors"
          >
            <Settings size={16} className="text-muted" />
            Account Settings
          </Link>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3 py-3 text-sm text-danger hover:text-red-700 transition-colors"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
