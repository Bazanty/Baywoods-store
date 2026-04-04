import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const callback = body?.Body?.stkCallback;
    if (!callback) return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });

    const { MerchantRequestID, CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = callback;

    let mpesaReceiptNumber: string | undefined;
    let amount: number | undefined;
    let phoneNumber: string | undefined;

    if (ResultCode === 0 && CallbackMetadata?.Item) {
      for (const item of CallbackMetadata.Item) {
        if (item.Name === "MpesaReceiptNumber") mpesaReceiptNumber = item.Value;
        if (item.Name === "Amount") amount = Number(item.Value);
        if (item.Name === "PhoneNumber") phoneNumber = String(item.Value);
      }
    }

    const paymentStatus = ResultCode === 0 ? "paid" : "failed";

    const supabaseAdmin = getAdmin();
    // Update payment row
    const { data: payment } = await supabaseAdmin
      .from("payments")
      .update({
        status:          paymentStatus,
        mpesa_receipt:   mpesaReceiptNumber ?? null,
        result_desc:     ResultDesc,
        metadata:        { MerchantRequestID, CheckoutRequestID, amount, phoneNumber },
        provider_tx_id:  mpesaReceiptNumber ?? null,
        paid_at:         ResultCode === 0 ? new Date().toISOString() : null,
        updated_at:      new Date().toISOString(),
      })
      .eq("checkout_request_id", CheckoutRequestID)
      .select("order_id")
      .single();

    // Update order status on success
    if (ResultCode === 0 && payment?.order_id) {
      await supabaseAdmin
        .from("orders")
        .update({
          status:         "processing",
          payment_status: "paid",
          updated_at:     new Date().toISOString(),
        })
        .eq("id", payment.order_id);
    }

    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  } catch (err) {
    console.error("M-Pesa callback error:", err);
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });
  }
}
