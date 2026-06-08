import { NextRequest, NextResponse } from "next/server";
import { getProductsBySlugsServer } from "@/lib/supabase/serverQueries";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const slugsParam = req.nextUrl.searchParams.get("slugs") ?? "";
  const slugs = slugsParam
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 24);

  if (slugs.length === 0) {
    return NextResponse.json({ products: [] });
  }

  try {
    const products = await getProductsBySlugsServer(slugs);
    return NextResponse.json({ products });
  } catch {
    return NextResponse.json({ products: [] });
  }
}
