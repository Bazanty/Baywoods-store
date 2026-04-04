import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { formatPrice } from "@/lib/utils";
import { ShoppingBag } from "lucide-react";

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
        shipping_name, shipping_city, shipping_country,
        tracking_number, created_at, updated_at,
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

      <div className="bg-white rounded overflow-hidden max-w-6xl">
        {orders.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-20 text-muted">
            <ShoppingBag size={32} strokeWidth={1} />
            <p className="text-sm">No orders yet.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone text-left">
                {[
                  { label: "Order ID",  cls: "" },
                  { label: "Customer",  cls: "" },
                  { label: "Items",     cls: "" },
                  { label: "Status",    cls: "" },
                  { label: "Total",     cls: "text-right" },
                  { label: "Date",      cls: "text-right" },
                ].map(({ label, cls }) => (
                  <th
                    key={label}
                    className={`px-5 py-3.5 text-xs font-medium text-muted tracking-wider uppercase ${cls}`}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orders.map((order: any, i: number) => (
                <tr
                  key={order.id}
                  className={`hover:bg-stone/20 transition-colors ${
                    i < orders.length - 1 ? "border-b border-stone/50" : ""
                  }`}
                >
                  <td className="px-5 py-4">
                    <span className="font-mono text-xs text-muted">
                      {order.id.slice(0, 8).toUpperCase()}
                    </span>
                    {order.tracking_number && (
                      <p className="text-[10px] text-muted/60 mt-0.5 font-mono">
                        {order.tracking_number}
                      </p>
                    )}
                  </td>

                  <td className="px-5 py-4">
                    <p className="font-medium text-ink">{order.shipping_name}</p>
                    <p className="text-xs text-muted">
                      {order.shipping_city}, {order.shipping_country}
                    </p>
                  </td>

                  <td className="px-5 py-4">
                    <div className="space-y-0.5">
                      {(order.order_items ?? []).slice(0, 2).map((item: any) => (
                        <p key={item.id} className="text-xs text-muted truncate max-w-[180px]">
                          {item.quantity}× {item.product_name}
                          {item.variant_name ? ` · ${item.variant_name}` : ""}
                        </p>
                      ))}
                      {order.order_items?.length > 2 && (
                        <p className="text-[10px] text-muted/60">
                          +{order.order_items.length - 2} more
                        </p>
                      )}
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`inline-block text-[11px] px-2 py-0.5 rounded-sm capitalize font-medium ${
                        STATUS_STYLES[order.status] ?? "bg-stone-light text-muted"
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>

                  <td className="px-5 py-4 text-right">
                    <span className="font-medium text-ink">{formatPrice(order.total)}</span>
                    {order.discount_amount > 0 && (
                      <p className="text-[10px] text-forest mt-0.5">
                        -{formatPrice(order.discount_amount)} off
                      </p>
                    )}
                  </td>

                  <td className="px-5 py-4 text-right text-xs text-muted">
                    {new Date(order.created_at).toLocaleDateString("en-KE", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
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
