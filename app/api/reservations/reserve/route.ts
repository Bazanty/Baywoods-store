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

// Reserves stock for every cart line under a single session id. If any line
// fails, every previously-reserved line for this session is released so the
// user is never left holding partial stock.
export async function POST(req: NextRequest) {
  const ip = getClientIp(req) ?? "unknown";
  const rl = rateLimit(`reserve:${ip}`, 15, 60_000);
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

  // Clear any stale reservations from a previous attempt on the same session.
  await supabaseAdmin.rpc("release_session_reservations", { p_session_id: sessionId });

  for (const item of items) {
    const { data, error } = await supabaseAdmin.rpc("reserve_stock_v2", {
      p_session_id: sessionId,
      p_product_id: item.productId,
      p_variant_id: item.variantId ?? null,
      p_qty: item.quantity,
      p_ttl_mins: 15,
    });

    if (error || data === false) {
      await supabaseAdmin.rpc("release_session_reservations", { p_session_id: sessionId });
      return NextResponse.json(
        {
          error: `"${item.productName ?? "An item in your cart"}" is no longer available in that quantity.`,
        },
        { status: 409 }
      );
    }
  }

  return NextResponse.json({ ok: true });
}
