import { headers } from "next/headers";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Check, Truck, Package, MapPin, Mail, Phone, Receipt } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { normalizeOrderStatus, orderStatusLabel, type OrderStatus } from "@/lib/orderStatus";
import OrderClearCart from "./OrderClearCart";
import CancelOrderButton from "./CancelOrderButton";
import ResendConfirmationButton from "./ResendConfirmationButton";

export const dynamic = "force-dynamic";

const MANUAL_MPESA = process.env.NEXT_PUBLIC_MPESA_MANUAL === "true";

interface OrderPageProps {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ t?: string }>;
}

interface OrderResponse {
  id: string;
  email: string;
  status: string;
  paymentMethod: "mpesa" | "card" | string;
  paymentStatus: string;
  shipping: {
    name: string;
    line1: string;
    city: string;
    state: string;
    postal: string;
    country: string;
    phone: string;
    method: string;
  };
  totals: {
    subtotal: number;
    discount: number;
    shipping: number;
    tax: number;
    total: number;
  };
  trackingNumber: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
  payment: {
    status: string;
    amount: number;
    currency: string;
    checkoutRequestId: string | null;
    merchantRequestId: string | null;
    mpesaReceipt: string | null;
    phone: string | null;
    resultDesc: string | null;
    paidAt: string | null;
  } | null;
  items: {
    id: string;
    productId: string;
    productName: string;
    productSlug: string | null;
    variantName: string | null;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
    image: string | null;
  }[];
}

async function fetchOrder(orderId: string, token?: string): Promise<OrderResponse | null> {
  const h = await headers();
  const host = h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  const cookie = h.get("cookie");
  const base = `${proto}://${host}`;
  const url = `${base}/api/orders/${orderId}${token ? `?token=${encodeURIComponent(token)}` : ""}`;

  try {
    const res = await fetch(url, {
      cache: "no-store",
      headers: cookie ? { Cookie: cookie } : {},
    });
    if (!res.ok) return null;
    return (await res.json()) as OrderResponse;
  } catch {
    return null;
  }
}

const STATUS_STEPS: { key: OrderStatus; label: string; icon: typeof Check }[] = [
  { key: "PAID",            label: "Paid",        icon: Check },
  { key: "VERIFIED",        label: "Verified",    icon: Check },
  { key: "PACKED",          label: "Packed",      icon: Package },
  { key: "OUT_FOR_DELIVERY", label: "Out",        icon: Truck },
  { key: "DELIVERED",       label: "Delivered",   icon: MapPin },
];

function activeStepIndex(status: string): number {
  const normalized = normalizeOrderStatus(status);
  if (normalized === "PENDING_PAYMENT" || normalized === "FAILED" || normalized === "CANCELLED") return 0;
  if (normalized === "VERIFICATION_PENDING") return 1;
  const idx = STATUS_STEPS.findIndex((s) => s.key === normalized);
  return idx === -1 ? 0 : idx;
}

