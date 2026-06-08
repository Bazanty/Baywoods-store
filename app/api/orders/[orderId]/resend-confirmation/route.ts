import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import * as Sentry from "@sentry/nextjs";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { verifyOrderToken } from "@/lib/orderAccessToken";
import { sendOrderConfirmation } from "@/lib/email";
import { getClientIp, rateLimit } from "@/lib/security";

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

const UUID_RX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function isAuthorisedOwner(orderId: string): Promise<boolean> {
  try {
    const supa = await createSupabaseServerClient();
    const { data: { user } } = await supa.auth.getUser();
    if (!user) return false;
    const admin = getAdmin();
    const { data: ord } = await admin
      .from("orders")
      .select("user_id, email")
      .eq("id", orderId)
      .single();
    if (!ord) return false;
    if (ord.user_id && ord.user_id === user.id) return true;
    if (ord.email && user.email && ord.email.toLowerCase() === user.email.toLowerCase()) return true;
    return false;
  } catch {
    return false;
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const ip = getClientIp(req) ?? "unknown";
  const rl = rateLimit(`resend:${ip}`, 3, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many resend attempts. Wait a minute." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  const { orderId } = await params;
  if (!UUID_RX.test(orderId)) {
    return NextResponse.json({ error: "Invalid order id" }, { status: 400 });
  }

  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  const tokenValid = token ? verifyOrderToken(orderId, token) : false;
  const authorised = tokenValid || (await isAuthorisedOwner(orderId));
  if (!authorised) {
    return NextResponse.json({ error: "Not authorised" }, { status: 401 });
  }

  const db = getAdmin();
  const { data: order, error: orderError } = await db
    .from("orders")
    .select(`
      id, email, payment_status, payment_method,
      shipping_name, shipping_line1, shipping_city, shipping_state,
      subtotal, shipping_cost, discount_amount, total,
      order_items ( product_name, variant_name, quantity, unit_price )
    `)
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  if (order.payment_status !== "paid") {
    return NextResponse.json(
      { error: "Confirmation is only available after payment." },
      { status: 409 }
    );
  }
  if (!order.email) {
    return NextResponse.json({ error: "No email on file." }, { status: 400 });
  }

  try {
    await sendOrderConfirmation({
      orderId: order.id,
      customerName: order.shipping_name,
      email: order.email,
      items: (order.order_items ?? []).map((item: any) => ({
        name: item.product_name,
        variant: item.variant_name,
        qty: item.quantity,
        price: Number(item.unit_price),
      })),
      subtotal: Number(order.subtotal),
      shippingCost: Number(order.shipping_cost),
      discount: Number(order.discount_amount),
      total: Number(order.total),
      shippingAddress: `${order.shipping_line1}, ${order.shipping_city}, ${order.shipping_state}`,
      paymentMethod: order.payment_method,
    });
  } catch (err) {
    Sentry.captureException(err);
    return NextResponse.json({ error: "Email service failed. Please try again later." }, { status: 502 });
  }

  return NextResponse.json({ ok: true, email: order.email });
}
