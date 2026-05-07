import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

const UUID_RX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  _req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  const { orderId } = params;

  if (!UUID_RX.test(orderId)) {
    return NextResponse.json({ error: "Invalid order id" }, { status: 400 });
  }

  const db = getAdmin();

  const { data, error } = await db
    .from("orders")
    .select(`
      id,
      email,
      status,
      payment_method,
      payment_status,
      shipping_name,
      shipping_line1,
      shipping_city,
      shipping_state,
      shipping_postal,
      shipping_country,
      shipping_phone,
      shipping_method,
      subtotal,
      discount_amount,
      shipping_cost,
      tax_amount,
      total,
      tracking_number,
      shipped_at,
      delivered_at,
      created_at,
      order_items (
        id,
        product_id,
        product_name,
        variant_name,
        unit_price,
        quantity,
        line_total,
        products (
          slug,
          product_images ( url, is_primary, sort_order )
        )
      )
    `)
    .eq("id", orderId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  // Pull primary image per item
  const items = (data.order_items ?? []).map((item: any) => {
    const imgs: { url: string; is_primary: boolean; sort_order: number }[] =
      item.products?.product_images ?? [];
    const sorted = [...imgs].sort((a, b) => {
      if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
      return a.sort_order - b.sort_order;
    });
    return {
      id: item.id,
      productId: item.product_id,
      productName: item.product_name,
      productSlug: item.products?.slug ?? null,
      variantName: item.variant_name,
      unitPrice: Number(item.unit_price),
      quantity: item.quantity,
      lineTotal: Number(item.line_total),
      image: sorted[0]?.url ?? null,
    };
  });

  return NextResponse.json({
    id: data.id,
    email: data.email,
    status: data.status,
    paymentMethod: data.payment_method,
    paymentStatus: data.payment_status,
    shipping: {
      name: data.shipping_name,
      line1: data.shipping_line1,
      city: data.shipping_city,
      state: data.shipping_state,
      postal: data.shipping_postal,
      country: data.shipping_country,
      phone: data.shipping_phone,
      method: data.shipping_method,
    },
    totals: {
      subtotal: Number(data.subtotal),
      discount: Number(data.discount_amount),
      shipping: Number(data.shipping_cost),
      tax: Number(data.tax_amount),
      total: Number(data.total),
    },
    trackingNumber: data.tracking_number,
    shippedAt: data.shipped_at,
    deliveredAt: data.delivered_at,
    createdAt: data.created_at,
    items,
  });
}
