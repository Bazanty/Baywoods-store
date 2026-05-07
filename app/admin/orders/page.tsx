import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { ShoppingBag } from "lucide-react";
import OrdersClient from "./OrdersClient";

export const dynamic = "force-dynamic";

async function getOrders() {
  try {
    const { data, error } = await createSupabaseAdminClient()
      .from("orders")
      .select(`
        id, status, total,
        shipping_name, shipping_city, shipping_country, shipping_phone, email,
        tracking_number, shipping_method, created_at,
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
    <div className="px-8 py-10 max-w-6xl">
      <div className="mb-7">
        <h1 className="font-serif text-2xl text-ink">Orders</h1>
        <p className="text-sm text-muted mt-0.5">{orders.length} total</p>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded flex flex-col items-center gap-3 py-20 text-muted">
          <ShoppingBag size={32} strokeWidth={1} />
          <p className="text-sm">No orders yet.</p>
        </div>
      ) : (
        <OrdersClient orders={orders as any} />
      )}
    </div>
  );
}
