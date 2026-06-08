import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";

interface IncomingSubscription {
  endpoint?: string;
  keys?: { p256dh?: string; auth?: string };
}

function pickUserAgent(req: NextRequest): string | null {
  const ua = req.headers.get("user-agent");
  return ua ? ua.slice(0, 500) : null;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as IncomingSubscription;
    const endpoint = typeof body.endpoint === "string" ? body.endpoint : null;
    const p256dh = body.keys?.p256dh;
    const auth = body.keys?.auth;
    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json({ error: "Invalid subscription" }, { status: 400 });
    }

    const userClient = await createSupabaseServerClient();
    const { data: userData } = await userClient.auth.getUser();
    const userId = userData?.user?.id ?? null;

    const admin = createSupabaseAdminClient();
    const { error } = await admin
      .from("push_subscriptions")
      .upsert(
        {
          endpoint,
          p256dh,
          auth,
          user_id: userId,
          user_agent: pickUserAgent(req),
          last_seen_at: new Date().toISOString(),
        },
        { onConflict: "endpoint" }
      );

    if (error) {
      return NextResponse.json({ error: "Failed to save subscription" }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => ({}))) as { endpoint?: string };
    if (!body.endpoint) return NextResponse.json({ success: true });

    const admin = createSupabaseAdminClient();
    await admin.from("push_subscriptions").delete().eq("endpoint", body.endpoint);
    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
