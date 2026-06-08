"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Package, ShoppingBag, Tag, Ticket, Users, Boxes, RotateCcw, MessageSquare, Star, ArrowUpLeft, LogOut, CreditCard, Bell, Send } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/admin",            label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/products",   label: "Products",  icon: Package },
  { href: "/admin/inventory",  label: "Inventory", icon: Boxes },
  { href: "/admin/restock",    label: "Restock",   icon: Bell },
  { href: "/admin/push",       label: "Push",      icon: Send },
  { href: "/admin/orders",     label: "Orders",    icon: ShoppingBag },
  { href: "/admin/payments",   label: "Payments",  icon: CreditCard },
  { href: "/admin/customers",  label: "Customers", icon: Users },
  { href: "/admin/returns",    label: "Returns",   icon: RotateCcw },
  { href: "/admin/categories", label: "Categories",icon: Tag },
  { href: "/admin/coupons",    label: "Coupons",   icon: Ticket },
  { href: "/admin/reviews",    label: "Reviews",   icon: Star },
  { href: "/admin/contacts",   label: "Messages",  icon: MessageSquare },
];

export default function AdminNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname() ?? "";
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/admin/auth", { method: "DELETE" });
    onNavigate?.();
    router.replace("/admin/login");
  };

  return (
    <>
      <nav className="flex-1 py-3 overflow-y-auto">
        {nav.map(({ href, label, icon: Icon, exact }, i) => {
          const active = exact
            ? pathname === href
            : pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={cn(
                "relative flex items-center gap-3 px-6 py-2.5 font-mono text-[11px] tracking-[0.14em] uppercase transition-colors",
                active
                  ? "bg-beige-dark text-ink"
                  : "text-muted hover:text-ink hover:bg-beige-dark/60"
              )}
            >
              {active && <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-citrine" aria-hidden />}
              <span className="font-mono text-[9px] tracking-[0.16em] text-muted">
                {String(i + 1).padStart(2, "0")}
              </span>
              <Icon size={14} strokeWidth={active ? 2 : 1.5} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-6 py-5 border-t border-ink/15 space-y-3">
        <Link
          href="/"
          onClick={onNavigate}
          className="flex items-center gap-2 font-mono text-[10px] tracking-[0.18em] uppercase text-muted hover:text-ink transition-colors"
        >
          <ArrowUpLeft size={12} />
          Back to store
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 font-mono text-[10px] tracking-[0.18em] uppercase text-muted hover:text-danger transition-colors w-full"
        >
          <LogOut size={12} />
          Sign out
        </button>
      </div>
    </>
  );
}
