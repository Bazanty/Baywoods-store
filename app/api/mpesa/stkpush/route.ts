import { NextRequest, NextResponse } from "next/server";
import { initiateStkPush, formatPhone } from "@/lib/mpesa";

export async function POST(req: NextRequest) {
  try {
    const { phone, amount, orderId } = await req.json();

    if (!phone || !amount) {
      return NextResponse.json({ error: "phone and amount are required" }, { status: 400 });
    }

    const formatted = formatPhone(phone);
    if (formatted.length !== 12) {
      return NextResponse.json({ error: "Invalid Kenyan phone number" }, { status: 400 });
    }

    // Mock mode — bypasses Safaricom sandbox (which blocks many IPs via Incapsula).
    // Set MPESA_MOCK=true in .env.local for local dev. Remove it on Vercel/production.
    if (process.env.MPESA_MOCK === "true") {
      const mockId = `mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      return NextResponse.json({
        checkoutRequestId: mockId,
        merchantRequestId: "mock-merchant-req",
        customerMessage: "[MOCK] Check your phone and enter your M-Pesa PIN to complete payment.",
      });
    }

    const result = await initiateStkPush({
      phone: formatted,
      amount,
      orderId: orderId ?? Date.now().toString(),
      description: "Baywoods Order",
    });

    if (result.ResponseCode !== "0") {
      return NextResponse.json(
        { error: result.ResponseDescription ?? "STK push failed" },
        { status: 422 }
      );
    }

    return NextResponse.json({
      checkoutRequestId: result.CheckoutRequestID,
      merchantRequestId: result.MerchantRequestID,
      customerMessage: result.CustomerMessage,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
