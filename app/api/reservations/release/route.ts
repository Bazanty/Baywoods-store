import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Called via navigator.sendBeacon when the user navigates away from /checkout
// without completing payment. Releases every reservation tied to their
// session id so other shoppers can buy the items.
export async function POST(req: NextRequest) {
  let sessionId: string | undefined;
  try {
    const body = await req.json();
    sessionId = body.sessionId;
  } catch {
    return NextResponse.json({ error: "invalid body" }, { status: 400 });
  }

  if (!sessionId) {
    return NextResponse.json({ error: "sessionId required" }, { status: 400 });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  await supabaseAdmin.rpc("release_session_reservations", { p_session_id: sessionId });
  return NextResponse.json({ ok: true });
}
