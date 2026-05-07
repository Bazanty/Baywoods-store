import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function POST(req: NextRequest) {
  let body: { code?: string; orderTotal?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ valid: false, message: "Invalid request." }, { status: 400 });
  }

  const code = typeof body.code === "string" ? body.code.trim().toUpperCase() : "";
  const orderTotal = typeof body.orderTotal === "number" ? body.orderTotal : 0;

  if (!code) {
    return NextResponse.json({ valid: false, message: "Enter a promo code." }, { status: 400 });
  }

  const now = new Date().toISOString();
  const supabase = getAdmin();

  const { data, error } = await supabase
    .from("coupons")
    .select("*")
    .eq("code", code)
    .eq("is_active", true)
    .lte("starts_at", now)
    .maybeSingle();

  if (error) {
    console.error("coupon lookup error", error.message);
    return NextResponse.json(
      { valid: false, message: "Could not validate coupon. Try again." },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json({ valid: false, message: "Invalid promo code." });
  }

  if (data.expires_at && data.expires_at < now) {
    return NextResponse.json({ valid: false, message: "This promo code has expired." });
  }

  if (data.max_uses != null && data.used_count >= data.max_uses) {
    return NextResponse.json({ valid: false, message: "This code has reached its usage limit." });
  }

  if (orderTotal < data.minimum_order) {
    return NextResponse.json({
      valid: false,
      message: `Minimum order of KSh ${Number(data.minimum_order).toLocaleString("en-KE")} required.`,
    });
  }

  const discountAmount =
    data.discount_type === "percentage"
      ? (orderTotal * data.discount_value) / 100
      : Number(data.discount_value);

  return NextResponse.json({
    valid: true,
    discountAmount: Math.min(discountAmount, orderTotal),
    description: data.description ?? null,
  });
}
