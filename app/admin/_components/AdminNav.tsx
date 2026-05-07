"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Package, ShoppingBag, Tag, Ticket, Users, Boxes, RotateCcw, ArrowUpLeft, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/admin",            label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/products",   label: "Products",  icon: Package },
  { href: "/admin/inventory",  label: "Inventory", icon: Boxes },
  { href: "/admin/orders",     label: "Orders",    icon: ShoppingBag },
  { href: "/admin/customers",  label: "Customers", icon: Users },
  { href: "/admin/returns",    label: "Returns",   icon: RotateCcw },
  { href: "/admin/categories", label: "Categories",icon: Tag },
  { href: "/admin/coupons",    label: "Coupons",   icon: Ticket },
];

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/admin/auth", { method: "DELETE" });
    router.replace("/admin/login");
  };

  return (
    <>
      <nav className="flex-1 py-3 overflow-y-auto">
        {nav.map(({ href, label, icon: Icon, exact }) => {
          const active = exact
            ? pathname === href
            : pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-6 py-2.5 text-sm transition-colors",
                active
                  ? "bg-white/10 text-white font-medium"
                  : "text-white/50 hover:text-white/80 hover:bg-white/5"
              )}
            >
              <Icon size={16} strokeWidth={active ? 2 : 1.5} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-6 py-5 border-t border-white/10 space-y-3">
        <Link
          href="/"
          className="flex items-center gap-2 text-xs text-white/35 hover:text-white/60 transition-colors"
        >
          <ArrowUpLeft size={13} />
          Back to store
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-xs text-white/35 hover:text-danger/80 transition-colors w-full"
        >
          <LogOut size={13} />
          Sign out
        </button>
      </div>
    </>
  );
}
