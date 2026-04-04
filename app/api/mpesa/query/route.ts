import { NextRequest, NextResponse } from "next/server";
import { queryStkPush } from "@/lib/mpesa";

// In-memory poll counter for mock mode (resets on server restart — fine for dev)
const mockPollCount = new Map<string, number>();

export async function POST(req: NextRequest) {
  try {
    const { checkoutRequestId } = await req.json();

    if (!checkoutRequestId) {
      return NextResponse.json({ error: "checkoutRequestId is required" }, { status: 400 });
    }

    // Mock mode — simulate pending for 2 polls (~8s), then succeed
    if (process.env.MPESA_MOCK === "true" || checkoutRequestId.startsWith("mock_")) {
      const count = (mockPollCount.get(checkoutRequestId) ?? 0) + 1;
      mockPollCount.set(checkoutRequestId, count);

      if (count < 3) {
        // Still "pending" — no resultCode means keep polling
        return NextResponse.json({ resultCode: null, resultDesc: "The request is being processed" });
      }

      // Clean up and return success
      mockPollCount.delete(checkoutRequestId);
      return NextResponse.json({ resultCode: "0", resultDesc: "The service request is processed successfully." });
    }

    const result = await queryStkPush(checkoutRequestId);

    // ResultCode "0" = success, "1032" = cancelled by user, "1037" = timeout
    return NextResponse.json({
      resultCode: result.ResultCode,
      resultDesc: result.ResultDesc,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
