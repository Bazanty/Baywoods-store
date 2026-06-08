"use client";

import Link from "next/link";
import { TrendingUp, ShoppingBag, AlertTriangle, UserPlus } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { AdminAnalytics } from "../analytics";

interface Props {
  analytics: AdminAnalytics;
}

export default function AnalyticsCharts({ analytics }: Props) {
  const { daily, topProducts, lowStock, customerGrowth, conversion, averageOrderValue, repeatCustomerRate } = analytics;

  const totalRevenue = daily.reduce((s, d) => s + d.revenue, 0);
  const totalOrders = daily.reduce((s, d) => s + d.orders, 0);
  const totalNewCustomers = customerGrowth.reduce((s, c) => s + c.newCustomers, 0);

  return (
    <div className="mt-12 space-y-px bg-ink/15 border border-ink/15">
      {/* Headline metric strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-ink/15">
        <MetricTile n="08" label={`Revenue · ${analytics.rangeDays}d`} value={formatPrice(totalRevenue)} />
        <MetricTile n="09" label={`Orders · ${analytics.rangeDays}d`} value={String(totalOrders)} />
        <MetricTile n="10" label="Avg order value" value={formatPrice(averageOrderValue)} />
        <MetricTile n="11" label="Repeat customers" value={`${repeatCustomerRate}%`} />
      </div>

      {/* Revenue chart */}
      <div className="bg-cream p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <TrendingUp size={14} className="text-ink" />
            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink">/ Revenue · last {analytics.rangeDays} days</p>
          </div>
          <span className="font-display text-lg tracking-[-0.01em] text-ink">{formatPrice(totalRevenue)}</span>
        </div>
        <RevenueChart daily={daily} />
      </div>

      {/* Orders chart */}
      <div className="bg-cream p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <ShoppingBag size={14} className="text-ink" />
            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink">/ Orders · last {analytics.rangeDays} days</p>
          </div>
          <span className="font-display text-lg tracking-[-0.01em] text-ink">{totalOrders}</span>
        </div>
        <OrdersChart daily={daily} />
      </div>

      {/* Top products + Low stock side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-px bg-ink/15">
        <div className="bg-cream p-6">
          <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink mb-5">/ Top products</p>
          {topProducts.length === 0 ? (
            <EmptyHint message="No sales in this window yet." />
          ) : (
            <ul className="divide-y divide-ink/10">
              {topProducts.map((p, i) => {
                const max = topProducts[0]?.unitsSold || 1;
                const pct = Math.max(4, (p.unitsSold / max) * 100);
                return (
                  <li key={(p.productId ?? p.name) + i} className="py-2.5">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="flex items-baseline gap-3 min-w-0">
                        <span className="font-mono text-[9px] tracking-[0.18em] text-muted">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="font-display text-sm text-ink truncate">{p.name}</span>
                      </span>
                      <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted shrink-0">
                        {p.unitsSold} units · {formatPrice(p.revenue)}
                      </span>
                    </div>
                    <div className="mt-1.5 h-[3px] bg-ink/10">
                      <div className="h-full bg-ink" style={{ width: `${pct}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="bg-cream p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <AlertTriangle size={14} className="text-ink" />
              <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink">/ Low stock</p>
            </div>
            <Link
              href="/admin/inventory"
              className="font-mono text-[10px] tracking-[0.18em] uppercase text-muted hover:text-ink transition-colors"
            >
              Inventory →
            </Link>
          </div>
          {lowStock.length === 0 ? (
            <EmptyHint message="Stock looks healthy." />
          ) : (
            <ul className="divide-y divide-ink/10">
              {lowStock.map((s) => (
                <li key={`${s.productId}-${s.variantName ?? "base"}`} className="py-2.5 flex items-baseline justify-between gap-3">
                  <div className="min-w-0">
                    {s.slug ? (
                      <Link
                        href={`/product/${s.slug}`}
                        className="font-display text-sm text-ink truncate hover:underline-citrine"
                      >
                        {s.productName}
                      </Link>
                    ) : (
                      <span className="font-display text-sm text-ink truncate">{s.productName}</span>
                    )}
                    {s.variantName && (
                      <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted mt-0.5">
                        {s.variantName}
                      </p>
                    )}
                  </div>
                  <span
                    className={`font-mono text-[10px] tracking-[0.18em] uppercase px-2 py-1 ${
                      s.available === 0 ? "bg-ink text-citrine" : "bg-citrine text-ink"
                    }`}
                  >
                    {s.available === 0 ? "Out" : `${s.available} left`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Customer growth */}
      <div className="bg-cream p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <UserPlus size={14} className="text-ink" />
            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink">/ New customers · last {analytics.rangeDays} days</p>
          </div>
          <span className="font-display text-lg tracking-[-0.01em] text-ink">{totalNewCustomers}</span>
        </div>
        <CustomerGrowthChart points={customerGrowth} />
      </div>

      {/* Conversion proxy */}
      <div className="bg-cream p-6">
        <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink mb-4">/ Cart-to-paid conversion</p>
        <div className="grid grid-cols-3 gap-4">
          <ConversionStat label="Sessions" value={conversion.sessions.toString()} hint="distinct carts" />
          <ConversionStat label="Paid orders" value={conversion.paidOrders.toString()} hint="completed" />
          <ConversionStat label="Conversion" value={`${conversion.rate}%`} hint="paid / sessions" />
        </div>
        <p className="font-mono text-[9px] tracking-[0.14em] uppercase text-muted mt-4">
          / Sessions counted from cart reservations — a proxy for true page-level analytics.
        </p>
      </div>
    </div>
  );
}

