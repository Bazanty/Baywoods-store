"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/adminAuth";
import { mpesaResultMessage } from "@/lib/mpesaResult";
import { formatPhone, queryStkPush } from "@/lib/mpesa";
import { createSupabaseAdminClient } from "@/lib/supabase/server";

type ActionResult = { ok: boolean; message: string };

function db() {
  return createSupabaseAdminClient();
}

function metadataValue(items: any[] | undefined, name: string): string | null {
  const found = items?.find((item) => item?.Name === name);
  if (found?.Value == null) return null;
  return String(found.Value);
}

async function getPayment(paymentId: string) {
  const { data, error } = await db()
    .from("payments")
    .select(`
      id, order_id, status, amount, checkout_request_id, merchant_request_id,
      mpesa_phone, mpesa_amount, mpesa_receipt, raw_callback, result_desc,
      orders ( id, status, payment_status, total )
    `)
    .eq("id", paymentId)
    .single();

  if (error || !data) throw new Error("Payment not found.");
  return data as any;
}

async function finalizeMpesaPayment(params: {
  checkoutRequestId: string;
  merchantRequestId: string | null;
  resultCode: string;
  resultDesc: string;
  receipt: string | null;
  phone: string | null;
  amount: number | null;
  raw: unknown;
}): Promise<ActionResult> {
  const { data, error } = await db().rpc("finalize_mpesa_payment", {
    p_checkout_request_id: params.checkoutRequestId,
    p_merchant_request_id: params.merchantRequestId,
    p_result_code: params.resultCode,
    p_result_desc: params.resultDesc,
    p_receipt: params.receipt,
    p_phone: params.phone,
    p_amount: params.amount,
    p_raw_callback: params.raw,
  });

  if (error) throw error;
  if (!data?.ok) {
    return { ok: false, message: `Could not apply payment: ${data?.reason ?? "unknown reason"}` };
  }
  if (data.duplicate) {
    return { ok: true, message: `Duplicate callback ignored. Payment is already ${data.payment_status}.` };
  }
  if (data.payment_status === "paid") {
    return {
      ok: true,
      message:
        data.order_status === "VERIFICATION_PENDING"
          ? "Payment marked paid, but stock needs admin verification."
          : "Payment confirmed and order marked paid.",
    };
  }
  return { ok: true, message: mpesaResultMessage(params.resultCode, params.resultDesc) };
}

export async function queryMpesaPayment(paymentId: string): Promise<ActionResult> {
  await requireAdmin();

  const payment = await getPayment(paymentId);
  if (!payment.checkout_request_id) {
    return { ok: false, message: "This payment has no checkout request ID." };
  }
  if (String(payment.checkout_request_id).startsWith("mock_")) {
    return { ok: false, message: "Mock payments cannot be queried from Daraja." };
  }
  if (String(payment.checkout_request_id).startsWith("manual_")) {
    return {
      ok: false,
      message: "Manual Till payment — verify the code in M-Pesa Business notifications, then use Confirm paid.",
    };
  }

  const result = await queryStkPush(payment.checkout_request_id, payment.merchant_request_id);
  const resultCode = result.ResultCode == null ? null : String(result.ResultCode);
  const resultDesc = result.ResultDesc ?? "The request is being processed";

  if (!resultCode) {
    return { ok: true, message: resultDesc };
  }

  if (resultCode === "0") {
    return {
      ok: true,
      message:
        "Daraja reports this STK request as successful. Wait for the webhook, replay a saved callback, or confirm manually with the verified M-Pesa receipt.",
    };
  }

  const applied = await finalizeMpesaPayment({
    checkoutRequestId: payment.checkout_request_id,
    merchantRequestId: payment.merchant_request_id ?? result.MerchantRequestID ?? null,
    resultCode,
    resultDesc: mpesaResultMessage(resultCode, resultDesc),
    receipt: null,
    phone: payment.mpesa_phone ?? null,
    amount: Number(payment.mpesa_amount ?? payment.amount),
    raw: result.Raw ?? result,
  });

  revalidatePath("/admin/payments");
  revalidatePath("/admin/orders");
  return applied;
}

