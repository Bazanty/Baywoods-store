"use client";

import Link from "next/link";
import { Package, ShoppingBag, AlertTriangle } from "lucide-react";

interface Props {
  productCount: number;
  orderCount: number;
  outOfStockCount: number;
}

export default function StatCards({ productCount, orderCount, outOfStockCount }: Props) {
  const stats = [
    {
      label: "Active Products",
      value: productCount,
      icon: Package,
      href: "/admin/products",
      color: "text-forest",
      bg: "bg-forest/[0.08]",
    },
    {
      label: "Total Orders",
      value: orderCount,
      icon: ShoppingBag,
      href: "/admin/orders",
      color: "text-ink",
      bg: "bg-ink/5",
    },
    {
      label: "Out of Stock",
      value: outOfStockCount,
      icon: AlertTriangle,
      href: "/admin/products",
      color: outOfStockCount > 0 ? "text-amber-600" : "text-muted",
      bg: outOfStockCount > 0 ? "bg-amber-50" : "bg-stone-light",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      {stats.map(({ label, value, icon: Icon, href, color, bg }) => (
        <Link
          key={label}
          href={href}
          className="bg-white rounded p-5 flex items-start justify-between hover:shadow-sm transition-shadow"
        >
          <div>
            <p className="text-xs text-muted tracking-wider uppercase mb-1">{label}</p>
            <p className={`text-3xl font-serif ${color}`}>{value}</p>
          </div>
          <span className={`${bg} ${color} p-2.5 rounded`}>
            <Icon size={18} strokeWidth={1.5} />
          </span>
        </Link>
      ))}
    </div>
  );
}
