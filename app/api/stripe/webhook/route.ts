import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import * as Sentry from "@sentry/nextjs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" });

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

async function releaseOrderStock(
  supabaseAdmin: ReturnType<typeof getAdmin>,
  orderId: string
) {
  const { data: items } = await supabaseAdmin
    .from("order_items")
    .select("product_id, variant_id, quantity")
    .eq("order_id", orderId);
  for (const it of items ?? []) {
    await supabaseAdmin.rpc("restore_inventory_v2", {
      p_product_id: it.product_id,
      p_variant_id: it.variant_id ?? null,
      p_qty:        it.quantity,
    });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing stripe signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err: unknown) {
    Sentry.captureException(err);
    const message = err instanceof Error ? err.message : "Webhook error";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const supabaseAdmin = getAdmin();

  // Idempotency — Stripe retries on non-2xx, so dedupe by event.id.
  const { data: seen } = await supabaseAdmin
    .from("stripe_events")
    .select("id")
    .eq("id", event.id)
    .maybeSingle();
  if (seen) return NextResponse.json({ received: true, duplicate: true });

  const nowIso = new Date().toISOString();

  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object as Stripe.PaymentIntent;
    const { data: payment } = await supabaseAdmin
      .from("payments")
      .update({
        status:         "paid",
        provider_tx_id: intent.id,
        paid_at:        nowIso,
        updated_at:     nowIso,
      })
      .eq("stripe_payment_intent_id", intent.id)
      .select("order_id")
      .single();

    if (payment?.order_id) {
      await supabaseAdmin
        .from("orders")
        .update({ status: "processing", payment_status: "paid", updated_at: nowIso })
        .eq("id", payment.order_id);
    }
  }

  if (event.type === "payment_intent.payment_failed") {
    const intent = event.data.object as Stripe.PaymentIntent;
    const { data: payment } = await supabaseAdmin
      .from("payments")
      .update({ status: "failed", updated_at: nowIso })
      .eq("stripe_payment_intent_id", intent.id)
      .select("order_id")
      .single();

    if (payment?.order_id) {
      await releaseOrderStock(supabaseAdmin, payment.order_id);
      await supabaseAdmin
        .from("orders")
        .update({ status: "cancelled", payment_status: "failed", updated_at: nowIso })
        .eq("id", payment.order_id);
    }
  }

  // Record the event so duplicates are dropped.
  await supabaseAdmin.from("stripe_events").insert({ id: event.id, type: event.type });

  return NextResponse.json({ received: true });
}
