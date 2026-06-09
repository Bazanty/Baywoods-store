import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getClientIp, rateLimit } from "@/lib/security";

interface ReserveItem {
  productId: string;
  variantId: string | null;
  quantity: number;
  productName?: string;
}

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req) ?? "unknown";
  const rl = await rateLimit(`reserve:${ip}`, 15, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many reservation attempts. Wait a moment." },
      { status: 429 }
    );
  }

  const { sessionId, items } = (await req.json()) as {
    sessionId?: string;
    items?: ReserveItem[];
  };

  if (!sessionId || !items?.length) {
    return NextResponse.json({ error: "Invalid reservation request" }, { status: 400 });
  }

  const supabaseAdmin = getAdmin();

  // Sweep globally-expired reservations so stale holds don't block new checkouts.
  try { await supabaseAdmin.rpc("expire_reservations"); } catch { /* best-effort */ }

  // Clear any previous attempt on this session.
  await supabaseAdmin.rpc("release_session_reservations", { p_session_id: sessionId });

  let reservedCount = 0;

  for (const item of items) {
    const { data, error } = await supabaseAdmin.rpc("reserve_stock_v2", {
      p_session_id: sessionId,
      p_product_id: item.productId,
      p_variant_id: item.variantId ?? null,
      p_qty: item.quantity,
      p_ttl_mins: 15,
    });

    if (error || data === false) {
      // Check if an inventory row exists for this specific variant bucket
      // (base row when variantId is null, or the exact variant row).
      // Checking any row for the product would give a false positive when the
      // product only has per-variant rows but the cart sent variantId = null.
      const { data: invRows } = await (
        item.variantId
          ? supabaseAdmin.from("inventory").select("id").eq("product_id", item.productId).eq("variant_id", item.variantId)
          : supabaseAdmin.from("inventory").select("id").eq("product_id", item.productId).is("variant_id", null)
      ).limit(1);

      if (!invRows || invRows.length === 0) {
        // No inventory row — product has no stock tracking, allow through.
        reservedCount++;
        continue;
      }

      // Inventory row exists but stock is insufficient.
      await supabaseAdmin.rpc("release_session_reservations", { p_session_id: sessionId });
      return NextResponse.json(
        {
          error: `"${item.productName ?? "An item in your cart"}" is no longer available in that quantity.`,
        },
        { status: 409 }
      );
    }

    reservedCount++;
  }

  // Return reservedCount so the orders route can verify exactly how many
  // reservations to expect, rather than comparing against items.length.
  return NextResponse.json({ ok: true, reservedCount });
}
