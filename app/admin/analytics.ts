"use server";

import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/adminAuth";
import { normalizeOrderStatus } from "@/lib/orderStatus";

function db() {
  return createSupabaseAdminClient();
}

const REVENUE_STATUSES = new Set([
  "PAID",
  "VERIFICATION_PENDING",
  "VERIFIED",
  "PACKED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
]);

export interface DailyPoint {
  date: string;
  revenue: number;
  orders: number;
}

export interface TopProduct {
  productId: string | null;
  name: string;
  unitsSold: number;
  revenue: number;
}

export interface LowStockProduct {
  productId: string;
  productName: string;
  variantName: string | null;
  available: number;
  slug: string | null;
}

export interface CustomerGrowthPoint {
  date: string;
  newCustomers: number;
}

export interface AdminAnalytics {
  rangeDays: number;
  daily: DailyPoint[];
  topProducts: TopProduct[];
  lowStock: LowStockProduct[];
  customerGrowth: CustomerGrowthPoint[];
  conversion: {
    sessions: number; // proxy: distinct cart_reservations
    paidOrders: number;
    rate: number;
  };
  averageOrderValue: number;
  repeatCustomerRate: number;
}

function isoDay(date: Date) {
  return date.toISOString().slice(0, 10);
}

function fillDays(start: Date, end: Date) {
  const out: string[] = [];
  const cur = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const stop = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  while (cur <= stop) {
    out.push(isoDay(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

export async function getAdminAnalytics(rangeDays = 30): Promise<AdminAnalytics> {
  await requireAdmin();

  const now = new Date();
  const since = new Date(now.getTime() - (rangeDays - 1) * 24 * 60 * 60 * 1000);
  const sinceIso = new Date(
    since.getFullYear(),
    since.getMonth(),
    since.getDate()
  ).toISOString();

  const empty: AdminAnalytics = {
    rangeDays,
    daily: fillDays(since, now).map((d) => ({ date: d, revenue: 0, orders: 0 })),
    topProducts: [],
    lowStock: [],
    customerGrowth: fillDays(since, now).map((d) => ({ date: d, newCustomers: 0 })),
    conversion: { sessions: 0, paidOrders: 0, rate: 0 },
    averageOrderValue: 0,
    repeatCustomerRate: 0,
  };

  try {
    const [ordersRes, itemsRes, lowStockRes, customersRes, reservationsRes] = await Promise.all([
      db()
        .from("orders")
        .select("id, total, status, created_at, email, user_id")
        .gte("created_at", sinceIso)
        .order("created_at", { ascending: true }),
      db()
        .from("order_items")
        .select("product_id, product_name, quantity, line_total, orders!inner(status, created_at)")
        .gte("orders.created_at", sinceIso),
      db()
        .from("inventory")
        .select(`
          quantity, reserved,
          products ( id, name, slug ),
          product_variants ( name )
        `)
        .order("quantity", { ascending: true })
        .limit(50),
      db()
        .from("orders")
        .select("email, created_at")
        .gte("created_at", sinceIso)
        .not("email", "is", null),
      db()
        .from("cart_reservations")
        .select("session_id, created_at", { count: "exact", head: false })
        .gte("created_at", sinceIso),
    ]);

    const orders = ordersRes.data ?? [];

    // Daily revenue + orders
    const dailyMap = new Map<string, { revenue: number; orders: number }>();
    for (const day of fillDays(since, now)) {
      dailyMap.set(day, { revenue: 0, orders: 0 });
    }
    let paidOrderCount = 0;
    for (const o of orders) {
      const key = isoDay(new Date(o.created_at));
      const slot = dailyMap.get(key);
      if (!slot) continue;
      const status = String(o.status);
      const counts = REVENUE_STATUSES.has(status);
      if (counts) {
        slot.revenue += Number(o.total) || 0;
        slot.orders += 1;
        paidOrderCount += 1;
      }
    }
    const daily: DailyPoint[] = Array.from(dailyMap.entries()).map(([date, v]) => ({
      date,
      revenue: v.revenue,
      orders: v.orders,
    }));

    // Top products by units sold
    const productMap = new Map<string, TopProduct>();
    for (const it of itemsRes.data ?? ([] as any[])) {
      const orderStatus = String((it as any).orders?.status ?? "");
      if (!REVENUE_STATUSES.has(orderStatus)) continue;
      const id = (it as any).product_id ?? null;
      const key = id ?? `__${(it as any).product_name}`;
      const existing = productMap.get(key);
      if (existing) {
        existing.unitsSold += Number((it as any).quantity) || 0;
        existing.revenue += Number((it as any).line_total) || 0;
      } else {
        productMap.set(key, {
          productId: id,
          name: (it as any).product_name ?? "Unknown",
          unitsSold: Number((it as any).quantity) || 0,
          revenue: Number((it as any).line_total) || 0,
        });
      }
    }
    const topProducts = Array.from(productMap.values())
      .sort((a, b) => b.unitsSold - a.unitsSold)
      .slice(0, 8);

    // Low stock — anything with available <= 5
    const lowStock: LowStockProduct[] = [];
    for (const row of (lowStockRes.data ?? []) as any[]) {
      const product = Array.isArray(row.products) ? row.products[0] : row.products;
      const variant = Array.isArray(row.product_variants)
        ? row.product_variants[0]
        : row.product_variants;
      if (!product) continue;
      const available = Math.max(0, Number(row.quantity) - Number(row.reserved));
      if (available > 5) continue;
      lowStock.push({
        productId: product.id,
        productName: product.name ?? "—",
        variantName: variant?.name ?? null,
        available,
        slug: product.slug ?? null,
      });
    }
    lowStock.sort((a, b) => a.available - b.available);

    // Customer growth — count first-seen email per day inside the window.
    // For accuracy we need to know which emails are "new" vs existing — query
    // the earliest order per email and only count first appearances within the
    // window.
    const customerGrowthMap = new Map<string, number>();
    for (const day of fillDays(since, now)) customerGrowthMap.set(day, 0);

    const firstSeen = new Map<string, string>();
    for (const o of (customersRes.data ?? []) as any[]) {
      const email = o.email;
      if (!email) continue;
      const existing = firstSeen.get(email);
      if (!existing || new Date(o.created_at) < new Date(existing)) {
        firstSeen.set(email, o.created_at);
      }
    }

    // Find prior earliest dates for these emails (outside the window) to know
    // who is truly new.
    const emails = Array.from(firstSeen.keys());
    if (emails.length > 0) {
      const { data: priorOrders } = await db()
        .from("orders")
        .select("email, created_at")
        .in("email", emails)
        .lt("created_at", sinceIso);
      const priorByEmail = new Map<string, string>();
      for (const p of (priorOrders ?? []) as any[]) {
        const existing = priorByEmail.get(p.email);
        if (!existing || new Date(p.created_at) < new Date(existing)) {
          priorByEmail.set(p.email, p.created_at);
        }
      }
      for (const [email, firstDate] of firstSeen) {
        if (priorByEmail.has(email)) continue; // existing customer
        const key = isoDay(new Date(firstDate));
        if (customerGrowthMap.has(key)) {
          customerGrowthMap.set(key, (customerGrowthMap.get(key) ?? 0) + 1);
        }
      }
    }
    const customerGrowth: CustomerGrowthPoint[] = Array.from(customerGrowthMap.entries()).map(
      ([date, newCustomers]) => ({ date, newCustomers })
    );

    // Conversion: distinct sessions in cart_reservations (proxy) vs paid orders.
    const sessionSet = new Set<string>();
    for (const r of (reservationsRes.data ?? []) as any[]) {
      if (r.session_id) sessionSet.add(r.session_id);
    }
    const sessions = sessionSet.size;
    const conversionRate = sessions > 0 ? (paidOrderCount / sessions) * 100 : 0;

    // AOV & repeat-customer rate
    const paidTotals = orders
      .filter((o) => REVENUE_STATUSES.has(String(o.status)))
      .map((o) => Number(o.total) || 0);
    const aov =
      paidTotals.length > 0
        ? paidTotals.reduce((s, n) => s + n, 0) / paidTotals.length
        : 0;

    const ordersPerEmail = new Map<string, number>();
    for (const o of orders) {
      const status = normalizeOrderStatus(String(o.status));
      if (status === "CANCELLED" || status === "REFUNDED" || status === "FAILED") continue;
      const key = o.email ?? `user:${o.user_id}`;
      if (!key) continue;
      ordersPerEmail.set(key, (ordersPerEmail.get(key) ?? 0) + 1);
    }
    const totalCustomers = ordersPerEmail.size;
    const repeat = Array.from(ordersPerEmail.values()).filter((n) => n > 1).length;
    const repeatRate = totalCustomers > 0 ? (repeat / totalCustomers) * 100 : 0;

    return {
      rangeDays,
      daily,
      topProducts,
      lowStock: lowStock.slice(0, 10),
      customerGrowth,
      conversion: {
        sessions,
        paidOrders: paidOrderCount,
        rate: Math.round(conversionRate * 10) / 10,
      },
      averageOrderValue: Math.round(aov),
      repeatCustomerRate: Math.round(repeatRate * 10) / 10,
    };
  } catch {
    return empty;
  }
}
