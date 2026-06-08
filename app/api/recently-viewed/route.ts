import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient, createSupabaseServerClient } from "@/lib/supabase/server";

const MAX_PER_USER = 24;

export async function POST(req: NextRequest) {
  try {
    const text = await req.text();
    if (!text) return NextResponse.json({ ok: true });

    const body = JSON.parse(text);
    const slug = typeof body.slug === "string" ? body.slug : null;
    if (!slug) return NextResponse.json({ ok: true });

    const userClient = await createSupabaseServerClient();
    const { data: userData } = await userClient.auth.getUser();
    const user = userData?.user;
    // Silent no-op for anonymous — the localStorage list is enough for guests.
    if (!user) return NextResponse.json({ ok: true });

    const admin = createSupabaseAdminClient();

    const { data: product } = await admin
      .from("products")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!product) return NextResponse.json({ ok: true });

    await admin
      .from("recently_viewed")
      .upsert(
        {
          user_id: user.id,
          product_id: product.id,
          viewed_at: new Date().toISOString(),
        },
        { onConflict: "user_id,product_id" }
      );

    // Trim to MAX_PER_USER by deleting older rows beyond the limit.
    const { data: stale } = await admin
      .from("recently_viewed")
      .select("id")
      .eq("user_id", user.id)
      .order("viewed_at", { ascending: false })
      .range(MAX_PER_USER, MAX_PER_USER + 50);
    if (stale && stale.length > 0) {
      await admin
        .from("recently_viewed")
        .delete()
        .in("id", stale.map((r) => r.id));
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}

export async function GET() {
  try {
    const userClient = await createSupabaseServerClient();
    const { data: userData } = await userClient.auth.getUser();
    const user = userData?.user;
    if (!user) return NextResponse.json({ slugs: [] });

    const admin = createSupabaseAdminClient();
    const { data } = await admin
      .from("recently_viewed")
      .select("viewed_at, products ( slug )")
      .eq("user_id", user.id)
      .order("viewed_at", { ascending: false })
      .limit(MAX_PER_USER);

    const slugs = (data ?? [])
      .map((r: any) => r.products?.slug)
      .filter((s: any): s is string => typeof s === "string");

    return NextResponse.json({ slugs });
  } catch {
    return NextResponse.json({ slugs: [] });
  }
}
