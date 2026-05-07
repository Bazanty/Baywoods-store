import Link from "next/link";
import { Plus, ArrowRight, TrendingUp, Users, DollarSign, CalendarDays } from "lucide-react";
import { getAdminStats, getAdminRevenue } from "./actions";
import { formatPrice } from "@/lib/utils";
import StatCards from "./_components/StatCards";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [{ productCount, orderCount, outOfStockCount, recentOrders }, revenue] = await Promise.all([
    getAdminStats(),
    getAdminRevenue(),
  ]);

  return (
    <div className="px-8 py-10 max-w-5xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-2xl text-ink">Dashboard</h1>
          <p className="text-sm text-muted mt-0.5">
            {new Date().toLocaleDateString("en-KE", {
              weekday: "long", day: "numeric", month: "long", year: "numeric",
            })}
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="flex items-center gap-2 bg-ink text-white text-sm px-5 py-2.5 hover:bg-ink/90 transition-colors"
        >
          <Plus size={14} />
          New Product
        </Link>
      </div>

      <StatCards
        productCount={productCount}
        orderCount={orderCount}
        outOfStockCount={outOfStockCount}
      />

      {/* Revenue Stats */}
      <div className="grid grid-cols-4 gap-4 mt-6">
        {[
          {
            label: "Total Revenue",
            value: formatPrice(revenue.totalRevenue),
            icon: DollarSign,
            color: "text-forest",
            bg: "bg-forest/[0.08]",
          },
          {
            label: "This Month",
            value: formatPrice(revenue.monthlyRevenue),
            icon: CalendarDays,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            label: "Monthly Orders",
            value: String(revenue.monthlyOrders),
            icon: TrendingUp,
            color: "text-purple-600",
            bg: "bg-purple-50",
          },
          {
            label: "Customers",
            value: String(revenue.customerCount),
            icon: Users,
            color: "text-ink",
            bg: "bg-ink/5",
          },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div
            key={label}
            className="bg-white rounded p-5 flex items-start justify-between"
          >
            <div>
              <p className="text-xs text-muted tracking-wider uppercase mb-1">{label}</p>
              <p className={`text-2xl font-serif ${color}`}>{value}</p>
            </div>
            <span className={`${bg} ${color} p-2.5 rounded`}>
              <Icon size={18} strokeWidth={1.5} />
            </span>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded overflow-hidden mt-10">
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone">
          <h2 className="text-sm font-medium text-ink">Recent Orders</h2>
          <Link
            href="/admin/orders"
            className="flex items-center gap-1 text-xs text-muted hover:text-ink transition-colors"
          >
            View all <ArrowRight size={12} />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <p className="px-5 py-8 text-sm text-muted text-center">No orders yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone text-left">
                {["Order ID", "Customer", "Status", "Total"].map((h, i) => (
                  <th
                    key={h}
                    className={`px-5 py-3 text-xs font-medium text-muted tracking-wider uppercase${i === 3 ? " text-right" : ""}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order: any, i: number) => (
                <tr
                  key={order.id}
                  className={i < recentOrders.length - 1 ? "border-b border-stone/50" : ""}
                >
                  <td className="px-5 py-3.5 font-mono text-xs text-muted">
                    {order.id.slice(0, 8).toUpperCase()}
                  </td>
                  <td className="px-5 py-3.5 text-ink">{order.shipping_name}</td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-5 py-3.5 text-right font-medium text-ink">
                    {formatPrice(order.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    pending:    "bg-amber-50 text-amber-700",
    confirmed:  "bg-blue-50 text-blue-700",
    processing: "bg-blue-50 text-blue-700",
    shipped:    "bg-purple-50 text-purple-700",
    delivered:  "bg-forest/10 text-forest",
    cancelled:  "bg-danger/10 text-danger",
    refunded:   "bg-stone-light text-muted",
  };
  return (
    <span className={`inline-block text-[11px] px-2 py-0.5 rounded-sm capitalize font-medium ${map[status] ?? "bg-stone-light text-muted"}`}>
      {status}
    </span>
  );
}