export default async function OrderPage({ params, searchParams }: OrderPageProps) {
  const [{ orderId }, query] = await Promise.all([params, searchParams]);
  const order = await fetchOrder(orderId, query?.t);
  if (!order) notFound();

  const stepIdx = activeStepIndex(order.status);
  const normalizedStatus = normalizeOrderStatus(order.status);
  const shortId = order.id.slice(0, 8).toUpperCase();
  const primaryItem = order.items[0];
  const placedDate = new Date(order.createdAt).toLocaleDateString("en-KE", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="pt-20 lg:pt-24 pb-24 min-h-screen">
      <OrderClearCart />

      <div className="container-px max-w-5xl mx-auto">
        {/* Hero confirmation */}
        <div className="border border-ink/20 p-8 lg:p-12 mb-8 bg-cream grain relative">
          <div className="flex items-start gap-5">
            <div className="w-12 h-12 bg-ink flex items-center justify-center shrink-0">
              <Check size={22} className="text-citrine" strokeWidth={2.5} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-muted">
                / {normalizedStatus === "FAILED"
                  ? "Payment failed"
                  : normalizedStatus === "PENDING_PAYMENT"
                  ? "Payment pending"
                  : "Order confirmed"}
              </p>
              <h1 className="font-display font-medium text-4xl lg:text-6xl tracking-[-0.025em] leading-[0.94] text-ink mt-3">
                Thank you,<br />{order.shipping.name.split(" ")[0]}.
              </h1>
              <p className="mt-5 max-w-md text-sm leading-relaxed text-ink/70">
                {normalizedStatus === "PENDING_PAYMENT"
                  ? MANUAL_MPESA
                    ? "We've received your M-Pesa code and are confirming the payment. You'll get an email once it's verified and your order moves to dispatch."
                    : "Waiting for secure payment confirmation from M-Pesa."
                  : normalizedStatus === "FAILED"
                  ? "The payment was not completed. Contact support if money left your account."
                  : (
                    <>
                      Confirmation sent to{" "}
                      <span className="text-ink font-medium">{order.email}</span>. Your order is being prepared.
                    </>
                  )}
              </p>
              <div className="flex flex-wrap gap-x-6 gap-y-2 mt-6 font-mono text-[10px] tracking-[0.18em] uppercase text-muted">
                <span>Order <span className="text-ink">#BW-{shortId}</span></span>
                <span>{placedDate}</span>
                <span>{orderStatusLabel(order.status)}</span>
              </div>
            </div>
          </div>

          {/* Status timeline */}
          <div className="mt-12 pt-8 border-t border-ink/15">
            <div className="flex items-start justify-between relative">
              <div className="absolute top-4 left-[10%] right-[10%] h-px bg-ink/15 -z-0" />
              <div
                className="absolute top-4 left-[10%] h-px bg-ink transition-all duration-700 -z-0"
                style={{ width: `${(stepIdx / (STATUS_STEPS.length - 1)) * 80}%` }}
              />
              {STATUS_STEPS.map((step, i) => {
                const Icon = step.icon;
                const reached = i <= stepIdx;
                const active = i === stepIdx;
                return (
                  <div key={step.key} className="flex flex-col items-center gap-2 relative z-10 flex-1">
                    <div
                      className={`w-8 h-8 flex items-center justify-center transition-colors ${
                        active
                          ? "bg-ink text-citrine"
                          : reached
                          ? "bg-ink text-cream"
                          : "border border-ink/25 bg-cream text-muted"
                      }`}
                    >
                      <Icon size={13} strokeWidth={2.25} />
                    </div>
                    <span
                      className={`font-mono text-[10px] tracking-[0.16em] uppercase text-center ${
                        reached ? "text-ink" : "text-muted"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
            {order.trackingNumber && (
              <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-muted mt-6 text-center">
                / Tracking{" "}
                <span className="text-ink">{order.trackingNumber}</span>
              </p>
            )}
          </div>
        </div>

        {/* Two-column body */}
        <div className="grid lg:grid-cols-[1fr_360px] gap-6">
          {/* Items */}
          <section className="border border-ink/20 bg-cream">
            <header className="px-6 py-4 border-b border-ink/15 flex items-center gap-3">
              <Receipt size={14} className="text-muted" />
              <h2 className="font-mono text-[10px] tracking-[0.22em] uppercase text-ink">
                / Items ({order.items.reduce((s, i) => s + i.quantity, 0)})
              </h2>
            </header>
            <ul className="divide-y divide-ink/10">
              {order.items.map((item, i) => (
                <li key={item.id} className="flex gap-4 p-6">
                  <span className="font-mono text-[10px] tracking-[0.16em] text-muted pt-1 shrink-0 w-7">
                    /{String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="relative w-20 h-24 bg-beige-dark shrink-0 overflow-hidden border border-ink/10">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.productName}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="flex-1 min-w-0">
                    {item.productSlug ? (
                      <Link
                        href={`/product/${item.productSlug}`}
                        className="font-display text-base tracking-[-0.01em] text-ink hover:underline-citrine line-clamp-2"
                      >
                        {item.productName}
                      </Link>
                    ) : (
                      <p className="font-display text-base tracking-[-0.01em] text-ink line-clamp-2">{item.productName}</p>
                    )}
                    {item.variantName && (
                      <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted mt-1">{item.variantName}</p>
                    )}
                    <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted mt-2">Qty · {item.quantity}</p>
                  </div>
                  <p className="price text-sm font-medium text-ink shrink-0 self-start">
                    {formatPrice(item.lineTotal)}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          {/* Side: shipping + totals */}
          <aside className="space-y-4">
            <div className="border border-ink/20 bg-cream p-6">
              <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-muted mb-3">/ Shipping to</p>
              <p className="font-display text-base tracking-[-0.01em] text-ink">{order.shipping.name}</p>
              <p className="text-sm text-muted mt-2 leading-relaxed">
                {order.shipping.line1}
                <br />
                {order.shipping.city}, {order.shipping.state} {order.shipping.postal}
                <br />
                {order.shipping.country}
              </p>
              <div className="mt-4 pt-4 border-t border-ink/15 space-y-2 font-mono text-[10px] tracking-[0.14em] uppercase text-muted">
                <div className="flex items-center gap-2">
                  <Phone size={11} /> {order.shipping.phone}
                </div>
                <div className="flex items-center gap-2">
                  <Mail size={11} /> {order.email}
                </div>
                <div className="flex items-center gap-2">
                  <Truck size={11} /> {order.shipping.method === "express" ? "Express" : "Standard"} delivery
                </div>
              </div>
            </div>

            <div className="border border-ink/20 bg-cream p-6">
              <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-muted mb-4">/ Summary</p>
              <div className="space-y-2 font-mono text-[11px] tracking-[0.1em] uppercase">
                {primaryItem && <Row label="Item" value={primaryItem.productName.slice(0, 14) + (primaryItem.productName.length > 14 ? "…" : "")} />}
                <Row label="Subtotal" value={formatPrice(order.totals.subtotal)} />
                {order.totals.discount > 0 && (
                  <Row label="Discount" value={`-${formatPrice(order.totals.discount)}`} />
                )}
                <Row
                  label="Dispatch"
                  value={order.totals.shipping === 0 ? "Free" : formatPrice(order.totals.shipping)}
                />
                {order.totals.tax > 0 && <Row label="Tax" value={formatPrice(order.totals.tax)} />}
              </div>
              <div className="flex justify-between items-baseline pt-3 mt-3 border-t border-ink/15">
                <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted">Total</span>
                <span className="font-display text-2xl tracking-[-0.02em] tabular-nums text-ink">
                  {formatPrice(order.totals.total)}
                </span>
              </div>
              {order.payment && (
                <div className="mt-3 pt-3 border-t border-ink/15 space-y-1.5 font-mono text-[10px] tracking-[0.12em] uppercase">
                  <Row label="Paid" value={order.payment.status === "paid" ? formatPrice(order.payment.amount) : "Pending"} />
                  <Row label="Status" value={order.payment.status} />
                  {order.payment.mpesaReceipt && <Row label="M-Pesa rcpt" value={order.payment.mpesaReceipt} />}
                </div>
              )}
              <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-muted mt-4 border-t border-ink/15 pt-3">
                / Paid via {order.paymentMethod === "mpesa" ? "M-Pesa" : "selected method"}
              </p>
              <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted mt-2">
                / Support: support@baywoods.co.ke
              </p>
            </div>

            <div className="space-y-2">
              {normalizedStatus === "PENDING_PAYMENT" && (
                <CancelOrderButton orderId={order.id} token={query?.t} />
              )}
              {order.paymentStatus === "paid" && (
                <ResendConfirmationButton orderId={order.id} token={query?.t} />
              )}
              <Link href="/account/orders" className="w-full btn-primary">
                View all orders →
              </Link>
              <Link href="/shop" className="w-full btn-outline">
                Continue shopping
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="flex justify-between text-muted">
      <span>{label}</span>
      <span className={`tabular-nums ${accent ?? "text-ink"}`}>{value}</span>
    </div>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  return {
    title: `Order #BW-${orderId.slice(0, 8).toUpperCase()}`,
    robots: { index: false, follow: false },
  };
}