function MetricTile({ n, label, value }: { n: string; label: string; value: string }) {
  return (
    <div className="bg-cream p-5 flex flex-col gap-3">
      <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted">/ {n}</p>
      <div>
        <p className="font-display text-2xl tracking-[-0.02em] tabular-nums text-ink leading-none">{value}</p>
        <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-muted mt-3">{label}</p>
      </div>
    </div>
  );
}

function ConversionStat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="border border-ink/15 p-4">
      <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-muted">{label}</p>
      <p className="font-display text-2xl tracking-[-0.02em] text-ink mt-2">{value}</p>
      <p className="font-mono text-[9px] tracking-[0.14em] uppercase text-muted mt-1">{hint}</p>
    </div>
  );
}

function EmptyHint({ message }: { message: string }) {
  return (
    <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-muted py-10 text-center border border-dashed border-ink/15">
      / {message}
    </p>
  );
}

const CHART_HEIGHT = 140;
const CHART_PAD_TOP = 8;
const CHART_PAD_BOTTOM = 22;

function RevenueChart({ daily }: { daily: { date: string; revenue: number }[] }) {
  const max = Math.max(1, ...daily.map((d) => d.revenue));
  const w = 1000;
  const stepX = daily.length > 1 ? w / (daily.length - 1) : w;
  const innerHeight = CHART_HEIGHT - CHART_PAD_TOP - CHART_PAD_BOTTOM;

  const points = daily.map((d, i) => {
    const x = i * stepX;
    const y = CHART_PAD_TOP + (innerHeight - (d.revenue / max) * innerHeight);
    return { x, y, ...d };
  });

  const polyline = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const area = `${points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ")} ${w},${
    CHART_HEIGHT - CHART_PAD_BOTTOM
  } 0,${CHART_HEIGHT - CHART_PAD_BOTTOM}`;

  return (
    <svg viewBox={`0 0 ${w} ${CHART_HEIGHT}`} className="w-full h-[160px]" preserveAspectRatio="none">
      <line
        x1="0"
        y1={CHART_HEIGHT - CHART_PAD_BOTTOM}
        x2={w}
        y2={CHART_HEIGHT - CHART_PAD_BOTTOM}
        className="stroke-ink/20"
        strokeWidth={1}
      />
      <polygon points={area} className="fill-ink/10" />
      <polyline points={polyline} className="stroke-ink fill-none" strokeWidth={2} strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3} className="fill-ink">
          <title>{`${p.date}: ${formatPrice(p.revenue)}`}</title>
        </circle>
      ))}
      {dateTicks(daily.length).map((idx) => {
        const d = daily[idx];
        if (!d) return null;
        return (
          <text
            key={idx}
            x={idx * stepX}
            y={CHART_HEIGHT - 4}
            textAnchor={idx === 0 ? "start" : idx === daily.length - 1 ? "end" : "middle"}
            className="fill-muted"
            style={{ fontSize: 9, fontFamily: "var(--font-mono)", letterSpacing: "0.1em" }}
          >
            {formatDayLabel(d.date)}
          </text>
        );
      })}
    </svg>
  );
}

