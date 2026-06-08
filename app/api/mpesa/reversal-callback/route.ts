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

// Safaricom expects a 200 even on internal failure — otherwise they retry,
// and a partially-applied refund is worse than a silent log line.
const ACK = NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });

function paramValue(items: any[] | undefined, name: string): string | null {
  const found = items?.find((it) => it?.Key === name);
  if (found?.Value == null) return null;
  return String(found.Value);
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!isSafaricomIp(ip)) {
    console.warn("[mpesa reversal callback] rejected unknown IP:", ip);
    return ACK;
  }

  let body: any;
  try {
    body = await req.json();
  } catch (err) {
    Sentry.captureException(err);
    console.error("[mpesa reversal callback] invalid JSON:", err);
    return ACK;
  }

  try {
    const result = body?.Result;
    if (!result) {
      console.warn("[mpesa reversal callback] missing Result:", body);
      return ACK;
    }

    const originatorConversationId = String(result.OriginatorConversationID ?? "");
    if (!originatorConversationId) {
      console.warn("[mpesa reversal callback] missing OriginatorConversationID:", body);
      return ACK;
    }

    const resultCode = Number(result.ResultCode ?? 1);
    const resultDesc = String(result.ResultDesc ?? "");
    const reversalReceipt = paramValue(result.ResultParameters?.ResultParameter, "TransactionID");

    const db = getAdmin();

    const { data: returnReq, error: lookupError } = await db
      .from("return_requests")
      .select("id, order_id, refund_status")
      .eq("refund_conversation_id", originatorConversationId)
      .maybeSingle();

    if (lookupError) {
      Sentry.captureException(lookupError);
      console.error("[mpesa reversal callback] lookup failed:", lookupError);
      return ACK;
    }

    if (!returnReq) {
      console.warn("[mpesa reversal callback] no return matched conversation:", originatorConversationId);
      return ACK;
    }

    // Idempotency: if already resolved, swallow re-deliveries.
    if (returnReq.refund_status === "success" || returnReq.refund_status === "failed") {
      return ACK;
    }

    const nowIso = new Date().toISOString();

    if (resultCode === 0) {
      // Success — record the reversal receipt, restore inventory, flip order.
      await db
        .from("return_requests")
        .update({
          refund_status: "success",
          refund_reference: reversalReceipt ?? originatorConversationId,
          refunded_at: nowIso,
          refund_failure_reason: null,
          updated_at: nowIso,
        })
        .eq("id", returnReq.id);

      if (returnReq.order_id) {
        const { data: items } = await db
          .from("order_items")
          .select("product_id, variant_id, quantity")
          .eq("order_id", returnReq.order_id);
        for (const it of items ?? []) {
          try {
            await db.rpc("restore_inventory_v2", {
              p_product_id: it.product_id,
              p_variant_id: it.variant_id ?? null,
              p_qty: it.quantity,
            });
          } catch (err) {
            Sentry.captureException(err);
          }
        }
        await db
          .from("orders")
          .update({
            status: "REFUNDED",
            payment_status: "refunded",
            updated_at: nowIso,
          })
          .eq("id", returnReq.order_id);
      }
    } else {
      // Failure — leave inventory and order untouched so the admin can retry
      // or fall back to a manual refund without double-restocking.
      await db
        .from("return_requests")
        .update({
          refund_status: "failed",
          refund_failure_reason: resultDesc || `ResultCode ${resultCode}`,
          updated_at: nowIso,
        })
        .eq("id", returnReq.id);
    }

    return ACK;
  } catch (err) {
    Sentry.captureException(err);
    console.error("[mpesa reversal callback] unhandled error:", err);
    return ACK;
  }
}
