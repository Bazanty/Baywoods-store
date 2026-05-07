import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit, getClientIp } from "@/lib/security";

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Lookup-by-email endpoint so guests can track without signing in.
// Email must match the one used at checkout — this is our access check.
export async function POST(req: NextRequest) {
  const ip = getClientIp(req) ?? "unknown";
  const rl = rateLimit(`track:${ip}`, 20, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many lookups" }, { status: 429 });
  }

  const { orderId, email } = await req.json();
  if (!orderId || !email) {
    return NextResponse.json({ error: "Order ID and email required" }, { status: 400 });
  }

  const supabaseAdmin = getAdmin();
  const { data, error } = await supabaseAdmin
    .from("orders")
    .select(`
      id,
      status,
      payment_status,
      total,
      shipping_name,
      shipping_city,
      tracking_number,
      created_at,
      shipped_at,
      delivered_at,
      order_items ( product_name, variant_name, quantity, unit_price, line_total )
    `)
    .eq("id", orderId)
    .eq("email", email)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  return NextResponse.json({ order: data });
}
