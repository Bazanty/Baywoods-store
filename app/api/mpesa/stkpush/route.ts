import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import * as Sentry from "@sentry/nextjs";
import { initiateStkPush, formatPhone, isPaymentMockEnabled } from "@/lib/mpesa";
import { getClientIp, rateLimit } from "@/lib/security";

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

async function failOrder(db: ReturnType<typeof getAdmin>, orderId: string, reason: string) {
  const nowIso = new Date().toISOString();
  const { data: order } = await db
    .from("orders")
    .select("reservation_session_id")
    .eq("id", orderId)
    .single();

  if (order?.reservation_session_id) {
    await db.rpc("release_session_reservations", { p_session_id: order.reservation_session_id });
  }

  await db
    .from("orders")
    .update({
      status: "FAILED",
      payment_status: "failed",
      failed_reason: reason,
      updated_at: nowIso,
    })
    .eq("id", orderId);
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req) ?? "unknown";
    const rl = await rateLimit(`stk:${ip}`, 5, 60_000);
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Too many payment attempts. Please wait a moment." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
      );
    }

    const { phone, amount, orderId } = await req.json();

    if (!phone || !amount || !orderId) {
      return NextResponse.json({ error: "phone, amount, and orderId are required" }, { status: 400 });
    }

    const formatted = formatPhone(phone);
    if (formatted.length !== 12) {
      return NextResponse.json({ error: "Invalid Kenyan phone number" }, { status: 400 });
    }

    const db = getAdmin();
    const { data: order, error: orderError } = await db
      .from("orders")
      .select("id, total, status, payment_status, payment_method")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    if (order.payment_method !== "mpesa") {
      return NextResponse.json({ error: "Order is not an M-Pesa order" }, { status: 400 });
    }
    if (order.payment_status !== "pending" || order.status !== "PENDING_PAYMENT") {
      return NextResponse.json({ error: "This order is not awaiting payment" }, { status: 409 });
    }
    if (Math.round(Number(order.total)) !== Math.round(Number(amount))) {
      return NextResponse.json({ error: "Payment amount does not match order total" }, { status: 400 });
    }

    if (isPaymentMockEnabled()) {
      const checkoutRequestId = `mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const merchantRequestId = "mock-merchant-req";

      const { error: paymentError } = await db.from("payments").insert({
        order_id: orderId,
        method: "mpesa",
        amount: Number(order.total),
        currency: "KES",
        status: "pending",
        checkout_request_id: checkoutRequestId,
        merchant_request_id: merchantRequestId,
        mpesa_phone: formatted,
        mpesa_amount: Number(order.total),
      });

      if (paymentError) {
        Sentry.captureException(paymentError);
        return NextResponse.json({ error: "Could not create payment attempt" }, { status: 500 });
      }

      return NextResponse.json({
        checkoutRequestId,
        merchantRequestId,
        customerMessage: "[MOCK] Check your phone and enter your M-Pesa PIN to complete payment.",
      });
    }

    const result = await initiateStkPush({
      phone: formatted,
      amount: Number(order.total),
      orderId,
      description: "Baywoods Order",
    });

    if (result.ResponseCode !== "0") {
      const reason = result.ResponseDescription ?? "STK push failed";
      await failOrder(db, orderId, reason);
      return NextResponse.json({ error: reason }, { status: 422 });
    }

    const { error: paymentError } = await db.from("payments").insert({
      order_id: orderId,
      method: "mpesa",
      amount: Number(order.total),
      currency: "KES",
      status: "pending",
      checkout_request_id: result.CheckoutRequestID,
      merchant_request_id: result.MerchantRequestID,
      mpesa_phone: formatted,
      mpesa_amount: Number(order.total),
      provider_response: result.ProviderResponse ?? result,
    });

    if (paymentError) {
      Sentry.captureException(paymentError);
      await failOrder(db, orderId, "Could not save M-Pesa payment attempt");
      return NextResponse.json({ error: "Could not save payment attempt" }, { status: 500 });
    }

    return NextResponse.json({
      checkoutRequestId: result.CheckoutRequestID,
      merchantRequestId: result.MerchantRequestID,
      customerMessage: result.CustomerMessage,
    });
  } catch (err: unknown) {
    Sentry.captureException(err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
