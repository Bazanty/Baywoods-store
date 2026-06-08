import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import * as Sentry from "@sentry/nextjs";
import { sendAdminOrderNotification, sendOrderConfirmation } from "@/lib/email";
import { sendOrderSms } from "@/lib/sms";
import { getClientIp, isSafaricomIp } from "@/lib/security";

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

const ACK = NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });

function metadataValue(items: any[] | undefined, name: string): string | null {
  const found = items?.find((item) => item?.Name === name);
  if (found?.Value == null) return null;
  return String(found.Value);
}

async function sendPaidNotifications(db: ReturnType<typeof getAdmin>, checkoutRequestId: string) {
  const { data: payment } = await db
    .from("payments")
    .select(`
      order_id,
      orders (
        id, email, shipping_name, shipping_line1, shipping_city, shipping_state,
        shipping_phone, subtotal, shipping_cost, discount_amount, total, payment_method,
        order_items ( product_name, variant_name, quantity, unit_price )
      )
    `)
    .eq("checkout_request_id", checkoutRequestId)
    .single();

  const order = payment?.orders as any;
  if (!order?.email) return;

  const items = (order.order_items ?? []).map((item: any) => ({
    name: item.product_name,
    variant: item.variant_name,
    qty: item.quantity,
    price: Number(item.unit_price),
  }));

  await Promise.allSettled([
    sendOrderConfirmation({
      orderId: order.id,
      customerName: order.shipping_name,
      email: order.email,
      items,
      subtotal: Number(order.subtotal),
      shippingCost: Number(order.shipping_cost),
      discount: Number(order.discount_amount),
      total: Number(order.total),
      shippingAddress: `${order.shipping_line1}, ${order.shipping_city}, ${order.shipping_state}`,
      paymentMethod: order.payment_method,
    }),
    order.shipping_phone
      ? sendOrderSms({
          phone: order.shipping_phone,
          customerName: order.shipping_name,
          orderId: order.id,
          total: Number(order.total),
        })
      : Promise.resolve(),
    sendAdminOrderNotification({
      orderId: order.id,
      customerName: order.shipping_name,
      email: order.email,
      total: Number(order.total),
      paymentMethod: order.payment_method,
      items,
      shippingAddress: `${order.shipping_line1}, ${order.shipping_city}, ${order.shipping_state}`,
    }),
  ]);
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!isSafaricomIp(ip)) {
    console.warn("[mpesa callback] rejected unknown IP:", ip);
    return ACK;
  }

  let body: any;
  try {
    body = await req.json();
  } catch (err) {
    Sentry.captureException(err);
    console.error("[mpesa callback] invalid JSON:", err);
    return ACK;
  }

  try {
    const callback = body?.Body?.stkCallback;
    if (!callback?.CheckoutRequestID) {
      console.warn("[mpesa callback] missing CheckoutRequestID:", body);
      return ACK;
    }

    const metadata = callback.CallbackMetadata?.Item;
    const receipt = metadataValue(metadata, "MpesaReceiptNumber");
    const amount = metadataValue(metadata, "Amount");
    const phone = metadataValue(metadata, "PhoneNumber");
    const resultCode = String(callback.ResultCode ?? "");
    const checkoutRequestId = String(callback.CheckoutRequestID);
    const merchantRequestId = callback.MerchantRequestID ? String(callback.MerchantRequestID) : null;

    const db = getAdmin();
    const { data: finalizeResult, error } = await db.rpc("finalize_mpesa_payment", {
      p_checkout_request_id: checkoutRequestId,
      p_merchant_request_id: merchantRequestId,
      p_result_code: resultCode,
      p_result_desc: String(callback.ResultDesc ?? ""),
      p_receipt: receipt,
      p_phone: phone,
      p_amount: amount ? Number(amount) : null,
      p_raw_callback: body,
    });

    if (error) {
      Sentry.captureException(error);
      console.error("[mpesa callback] finalize error:", error);
      return ACK;
    }

    if (!finalizeResult?.ok) {
      const reason = finalizeResult?.reason ?? "unknown";
      Sentry.captureMessage(`M-Pesa callback could not be applied: ${reason}`);
      console.warn("[mpesa callback] not applied:", finalizeResult);
      return ACK;
    }

    if (!finalizeResult.duplicate && finalizeResult.payment_status === "paid") {
      await sendPaidNotifications(db, checkoutRequestId);
    }

    return ACK;
  } catch (err) {
    Sentry.captureException(err);
    console.error("[mpesa callback] unhandled error:", err);
    return ACK;
  }
}
