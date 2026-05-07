import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import * as Sentry from "@sentry/nextjs";
import { sendOrderConfirmation } from "@/lib/email";
import { sendOrderSms } from "@/lib/sms";
import { getClientIp, rateLimit } from "@/lib/security";

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

interface OrderItem {
  productId: string;
  variantId?: string | null;
  productName: string;
  variantName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

interface CreateOrderPayload {
  userId?: string;
  email: string;
  phone: string;
  shippingAddress: {
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    county: string;
  };
  shippingMethod: "standard" | "express";
  shippingCost: number;
  subtotal: number;
  discountAmount?: number;
  total: number;
  paymentMethod: "mpesa" | "card";
  checkoutRequestId?: string;
  stripePaymentIntentId?: string;
  items: OrderItem[];
  // When the client reserved stock up-front, it sends back the same sessionId
  // so we can atomically consume those reservations instead of running a fresh
  // decrement (which would fail because the user's own reservation blocks it).
  sessionId?: string;
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req) ?? "unknown";
    const rl = rateLimit(`order:${ip}`, 10, 60_000);
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Too many order attempts. Please wait a moment." },
        { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
      );
    }

    const payload: CreateOrderPayload = await req.json();
    const { userId, email, phone, shippingAddress, shippingMethod, shippingCost, subtotal, discountAmount = 0, total, paymentMethod, checkoutRequestId, stripePaymentIntentId, items, sessionId } = payload;

    if (!items?.length) {
      return NextResponse.json({ error: "No items in order" }, { status: 400 });
    }

    const supabaseAdmin = getAdmin();

    // Two stock paths:
    //   1. Reserved path — client called reserve_stock_v2 earlier, so we just
    //      consume the session's reservations atomically.
    //   2. Direct path — fall back to per-item variant-aware decrement, with
    //      rollback on any failure.
    const decremented: { productId: string; variantId: string | null; qty: number }[] = [];

    if (sessionId) {
      const { data: consumed, error: consumeErr } = await supabaseAdmin.rpc(
        "consume_reservations",
        { p_session_id: sessionId }
      );
      if (consumeErr) {
        Sentry.captureException(consumeErr);
        return NextResponse.json(
          { error: "Could not finalise your reserved stock. Please retry." },
          { status: 409 }
        );
      }
      // No reservations consumed → the user's TTL ran out between reserving
      // and submitting. Tell the client to re-reserve so we don't ship an
      // order with no inventory decrement.
      if ((consumed ?? 0) < items.length) {
        return NextResponse.json(
          {
            error: "Your stock hold expired. Please refresh and try again.",
            code: "RESERVATION_EXPIRED",
          },
          { status: 410 }
        );
      }
    } else {
      for (const item of items) {
        const { data, error } = await supabaseAdmin.rpc("decrement_inventory_v2", {
          p_product_id: item.productId,
          p_variant_id: item.variantId ?? null,
          p_qty: item.quantity,
        });

        if (error || data === false) {
          for (const dec of decremented) {
            await supabaseAdmin.rpc("restore_inventory_v2", {
              p_product_id: dec.productId,
              p_variant_id: dec.variantId,
              p_qty: dec.qty,
            });
          }
          return NextResponse.json(
            { error: `"${item.productName}" is out of stock or insufficient quantity.` },
            { status: 409 }
          );
        }

        decremented.push({ productId: item.productId, variantId: item.variantId ?? null, qty: item.quantity });
      }
    }

    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id:          userId ?? null,
        email,
        status:           "pending",
        payment_method:   paymentMethod,
        payment_status:   "pending",
        // Shipping address — map to schema columns
        shipping_name:    `${shippingAddress.firstName} ${shippingAddress.lastName}`,
        shipping_line1:   shippingAddress.address,
        shipping_city:    shippingAddress.city,
        shipping_state:   shippingAddress.county,
        shipping_postal:  "00100",
        shipping_country: "KE",
        shipping_phone:   phone,
        shipping_method:  shippingMethod,
        // Totals
        subtotal,
        discount_amount:  discountAmount,
        shipping_cost:    shippingCost,
        tax_amount:       0,
        total,
      })
      .select("id")
      .single();

    if (orderError || !order) {
      // Roll back inventory since order failed.
      // Reservation path is already destroyed by consume_reservations, so we
      // restore each item directly using whatever the client sent.
      if (sessionId) {
        for (const item of items) {
          await supabaseAdmin.rpc("restore_inventory_v2", {
            p_product_id: item.productId,
            p_variant_id: item.variantId ?? null,
            p_qty: item.quantity,
          });
        }
      } else {
        for (const dec of decremented) {
          await supabaseAdmin.rpc("restore_inventory_v2", {
            p_product_id: dec.productId,
            p_variant_id: dec.variantId,
            p_qty: dec.qty,
          });
        }
      }
      console.error("Order insert error:", orderError);
      return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
    }

    const orderId = order.id;

    // Insert order items
    await supabaseAdmin.from("order_items").insert(
      items.map((item) => ({
        order_id:     orderId,
        product_id:   item.productId,
        variant_id:   item.variantId ?? null,
        product_name: item.productName,
        variant_name: item.variantName,
        unit_price:   item.unitPrice,
        quantity:     item.quantity,
        line_total:   item.lineTotal,
      }))
    );

    // Create payment record
    if (paymentMethod === "mpesa" && checkoutRequestId) {
      await supabaseAdmin.from("payments").insert({
        order_id:            orderId,
        method:              "mpesa",
        amount:              total,
        currency:            "KES",
        status:              "pending",
        checkout_request_id: checkoutRequestId,
      });
    } else if (paymentMethod === "card" && stripePaymentIntentId) {
      await supabaseAdmin.from("payments").insert({
        order_id:                   orderId,
        method:                     "card",
        amount:                     total,
        currency:                   "KES",
        status:                     "pending",
        stripe_payment_intent_id:   stripePaymentIntentId,
      });
    }

    // Fire notifications (non-blocking)
    const customerName = `${shippingAddress.firstName} ${shippingAddress.lastName}`;
    Promise.allSettled([
      sendOrderConfirmation({
        orderId,
        customerName,
        email,
        items: items.map((i) => ({ name: i.productName, variant: i.variantName, qty: i.quantity, price: i.unitPrice })),
        subtotal,
        shippingCost,
        discount: discountAmount,
        total,
        shippingAddress: `${shippingAddress.address}, ${shippingAddress.city}, ${shippingAddress.county}`,
        paymentMethod,
      }),
      sendOrderSms({
        phone,
        customerName,
        orderId,
        total,
      }),
    ]).catch(() => {});

    return NextResponse.json({ orderId });
  } catch (err: unknown) {
    Sentry.captureException(err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