export async function replaySavedMpesaCallback(paymentId: string): Promise<ActionResult> {
  await requireAdmin();

  const payment = await getPayment(paymentId);
  const callback = payment.raw_callback?.Body?.stkCallback;
  if (!callback?.CheckoutRequestID) {
    return { ok: false, message: "No saved Daraja callback payload is available for this payment." };
  }

  const metadata = callback.CallbackMetadata?.Item;
  const resultCode = String(callback.ResultCode ?? "");
  const resultDesc = String(callback.ResultDesc ?? "");
  const applied = await finalizeMpesaPayment({
    checkoutRequestId: String(callback.CheckoutRequestID),
    merchantRequestId: callback.MerchantRequestID ? String(callback.MerchantRequestID) : null,
    resultCode,
    resultDesc,
    receipt: metadataValue(metadata, "MpesaReceiptNumber"),
    phone: metadataValue(metadata, "PhoneNumber"),
    amount: metadataValue(metadata, "Amount") ? Number(metadataValue(metadata, "Amount")) : null,
    raw: payment.raw_callback,
  });

  revalidatePath("/admin/payments");
  revalidatePath("/admin/orders");
  return applied;
}

export async function confirmMpesaPaymentManually(
  paymentId: string,
  formData: FormData
): Promise<ActionResult> {
  await requireAdmin();

  const receipt = String(formData.get("receipt") ?? "").trim().toUpperCase();
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const note = String(formData.get("note") ?? "").trim();
  const amountInput = String(formData.get("amount") ?? "").trim();
  const amount = amountInput ? Number(amountInput) : null;

  if (!receipt || receipt.length < 6) {
    return { ok: false, message: "Enter the verified M-Pesa receipt number before confirming." };
  }
  if (amountInput && (!Number.isFinite(amount) || Number(amount) <= 0)) {
    return { ok: false, message: "Amount must be a valid positive number." };
  }

  const payment = await getPayment(paymentId);
  if (!payment.checkout_request_id) {
    return { ok: false, message: "This payment has no checkout request ID." };
  }

  const confirmedAmount = amount ?? Number(payment.mpesa_amount ?? payment.amount);
  const raw = {
    source: "admin_reconciliation",
    reconciledAt: new Date().toISOString(),
    note,
    paymentId,
    Body: {
      stkCallback: {
        MerchantRequestID: payment.merchant_request_id,
        CheckoutRequestID: payment.checkout_request_id,
        ResultCode: 0,
        ResultDesc: "Payment manually confirmed from verified M-Pesa receipt.",
        CallbackMetadata: {
          Item: [
            { Name: "Amount", Value: confirmedAmount },
            { Name: "MpesaReceiptNumber", Value: receipt },
            { Name: "PhoneNumber", Value: phone ?? payment.mpesa_phone ?? "" },
          ],
        },
      },
    },
  };

  const applied = await finalizeMpesaPayment({
    checkoutRequestId: payment.checkout_request_id,
    merchantRequestId: payment.merchant_request_id ?? null,
    resultCode: "0",
    resultDesc: "Payment manually confirmed from verified M-Pesa receipt.",
    receipt,
    phone: phone ?? payment.mpesa_phone ?? null,
    amount: confirmedAmount,
    raw,
  });

  revalidatePath("/admin/payments");
  revalidatePath("/admin/orders");
  return applied;
}

export async function repairPaidOrderStatus(paymentId: string): Promise<ActionResult> {
  await requireAdmin();

  const payment = await getPayment(paymentId);
  const order = Array.isArray(payment.orders) ? payment.orders[0] : payment.orders;
  if (payment.status !== "paid") {
    return { ok: false, message: "Only an already-paid payment can repair an order status mismatch." };
  }
  if (!order?.id) {
    return { ok: false, message: "No order is attached to this payment." };
  }
  if (order.payment_status === "paid") {
    return { ok: true, message: "Order already has paid payment status." };
  }

  const { error } = await db()
    .from("orders")
    .update({
      status: "VERIFICATION_PENDING",
      payment_status: "paid",
      payment_confirmed_at: new Date().toISOString(),
      failed_reason: "Payment was already paid before reconciliation; verify stock before packing.",
      updated_at: new Date().toISOString(),
    })
    .eq("id", order.id);

  if (error) throw error;
  revalidatePath("/admin/payments");
  revalidatePath("/admin/orders");
  return { ok: true, message: "Order marked paid and moved to verification pending." };
}
