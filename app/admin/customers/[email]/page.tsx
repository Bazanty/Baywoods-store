import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Mail, MapPin, ShoppingBag, Star } from "lucide-react";
import { requireAdmin } from "@/lib/adminAuth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";
import {
  ORDER_STATUS_STYLES,
  normalizeOrderStatus,
  orderStatusLabel,
} from "@/lib/orderStatus";

export const dynamic = "force-dynamic";

async function loadCustomer(emailParam: string) {
  await requireAdmin();
  const email = decodeURIComponent(emailParam).toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;

  const db = createSupabaseAdminClient();

  const { data: orders } = await db
    .from("orders")
    .select(`
      id, user_id, status, payment_status, total, shipping_name, shipping_phone,
      shipping_line1, shipping_city, shipping_state, shipping_method,
      tracking_number, created_at,
      order_items ( id, product_name, variant_name, quantity, unit_price )
    `)
    .ilike("email", email)
    .order("created_at", { ascending: false });

  if (!orders || orders.length === 0) return null;

  const userId = orders.find((o) => o.user_id)?.user_id ?? null;
  const name = orders.find((o) => o.shipping_name)?.shipping_name ?? "";
  const phone = orders.find((o) => o.shipping_phone)?.shipping_phone ?? "";

  let addresses: any[] = [];
  let reviews: any[] = [];
  if (userId) {
    const [{ data: addrs }, { data: revs }] = await Promise.all([
      db.from("addresses").select("id, label, first_name, last_name, address, line1, city, county, state, phone, is_default").eq("user_id", userId),
      db.from("reviews").select("id, rating, title, body, is_approved, created_at, products(name, slug)").eq("user_id", userId).order("created_at", { ascending: false }).limit(10),
    ]);
    addresses = addrs ?? [];
    reviews = revs ?? [];
  }

  const lifetime = orders.reduce(
    (acc, o) => {
      const status = normalizeOrderStatus(o.status);
      const counts = status !== "CANCELLED" && status !== "REFUNDED" && status !== "FAILED";
      if (counts) {
        acc.totalSpent += Number(o.total);
        acc.paidOrders++;
      }
      return acc;
    },
    { totalSpent: 0, paidOrders: 0 }
  );
  const avgOrder = lifetime.paidOrders > 0 ? lifetime.totalSpent / lifetime.paidOrders : 0;

  return {
    email,
    userId,
    name,
    phone,
    orders,
    addresses,
    reviews,
    lifetime,
    avgOrder,
  };
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default async function AdminCustomerDetail({ params }: { params: Promise<{ email: string }> }) {
  const { email } = await params;
  const customer = await loadCustomer(email);
  if (!customer) notFound();

  const firstOrder = customer.orders[customer.orders.length - 1];
  const lastOrder = customer.orders[0];

  return (
    <div className="px-6 lg:px-10 py-10 max-w-5xl">
      <Link
        href="/admin/customers"
        className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted hover:text-ink inline-flex items-center gap-1 mb-3"
      >
        <ChevronLeft size={12} /> Customers
      </Link>

      <div className="border-b border-ink/15 pb-6 mb-8">
        <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted mb-3">
          <span className="text-ink">/</span> CUSTOMER
        </p>
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <h1 className="font-display font-medium tracking-[-0.025em] leading-[0.92] text-ink text-4xl sm:text-5xl">
              {customer.name || customer.email}
            </h1>
            <div className="mt-3 flex items-center gap-3 flex-wrap font-mono text-[10px] tracking-[0.14em] uppercase text-muted">
              <a href={`mailto:${customer.email}`} className="text-ink underline-citrine inline-flex items-center gap-1.5">
                <Mail size={11} /> {customer.email}
              </a>
              {customer.phone && <span>· {customer.phone}</span>}
              <span className={`px-2 py-0.5 ${customer.userId ? "bg-citrine text-ink" : "border border-ink/30 text-ink"}`}>
                {customer.userId ? "Registered" : "Guest"}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px mb-8 bg-ink/15 border border-ink/15">
        {[
          { n: "01", label: "Lifetime spend", value: formatPrice(customer.lifetime.totalSpent) },
          { n: "02", label: "Paid orders", value: String(customer.lifetime.paidOrders) },
          { n: "03", label: "Avg order", value: formatPrice(customer.avgOrder) },
          { n: "04", label: "All orders", value: String(customer.orders.length) },
        ].map((s) => (
          <div key={s.n} className="bg-cream p-5">
            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted">/ {s.n}</p>
            <p className="font-display text-2xl tracking-[-0.02em] tabular-nums text-ink leading-none mt-2">{s.value}</p>
            <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-muted mt-3">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted mb-8 flex flex-wrap gap-x-6 gap-y-2">
        <span>/ First order {formatDate(firstOrder?.created_at)}</span>
        <span>/ Last order {formatDate(lastOrder?.created_at)}</span>
      </div>

      <section className="mb-10">
        <div className="border-b border-ink/15 pb-3 mb-4 flex items-center justify-between">
          <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink flex items-center gap-2">
            <ShoppingBag size={11} /> / Orders
          </p>
          <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted">
            {customer.orders.length} total
          </span>
        </div>
        <div className="border border-ink/15 divide-y divide-ink/10">
          {customer.orders.map((order: any, i: number) => {
            const status = normalizeOrderStatus(order.status);
            const firstItem = order.order_items?.[0];
            const moreCount = Math.max(0, (order.order_items?.length ?? 1) - 1);
            return (
              <Link
                key={order.id}
                href={`/admin/orders/${order.id}`}
                className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-beige-dark transition-colors bg-cream"
              >
                <div className="flex items-baseline gap-4 min-w-0">
                  <span className="font-mono text-[10px] tracking-[0.16em] text-muted shrink-0">
                    /{String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <p className="font-mono text-sm tracking-[0.06em] text-ink">
                      #BW-{order.id.slice(0, 8).toUpperCase()}
                    </p>
                    <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted mt-1 truncate">
                      {formatDate(order.created_at)}
                      {firstItem ? ` · ${firstItem.product_name}` : ""}
                      {moreCount > 0 ? ` +${moreCount} more` : ""}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className={`font-mono text-[9px] tracking-[0.2em] uppercase px-2 py-0.5 ${ORDER_STATUS_STYLES[status]}`}>
                    {orderStatusLabel(status)}
                  </span>
                  <p className="price text-sm font-medium text-ink mt-1.5 tabular-nums">
                    {formatPrice(Number(order.total))}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {customer.addresses.length > 0 && (
        <section className="mb-10">
          <div className="border-b border-ink/15 pb-3 mb-4">
            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink flex items-center gap-2">
              <MapPin size={11} /> / Addresses
            </p>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {customer.addresses.map((a: any) => (
              <div key={a.id} className="border border-ink/15 bg-cream p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted">{a.label ?? "Home"}</span>
                  {a.is_default && (
                    <span className="font-mono text-[9px] tracking-[0.18em] uppercase bg-ink text-citrine px-1.5 py-0.5">
                      Default
                    </span>
                  )}
                </div>
                <p className="font-display text-sm tracking-[-0.01em] text-ink">
                  {a.first_name} {a.last_name}
                </p>
                <p className="text-sm text-muted mt-1">
                  {a.address ?? a.line1}
                  <br />
                  {a.city}{a.county || a.state ? `, ${a.county ?? a.state}` : ""}
                </p>
                {a.phone && (
                  <p className="font-mono text-xs tabular-nums text-muted mt-2">{a.phone}</p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {customer.reviews.length > 0 && (
        <section>
          <div className="border-b border-ink/15 pb-3 mb-4">
            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink flex items-center gap-2">
              <Star size={11} /> / Reviews
            </p>
          </div>
          <div className="space-y-3">
            {customer.reviews.map((r: any) => (
              <div key={r.id} className="border border-ink/15 bg-cream p-4">
                <div className="flex items-center gap-3 mb-2">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={11}
                        className={i < r.rating ? "fill-ink text-ink" : "fill-ink/15 text-ink/15"}
                      />
                    ))}
                  </div>
                  <span
                    className={`font-mono text-[9px] tracking-[0.2em] uppercase px-2 py-0.5 ${
                      r.is_approved ? "bg-citrine text-ink" : "border border-ink text-ink"
                    }`}
                  >
                    {r.is_approved ? "Published" : "Pending"}
                  </span>
                  <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted">
                    {formatDate(r.created_at)}
                  </span>
                </div>
                {r.products?.slug && (
                  <Link
                    href={`/product/${r.products.slug}`}
                    target="_blank"
                    className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink underline-citrine"
                  >
                    {r.products.name} →
                  </Link>
                )}
                {r.title && (
                  <p className="font-display text-base tracking-[-0.01em] text-ink mt-1">{r.title}</p>
                )}
                <p className="text-sm text-ink/75 leading-relaxed mt-1">{r.body}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
