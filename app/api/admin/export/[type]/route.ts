import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/adminAuth";
import { toCsv, csvResponseHeaders } from "@/lib/csv";
import { normalizeOrderStatus } from "@/lib/orderStatus";

export const dynamic = "force-dynamic";

type ExportType = "orders" | "customers" | "products" | "inventory";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ type: string }> }) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { type: rawType } = await params;
  const type = rawType as ExportType;
  const today = new Date().toISOString().slice(0, 10);

  switch (type) {
    case "orders":
      return new NextResponse(await exportOrders(), {
        headers: csvResponseHeaders(`baywoods-orders-${today}.csv`),
      });
    case "customers":
      return new NextResponse(await exportCustomers(), {
        headers: csvResponseHeaders(`baywoods-customers-${today}.csv`),
      });
    case "products":
      return new NextResponse(await exportProducts(), {
        headers: csvResponseHeaders(`baywoods-products-${today}.csv`),
      });
    case "inventory":
      return new NextResponse(await exportInventory(), {
        headers: csvResponseHeaders(`baywoods-inventory-${today}.csv`),
      });
    default:
      return NextResponse.json({ error: "Unknown export type" }, { status: 400 });
  }
}

function db() {
  return createSupabaseAdminClient();
}

async function exportOrders(): Promise<string> {
  const { data } = await db()
    .from("orders")
    .select(`
      id, status, payment_status, payment_method,
      shipping_name, shipping_phone, email,
      shipping_line1, shipping_city, shipping_state, shipping_country,
      subtotal, shipping_cost, discount_amount, tax_amount, total,
      tracking_number, shipping_method, created_at, delivered_at,
      order_items ( quantity )
    `)
    .order("created_at", { ascending: false })
    .limit(5000);

  const rows = (data ?? []).map((o: any) => ({
    order_id: o.id,
    reference: `BW-${o.id.slice(0, 8).toUpperCase()}`,
    created_at: o.created_at,
    status: o.status,
    payment_status: o.payment_status,
    payment_method: o.payment_method ?? "",
    customer_name: o.shipping_name ?? "",
    customer_email: o.email ?? "",
    customer_phone: o.shipping_phone ?? "",
    shipping_address: [o.shipping_line1, o.shipping_city, o.shipping_state, o.shipping_country]
      .filter(Boolean)
      .join(", "),
    shipping_method: o.shipping_method ?? "",
    items_count: Array.isArray(o.order_items) ? o.order_items.reduce((s: number, i: any) => s + Number(i.quantity || 0), 0) : 0,
    subtotal: Number(o.subtotal ?? 0).toFixed(2),
    discount: Number(o.discount_amount ?? 0).toFixed(2),
    shipping: Number(o.shipping_cost ?? 0).toFixed(2),
    tax: Number(o.tax_amount ?? 0).toFixed(2),
    total: Number(o.total ?? 0).toFixed(2),
    tracking_number: o.tracking_number ?? "",
    delivered_at: o.delivered_at ?? "",
  }));

  return toCsv(rows, [
    { key: "reference", label: "Reference" },
    { key: "order_id", label: "Order ID" },
    { key: "created_at", label: "Created" },
    { key: "status", label: "Status" },
    { key: "payment_status", label: "Payment status" },
    { key: "payment_method", label: "Payment method" },
    { key: "customer_name", label: "Customer name" },
    { key: "customer_email", label: "Customer email" },
    { key: "customer_phone", label: "Customer phone" },
    { key: "shipping_address", label: "Shipping address" },
    { key: "shipping_method", label: "Shipping method" },
    { key: "items_count", label: "Items" },
    { key: "subtotal", label: "Subtotal" },
    { key: "discount", label: "Discount" },
    { key: "shipping", label: "Shipping cost" },
    { key: "tax", label: "Tax" },
    { key: "total", label: "Total" },
    { key: "tracking_number", label: "Tracking #" },
    { key: "delivered_at", label: "Delivered at" },
  ]);
}

