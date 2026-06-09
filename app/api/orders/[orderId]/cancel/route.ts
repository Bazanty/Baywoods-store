import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import * as Sentry from "@sentry/nextjs";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { verifyOrderToken } from "@/lib/orderAccessToken";
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
  const rl = await rateLimit(`cancel:${ip}`, 10, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many cancel attempts. Wait a moment." },
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
  const { data: order, error: readError } = await db
    .from("orders")
    .select("id, status, payment_status, reservation_session_id")
    .eq("id", orderId)
    .single();

  if (readError || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.status !== "PENDING_PAYMENT" || order.payment_status !== "pending") {
    return NextResponse.json(
      { error: "This order can no longer be cancelled." },
      { status: 409 }
    );
  }

  const nowIso = new Date().toISOString();
  const { error: updateError } = await db
    .from("orders")
    .update({
      status: "CANCELLED",
      payment_status: "cancelled",
      failed_reason: "Cancelled by customer",
      updated_at: nowIso,
    })
    .eq("id", orderId)
    .eq("status", "PENDING_PAYMENT");

  if (updateError) {
    Sentry.captureException(updateError);
    return NextResponse.json({ error: "Failed to cancel order" }, { status: 500 });
  }

  if (order.reservation_session_id) {
    try {
      await db.rpc("release_session_reservations", { p_session_id: order.reservation_session_id });
    } catch (err) {
      Sentry.captureException(err);
    }
  }

  return NextResponse.json({ ok: true });
}
