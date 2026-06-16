import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import * as Sentry from "@sentry/nextjs";
import {
  formatPhone,
  normalizeLipanaPaymentPayload,
  verifyLipanaWebhookSignature,
} from "@/lib/mpesa";
import { sendPaidOrderNotifications } from "@/lib/paymentNotifications";
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

function allowUnsignedLipanaWebhook() {
  return process.env.LIPANA_SKIP_SIGNATURE_CHECK === "true";
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

async function resolveCheckoutRequestId(
  db: ReturnType<typeof getAdmin>,
  checkoutRequestId: string | null,
  transactionId: string | null
) {
  if (checkoutRequestId) return checkoutRequestId;
  if (!transactionId) return null;

  const { data } = await db
    .from("payments")
    .select("checkout_request_id")
    .eq("merchant_request_id", transactionId)
    .maybeSingle();

  return data?.checkout_request_id ? String(data.checkout_request_id) : null;
}

export async function POST(req: NextRequest) {
  let rawBody: string;
  let body: any;

  try {
    rawBody = await req.text();
    body = JSON.parse(rawBody);
  } catch (err) {
    Sentry.captureException(err);
    console.error("[mpesa callback] invalid JSON:", err);
    return ACK;
  }

  try {
    const lipanaPayment = normalizeLipanaPaymentPayload(body);

    if (lipanaPayment) {
      const signature = req.headers.get("x-lipana-signature");
      if (!verifyLipanaWebhookSignature(rawBody, signature) && !allowUnsignedLipanaWebhook()) {
        console.warn("[mpesa callback] rejected Lipana webhook with invalid signature");
        return NextResponse.json({ error: "Invalid Lipana webhook signature" }, { status: 401 });
      }

      if (!lipanaPayment.resultCode) {
        return ACK;
      }

      const db = getAdmin();
      const checkoutRequestId = await resolveCheckoutRequestId(
        db,
        lipanaPayment.checkoutRequestId,
        lipanaPayment.transactionId
      );

      if (!checkoutRequestId) {
        console.warn("[mpesa callback] Lipana webhook missing checkout request ID:", body);
        return ACK;
      }

      await applyPaymentResult({
        db,
        checkoutRequestId,
        merchantRequestId: lipanaPayment.merchantRequestId,
        resultCode: lipanaPayment.resultCode,
        resultDesc: lipanaPayment.resultDesc,
        receipt: lipanaPayment.receipt,
        phone: lipanaPayment.phone ? formatPhone(lipanaPayment.phone) : null,
        amount: lipanaPayment.amount,
        rawCallback: body,
      });

      return ACK;
    }

    // Legacy Daraja fallback for any in-flight payments created before the
    // Lipana migration.
    const ip = getClientIp(req);
    if (!isSafaricomIp(ip)) {
      console.warn("[mpesa callback] rejected unknown legacy callback IP:", ip);
      return ACK;
    }

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

    await applyPaymentResult({
      db: getAdmin(),
      checkoutRequestId,
      merchantRequestId,
      resultCode,
      resultDesc: String(callback.ResultDesc ?? ""),
      receipt,
      phone,
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
