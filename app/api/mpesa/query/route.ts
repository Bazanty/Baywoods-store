import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import * as Sentry from "@sentry/nextjs";
import { formatPhone, isPaymentMockEnabled, queryStkPush } from "@/lib/mpesa";
import { mpesaResultMessage } from "@/lib/mpesaResult";
import { sendPaidOrderNotifications } from "@/lib/paymentNotifications";

const mockPollCount = new Map<string, number>();

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

async function readPayment(db: ReturnType<typeof getAdmin>, checkoutRequestId: string) {
  const { data, error } = await db
    .from("payments")
    .select(`
      id, status, amount, checkout_request_id, merchant_request_id,
      mpesa_phone, mpesa_amount, mpesa_receipt, result_desc, failure_code,
      orders ( id, status, payment_status )
    `)
    .eq("checkout_request_id", checkoutRequestId)
    .single();

  if (error) return null;
  return data as any;
}

function paymentResponse(payment: any, extra: Record<string, unknown> = {}) {
  const order = payment?.orders;
  return NextResponse.json({
    paymentStatus: payment?.status ?? null,
    orderStatus: order?.status ?? null,
    orderPaymentStatus: order?.payment_status ?? null,
    orderId: order?.id ?? null,
    checkoutRequestId: payment?.checkout_request_id ?? null,
    mpesaReceipt: payment?.mpesa_receipt ?? null,
    resultCode: payment?.status === "paid" ? "0" : payment?.failure_code ?? null,
    resultDesc: payment?.result_desc ?? null,
    ...extra,
  });
}

export async function POST(req: NextRequest) {
  try {
    const { checkoutRequestId } = await req.json();
    const cleanCheckoutRequestId = String(checkoutRequestId ?? "").trim();

    if (!cleanCheckoutRequestId) {
      return NextResponse.json({ error: "checkoutRequestId is required" }, { status: 400 });
    }
    if (cleanCheckoutRequestId.length > 120) {
      return NextResponse.json({ error: "checkoutRequestId is invalid" }, { status: 400 });
    }

    const db = getAdmin();
    let payment = await readPayment(db, cleanCheckoutRequestId);
    if (!payment) {
      return NextResponse.json({ error: "Payment attempt not found" }, { status: 404 });
    }

    if (payment.status === "paid" || payment.status === "failed") {
      return paymentResponse(payment);
    }

    if (isPaymentMockEnabled() || cleanCheckoutRequestId.startsWith("mock_")) {
      const count = (mockPollCount.get(cleanCheckoutRequestId) ?? 0) + 1;
      mockPollCount.set(cleanCheckoutRequestId, count);

      if (count < 3) {
        return paymentResponse(payment, {
          resultCode: null,
          resultDesc: "The request is being processed",
        });
      }

      mockPollCount.delete(cleanCheckoutRequestId);
      const rawCallback = {
        Body: {
          stkCallback: {
            MerchantRequestID: payment.merchant_request_id ?? "mock-merchant-req",
            CheckoutRequestID: cleanCheckoutRequestId,
            ResultCode: 0,
            ResultDesc: "The service request is processed successfully.",
            CallbackMetadata: {
              Item: [
                { Name: "Amount", Value: Number(payment.mpesa_amount ?? payment.amount) },
                { Name: "MpesaReceiptNumber", Value: `MOCK${Date.now().toString().slice(-8)}` },
                { Name: "PhoneNumber", Value: payment.mpesa_phone ?? "" },
              ],
            },
          },
        },
      };

      const { error } = await db.rpc("finalize_mpesa_payment", {
        p_checkout_request_id: cleanCheckoutRequestId,
        p_merchant_request_id: payment.merchant_request_id ?? "mock-merchant-req",
        p_result_code: "0",
        p_result_desc: "The service request is processed successfully.",
        p_receipt: rawCallback.Body.stkCallback.CallbackMetadata.Item[1].Value,
        p_phone: payment.mpesa_phone ?? null,
        p_amount: Number(payment.mpesa_amount ?? payment.amount),
        p_raw_callback: rawCallback,
      });

      if (error) {
        Sentry.captureException(error);
        return NextResponse.json({ error: "Could not confirm mock payment" }, { status: 500 });
      }

      payment = await readPayment(db, cleanCheckoutRequestId);
      return paymentResponse(payment);
    }

    const result = await queryStkPush(cleanCheckoutRequestId, payment.merchant_request_id);
    const resultCode = result.ResultCode == null ? null : String(result.ResultCode);
    const resultDesc = result.ResultDesc ?? null;

    if (resultCode && resultCode !== "0") {
      const { error } = await db.rpc("finalize_mpesa_payment", {
        p_checkout_request_id: cleanCheckoutRequestId,
        p_merchant_request_id: payment.merchant_request_id ?? null,
        p_result_code: resultCode,
        p_result_desc: resultDesc ?? mpesaResultMessage(resultCode),
        p_receipt: null,
        p_phone: payment.mpesa_phone ?? null,
        p_amount: Number(payment.mpesa_amount ?? payment.amount),
        p_raw_callback: result.Raw ?? result,
      });

      if (error) {
        Sentry.captureException(error);
        console.error("[mpesa query] failed to persist failed payment:", error);
      }

      payment = await readPayment(db, cleanCheckoutRequestId);
      return paymentResponse(payment, {
        resultCode,
        resultDesc: mpesaResultMessage(resultCode, resultDesc),
      });
    }

    if (resultCode === "0") {
      const { data: finalizeResult, error } = await db.rpc("finalize_mpesa_payment", {
        p_checkout_request_id: cleanCheckoutRequestId,
        p_merchant_request_id: result.MerchantRequestID ?? payment.merchant_request_id ?? null,
        p_result_code: "0",
        p_result_desc: resultDesc ?? "Lipana confirmed the M-Pesa payment.",
        p_receipt: result.MpesaReceiptNumber ?? null,
        p_phone: result.PhoneNumber ? formatPhone(result.PhoneNumber) : payment.mpesa_phone ?? null,
        p_amount: result.Amount ?? Number(payment.mpesa_amount ?? payment.amount),
        p_raw_callback: result.Raw ?? result,
      });

      if (error) {
        Sentry.captureException(error);
        console.error("[mpesa query] failed to persist successful payment:", error);
        return paymentResponse(payment, {
          resultCode: "0",
          callbackPending: true,
          resultDesc: "Lipana confirmed the payment. Waiting for the webhook to update the order.",
        });
      }

      if (finalizeResult?.ok && !finalizeResult.duplicate && finalizeResult.payment_status === "paid") {
        await sendPaidOrderNotifications(db, cleanCheckoutRequestId);
      }

      payment = await readPayment(db, cleanCheckoutRequestId);
      return paymentResponse(payment, {
        resultCode: "0",
        resultDesc: resultDesc ?? "Lipana confirmed the M-Pesa payment.",
      });
    }

    return paymentResponse(payment, {
      resultCode: null,
      resultDesc: resultDesc ?? "The request is being processed",
    });
  } catch (err: unknown) {
    Sentry.captureException(err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
