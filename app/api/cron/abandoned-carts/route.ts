import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendAbandonedCartEmail } from "@/lib/email";

// Invoke this from Vercel Cron (hourly). Auth'd by a shared secret so it can't
// be triggered by arbitrary POSTers and spam customer inboxes.
export async function GET(req: NextRequest) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const cutoff = new Date(Date.now() - 60 * 60 * 1000).toISOString();

  const { data: carts, error } = await supabaseAdmin
    .from("abandoned_carts")
    .select("id, email, items, subtotal")
    .is("reminded_at", null)
    .eq("recovered", false)
    .lt("created_at", cutoff)
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let sent = 0;
  for (const cart of carts ?? []) {
    try {
      const items = Array.isArray(cart.items) ? cart.items : [];
      const firstName = (cart.email ?? "").split("@")[0];
      await sendAbandonedCartEmail({
        email:     cart.email,
        firstName,
        items:     items.map((i: any) => ({ name: i.name, qty: i.qty, price: i.price })),
        subtotal:  Number(cart.subtotal),
      });
      await supabaseAdmin
        .from("abandoned_carts")
        .update({ reminded_at: new Date().toISOString() })
        .eq("id", cart.id);
      sent++;
    } catch (err) {
      console.error("abandoned cart email failed", cart.id, err);
    }
  }

  // Cleanup pass — drop snapshots that are no longer useful so the table
  // doesn't grow forever. Recovered carts older than 7 days, anything older
  // than 30 days regardless of state.
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const sevenDaysAgo  = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  await supabaseAdmin
    .from("abandoned_carts")
    .delete()
    .eq("recovered", true)
    .lt("created_at", sevenDaysAgo);

  await supabaseAdmin
    .from("abandoned_carts")
    .delete()
    .lt("created_at", thirtyDaysAgo);

  return NextResponse.json({ processed: carts?.length ?? 0, sent });
}
