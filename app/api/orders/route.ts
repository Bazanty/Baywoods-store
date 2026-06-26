import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import * as Sentry from "@sentry/nextjs";
import { getClientIp, rateLimit } from "@/lib/security";
import { signOrderToken } from "@/lib/orderAccessToken";
import { formatPhone, isManualMpesaEnabled, isLikelyMpesaCode } from "@/lib/mpesa";
import {
  recomputeOrder,
  validateReservedStock,
  TOTAL_TOLERANCE_KES,
  type CreateOrderPayload,
} from "@/lib/orderPricing";

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

async function releaseReservationSession(db: ReturnType<typeof getAdmin>, sessionId?: string) {
  if (!sessionId) return;
  await db.rpc("release_session_reservations", { p_session_id: sessionId });
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req) ?? "unknown";
    const rl = await rateLimit(`order:${ip}`, 10, 60_000);
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Too many order attempts. Please wait a moment." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
      );
    }

    const payload: CreateOrderPayload = await req.json();
    const {
      userId,
      email,
      phone,
      shippingAddress,
      paymentMethod,
      items,
      sessionId,
      mpesaCode,
    } = payload;

    if (!items?.length) {
      return NextResponse.json({ error: "No items in order" }, { status: 400 });
    }
    if (!email || !phone || !shippingAddress?.firstName || !shippingAddress?.address) {
      return NextResponse.json({ error: "Missing customer or shipping details" }, { status: 400 });
    }
    if (paymentMethod !== "mpesa") {
      return NextResponse.json({ error: "Only M-Pesa checkout is currently supported." }, { status: 400 });
    }

    // In manual mode the customer must hand us the Till confirmation code up
    // front — it's the only thread linking their payment to this order until an
    // admin verifies it.
    const manualMode = isManualMpesaEnabled();
    const normalizedCode = mpesaCode?.trim().toUpperCase() ?? "";
    if (manualMode && !isLikelyMpesaCode(normalizedCode)) {
      return NextResponse.json(
        { error: "Enter the M-Pesa confirmation code from your payment SMS (e.g. QJK3B7WCLP)." },
        { status: 400 }
      );
    }

    const db = getAdmin();

    // Recompute every monetary value server-side from authoritative DB rows.
    const result = await recomputeOrder(db, payload);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }
    const resolved = result.order;

    // Sanity-check the totals the client believed in so a tampered cart can
    // never silently push through with a stale (too-low) total.
    if (typeof payload.total === "number") {
      const drift = Math.abs(payload.total - resolved.total);
      if (drift > TOTAL_TOLERANCE_KES) {
        return NextResponse.json(
          {
            code: "PRICE_MISMATCH",
            error: "Your cart total has changed. Please review and try again.",
            serverTotal: resolved.total,
          },
          { status: 409 }
        );
      }
    }

    const reservationError = await validateReservedStock(db, sessionId, resolved.items);
    if (reservationError) return reservationError;

    const { data: order, error: orderError } = await db
      .from("orders")
      .insert({
        user_id: userId ?? null,
        email,
        status: "PENDING_PAYMENT",
        payment_method: "mpesa",
        payment_status: "pending",
        reservation_session_id: sessionId ?? null,
        shipping_name: `${shippingAddress.firstName} ${shippingAddress.lastName}`,
        shipping_line1: shippingAddress.address,
        shipping_city: shippingAddress.city,
        shipping_state: shippingAddress.county,
        shipping_postal: shippingAddress.postal?.trim() || null,
        shipping_country: "KE",
        shipping_phone: phone,
        shipping_method: resolved.shippingMethod,
        subtotal: resolved.subtotal,
        discount_amount: resolved.discountAmount,
        shipping_cost: resolved.shippingCost,
        tax_amount: 0,
        total: resolved.total,
        coupon_id: resolved.couponId,
      })
      .select("id")
      .single();

    if (orderError || !order) {
      await releaseReservationSession(db, sessionId);
      console.error("[orders] insert error:", orderError);
      return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
    }

    const orderId = order.id;

    const { error: itemsError } = await db.from("order_items").insert(
      resolved.items.map((item) => ({
        order_id: orderId,
        product_id: item.productId,
        variant_id: item.variantId,
        product_name: item.productName,
        variant_name: item.variantName,
        unit_price: item.unitPrice,
        quantity: item.quantity,
        line_total: item.lineTotal,
      }))
    );

    if (itemsError) {
      await db.from("orders").delete().eq("id", orderId);
      await releaseReservationSession(db, sessionId);
      return NextResponse.json({ error: "Failed to create order items" }, { status: 500 });
    }

    // Manual mode: stand up a pending payment carrying the customer's claimed
    // code so it surfaces on /admin/payments. finalize_mpesa_payment keys off
    // checkout_request_id, so we mint a deterministic "manual_" id here that the
    // admin confirm flow can later finalize. A payment insert hiccup shouldn't
    // sink the order — the admin can still reconcile from the order itself.
    if (manualMode) {
      const { error: paymentError } = await db.from("payments").insert({
        order_id: orderId,
        method: "mpesa",
        amount: resolved.total,
        currency: "KES",
        status: "pending",
        checkout_request_id: `manual_${orderId}`,
        mpesa_phone: formatPhone(phone),
        mpesa_amount: resolved.total,
        mpesa_receipt: normalizedCode,
        result_desc: "Customer-submitted M-Pesa code — verify against M-Pesa Business notifications before confirming.",
      });
      if (paymentError) {
        Sentry.captureException(paymentError);
        console.error("[orders] manual payment insert error:", paymentError);
      }
    }

    const accessToken = signOrderToken(orderId);

    return NextResponse.json({
      orderId,
      accessToken,
      total: resolved.total,
      subtotal: resolved.subtotal,
      shippingCost: resolved.shippingCost,
      discountAmount: resolved.discountAmount,
    });
  } catch (err: unknown) {
    Sentry.captureException(err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
