import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getClientIp, rateLimit } from "@/lib/security";

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function POST(req: NextRequest) {
  // Rate-limit: 30 votes per IP per minute to discourage automation.
  const ip = getClientIp(req) ?? "unknown";
  const rl = await rateLimit(`helpful:${ip}`, 30, 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let reviewId: string | undefined;
  let fingerprint: string | undefined;

  try {
    ({ reviewId, fingerprint } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  if (
    typeof reviewId !== "string" ||
    !/^[0-9a-f-]{36}$/.test(reviewId) ||
    typeof fingerprint !== "string" ||
    fingerprint.length < 8 ||
    fingerprint.length > 128
  ) {
    return NextResponse.json({ error: "reviewId (UUID) and fingerprint (string) required" }, { status: 400 });
  }

  const db = getAdmin();

  // Verify the review exists and is approved.
  const { data: review } = await db
    .from("reviews")
    .select("id, helpful")
    .eq("id", reviewId)
    .eq("is_approved", true)
    .maybeSingle();

  if (!review) {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }

  // Try to record the vote. The UNIQUE(review_id, voter_fingerprint) constraint
  // fires if this fingerprint already voted — we treat that as a no-op (ok: false).
  const { error: voteError } = await db
    .from("review_helpful_votes")
    .insert({ review_id: reviewId, voter_fingerprint: fingerprint });

  if (voteError) {
    // 23505 = unique_violation — already voted.
    if (voteError.code === "23505") {
      return NextResponse.json({ ok: false, helpful: review.helpful, alreadyVoted: true });
    }
    console.error("[helpful] insert vote error:", voteError);
    return NextResponse.json({ error: "Could not record vote" }, { status: 500 });
  }

  // Atomically increment the counter.
  const { data: updated, error: updateError } = await db
    .from("reviews")
    .update({ helpful: review.helpful + 1 })
    .eq("id", reviewId)
    .select("helpful")
    .single();

  if (updateError || !updated) {
    // Rollback the vote record so the user can retry.
    await db
      .from("review_helpful_votes")
      .delete()
      .eq("review_id", reviewId)
      .eq("voter_fingerprint", fingerprint);
    console.error("[helpful] increment error:", updateError);
    return NextResponse.json({ error: "Could not update count" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, helpful: updated.helpful });
}
