import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import * as Sentry from "@sentry/nextjs";
import { getClientIp, isSafaricomIp } from "@/lib/security";

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Always return 200 + ResultCode 0 — Safaricom retries aggressively on any
// non-2xx response, and a retry storm will corrupt state. Log internally,
// acknowledge externally.
const ACK = NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!isSafaricomIp(ip)) {
    console.warn("Rejected M-Pesa callback from unknown IP:", ip);
    return ACK;
  }

  try {
    const body = await req.json();
    const callback = body?.Body?.stkCallback;
    if (!callback?.CheckoutRequestID) return ACK;

    const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = callback;
    const supabaseAdmin = getAdmin();

    // Idempotency: if this payment is already settled, ignore duplicate callbacks.
    const { data: existing } = await supabaseAdmin
      .from("payments")
      .select("id, status, order_id")
      .eq("checkout_request_id", CheckoutRequestID)
      .single();

    if (!existing) {
      console.warn("Callback for unknown CheckoutRequestID:", CheckoutRequestID);
      return ACK;
    }
    if (existing.status === "paid" || existing.status === "failed") {
      return ACK;
    }

    let mpesaReceipt: string | undefined;
    let amount: number | undefined;
    let phoneNumber: string | undefined;
    if (ResultCode === 0 && Array.isArray(CallbackMetadata?.Item)) {
      for (const item of CallbackMetadata.Item) {
        if (item.Name === "MpesaReceiptNumber") mpesaReceipt = String(item.Value);
        else if (item.Name === "Amount") amount = Number(item.Value);
        else if (item.Name === "PhoneNumber") phoneNumber = String(item.Value);
      }
    }

    const paymentStatus = ResultCode === 0 ? "paid" : "failed";
    const nowIso = new Date().toISOString();

    await supabaseAdmin
      .from("payments")
      .update({
        status:            paymentStatus,
        mpesa_receipt:     mpesaReceipt ?? null,
        result_desc:       ResultDesc,
        provider_response: { MerchantRequestID, CheckoutRequestID, amount, phoneNumber },
        provider_tx_id:    mpesaReceipt ?? null,
        paid_at:           ResultCode === 0 ? nowIso : null,
        updated_at:        nowIso,
      })
      .eq("id", existing.id);

    if (ResultCode === 0 && existing.order_id) {
      await supabaseAdmin
        .from("orders")
        .update({ status: "processing", payment_status: "paid", updated_at: nowIso })
        .eq("id", existing.order_id);
    } else if (ResultCode !== 0 && existing.order_id) {
      // Payment failed — release reserved stock so the order doesn't hold inventory.
      const { data: items } = await supabaseAdmin
        .from("order_items")
        .select("product_id, variant_id, quantity")
        .eq("order_id", existing.order_id);
      for (const it of items ?? []) {
        await supabaseAdmin.rpc("restore_inventory_v2", {
          p_product_id: it.product_id,
          p_variant_id: it.variant_id ?? null,
          p_qty:        it.quantity,
        });
      }
      await supabaseAdmin
        .from("orders")
        .update({ status: "cancelled", payment_status: "failed", updated_at: nowIso })
        .eq("id", existing.order_id);
    }

    return ACK;
  } catch (err) {
    Sentry.captureException(err);
    console.error("M-Pesa callback error:", err);
    return ACK;
  }
}
