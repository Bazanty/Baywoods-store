import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";
import { ShoppingBag } from "lucide-react";
import OrderStatusControl from "./OrderStatusControl";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  pending:    "bg-amber-50 text-amber-700",
  confirmed:  "bg-blue-50 text-blue-700",
  processing: "bg-blue-50 text-blue-700",
  shipped:    "bg-purple-50 text-purple-700",
  delivered:  "bg-forest/10 text-forest",
  cancelled:  "bg-danger/10 text-danger",
  refunded:   "bg-stone-light text-muted",
};

async function getOrders() {
  try {
    const { data, error } = await createSupabaseAdminClient()
      .from("orders")
      .select(`
        id, status, total, subtotal, discount_amount, shipping_cost,
        shipping_name, shipping_city, shipping_country, shipping_phone, email,
        tracking_number, shipping_method, created_at, updated_at,
        order_items ( id, product_name, variant_name, quantity, unit_price )
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data ?? [];
  } catch {
    return [];
  }
}

export default async function AdminOrders() {
  const orders = await getOrders();

  return (
    <div className="px-8 py-10">
      <div className="mb-7">
        <h1 className="font-serif text-2xl text-ink">Orders</h1>
        <p className="text-sm text-muted mt-0.5">{orders.length} total</p>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded flex flex-col items-center gap-3 py-20 text-muted max-w-6xl">
          <ShoppingBag size={32} strokeWidth={1} />
          <p className="text-sm">No orders yet.</p>
        </div>
      ) : (
        <div className="space-y-3 max-w-6xl">
          {orders.map((order: any) => (
            <div key={order.id} className="bg-white rounded overflow-hidden">
              <div className="flex items-start justify-between px-5 py-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-mono text-xs text-muted">
                      {order.id.slice(0, 8).toUpperCase()}
                    </span>
                    <span
                      className={`inline-block text-[11px] px-2 py-0.5 rounded-sm capitalize font-medium ${
                        STATUS_STYLES[order.status] ?? "bg-stone-light text-muted"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-ink">{order.shipping_name}</p>
                  <p className="text-xs text-muted">
                    {order.email} · {order.shipping_phone}
                  </p>
                  <p className="text-xs text-muted">
                    {order.shipping_city}, {order.shipping_country} · {order.shipping_method}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-medium text-ink">{formatPrice(order.total)}</p>
                  <p className="text-xs text-muted mt-0.5">
                    {new Date(order.created_at).toLocaleDateString("en-KE", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </p>
                </div>
              </div>

              <div className="px-5 pb-1 space-y-0.5">
                {(order.order_items ?? []).map((item: any) => (
                  <p key={item.id} className="text-xs text-muted">
                    {item.quantity}× {item.product_name}
                    {item.variant_name ? ` · ${item.variant_name}` : ""}{" "}
                    <span className="text-muted/60">({formatPrice(item.unit_price)})</span>
                  </p>
                ))}
              </div>

              <div className="px-5 py-3 border-t border-stone/50 mt-2">
                <OrderStatusControl
                  orderId={order.id}
                  currentStatus={order.status}
                  currentTracking={order.tracking_number ?? ""}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
