import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getClientIp, rateLimit } from "@/lib/security";

const MAX_TITLE_LENGTH = 120;
const MAX_BODY_LENGTH = 2000;

export async function POST(req: NextRequest) {
  const ip = getClientIp(req) ?? "unknown";
  const rl = rateLimit(`review:${ip}`, 8, 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many review attempts. Please wait a moment." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  try {
    const supabase = createSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Sign in to write a review." }, { status: 401 });
    }

    const payload = await req.json();
    const productId = String(payload.productId ?? "").trim();
    const rating = Number(payload.rating);
    const title = String(payload.title ?? "").trim();
    const body = String(payload.body ?? "").trim();

    if (!productId) {
      return NextResponse.json({ error: "Product is required." }, { status: 400 });
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5." }, { status: 400 });
    }
    if (!body) {
      return NextResponse.json({ error: "Review is required." }, { status: 400 });
    }
    if (title.length > MAX_TITLE_LENGTH) {
      return NextResponse.json({ error: "Title is too long." }, { status: 400 });
    }
    if (body.length > MAX_BODY_LENGTH) {
      return NextResponse.json({ error: "Review is too long." }, { status: 400 });
    }

    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id")
      .eq("id", productId)
      .eq("is_active", true)
      .maybeSingle();

    if (productError) {
      console.error("Review product lookup error:", productError);
      return NextResponse.json({ error: "Could not verify product." }, { status: 500 });
    }
    if (!product) {
      return NextResponse.json({ error: "Product not found." }, { status: 404 });
    }

    const { data, error } = await supabase
      .from("reviews")
      .insert({
        product_id: productId,
        user_id: user.id,
        rating,
        title: title || null,
        body,
        is_verified: false,
        is_approved: false,
      })
      .select("id, rating, title, body, is_verified, is_approved, created_at")
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "You have already reviewed this product." },
          { status: 409 }
        );
      }
      console.error("Review insert error:", error);
      return NextResponse.json({ error: "Could not submit review." }, { status: 500 });
    }

    return NextResponse.json({
      review: {
        id: data.id,
        rating: data.rating,
        title: data.title,
        body: data.body,
        date: data.created_at.slice(0, 10),
        verified: data.is_verified,
        approved: data.is_approved,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