function OrdersChart({ daily }: { daily: { date: string; orders: number }[] }) {
  const max = Math.max(1, ...daily.map((d) => d.orders));
  const w = 1000;
  const innerHeight = CHART_HEIGHT - CHART_PAD_TOP - CHART_PAD_BOTTOM;
  const barWidth = daily.length > 0 ? (w / daily.length) * 0.72 : 1;
  const gap = daily.length > 0 ? (w / daily.length) * 0.28 : 0;

  return (
    <svg viewBox={`0 0 ${w} ${CHART_HEIGHT}`} className="w-full h-[160px]" preserveAspectRatio="none">
      <line
        x1="0"
        y1={CHART_HEIGHT - CHART_PAD_BOTTOM}
        x2={w}
        y2={CHART_HEIGHT - CHART_PAD_BOTTOM}
        className="stroke-ink/20"
        strokeWidth={1}
      />
      {daily.map((d, i) => {
        const h = max === 0 ? 0 : (d.orders / max) * innerHeight;
        const x = i * (barWidth + gap) + gap / 2;
        const y = CHART_HEIGHT - CHART_PAD_BOTTOM - h;
        return (
          <rect key={i} x={x} y={y} width={barWidth} height={h} className="fill-ink">
            <title>{`${d.date}: ${d.orders} orders`}</title>
          </rect>
        );
      })}
      {dateTicks(daily.length).map((idx) => {
        const d = daily[idx];
        if (!d) return null;
        const x = idx * (barWidth + gap) + barWidth / 2 + gap / 2;
        return (
          <text
            key={idx}
            x={x}
            y={CHART_HEIGHT - 4}
            textAnchor="middle"
            className="fill-muted"
            style={{ fontSize: 9, fontFamily: "var(--font-mono)", letterSpacing: "0.1em" }}
          >
            {formatDayLabel(d.date)}
          </text>
        );
      })}
    </svg>
  );
}

function CustomerGrowthChart({ points }: { points: { date: string; newCustomers: number }[] }) {
  // Cumulative line
  let cum = 0;
  const cumPoints = points.map((p) => {
    cum += p.newCustomers;
    return { date: p.date, value: cum };
  });
  const max = Math.max(1, ...cumPoints.map((p) => p.value));
  const w = 1000;
  const stepX = cumPoints.length > 1 ? w / (cumPoints.length - 1) : w;
  const innerHeight = CHART_HEIGHT - CHART_PAD_TOP - CHART_PAD_BOTTOM;
  const pts = cumPoints.map((p, i) => {
    const x = i * stepX;
    const y = CHART_PAD_TOP + (innerHeight - (p.value / max) * innerHeight);
    return { x, y, ...p };
  });
  const polyline = pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${CHART_HEIGHT}`} className="w-full h-[160px]" preserveAspectRatio="none">
      <line
        x1="0"
        y1={CHART_HEIGHT - CHART_PAD_BOTTOM}
        x2={w}
        y2={CHART_HEIGHT - CHART_PAD_BOTTOM}
        className="stroke-ink/20"
        strokeWidth={1}
      />
      <polyline
        points={polyline}
        className="stroke-ink fill-none"
        strokeWidth={1.5}
        strokeDasharray="3 3"
      />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={2.5} className="fill-citrine stroke-ink" strokeWidth={1}>
          <title>{`${p.date}: ${p.value} total customers`}</title>
        </circle>
      ))}
      {dateTicks(cumPoints.length).map((idx) => {
        const d = cumPoints[idx];
        if (!d) return null;
        return (
          <text
            key={idx}
            x={idx * stepX}
            y={CHART_HEIGHT - 4}
            textAnchor={idx === 0 ? "start" : idx === cumPoints.length - 1 ? "end" : "middle"}
            className="fill-muted"
            style={{ fontSize: 9, fontFamily: "var(--font-mono)", letterSpacing: "0.1em" }}
          >
            {formatDayLabel(d.date)}
          </text>
        );
      })}
    </svg>
  );
}

function dateTicks(length: number) {
  if (length <= 1) return [0];
  if (length <= 8) return Array.from({ length }, (_, i) => i);
  return [0, Math.floor(length / 4), Math.floor(length / 2), Math.floor((length * 3) / 4), length - 1];
}

function formatDayLabel(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-KE", { month: "short", day: "numeric" });
}
