import { NextRequest, NextResponse } from "next/server";
import { queryStkPush } from "@/lib/mpesa";

const mockPollCount = new Map<string, number>();

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

    if (process.env.MPESA_MOCK === "true" || cleanCheckoutRequestId.startsWith("mock_")) {
      const count = (mockPollCount.get(cleanCheckoutRequestId) ?? 0) + 1;
      mockPollCount.set(cleanCheckoutRequestId, count);

      if (count < 3) {
        return NextResponse.json({
          resultCode: null,
          resultDesc: "The request is being processed",
        });
      }

      mockPollCount.delete(cleanCheckoutRequestId);
      return NextResponse.json({
        resultCode: "0",
        resultDesc: "The service request is processed successfully.",
      });
    }

    const result = await queryStkPush(cleanCheckoutRequestId);

    return NextResponse.json({
      resultCode: result.ResultCode,
      resultDesc: result.ResultDesc,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
