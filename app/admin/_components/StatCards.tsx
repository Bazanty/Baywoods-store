"use client";

import Link from "next/link";
import { Package, ShoppingBag, AlertTriangle, ArrowUpRight } from "lucide-react";

interface Props {
  productCount: number;
  orderCount: number;
  outOfStockCount: number;
}

export default function StatCards({ productCount, orderCount, outOfStockCount }: Props) {
  const stats = [
    {
      n: "01",
      label: "Active products",
      value: productCount,
      icon: Package,
      href: "/admin/products",
    },
    {
      n: "02",
      label: "Total orders",
      value: orderCount,
      icon: ShoppingBag,
      href: "/admin/orders",
    },
    {
      n: "03",
      label: "Out of stock",
      value: outOfStockCount,
      icon: AlertTriangle,
      href: "/admin/products",
      alert: outOfStockCount > 0,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-px md:grid-cols-3 bg-ink/15 border border-ink/15">
      {stats.map(({ n, label, value, icon: Icon, href, alert }) => (
        <Link
          key={label}
          href={href}
          className="bg-cream p-5 flex flex-col gap-3 hover:bg-beige-dark transition-colors group"
        >
          <div className="flex items-baseline justify-between">
            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted">/ {n}</p>
            <ArrowUpRight size={13} className="text-muted group-hover:text-ink transition-colors" />
          </div>
          <div className="flex items-end justify-between">
            <div>
              <p className={`font-display text-4xl tracking-[-0.025em] leading-none ${alert ? "text-citrine bg-ink px-1.5 inline-block" : "text-ink"}`}>
                {value}
              </p>
              <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-muted mt-3">{label}</p>
            </div>
            <Icon size={18} strokeWidth={1.5} className={alert ? "text-danger" : "text-ink"} />
          </div>
        </Link>
      ))}
    </div>
  );
}