async function exportCustomers(): Promise<string> {
  const { data } = await db()
    .from("orders")
    .select("user_id, email, shipping_name, shipping_phone, total, status, created_at")
    .order("created_at", { ascending: false })
    .limit(20000);

  const map = new Map<string, {
    email: string;
    name: string;
    phone: string;
    userId: string | null;
    orderCount: number;
    totalSpent: number;
    firstOrderAt: string;
    lastOrderAt: string;
  }>();

  for (const o of (data ?? []) as any[]) {
    const key = (o.email ?? "").toLowerCase() || `user:${o.user_id}`;
    if (!key) continue;
    const status = normalizeOrderStatus(String(o.status));
    const counts = status !== "CANCELLED" && status !== "REFUNDED" && status !== "FAILED";
    const existing = map.get(key);
    if (existing) {
      existing.orderCount += 1;
      if (counts) existing.totalSpent += Number(o.total);
      if (new Date(o.created_at) < new Date(existing.firstOrderAt)) existing.firstOrderAt = o.created_at;
      if (new Date(o.created_at) > new Date(existing.lastOrderAt)) existing.lastOrderAt = o.created_at;
    } else {
      map.set(key, {
        email: o.email ?? "",
        name: o.shipping_name ?? "",
        phone: o.shipping_phone ?? "",
        userId: o.user_id ?? null,
        orderCount: 1,
        totalSpent: counts ? Number(o.total) : 0,
        firstOrderAt: o.created_at,
        lastOrderAt: o.created_at,
      });
    }
  }

  const rows = Array.from(map.values())
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .map((c) => ({
      email: c.email,
      name: c.name,
      phone: c.phone,
      user_id: c.userId ?? "",
      order_count: c.orderCount,
      total_spent: c.totalSpent.toFixed(2),
      first_order_at: c.firstOrderAt,
      last_order_at: c.lastOrderAt,
    }));

  return toCsv(rows, [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "order_count", label: "Orders" },
    { key: "total_spent", label: "Lifetime spend (KES)" },
    { key: "first_order_at", label: "First order" },
    { key: "last_order_at", label: "Last order" },
    { key: "user_id", label: "User ID" },
  ]);
}

async function exportProducts(): Promise<string> {
  const { data } = await db()
    .from("products")
    .select(`
      id, name, slug, sku, base_price, compare_price,
      is_active, is_featured, verification_status, created_at,
      categories!category_id ( name, slug ),
      inventory ( quantity, reserved )
    `)
    .order("created_at", { ascending: false })
    .limit(5000);

  const rows = (data ?? []).map((p: any) => {
    const totalStock = Array.isArray(p.inventory)
      ? p.inventory.reduce((s: number, r: any) => s + Math.max(0, Number(r.quantity) - Number(r.reserved)), 0)
      : 0;
    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      sku: p.sku ?? "",
      category: p.categories?.name ?? "",
      base_price: Number(p.base_price ?? 0).toFixed(2),
      compare_price: p.compare_price != null ? Number(p.compare_price).toFixed(2) : "",
      available_stock: totalStock,
      is_active: p.is_active ? "yes" : "no",
      is_featured: p.is_featured ? "yes" : "no",
      verification_status: p.verification_status ?? "",
      created_at: p.created_at,
    };
  });

  return toCsv(rows, [
    { key: "name", label: "Name" },
    { key: "slug", label: "Slug" },
    { key: "sku", label: "SKU" },
    { key: "category", label: "Category" },
    { key: "base_price", label: "Base price" },
    { key: "compare_price", label: "Compare price" },
    { key: "available_stock", label: "Available stock" },
    { key: "is_active", label: "Active" },
    { key: "is_featured", label: "Featured" },
    { key: "verification_status", label: "Verification" },
    { key: "created_at", label: "Created" },
    { key: "id", label: "Product ID" },
  ]);
}

async function exportInventory(): Promise<string> {
  const { data } = await db()
    .from("inventory")
    .select(`
      quantity, reserved, reorder_threshold, updated_at,
      products ( name, slug, sku ),
      product_variants ( name, sku )
    `)
    .limit(10000);

  const rows = (data ?? []).map((row: any) => {
    const product = Array.isArray(row.products) ? row.products[0] : row.products;
    const variant = Array.isArray(row.product_variants) ? row.product_variants[0] : row.product_variants;
    const quantity = Number(row.quantity ?? 0);
    const reserved = Number(row.reserved ?? 0);
    return {
      product_name: product?.name ?? "—",
      variant_name: variant?.name ?? "",
      sku: variant?.sku ?? product?.sku ?? "",
      slug: product?.slug ?? "",
      quantity,
      reserved,
      available: Math.max(0, quantity - reserved),
      reorder_threshold: Number(row.reorder_threshold ?? 0),
      updated_at: row.updated_at,
    };
  });

  return toCsv(rows, [
    { key: "product_name", label: "Product" },
    { key: "variant_name", label: "Variant" },
    { key: "sku", label: "SKU" },
    { key: "slug", label: "Slug" },
    { key: "quantity", label: "Quantity" },
    { key: "reserved", label: "Reserved" },
    { key: "available", label: "Available" },
    { key: "reorder_threshold", label: "Reorder threshold" },
    { key: "updated_at", label: "Updated" },
  ]);
}
