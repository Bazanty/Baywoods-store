import Link from "next/link";
import { Plus, ArrowRight, TrendingUp, Users, DollarSign, CalendarDays } from "lucide-react";
import { getAdminStats, getAdminRevenue } from "./actions";
import { getAdminAnalytics } from "./analytics";
import { formatPrice } from "@/lib/utils";
import { ORDER_STATUS_STYLES, normalizeOrderStatus, orderStatusLabel } from "@/lib/orderStatus";
import StatCards from "./_components/StatCards";
import AnalyticsCharts from "./_components/AnalyticsCharts";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [{ productCount, orderCount, outOfStockCount, recentOrders }, revenue, analytics] = await Promise.all([
    getAdminStats(),
    getAdminRevenue(),
    getAdminAnalytics(30),
  ]);

  return (
    <div className="px-6 lg:px-10 py-10 max-w-6xl">
      <div className="flex items-end justify-between mb-10 border-b border-ink/15 pb-6 flex-wrap gap-4">
        <div>
          <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted mb-3">
            <span className="text-ink">/</span> DASHBOARD
          </p>
          <h1 className="font-display font-medium tracking-[-0.025em] leading-[0.92] text-ink text-4xl sm:text-5xl">
            Overview.
          </h1>
          <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted mt-3">
            / {new Date().toLocaleDateString("en-KE", {
              weekday: "long", day: "numeric", month: "long", year: "numeric",
            })}
          </p>
        </div>
        <Link
          href="/admin/products/new"
          className="btn-primary"
        >
          <Plus size={13} />
          New product
        </Link>
      </div>

      <StatCards
        productCount={productCount}
        orderCount={orderCount}
        outOfStockCount={outOfStockCount}
      />

      {/* Revenue Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px mt-px bg-ink/15 border border-ink/15 border-t-0">
        {[
          { n: "04", label: "Total revenue", value: formatPrice(revenue.totalRevenue), icon: DollarSign },
          { n: "05", label: "This month", value: formatPrice(revenue.monthlyRevenue), icon: CalendarDays },
          { n: "06", label: "Monthly orders", value: String(revenue.monthlyOrders), icon: TrendingUp },
          { n: "07", label: "Customers", value: String(revenue.customerCount), icon: Users },
        ].map(({ n, label, value, icon: Icon }) => (
          <div key={label} className="bg-cream p-5 flex flex-col gap-3">
            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted">/ {n}</p>
            <div className="flex items-end justify-between">
              <div>
                <p className="font-display text-2xl tracking-[-0.02em] tabular-nums text-ink leading-none">{value}</p>
                <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-muted mt-3">{label}</p>
              </div>
              <Icon size={16} strokeWidth={1.5} className="text-ink" />
            </div>
          </div>
        ))}
      </div>

      <AnalyticsCharts analytics={analytics} />

      {/* Recent Orders */}
      <div className="mt-10 border border-ink/15">
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink/15">
          <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink">/ Recent orders</p>
          <Link
            href="/admin/orders"
            className="flex items-center gap-1 font-mono text-[10px] tracking-[0.18em] uppercase text-muted hover:text-ink transition-colors"
          >
            View all <ArrowRight size={11} />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <p className="px-5 py-10 font-mono text-[10px] tracking-[0.16em] uppercase text-muted text-center">
            / No orders yet.
          </p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-ink/15 text-left">
                {["Order", "Customer", "Status", "Total"].map((h, i) => (
                  <th
                    key={h}
                    className={`px-5 py-3 font-mono text-[10px] tracking-[0.18em] uppercase text-muted${i === 3 ? " text-right" : ""}`}
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
                  className={i < recentOrders.length - 1 ? "border-b border-ink/10" : ""}
                >
                  <td className="px-5 py-3.5 font-mono text-xs tracking-[0.06em] text-ink">
                    #BW-{order.id.slice(0, 8).toUpperCase()}
                  </td>
                  <td className="px-5 py-3.5 text-sm text-ink">{order.shipping_name}</td>
                  <td className="px-5 py-3.5">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-5 py-3.5 text-right price text-sm font-medium text-ink">
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
  const normalized = normalizeOrderStatus(status);
  return (
    <span className={`inline-block font-mono text-[9px] tracking-[0.2em] uppercase px-2 py-0.5 ${ORDER_STATUS_STYLES[normalized]}`}>
      {orderStatusLabel(normalized)}
    </span>
  );
}
