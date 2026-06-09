import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";
import { getClientIp, rateLimit } from "@/lib/security";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export async function POST(req: NextRequest) {
  const ip = getClientIp(req) ?? "unknown";
  const rl = await rateLimit(`restock:${ip}`, 8, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const body = await req.json();
    const productId = typeof body.productId === "string" ? body.productId : null;
    const variantId = typeof body.variantId === "string" && body.variantId ? body.variantId : null;
    let email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!productId) {
      return NextResponse.json({ error: "productId required" }, { status: 400 });
    }

    // Prefer the signed-in user's email when present
    let userId: string | null = null;
    try {
      const userClient = await createSupabaseServerClient();
      const { data } = await userClient.auth.getUser();
      if (data.user) {
        userId = data.user.id;
        if (!email && data.user.email) email = data.user.email.toLowerCase();
      }
    } catch {
      // ignore — fall back to body email
    }

    if (!email || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    const admin = createSupabaseAdminClient();

    // Verify the product (and variant if provided) exists, and that current
    // stock is actually exhausted. We don't want to capture subscriptions for
    // in-stock items.
    const inventoryQuery = admin
      .from("inventory")
      .select("quantity, reserved")
      .eq("product_id", productId);
    const { data: inventoryRows, error: invError } = variantId
      ? await inventoryQuery.eq("variant_id", variantId)
      : await inventoryQuery.is("variant_id", null);

    if (invError) {
      return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
    }
    if (!inventoryRows || inventoryRows.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const available = inventoryRows.reduce(
      (sum, r) => sum + Math.max(0, Number(r.quantity) - Number(r.reserved)),
      0
    );
    if (available > 0) {
      return NextResponse.json(
        { error: "Item is in stock", inStock: true },
        { status: 409 }
      );
    }

    // Dedupe: skip if an active subscription already exists.
    const existsQuery = admin
      .from("restock_subscriptions")
      .select("id")
      .eq("product_id", productId)
      .eq("email", email)
      .is("notified_at", null)
      .limit(1);
    const { data: existingRows } = variantId
      ? await existsQuery.eq("variant_id", variantId)
      : await existsQuery.is("variant_id", null);

    if (existingRows && existingRows.length > 0) {
      return NextResponse.json({ success: true, alreadySubscribed: true });
    }

    const { error: insertError } = await admin.from("restock_subscriptions").insert({
      product_id: productId,
      variant_id: variantId,
      email,
      user_id: userId,
    });

    if (insertError) {
      // Race condition fallback — partial unique index may catch a duplicate.
      if (insertError.code === "23505") {
        return NextResponse.json({ success: true, alreadySubscribed: true });
      }
      return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
