import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import * as Sentry from "@sentry/nextjs";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getClientIp, rateLimit } from "@/lib/security";

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

const RETURN_WINDOW_DAYS = 14;
const UUID_RX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(req: NextRequest) {
  const ip = getClientIp(req) ?? "unknown";
  const rl = await rateLimit(`return:${ip}`, 5, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many return requests. Wait a moment." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  let body: { orderId?: string; reason?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const orderId = body.orderId?.trim();
  const reason = body.reason?.trim();

  if (!orderId || !UUID_RX.test(orderId)) {
    return NextResponse.json({ error: "Invalid order id" }, { status: 400 });
  }
  if (!reason || reason.length < 5) {
    return NextResponse.json({ error: "Please describe the reason (5 characters or more)." }, { status: 400 });
  }
  if (reason.length > 1000) {
    return NextResponse.json({ error: "Reason is too long (max 1000 characters)." }, { status: 400 });
  }

  const supa = await createSupabaseServerClient();
  const { data: { user } } = await supa.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to request a return." }, { status: 401 });
  }

  const db = getAdmin();
  const { data: order, error: orderError } = await db
    .from("orders")
    .select("id, user_id, email, status, delivered_at")
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const ownsByUser = order.user_id && order.user_id === user.id;
  const ownsByEmail =
    order.email && user.email && order.email.toLowerCase() === user.email.toLowerCase();
  if (!ownsByUser && !ownsByEmail) {
    return NextResponse.json({ error: "Not authorised" }, { status: 403 });
  }

  if (order.status !== "DELIVERED") {
    return NextResponse.json(
      { error: "Returns are only available after delivery." },
      { status: 409 }
    );
  }

  if (order.delivered_at) {
    const deliveredAt = new Date(order.delivered_at).getTime();
    const cutoff = Date.now() - RETURN_WINDOW_DAYS * 24 * 60 * 60 * 1000;
    if (deliveredAt < cutoff) {
      return NextResponse.json(
        { error: `Returns are accepted within ${RETURN_WINDOW_DAYS} days of delivery.` },
        { status: 409 }
      );
    }
  }

  const { data: existing } = await db
    .from("return_requests")
    .select("id")
    .eq("order_id", orderId)
    .limit(1);
  if (existing && existing.length > 0) {
    return NextResponse.json(
      { error: "A return request already exists for this order." },
      { status: 409 }
    );
  }

  const { error: insertError } = await db.from("return_requests").insert({
    order_id: orderId,
    user_id: user.id,
    email: user.email ?? order.email,
    reason,
  });

  if (insertError) {
    Sentry.captureException(insertError);
    return NextResponse.json({ error: "Could not submit return. Please try again." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
