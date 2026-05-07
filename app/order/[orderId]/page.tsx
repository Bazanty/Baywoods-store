import { headers } from "next/headers";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Check, Truck, Package, MapPin, Mail, Phone, Receipt } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import OrderClearCart from "./OrderClearCart";

export const dynamic = "force-dynamic";

interface OrderPageProps {
  params: { orderId: string };
}

interface OrderResponse {
  id: string;
  email: string;
  status: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded";
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

async function fetchOrder(orderId: string): Promise<OrderResponse | null> {
  const h = headers();
  const host = h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "http";
  const base = `${proto}://${host}`;

  try {
    const res = await fetch(`${base}/api/orders/${orderId}`, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as OrderResponse;
  } catch {
    return null;
  }
}

const STATUS_STEPS: { key: OrderResponse["status"]; label: string; icon: typeof Check }[] = [
  { key: "confirmed",  label: "Confirmed",  icon: Check },
  { key: "processing", label: "Preparing",  icon: Package },
  { key: "shipped",    label: "Shipped",    icon: Truck },
  { key: "delivered",  label: "Delivered",  icon: MapPin },
];

function activeStepIndex(status: OrderResponse["status"]): number {
  if (status === "pending") return 0;
  const idx = STATUS_STEPS.findIndex((s) => s.key === status);
  return idx === -1 ? 0 : idx;
}

export default async function OrderPage({ params }: OrderPageProps) {
  const order = await fetchOrder(params.orderId);
  if (!order) notFound();

  const stepIdx = activeStepIndex(order.status);
  const shortId = order.id.slice(0, 8).toUpperCase();
  const placedDate = new Date(order.createdAt).toLocaleDateString("en-KE", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="pt-24 lg:pt-28 pb-24 bg-beige min-h-screen">
      <OrderClearCart />

      <div className="container-px max-w-5xl mx-auto">
        {/* Hero confirmation */}
        <div className="bg-cream border border-stone p-8 lg:p-12 mb-8">
          <div className="flex items-start gap-5">
            <div className="w-12 h-12 bg-forest rounded-full flex items-center justify-center shrink-0">
              <Check size={22} className="text-white" strokeWidth={3} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs uppercase tracking-[0.2em] text-forest font-medium">
                Order {order.status === "pending" ? "received" : "confirmed"}
              </p>
              <h1 className="font-serif text-3xl lg:text-4xl text-ink mt-1">
                Thank you, {order.shipping.name.split(" ")[0]}.
              </h1>
              <p className="text-sm text-muted mt-2 max-w-md">
                We&apos;ve sent a confirmation to{" "}
                <span className="text-ink font-medium">{order.email}</span>. Your order is being prepared.
              </p>
              <div className="flex flex-wrap gap-x-6 gap-y-1 mt-5 text-xs text-muted">
                <span>
                  Order <span className="text-ink font-mono font-medium">#BW-{shortId}</span>
                </span>
                <span>{placedDate}</span>
              </div>
            </div>
          </div>

          {/* Status timeline */}
          <div className="mt-10 pt-8 border-t border-stone">
            <div className="flex items-start justify-between relative">
              <div className="absolute top-4 left-[12%] right-[12%] h-px bg-stone -z-0" />
              <div
                className="absolute top-4 left-[12%] h-px bg-forest transition-all duration-700 -z-0"
                style={{ width: `${(stepIdx / (STATUS_STEPS.length - 1)) * 76}%` }}
              />
              {STATUS_STEPS.map((step, i) => {
                const Icon = step.icon;
                const reached = i <= stepIdx;
                return (
                  <div key={step.key} className="flex flex-col items-center gap-2 relative z-10 flex-1">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                        reached ? "bg-forest text-white" : "bg-stone text-muted"
                      }`}
                    >
                      <Icon size={14} strokeWidth={2.5} />
                    </div>
                    <span
                      className={`text-[11px] font-medium uppercase tracking-wide ${
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
              <p className="text-xs text-muted mt-6 text-center">
                Tracking number:{" "}
                <span className="font-mono text-ink">{order.trackingNumber}</span>
              </p>
            )}
          </div>
        </div>

        {/* Two-column body */}
        <div className="grid lg:grid-cols-[1fr_360px] gap-6">
          {/* Items */}
          <section className="bg-cream border border-stone">
            <header className="px-6 py-4 border-b border-stone flex items-center gap-2">
              <Receipt size={16} className="text-muted" />
              <h2 className="text-sm font-medium uppercase tracking-wide text-ink">
                Items ({order.items.reduce((s, i) => s + i.quantity, 0)})
              </h2>
            </header>
            <ul className="divide-y divide-stone">
              {order.items.map((item) => (
                <li key={item.id} className="flex gap-4 p-6">
                  <div className="relative w-20 h-24 bg-beige shrink-0 overflow-hidden">
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
                        className="text-sm font-medium text-ink hover:text-forest transition-colors line-clamp-2"
                      >
                        {item.productName}
                      </Link>
                    ) : (
                      <p className="text-sm font-medium text-ink line-clamp-2">{item.productName}</p>
                    )}
                    {item.variantName && (
                      <p className="text-xs text-muted mt-1">{item.variantName}</p>
                    )}
                    <p className="text-xs text-muted mt-2">Qty {item.quantity}</p>
                  </div>
                  <p className="text-sm font-semibold text-ink shrink-0 self-start">
                    {formatPrice(item.lineTotal)}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          {/* Side: shipping + totals */}
          <aside className="space-y-6">
            <div className="bg-cream border border-stone p-6">
              <h3 className="text-xs uppercase tracking-wide text-muted mb-3">Shipping to</h3>
              <p className="text-sm font-medium text-ink">{order.shipping.name}</p>
              <p className="text-sm text-muted mt-1 leading-relaxed">
                {order.shipping.line1}
                <br />
                {order.shipping.city}, {order.shipping.state} {order.shipping.postal}
                <br />
                {order.shipping.country}
              </p>
              <div className="mt-4 pt-4 border-t border-stone space-y-1.5 text-xs text-muted">
                <div className="flex items-center gap-2">
                  <Phone size={12} /> {order.shipping.phone}
                </div>
                <div className="flex items-center gap-2">
                  <Mail size={12} /> {order.email}
                </div>
                <div className="flex items-center gap-2">
                  <Truck size={12} /> {order.shipping.method === "express" ? "Express" : "Standard"} delivery
                </div>
              </div>
            </div>

            <div className="bg-cream border border-stone p-6">
              <h3 className="text-xs uppercase tracking-wide text-muted mb-4">Summary</h3>
              <div className="space-y-2 text-sm">
                <Row label="Subtotal" value={formatPrice(order.totals.subtotal)} />
                {order.totals.discount > 0 && (
                  <Row
                    label="Discount"
                    value={`-${formatPrice(order.totals.discount)}`}
                    accent="text-forest"
                  />
                )}
                <Row
                  label="Shipping"
                  value={order.totals.shipping === 0 ? "Free" : formatPrice(order.totals.shipping)}
                />
                {order.totals.tax > 0 && <Row label="Tax" value={formatPrice(order.totals.tax)} />}
                <div className="flex justify-between pt-3 mt-3 border-t border-stone text-base font-semibold text-ink">
                  <span>Total</span>
                  <span>{formatPrice(order.totals.total)}</span>
                </div>
              </div>
              <p className="text-[11px] text-muted mt-4 uppercase tracking-wide">
                Paid with {order.paymentMethod === "mpesa" ? "M-Pesa" : "Card"}
              </p>
            </div>

            <div className="space-y-3">
              <Link
                href="/account/orders"
                className="w-full inline-flex items-center justify-center font-sans font-medium tracking-wide bg-ink text-white hover:bg-ink/80 transition-colors text-sm px-6 py-3"
              >
                View all orders
              </Link>
              <Link
                href="/shop"
                className="w-full inline-flex items-center justify-center font-sans font-medium tracking-wide border border-ink text-ink hover:bg-ink hover:text-white transition-colors text-sm px-6 py-3"
              >
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
      <span className={accent ?? "text-ink"}>{value}</span>
    </div>
  );
}

export async function generateMetadata({ params }: OrderPageProps) {
  return {
    title: `Order #BW-${params.orderId.slice(0, 8).toUpperCase()}`,
    robots: { index: false, follow: false },
  };
}
