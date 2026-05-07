import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { getClientIp, rateLimit } from "@/lib/security";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req) ?? "unknown";
  const rl = rateLimit(`newsletter:${ip}`, 5, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const { email } = await req.json();
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Record locally (source of truth)
    const { error } = await supabaseAdmin
      .from("newsletter_subscribers")
      .upsert({ email, subscribed_at: new Date().toISOString() }, { onConflict: "email" });

    if (error) {
      console.error("Newsletter insert error:", error);
      return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
    }

    // Mirror to Resend audience if configured — fire-and-forget.
    const audienceId = process.env.RESEND_AUDIENCE_ID;
    if (audienceId && process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      resend.contacts
        .create({ email, audienceId, unsubscribed: false })
        .catch((e) => console.warn("Resend audience mirror failed:", e));
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
