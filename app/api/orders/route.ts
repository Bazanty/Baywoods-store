import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import * as Sentry from "@sentry/nextjs";
import { sendOrderConfirmation, sendAdminOrderNotification } from "@/lib/email";
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
  expectedConsumed?: number;
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
    const { userId, email, phone, shippingAddress, shippingMethod, shippingCost, subtotal, discountAmount = 0, total, paymentMethod, checkoutRequestId, stripePaymentIntentId, items, sessionId, expectedConsumed } = payload;

    if (!items?.length) {
      return NextResponse.json({ error: "No items in order" }, { status: 400 });
    }

    const supabaseAdmin = getAdmin();

    // Stock handling — two paths tried in order:
    //   1. Reservation path: atomically consume the session's cart_reservations rows,
    //      which both decrements quantity and releases the reserved hold in one shot.
    //      Used when the client reserved stock at the shipping step.
    //   2. Direct decrement path: per-item variant-aware decrement with rollback.
    //      Used when no session (guest fast-checkout) OR when consume_reservations
    //      found 0 rows (TTL expired between reservation and payment).
    //      Untracked products (no inventory row) are skipped gracefully.

    let inventoryHandledByReservation = false;

    if (sessionId) {
      const { data: consumed, error: consumeErr } = await supabaseAdmin.rpc(
        "consume_reservations",
        { p_session_id: sessionId }
      );
      if (consumeErr) {
        Sentry.captureException(consumeErr);
        console.error("[orders] consume_reservations error:", consumeErr);
        // Fall through to direct decrement below
      } else if ((consumed ?? 0) > 0) {
        // At least some reservations were consumed — inventory is handled.
        // Untracked items (placeholder rows) are no-ops and still counted.
        inventoryHandledByReservation = true;
      }
      // consumed === 0: all reservations expired, fall through to direct decrement
    }

    const decremented: { productId: string; variantId: string | null; qty: number }[] = [];

    if (!inventoryHandledByReservation) {
      for (const item of items) {
        const { data, error } = await supabaseAdmin.rpc("decrement_inventory_v2", {
          p_product_id: item.productId,
          p_variant_id: item.variantId ?? null,
          p_qty: item.quantity,
        });

        if (error || data === false) {
          // Check whether this product has an inventory row at all.
          const { data: invRows } = await supabaseAdmin
            .from("inventory")
            .select("id")
            .eq("product_id", item.productId)
            .limit(1);

          if (!invRows || invRows.length === 0) {
            // Untracked product — no inventory to manage, skip.
            continue;
          }

          // Inventory row exists but stock is insufficient — rollback and fail.
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
      sendAdminOrderNotification({
        orderId,
        customerName,
        email,
        total,
        paymentMethod,
        items: items.map((i) => ({ name: i.productName, variant: i.variantName, qty: i.quantity, price: i.unitPrice })),
        shippingAddress: `${shippingAddress.address}, ${shippingAddress.city}, ${shippingAddress.county}`,
      }),
    ]).catch(() => {});

    return NextResponse.json({ orderId });
  } catch (err: unknown) {
    Sentry.captureException(err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
