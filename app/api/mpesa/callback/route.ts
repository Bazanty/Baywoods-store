import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import * as Sentry from "@sentry/nextjs";
import { formatPhone } from "@/lib/mpesa";
import { sendPaidOrderNotifications } from "@/lib/paymentNotifications";
import { getClientIp, isSafaricomIp } from "@/lib/security";

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Safaricom expects a 200 with this body even on internal failures — anything
// else triggers retries, which can double-apply payments.
const ACK = NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });

function metadataValue(items: any[] | undefined, name: string): string | null {
  const found = items?.find((item) => item?.Name === name);
  if (found?.Value == null) return null;
  return String(found.Value);
}

async function applyPaymentResult(params: {
  db: ReturnType<typeof getAdmin>;
  checkoutRequestId: string;
  merchantRequestId: string | null;
  resultCode: string;
  resultDesc: string;
  receipt: string | null;
  phone: string | null;
  amount: number | null;
  rawCallback: unknown;
}) {
  const { data: finalizeResult, error } = await params.db.rpc("finalize_mpesa_payment", {
    p_checkout_request_id: params.checkoutRequestId,
    p_merchant_request_id: params.merchantRequestId,
    p_result_code: params.resultCode,
    p_result_desc: params.resultDesc,
    p_receipt: params.receipt,
    p_phone: params.phone,
    p_amount: params.amount,
    p_raw_callback: params.rawCallback,
  });

  if (error) {
    Sentry.captureException(error);
    console.error("[mpesa callback] finalize error:", error);
    return;
  }

  if (!finalizeResult?.ok) {
    const reason = finalizeResult?.reason ?? "unknown";
    Sentry.captureMessage(`M-Pesa callback could not be applied: ${reason}`);
    console.warn("[mpesa callback] not applied:", finalizeResult);
    return;
  }

  if (!finalizeResult.duplicate && finalizeResult.payment_status === "paid") {
    await sendPaidOrderNotifications(params.db, params.checkoutRequestId);
  }
}

export async function POST(req: NextRequest) {
  // Validate the request comes from Safaricom's IP range.
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
      console.warn("[mpesa callback] missing stkCallback or CheckoutRequestID:", body);
      return ACK;
    }

    const metadata = callback.CallbackMetadata?.Item;
    const resultCode = String(callback.ResultCode ?? "");
    const checkoutRequestId = String(callback.CheckoutRequestID);
    const merchantRequestId = callback.MerchantRequestID ? String(callback.MerchantRequestID) : null;
    const receipt = metadataValue(metadata, "MpesaReceiptNumber");
    const amount = metadataValue(metadata, "Amount");
    const rawPhone = metadataValue(metadata, "PhoneNumber");

    await applyPaymentResult({
      db: getAdmin(),
      checkoutRequestId,
      merchantRequestId,
      resultCode,
      resultDesc: String(callback.ResultDesc ?? ""),
      receipt,
      phone: rawPhone ? formatPhone(rawPhone) : null,
      amount: amount ? Number(amount) : null,
      rawCallback: body,
    });

    return ACK;
  } catch (err) {
    Sentry.captureException(err);
    console.error("[mpesa callback] unhandled error:", err);
    return ACK;
  }
}
