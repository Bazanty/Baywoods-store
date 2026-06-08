import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Mail, Phone, MapPin, Truck, Receipt, User } from "lucide-react";
import { requireAdmin } from "@/lib/adminAuth";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";
import {
  ORDER_STATUS_STYLES,
  normalizeOrderStatus,
  orderStatusLabel,
} from "@/lib/orderStatus";
import OrderStatusControl from "../OrderStatusControl";
import ShippingEditor from "./ShippingEditor";

export const dynamic = "force-dynamic";

const SHIPPING_EDITABLE: ReadonlySet<string> = new Set([
  "PENDING_PAYMENT",
  "VERIFICATION_PENDING",
  "PAID",
  "VERIFIED",
  "PACKED",
]);

const UUID_RX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function loadOrder(id: string) {
  await requireAdmin();
  const db = createSupabaseAdminClient();
  const { data, error } = await db
    .from("orders")
    .select(`
      id, user_id, status, payment_status, payment_method,
      shipping_name, shipping_line1, shipping_city, shipping_state, shipping_postal, shipping_country, shipping_phone, email,
      tracking_number, shipping_method, failed_reason,
      subtotal, discount_amount, shipping_cost, tax_amount, total,
      created_at, updated_at, shipped_at, delivered_at,
      payments (
        id, status, amount, currency, mpesa_receipt, mpesa_phone, mpesa_amount,
        checkout_request_id, merchant_request_id, result_desc, failure_code,
        callback_received_at, paid_at, created_at
      ),
      order_items (
        id, product_id, product_name, variant_name, quantity, unit_price, line_total,
        products ( id, is_active )
      )
    `)
    .eq("id", id)
    .single();
  if (error || !data) return null;
  return data;
}

