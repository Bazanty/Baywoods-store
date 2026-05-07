import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getClientIp, rateLimit } from "@/lib/security";

// Called from /checkout once the user has entered an email — captures the cart
// so we can email them if they bail out. Upserts by email so one row per user.
export async function POST(req: NextRequest) {
  const ip = getClientIp(req) ?? "unknown";
  const rl = rateLimit(`snapshot:${ip}`, 20, 60_000);
  if (!rl.ok) return NextResponse.json({ error: "rate limited" }, { status: 429 });

  const { email, items, subtotal, userId } = await req.json();
  if (!email || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Delete any existing unrecovered snapshot for this email, then insert fresh.
  await supabaseAdmin
    .from("abandoned_carts")
    .delete()
    .eq("email", email)
    .eq("recovered", false);

  await supabaseAdmin.from("abandoned_carts").insert({
    email,
    user_id: userId ?? null,
    items,
    subtotal,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  await supabaseAdmin
    .from("abandoned_carts")
    .update({ recovered: true })
    .eq("email", email)
    .eq("recovered", false);

  return NextResponse.json({ ok: true });
}
