import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendOrderConfirmation } from "@/lib/email";
import { sendOrderSms } from "@/lib/sms";

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

interface OrderItem {
  productId: string;
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
  paymentMethod: "mpesa" | "card" | "paypal";
  checkoutRequestId?: string;
  stripePaymentIntentId?: string;
  items: OrderItem[];
}

export async function POST(req: NextRequest) {
  try {
    const payload: CreateOrderPayload = await req.json();
    const { userId, email, phone, shippingAddress, shippingMethod, shippingCost, subtotal, discountAmount = 0, total, paymentMethod, checkoutRequestId, stripePaymentIntentId, items } = payload;

    if (!items?.length) {
      return NextResponse.json({ error: "No items in order" }, { status: 400 });
    }

    const supabaseAdmin = getAdmin();
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
      console.error("Order insert error:", orderError);
      return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
    }

    const orderId = order.id;

    // Insert order items
    await supabaseAdmin.from("order_items").insert(
      items.map((item) => ({
        order_id:     orderId,
        product_id:   item.productId,
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
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
