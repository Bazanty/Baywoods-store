import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

// Lightweight liveness + DB ping for uptime monitors. Cheap query — just
// checks Supabase is reachable and responding within a reasonable budget.
export async function GET() {
  const start = Date.now();
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { error } = await supabase
      .from("products")
      .select("id", { head: true, count: "exact" })
      .limit(1);

    if (error) {
      return NextResponse.json(
        { ok: false, db: "error", error: error.message, latencyMs: Date.now() - start },
        { status: 503 }
      );
    }

    return NextResponse.json({
      ok: true,
      db: "ok",
      latencyMs: Date.now() - start,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "unknown",
        latencyMs: Date.now() - start,
      },
      { status: 503 }
    );
  }
}
