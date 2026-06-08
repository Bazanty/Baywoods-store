import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { ShoppingBag } from "lucide-react";
import OrdersClient from "./OrdersClient";
import ExportButton from "../_components/ExportButton";

export const dynamic = "force-dynamic";

async function getOrders() {
  try {
    const { data, error } = await createSupabaseAdminClient()
      .from("orders")
      .select(`
        id, status, payment_status, total,
        shipping_name, shipping_line1, shipping_city, shipping_state, shipping_country, shipping_phone, email,
        tracking_number, shipping_method, created_at,
        payments ( status, mpesa_receipt, mpesa_phone, mpesa_amount, checkout_request_id, merchant_request_id, created_at ),
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
    <div className="px-6 lg:px-10 py-10 max-w-6xl">
      <div className="mb-8 border-b border-ink/15 pb-6">
        <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted mb-3">
          <span className="text-ink">/</span> ORDERS
        </p>
        <div className="flex items-end justify-between flex-wrap gap-4">
          <h1 className="font-display font-medium tracking-[-0.025em] leading-[0.92] text-ink text-4xl sm:text-5xl">
            All orders.
          </h1>
          <div className="flex items-center gap-4">
            <p className="font-mono text-[11px] tracking-[0.14em] uppercase text-ink">
              {String(orders.length).padStart(3, "0")} total
            </p>
            <ExportButton type="orders" label="Export CSV" />
          </div>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="border border-ink/15 flex flex-col items-center gap-3 py-20 text-muted">
          <ShoppingBag size={28} strokeWidth={1.25} />
          <p className="font-mono text-[10px] tracking-[0.16em] uppercase">/ No orders yet.</p>
        </div>
      ) : (
        <OrdersClient orders={orders as any} />
      )}
    </div>
  );
}