async function loadCustomerOrderCount(userId: string | null, email: string | null) {
  if (!userId && !email) return 0;
  const db = createSupabaseAdminClient();
  const q = db.from("orders").select("id", { count: "exact", head: true });
  const { count } = userId
    ? await q.eq("user_id", userId)
    : await q.eq("email", email!);
  return count ?? 0;
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminOrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID_RX.test(id)) notFound();

  const order = await loadOrder(id);
  if (!order) notFound();

  const status = normalizeOrderStatus(order.status);
  const shortId = order.id.slice(0, 8).toUpperCase();
  const customerOrderCount = await loadCustomerOrderCount(order.user_id, order.email);
  const payments = [...(order.payments ?? [])].sort(
    (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className="px-6 lg:px-10 py-10 max-w-5xl">
      <Link
        href="/admin/orders"
        className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted hover:text-ink inline-flex items-center gap-1 mb-3"
      >
        <ChevronLeft size={12} /> Orders
      </Link>

      <div className="border-b border-ink/15 pb-6 mb-8 flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted mb-3">
            <span className="text-ink">/</span> ORDER #BW-{shortId}
          </p>
          <h1 className="font-display font-medium tracking-[-0.025em] leading-[0.92] text-ink text-4xl sm:text-5xl">
            {order.shipping_name}
          </h1>
          <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted mt-3">
            / Placed {formatDateTime(order.created_at)}
          </p>
        </div>
        <span
          className={`font-mono text-[10px] tracking-[0.2em] uppercase px-2.5 py-1 ${ORDER_STATUS_STYLES[status]}`}
        >
          {orderStatusLabel(status)}
        </span>
      </div>

      <div className="border border-ink/15 bg-cream p-5 mb-6">
        <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted mb-3">/ Status & tracking</p>
        <OrderStatusControl
          orderId={order.id}
          currentStatus={status}
          currentTracking={order.tracking_number ?? ""}
        />
        {order.failed_reason && (
          <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-danger border-l-2 border-danger pl-3 py-2 mt-4">
            / {order.failed_reason}
          </p>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <section className="border border-ink/15 bg-cream p-5">
          <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted mb-3 flex items-center gap-2">
            <User size={11} /> / Customer
          </p>
          <p className="font-display text-base tracking-[-0.01em] text-ink">{order.shipping_name}</p>
          <div className="mt-3 space-y-1.5 font-mono text-[11px] tracking-[0.1em] uppercase text-muted">
            <div className="flex items-center gap-2">
              <Mail size={11} />
              <a href={`mailto:${order.email}`} className="text-ink underline-citrine">{order.email}</a>
            </div>
            <div className="flex items-center gap-2">
              <Phone size={11} />
              <a href={`tel:${order.shipping_phone}`} className="text-ink underline-citrine">{order.shipping_phone}</a>
            </div>
            <p className="text-muted mt-3">
              {customerOrderCount} order{customerOrderCount === 1 ? "" : "s"} placed
              {order.user_id ? " · registered account" : " · guest checkout"}
            </p>
          </div>
        </section>

        <section className="border border-ink/15 bg-cream p-5">
          <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted mb-3 flex items-center gap-2">
            <MapPin size={11} /> / Shipping
          </p>
          <p className="font-display text-base tracking-[-0.01em] text-ink">{order.shipping_line1}</p>
          <p className="text-sm text-muted mt-1">
            {order.shipping_city}
            {order.shipping_state ? `, ${order.shipping_state}` : ""}
            {order.shipping_postal ? ` ${order.shipping_postal}` : ""}
          </p>
          <p className="text-sm text-muted">{order.shipping_country}</p>
          <div className="mt-3 pt-3 border-t border-ink/15 space-y-1.5 font-mono text-[11px] tracking-[0.1em] uppercase text-muted">
            <div className="flex items-center gap-2">
              <Truck size={11} /> {order.shipping_method === "express" ? "Express" : "Standard"}
            </div>
            {order.shipped_at && <p>Shipped {formatDateTime(order.shipped_at)}</p>}
            {order.delivered_at && <p>Delivered {formatDateTime(order.delivered_at)}</p>}
          </div>
          <ShippingEditor
            orderId={order.id}
            editable={SHIPPING_EDITABLE.has(status)}
            initial={{
              name: order.shipping_name ?? "",
              line1: order.shipping_line1 ?? "",
              city: order.shipping_city ?? "",
              state: order.shipping_state ?? "Nairobi",
              postal: order.shipping_postal ?? "",
              phone: order.shipping_phone ?? "",
            }}
          />
        </section>
      </div>

      <section className="border border-ink/15 bg-cream mb-6">
        <header className="px-5 py-3 border-b border-ink/15 flex items-center gap-2">
          <Receipt size={11} className="text-muted" />
          <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink">
            / Items ({(order.order_items ?? []).reduce((s: number, i: any) => s + i.quantity, 0)})
          </p>
        </header>
        <ul className="divide-y divide-ink/10">
          {(order.order_items ?? []).map((item: any, i: number) => {
            const productId = item.products?.id ?? null;
            const isActive = item.products?.is_active ?? false;
            return (
              <li key={item.id} className="flex items-start gap-4 px-5 py-4">
                <span className="font-mono text-[10px] tracking-[0.16em] text-muted shrink-0 w-7 pt-1">
                  /{String(i + 1).padStart(2, "0")}
                </span>
                <div className="flex-1 min-w-0">
                  {productId ? (
                    <Link
                      href={`/admin/products/${productId}/edit`}
                      className="font-display text-base tracking-[-0.01em] text-ink hover:underline-citrine inline-flex items-center gap-2 flex-wrap"
                    >
                      {item.product_name}
                      {!isActive && (
                        <span className="font-mono text-[9px] tracking-[0.18em] uppercase bg-beige-dark text-muted px-1.5 py-0.5">
                          Inactive
                        </span>
                      )}
                    </Link>
                  ) : (
                    <p className="font-display text-base tracking-[-0.01em] text-ink inline-flex items-center gap-2 flex-wrap">
                      {item.product_name}
                      <span className="font-mono text-[9px] tracking-[0.18em] uppercase bg-danger/15 text-danger px-1.5 py-0.5">
                        Deleted
                      </span>
                    </p>
                  )}
                  {item.variant_name && (
                    <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted mt-0.5">
                      {item.variant_name}
                    </p>
                  )}
                  <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted mt-2">
                    Qty · {item.quantity} · {formatPrice(Number(item.unit_price))}
                  </p>
                </div>
                <p className="price text-sm font-medium text-ink shrink-0 self-start tabular-nums">
                  {formatPrice(Number(item.line_total))}
                </p>
              </li>
            );
          })}
        </ul>
        <div className="px-5 py-4 border-t border-ink/15 space-y-1.5 font-mono text-[11px] tracking-[0.1em] uppercase">
          <Row label="Subtotal" value={formatPrice(Number(order.subtotal))} />
          {Number(order.discount_amount) > 0 && (
            <Row label="Discount" value={`-${formatPrice(Number(order.discount_amount))}`} />
          )}
          <Row label="Dispatch" value={Number(order.shipping_cost) === 0 ? "Free" : formatPrice(Number(order.shipping_cost))} />
          {Number(order.tax_amount) > 0 && <Row label="Tax" value={formatPrice(Number(order.tax_amount))} />}
        </div>
        <div className="px-5 py-3 border-t border-ink/15 flex justify-between items-baseline">
          <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted">Total</span>
          <span className="font-display text-2xl tracking-[-0.02em] text-ink tabular-nums">
            {formatPrice(Number(order.total))}
          </span>
        </div>
      </section>

      <section className="border border-ink/15 bg-cream">
        <header className="px-5 py-3 border-b border-ink/15 flex items-center justify-between">
          <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink">/ Payment history</p>
          <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted">
            {order.payment_method?.toUpperCase()} · {order.payment_status}
          </span>
        </header>
        {payments.length === 0 ? (
          <p className="px-5 py-10 text-center font-mono text-[10px] tracking-[0.16em] uppercase text-muted">
            / No payment attempts recorded.
          </p>
        ) : (
          <ul className="divide-y divide-ink/10">
            {payments.map((p: any, i: number) => (
              <li key={p.id} className="px-5 py-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-muted">/{String(i + 1).padStart(2, "0")} Status</p>
                  <p className="font-mono text-ink mt-1">{p.status}</p>
                </div>
                <div>
                  <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-muted">Amount</p>
                  <p className="font-mono text-ink mt-1 tabular-nums">
                    {formatPrice(Number(p.mpesa_amount ?? p.amount))}
                  </p>
                </div>
                <div>
                  <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-muted">Receipt</p>
                  <p className="font-mono text-ink mt-1">{p.mpesa_receipt ?? "—"}</p>
                </div>
                <div>
                  <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-muted">When</p>
                  <p className="font-mono text-muted mt-1">{formatDateTime(p.paid_at ?? p.callback_received_at ?? p.created_at)}</p>
                </div>
                {p.result_desc && (
                  <p className="col-span-full font-mono text-[10px] tracking-[0.14em] uppercase text-muted border-l-2 border-ink/15 pl-3 py-1">
                    / {p.result_desc}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-muted">
      <span>{label}</span>
      <span className="tabular-nums text-ink">{value}</span>
    </div>
  );
}
