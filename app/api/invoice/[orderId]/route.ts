import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { renderToBuffer, Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { createElement } from "react";

export const dynamic = "force-dynamic";

function getAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica" },
  header: { fontSize: 22, marginBottom: 4, fontFamily: "Helvetica-Bold" },
  sub: { color: "#666", marginBottom: 24 },
  row: { flexDirection: "row", marginBottom: 3 },
  col: { flex: 1 },
  label: { color: "#666", marginBottom: 2 },
  section: { marginTop: 18, marginBottom: 6, fontFamily: "Helvetica-Bold", fontSize: 11 },
  th: { flexDirection: "row", borderBottomWidth: 1, borderColor: "#ccc", paddingBottom: 4, marginBottom: 4, fontFamily: "Helvetica-Bold" },
  tr: { flexDirection: "row", paddingVertical: 3 },
  cItem: { flex: 3 },
  cQty: { flex: 1, textAlign: "right" },
  cPrice: { flex: 1, textAlign: "right" },
  cTotal: { flex: 1.2, textAlign: "right" },
  totals: { marginTop: 18, alignSelf: "flex-end", width: 200 },
  totalsRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
  grand: { fontFamily: "Helvetica-Bold", borderTopWidth: 1, borderColor: "#000", paddingTop: 6, marginTop: 4, fontSize: 12 },
});

interface Order {
  id: string;
  created_at: string;
  email: string;
  shipping_name: string;
  shipping_line1: string;
  shipping_city: string;
  shipping_state: string;
  subtotal: number;
  shipping_cost: number;
  discount_amount: number;
  total: number;
  order_items: { product_name: string; variant_name: string | null; quantity: number; unit_price: number; line_total: number }[];
}

function fmt(n: number) {
  return `KSh ${Number(n).toLocaleString("en-KE")}`;
}

function Invoice({ order }: { order: Order }) {
  return createElement(
    Document,
    null,
    createElement(
      Page,
      { size: "A4", style: styles.page },
      createElement(Text, { style: styles.header }, "BAYWOODS"),
      createElement(Text, { style: styles.sub }, "Tax invoice"),

      createElement(
        View,
        { style: styles.row },
        createElement(
          View,
          { style: styles.col },
          createElement(Text, { style: styles.label }, "Invoice #"),
          createElement(Text, null, order.id.slice(0, 8).toUpperCase()),
          createElement(Text, { style: { marginTop: 6, ...styles.label } }, "Date"),
          createElement(Text, null, new Date(order.created_at).toLocaleDateString("en-KE"))
        ),
        createElement(
          View,
          { style: styles.col },
          createElement(Text, { style: styles.label }, "Billed to"),
          createElement(Text, null, order.shipping_name),
          createElement(Text, null, order.email),
          createElement(Text, null, order.shipping_line1),
          createElement(Text, null, `${order.shipping_city}, ${order.shipping_state}`)
        )
      ),

      createElement(Text, { style: styles.section }, "Items"),
      createElement(
        View,
        { style: styles.th },
        createElement(Text, { style: styles.cItem }, "Item"),
        createElement(Text, { style: styles.cQty }, "Qty"),
        createElement(Text, { style: styles.cPrice }, "Price"),
        createElement(Text, { style: styles.cTotal }, "Total")
      ),
      ...order.order_items.map((it, i) =>
        createElement(
          View,
          { style: styles.tr, key: i },
          createElement(
            Text,
            { style: styles.cItem },
            it.variant_name ? `${it.product_name} — ${it.variant_name}` : it.product_name
          ),
          createElement(Text, { style: styles.cQty }, String(it.quantity)),
          createElement(Text, { style: styles.cPrice }, fmt(it.unit_price)),
          createElement(Text, { style: styles.cTotal }, fmt(it.line_total))
        )
      ),

      createElement(
        View,
        { style: styles.totals },
        createElement(
          View,
          { style: styles.totalsRow },
          createElement(Text, null, "Subtotal"),
          createElement(Text, null, fmt(order.subtotal))
        ),
        order.discount_amount > 0 &&
          createElement(
            View,
            { style: styles.totalsRow },
            createElement(Text, null, "Discount"),
            createElement(Text, null, `-${fmt(order.discount_amount)}`)
          ),
        createElement(
          View,
          { style: styles.totalsRow },
          createElement(Text, null, "Shipping"),
          createElement(Text, null, fmt(order.shipping_cost))
        ),
        createElement(
          View,
          { style: [styles.totalsRow, styles.grand] },
          createElement(Text, null, "Total"),
          createElement(Text, null, fmt(order.total))
        )
      )
    )
  );
}

export async function GET(
  req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");
  if (!email) {
    return NextResponse.json({ error: "email param required" }, { status: 400 });
  }

  const supabaseAdmin = getAdmin();
  const { data: order, error } = await supabaseAdmin
    .from("orders")
    .select(`
      id, created_at, email,
      shipping_name, shipping_line1, shipping_city, shipping_state,
      subtotal, shipping_cost, discount_amount, total,
      order_items ( product_name, variant_name, quantity, unit_price, line_total )
    `)
    .eq("id", params.orderId)
    .eq("email", email)
    .maybeSingle();

  if (error || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const buffer = await renderToBuffer(Invoice({ order: order as Order }));
  const body = new Uint8Array(buffer);

  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="baywoods-${params.orderId.slice(0, 8)}.pdf"`,
    },
  });
}
