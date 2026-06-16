"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";
import { sendShippingUpdateEmail, sendDeliveredEmail, sendRestockEmail } from "@/lib/email";
import { sendShippingUpdateSms } from "@/lib/sms";
import { sendPushToUser, sendPushToEmails, sendPushToAll, isPushConfigured } from "@/lib/push";
import { initiateReversal, isReversalConfigured } from "@/lib/mpesa";
import { requireAdmin } from "@/lib/adminAuth";
import { normalizeOrderStatus } from "@/lib/orderStatus";
import type { ProductVerificationStatus } from "@/lib/types";

function db() { return createSupabaseAdminClient(); }

export interface UploadedImage {
  url: string;
  publicId: string;
  isPrimary: boolean;
}

export interface ColorOption {
  name: string;
  hex: string;
}

export interface ProductPayload {
  name: string;
  description: string;
  shortDescription: string;
  materialCare?: string;
  categorySlug: string;
  basePrice: number;
  comparePrice?: number;
  sku?: string;
  isFeatured: boolean;
  isActive: boolean;
  images: UploadedImage[];
  sizes: string[];
  colors: ColorOption[];
  stockQuantity: number;
  verificationStatus: ProductVerificationStatus;
  verificationNotes?: string;
}

// ---------------------------------------------------------------------------
// Create product
// ---------------------------------------------------------------------------
export async function createProduct(payload: ProductPayload) {
  await requireAdmin();
  const slug = slugify(payload.name);

  // 1. Resolve category id
  const { data: category } = await db()
    .from("categories")
    .select("id")
    .eq("slug", payload.categorySlug)
    .single();

  // 2. Insert product
  const { data: product, error: productError } = await db()
    .from("products")
    .insert({
      name: payload.name,
      slug,
      description: payload.description || null,
      short_description: payload.shortDescription || null,
      material_care: payload.materialCare?.trim() || null,
      category_id: category?.id ?? null,
      base_price: payload.basePrice,
      compare_price: payload.comparePrice ?? null,
      sku: payload.sku || null,
      is_featured: payload.isFeatured,
      is_active: payload.isActive,
      verification_status: payload.verificationStatus,
      verification_notes: payload.verificationNotes || null,
      verified_at: payload.verificationStatus === "VERIFIED_ORIGINAL" ? new Date().toISOString() : null,
      verified_by: payload.verificationStatus === "VERIFIED_ORIGINAL" ? "admin" : null,
    })
    .select("id")
    .single();

  if (productError) throw new Error(productError.message);
  const productId = product.id;

  // 3. Insert images
  if (payload.images.length > 0) {
    await db().from("product_images").insert(
      payload.images.map((img, i) => ({
        product_id: productId,
        url: img.url,
        is_primary: img.isPrimary,
        sort_order: i,
      }))
    );
  }

  // 4. Insert variants (sizes × colors cartesian product)
  const createdVariants = await insertVariants(productId, payload.sizes, payload.colors);

  // 5. Insert inventory — per-variant when variants exist, base row otherwise.
  if (createdVariants.length > 0) {
    await db().from("inventory").insert(
      createdVariants.map((v) => ({
        product_id: productId,
        variant_id: v.id,
        quantity: payload.stockQuantity,
        reserved: 0,
      }))
    );
  } else {
    await db().from("inventory").insert({
      product_id: productId,
      variant_id: null,
      quantity: payload.stockQuantity,
      reserved: 0,
    });
  }

  revalidatePath("/admin/products");
  return { productId, slug };
}

// ---------------------------------------------------------------------------
// Update product
// ---------------------------------------------------------------------------
export async function updateProduct(productId: string, payload: ProductPayload) {
  await requireAdmin();
  const { data: category } = await db()
    .from("categories")
    .select("id")
    .eq("slug", payload.categorySlug)
    .single();

  const { error } = await db()
    .from("products")
    .update({
      name: payload.name,
      description: payload.description || null,
      short_description: payload.shortDescription || null,
      material_care: payload.materialCare?.trim() || null,
      category_id: category?.id ?? null,
      base_price: payload.basePrice,
      compare_price: payload.comparePrice ?? null,
      sku: payload.sku || null,
      is_featured: payload.isFeatured,
      is_active: payload.isActive,
      verification_status: payload.verificationStatus,
      verification_notes: payload.verificationNotes || null,
      verified_at: payload.verificationStatus === "VERIFIED_ORIGINAL" ? new Date().toISOString() : null,
      verified_by: payload.verificationStatus === "VERIFIED_ORIGINAL" ? "admin" : null,
    })
    .eq("id", productId);

  if (error) throw new Error(error.message);

  // Replace images — delete old, insert new
  await db().from("product_images").delete().eq("product_id", productId);
  if (payload.images.length > 0) {
    await db().from("product_images").insert(
      payload.images.map((img, i) => ({
        product_id: productId,
        url: img.url,
        is_primary: img.isPrimary,
        sort_order: i,
      }))
    );
  }

  // Snapshot existing per-variant stock by variant name so we can preserve it
  // when the new variant set happens to use the same name (e.g. "M / Black").
  const { data: existingVariants } = await db()
    .from("product_variants")
    .select("id, name, inventory ( quantity )")
    .eq("product_id", productId);

  const priorStockByName = new Map<string, number>();
  for (const v of (existingVariants ?? []) as any[]) {
    const inv = Array.isArray(v.inventory) ? v.inventory[0] : v.inventory;
    if (inv?.quantity != null) priorStockByName.set(v.name, Number(inv.quantity));
  }

  if (existingVariants?.length) {
    const ids = existingVariants.map((v: any) => v.id);
    await db().from("variant_options").delete().in("variant_id", ids);
    // Inventory rows for these variants cascade-delete via FK.
    await db().from("product_variants").delete().eq("product_id", productId);
  }

  const createdVariants = await insertVariants(productId, payload.sizes, payload.colors);

  if (createdVariants.length > 0) {
    // Drop any leftover base-row inventory; variant rows are authoritative now.
    await db().from("inventory").delete().eq("product_id", productId).is("variant_id", null);

    await db().from("inventory").insert(
      createdVariants.map((v) => ({
        product_id: productId,
        variant_id: v.id,
        quantity: priorStockByName.get(v.name) ?? payload.stockQuantity,
        reserved: 0,
      }))
    );
  } else {
    // No variants — ensure a base inventory row exists and is up to date.
    const { data: baseRow } = await db()
      .from("inventory")
      .select("id")
      .eq("product_id", productId)
      .is("variant_id", null)
      .maybeSingle();

    if (baseRow) {
      await db()
        .from("inventory")
        .update({ quantity: payload.stockQuantity })
        .eq("id", baseRow.id);
    } else {
      await db().from("inventory").insert({
        product_id: productId,
        variant_id: null,
        quantity: payload.stockQuantity,
        reserved: 0,
      });
    }
  }

  const { data: updated } = await db().from("products").select("slug").eq("id", productId).single();
  revalidatePath("/admin/products");
  if (updated?.slug) revalidatePath(`/product/${updated.slug}`);
}

// ---------------------------------------------------------------------------
// Toggle active / draft
// ---------------------------------------------------------------------------
export async function toggleProductActive(productId: string, active: boolean) {
  await requireAdmin();
  await db().from("products").update({ is_active: active }).eq("id", productId);
  revalidatePath("/admin/products");
}

// ---------------------------------------------------------------------------
// Hard-delete product (removes all related rows via cascade)
// ---------------------------------------------------------------------------
export async function deleteProduct(productId: string) {
  await requireAdmin();
  await db().from("products").delete().eq("id", productId);
  revalidatePath("/admin/products");
}

// ---------------------------------------------------------------------------
// Admin product list
// ---------------------------------------------------------------------------
export async function getAdminProducts() {
  const { data, error } = await db()
    .from("products")
    .select(`
      id, name, slug, base_price, compare_price, is_active, is_featured, created_at,
      categories!category_id ( name ),
      product_images ( url, is_primary ),
      inventory ( quantity, reserved )
    `)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

// ---------------------------------------------------------------------------
// Admin category list (with product counts)
// ---------------------------------------------------------------------------
export async function getAdminCategories() {
  const { data, error } = await db()
    .from("categories")
    .select("id, name, slug, is_active, created_at, products(id)")
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map((c: any) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    isActive: c.is_active,
    productCount: Array.isArray(c.products) ? c.products.length : 0,
  }));
}

export async function createCategory(name: string) {
  await requireAdmin();
  const slug = slugify(name);
  if (!slug) throw new Error("Category name required");

  const { error } = await db()
    .from("categories")
    .insert({ name, slug, is_active: true });

  if (error) throw new Error(error.message);
  revalidatePath("/admin/categories");
  return { slug };
}

export async function deleteCategory(categoryId: string) {
  await requireAdmin();
  const { error } = await db().from("categories").delete().eq("id", categoryId);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/categories");
}

// ---------------------------------------------------------------------------
// Admin stats for dashboard
// ---------------------------------------------------------------------------
export async function getAdminStats() {
  try {
    const [products, orders, outOfStock] = await Promise.all([
      db()
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true),
      db()
        .from("orders")
        .select("id", { count: "exact", head: true }),
      db()
        .from("inventory")
        .select("id", { count: "exact", head: true })
        .eq("quantity", 0),
    ]);

    const { data: recentOrders } = await db()
      .from("orders")
      .select("id, status, total, created_at, shipping_name")
      .order("created_at", { ascending: false })
      .limit(5);

    return {
      productCount: products.count ?? 0,
      orderCount: orders.count ?? 0,
      outOfStockCount: outOfStock.count ?? 0,
      recentOrders: recentOrders ?? [],
    };
  } catch {
    return { productCount: 0, orderCount: 0, outOfStockCount: 0, recentOrders: [] };
  }
}

// ---------------------------------------------------------------------------
// Update order status
// ---------------------------------------------------------------------------
export async function updateOrderStatus(
  orderId: string,
  status: string,
  trackingNumber?: string
) {
  await requireAdmin();
  const nextStatus = normalizeOrderStatus(status);
  const updates: Record<string, unknown> = {
    status: nextStatus,
    updated_at: new Date().toISOString(),
  };

  if (nextStatus === "OUT_FOR_DELIVERY") updates.shipped_at = new Date().toISOString();
  if (nextStatus === "DELIVERED") updates.delivered_at = new Date().toISOString();
  if (nextStatus === "CANCELLED") updates.cancelled_at = new Date().toISOString();
  if (trackingNumber !== undefined) updates.tracking_number = trackingNumber || null;

  const { error } = await db().from("orders").update(updates).eq("id", orderId);
  if (error) throw new Error(error.message);

  // Send lifecycle notifications
  if (nextStatus === "OUT_FOR_DELIVERY" || nextStatus === "DELIVERED") {
    const { data: order } = await db()
      .from("orders")
      .select("email, shipping_name, shipping_phone, tracking_number, user_id")
      .eq("id", orderId)
      .single();

    if (order?.email) {
      const shortRef = orderId.slice(0, 8).toUpperCase();
      const pushPayload = nextStatus === "OUT_FOR_DELIVERY"
        ? {
            title: `Order #${shortRef} is on the way`,
            body: order.tracking_number
              ? `Track with ${order.tracking_number}.`
              : "Out for delivery — we'll keep you posted.",
            url: `/account/orders`,
            tag: `order-${orderId}`,
          }
        : {
            title: `Order #${shortRef} delivered`,
            body: "Enjoy! Tap to leave a review.",
            url: `/account/orders`,
            tag: `order-${orderId}`,
          };

      await Promise.allSettled([
        nextStatus === "OUT_FOR_DELIVERY" && order.tracking_number
          ? sendShippingUpdateEmail({
              orderId,
              email: order.email,
              customerName: order.shipping_name,
              trackingNumber: order.tracking_number,
            })
          : Promise.resolve(),
        nextStatus === "OUT_FOR_DELIVERY" && order.tracking_number && order.shipping_phone
          ? sendShippingUpdateSms({
              phone: order.shipping_phone,
              customerName: order.shipping_name,
              orderId,
              trackingNumber: order.tracking_number,
            })
          : Promise.resolve(),
        nextStatus === "DELIVERED"
          ? sendDeliveredEmail({
              orderId,
              email: order.email,
              customerName: order.shipping_name,
            })
          : Promise.resolve(),
        order.user_id
          ? sendPushToUser(order.user_id, pushPayload).catch(() => null)
          : sendPushToEmails([order.email], pushPayload).catch(() => null),
      ]);
    }
  }

  revalidatePath("/admin/orders");
}

// ---------------------------------------------------------------------------
// Update order shipping address (admin)
// ---------------------------------------------------------------------------
// Editing the address only makes sense before the courier picks up — once an
// order is OUT_FOR_DELIVERY or DELIVERED, the label is already in the world.
const SHIPPING_EDITABLE_STATUSES = new Set([
  "PENDING_PAYMENT",
  "VERIFICATION_PENDING",
  "PAID",
  "VERIFIED",
  "PACKED",
]);

export interface OrderShippingPatch {
  name?: string;
  line1?: string;
  city?: string;
  state?: string;
  postal?: string | null;
  phone?: string;
}

export async function updateOrderShipping(orderId: string, patch: OrderShippingPatch) {
  await requireAdmin();

  const { data: current } = await db()
    .from("orders")
    .select("status")
    .eq("id", orderId)
    .single();

  if (!current) throw new Error("Order not found");
  if (!SHIPPING_EDITABLE_STATUSES.has(normalizeOrderStatus(current.status))) {
    throw new Error("This order has already shipped — address cannot be changed.");
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (patch.name !== undefined) {
    const v = patch.name.trim();
    if (!v) throw new Error("Name is required.");
    updates.shipping_name = v;
  }
  if (patch.line1 !== undefined) {
    const v = patch.line1.trim();
    if (!v) throw new Error("Street address is required.");
    updates.shipping_line1 = v;
  }
  if (patch.city !== undefined) {
    const v = patch.city.trim();
    if (!v) throw new Error("City is required.");
    updates.shipping_city = v;
  }
  if (patch.state !== undefined) {
    const v = patch.state.trim();
    if (!v) throw new Error("County is required.");
    updates.shipping_state = v;
  }
  if (patch.postal !== undefined) {
    updates.shipping_postal = patch.postal?.trim() || null;
  }
  if (patch.phone !== undefined) {
    const v = patch.phone.trim();
    if (!v) throw new Error("Phone is required.");
    updates.shipping_phone = v;
  }

  const { error } = await db().from("orders").update(updates).eq("id", orderId);
  if (error) throw new Error(error.message);

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
}

// ---------------------------------------------------------------------------
// Bulk product operations
// ---------------------------------------------------------------------------
export async function bulkToggleProducts(ids: string[], active: boolean) {
  await requireAdmin();
  const { error } = await db()
    .from("products")
    .update({ is_active: active })
    .in("id", ids);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/products");
}

export async function bulkDeleteProducts(ids: string[]) {
  await requireAdmin();
  const { error } = await db().from("products").delete().in("id", ids);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/products");
}

// ---------------------------------------------------------------------------
// Coupon management
// ---------------------------------------------------------------------------
export async function getAdminCoupons() {
  const { data, error } = await db()
    .from("coupons")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createCoupon(payload: {
  code: string;
  description: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minimumOrder: number;
  maxUses: number | null;
  expiresAt: string | null;
}) {
  await requireAdmin();
  const { error } = await db().from("coupons").insert({
    code: payload.code.toUpperCase(),
    description: payload.description || null,
    discount_type: payload.discountType,
    discount_value: payload.discountValue,
    minimum_order: payload.minimumOrder,
    max_uses: payload.maxUses,
    expires_at: payload.expiresAt || null,
    is_active: true,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/coupons");
}

export async function toggleCouponActive(couponId: string, active: boolean) {
  await requireAdmin();
  await db().from("coupons").update({ is_active: active }).eq("id", couponId);
  revalidatePath("/admin/coupons");
}

export async function deleteCoupon(couponId: string) {
  await requireAdmin();
  await db().from("coupons").delete().eq("id", couponId);
  revalidatePath("/admin/coupons");
}

// ---------------------------------------------------------------------------
// Admin stats for dashboard (enhanced with revenue)
// ---------------------------------------------------------------------------
export async function getAdminRevenue() {
  try {
    const { data: orders } = await db()
      .from("orders")
      .select("total, status, created_at")
      .in("status", ["PAID", "VERIFICATION_PENDING", "VERIFIED", "PACKED", "OUT_FOR_DELIVERY", "DELIVERED", "confirmed", "processing", "shipped", "delivered"]);

    const allOrders = orders ?? [];
    const totalRevenue = allOrders.reduce((sum, o) => sum + Number(o.total), 0);

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const recentOrders = allOrders.filter((o) => new Date(o.created_at) >= thirtyDaysAgo);
    const monthlyRevenue = recentOrders.reduce((sum, o) => sum + Number(o.total), 0);

    const { count: customerCount } = await db()
      .from("orders")
      .select("user_id", { count: "exact", head: true })
      .not("user_id", "is", null);

    return {
      totalRevenue,
      monthlyRevenue,
      monthlyOrders: recentOrders.length,
      customerCount: customerCount ?? 0,
    };
  } catch {
    return { totalRevenue: 0, monthlyRevenue: 0, monthlyOrders: 0, customerCount: 0 };
  }
}

// ---------------------------------------------------------------------------
// Customers — aggregate from orders
// ---------------------------------------------------------------------------
export async function getAdminCustomers() {
  await requireAdmin();
  const { data, error } = await db()
    .from("orders")
    .select("user_id, email, shipping_name, total, created_at, status")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  // Group by email (covers both guest and authed)
  const map = new Map<
    string,
    {
      email: string;
      userId: string | null;
      name: string;
      orderCount: number;
      totalSpent: number;
      lastOrderAt: string;
    }
  >();

  for (const o of data ?? []) {
    const key = o.email ?? `user:${o.user_id}`;
    if (!key) continue;
    const status = normalizeOrderStatus(o.status);
    const countsRevenue = status !== "CANCELLED" && status !== "REFUNDED" && status !== "FAILED";
    const existing = map.get(key);
    if (existing) {
      existing.orderCount++;
      if (countsRevenue) {
        existing.totalSpent += Number(o.total);
      }
    } else {
      map.set(key, {
        email: o.email ?? "",
        userId: o.user_id,
        name: o.shipping_name ?? "",
        orderCount: 1,
        totalSpent: countsRevenue ? Number(o.total) : 0,
        lastOrderAt: o.created_at,
      });
    }
  }

  return Array.from(map.values()).sort((a, b) => b.totalSpent - a.totalSpent);
}

// ---------------------------------------------------------------------------
// Inventory list / restock
// ---------------------------------------------------------------------------
export async function getAdminInventory() {
  await requireAdmin();
  const { data, error } = await db()
    .from("inventory")
    .select(`
      id, quantity, reserved, updated_at,
      products ( id, name, slug, is_active ),
      product_variants ( id, name )
    `);
  if (error) throw new Error(error.message);
  return (data ?? [])
    .map((row: any) => ({
      id: row.id,
      productId: row.products?.id,
      variantId: row.product_variants?.id ?? null,
      variantName: row.product_variants?.name ?? null,
      productName: row.products?.name ?? "—",
      slug: row.products?.slug,
      isActive: row.products?.is_active,
      quantity: row.quantity,
      reserved: row.reserved,
      available: row.quantity - row.reserved,
      updatedAt: row.updated_at,
    }))
    .sort((a, b) => a.available - b.available);
}

export async function restockInventory(inventoryId: string, delta: number) {
  await requireAdmin();
  if (!Number.isFinite(delta)) throw new Error("Invalid delta");
  const { data: current } = await db()
    .from("inventory")
    .select("product_id, variant_id, quantity, reserved")
    .eq("id", inventoryId)
    .single();
  if (!current) throw new Error("Inventory row not found");
  const wasOutOfStock = Math.max(0, current.quantity - current.reserved) <= 0;
  const next = Math.max(0, current.quantity + delta);
  await db()
    .from("inventory")
    .update({ quantity: next, updated_at: new Date().toISOString() })
    .eq("id", inventoryId);

  const nowAvailable = Math.max(0, next - current.reserved);
  if (wasOutOfStock && nowAvailable > 0) {
    await notifyRestockSubscribers(current.product_id, current.variant_id ?? null);
  }
  revalidatePath("/admin/inventory");
}

// ---------------------------------------------------------------------------
// Restock subscriptions
// ---------------------------------------------------------------------------
export interface RestockSubscriberRow {
  id: string;
  email: string;
  productId: string;
  productName: string;
  variantName: string | null;
  productSlug: string | null;
  createdAt: string;
  notifiedAt: string | null;
}

export async function getRestockSubscribers(): Promise<RestockSubscriberRow[]> {
  await requireAdmin();
  const { data, error } = await db()
    .from("restock_subscriptions")
    .select(`
      id, email, created_at, notified_at, product_id,
      products ( name, slug ),
      product_variants ( name )
    `)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r: any) => ({
    id: r.id,
    email: r.email,
    productId: r.product_id,
    productName: r.products?.name ?? "—",
    productSlug: r.products?.slug ?? null,
    variantName: r.product_variants?.name ?? null,
    createdAt: r.created_at,
    notifiedAt: r.notified_at,
  }));
}

export async function deleteRestockSubscriber(id: string) {
  await requireAdmin();
  await db().from("restock_subscriptions").delete().eq("id", id);
  revalidatePath("/admin/restock");
}

async function notifyRestockSubscribers(productId: string, variantId: string | null) {
  const query = db()
    .from("restock_subscriptions")
    .select("id, email, product_id, variant_id")
    .eq("product_id", productId)
    .is("notified_at", null);
  // A restocked variant should also clear product-level subscribers (those who
  // hit "Notify me" without picking a size), not just exact-variant matches.
  const { data: subs } = variantId
    ? await query.or(`variant_id.eq.${variantId},variant_id.is.null`)
    : await query.is("variant_id", null);

  if (!subs || subs.length === 0) return;

  const { data: productRow } = await db()
    .from("products")
    .select("name, slug, product_images ( url, is_primary, sort_order )")
    .eq("id", productId)
    .single();
  if (!productRow) return;

  const images = (productRow.product_images ?? [])
    .slice()
    .sort((a: any, b: any) => {
      if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
      return a.sort_order - b.sort_order;
    });
  const primaryImage = images[0]?.url ?? null;

  let variantName: string | null = null;
  if (variantId) {
    const { data: v } = await db()
      .from("product_variants")
      .select("name")
      .eq("id", variantId)
      .single();
    variantName = v?.name ?? null;
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXTAUTH_URL ??
    "https://baywoodsstore.com";
  const productUrl = `${baseUrl.replace(/\/$/, "")}/product/${productRow.slug}`;

  await Promise.allSettled([
    ...subs.map((s: any) =>
      sendRestockEmail({
        email: s.email,
        productName: productRow.name,
        productUrl,
        variantName,
        imageUrl: primaryImage,
      })
    ),
    sendPushToEmails(
      subs.map((s: any) => s.email as string),
      {
        title: `Back in stock — ${productRow.name}`,
        body: variantName
          ? `${variantName} is available again.`
          : "It's back. Tap to grab one before it sells out.",
        url: `/product/${productRow.slug}`,
        tag: `restock-${productId}`,
      }
    ).catch(() => null),
  ]);

  const ids = subs.map((s: any) => s.id);
  await db()
    .from("restock_subscriptions")
    .update({ notified_at: new Date().toISOString() })
    .in("id", ids);
}

// ---------------------------------------------------------------------------
// Return requests
// ---------------------------------------------------------------------------
export async function getReturnRequests() {
  await requireAdmin();
  const { data, error } = await db()
    .from("return_requests")
    .select(`
      id, order_id, email, reason, status, admin_note,
      refund_reference, refunded_at,
      refund_method, refund_status, refund_failure_reason,
      created_at,
      orders ( shipping_name, total )
    `)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r: any) => ({
    id: r.id,
    orderId: r.order_id,
    customerName: r.orders?.shipping_name ?? "",
    email: r.email,
    orderTotal: Number(r.orders?.total ?? 0),
    reason: r.reason,
    status: r.status,
    adminNote: r.admin_note,
    refundReference: (r.refund_reference as string | null) ?? null,
    refundedAt: (r.refunded_at as string | null) ?? null,
    refundMethod: (r.refund_method as string | null) ?? null,
    refundStatus: (r.refund_status as string | null) ?? null,
    refundFailureReason: (r.refund_failure_reason as string | null) ?? null,
    createdAt: r.created_at,
  }));
}

export async function isMpesaRefundConfigured(): Promise<boolean> {
  return isReversalConfigured();
}

export async function actionReturnRequest(
  id: string,
  action: "approve" | "deny" | "received" | "refund-manual" | "refund-auto",
  note?: string,
  refundReference?: string
) {
  await requireAdmin();
  const status =
    action === "approve" ? "approved"
    : action === "deny" ? "denied"
    : action === "received" ? "received"
    : "refunded";

  if (action === "refund-manual") {
    const ref = refundReference?.trim();
    if (!ref || ref.length < 3) {
      throw new Error("Refund reference is required (e.g. M-Pesa reversal ID or receipt note).");
    }
  }

  const { data: req } = await db()
    .from("return_requests")
    .select("order_id, status, refund_status")
    .eq("id", id)
    .single();
  if (!req) throw new Error("Return request not found");

  // Guard against re-processing terminal states. The customer-facing flow
  // is "requested → approved → received → refunded"; once refunded, the
  // only thing that should mutate it is the reversal callback flipping
  // refund_status from pending → success/failed.
  if (req.status === "refunded" && (action === "refund-manual" || action === "refund-auto")) {
    if (req.refund_status === "pending") {
      throw new Error("An auto-refund is already in flight for this return — wait for the provider to confirm.");
    }
    if (req.refund_status === "success" || action === "refund-manual") {
      throw new Error("This return has already been refunded.");
    }
  }

  const nowIso = new Date().toISOString();

  // -----------------------------------------------------------------
  // Auto refund via provider reversal API
  // -----------------------------------------------------------------
  // The actual inventory restore + order flip happen in the result callback
  // once the provider confirms the reversal succeeded. We only mark the return
  // as 'refunded' (status) and refund_status='pending' here. The admin sees
  // an in-flight indicator until the callback resolves it.
  if (action === "refund-auto") {
    if (!isReversalConfigured()) {
      throw new Error("M-Pesa auto-refund is not configured. Use the manual flow.");
    }
    if (!req.order_id) {
      throw new Error("Return is not tied to an order.");
    }

    const { data: payment } = await db()
      .from("payments")
      .select("mpesa_receipt, mpesa_amount, amount, status")
      .eq("order_id", req.order_id)
      .eq("status", "paid")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!payment?.mpesa_receipt) {
      throw new Error("No paid M-Pesa transaction found for this order — record manually instead.");
    }

    const amount = Number(payment.mpesa_amount ?? payment.amount);
    if (!amount || amount <= 0) {
      throw new Error("Could not determine refund amount.");
    }

    let reversal;
    try {
      reversal = await initiateReversal({
        receipt: payment.mpesa_receipt,
        amount,
        orderId: req.order_id,
        remarks: `Return ${id.slice(0, 8)}`,
      });
    } catch (err) {
      await db()
        .from("return_requests")
        .update({
          refund_method: "mpesa_reversal",
          refund_status: "failed",
          refund_failure_reason: err instanceof Error ? err.message : String(err),
          admin_note: note ?? null,
          updated_at: nowIso,
        })
        .eq("id", id);
      revalidatePath("/admin/returns");
      throw err;
    }

    if (reversal.ResponseCode !== "0") {
      await db()
        .from("return_requests")
        .update({
          refund_method: "mpesa_reversal",
          refund_status: "failed",
          refund_failure_reason: reversal.ResponseDescription,
          admin_note: note ?? null,
          updated_at: nowIso,
        })
        .eq("id", id);
      revalidatePath("/admin/returns");
      throw new Error(reversal.ResponseDescription);
    }

    // Provider accepted the request. Mark refunded + pending until the async
    // callback returns. Inventory/order updates wait for that confirmation.
    await db()
      .from("return_requests")
      .update({
        status: "refunded",
        refund_method: "mpesa_reversal",
        refund_status: "pending",
        refund_conversation_id: reversal.OriginatorConversationID,
        refund_failure_reason: null,
        admin_note: note ?? null,
        updated_at: nowIso,
      })
      .eq("id", id);

    revalidatePath("/admin/returns");
    return;
  }

  // -----------------------------------------------------------------
  // All other actions (approve / deny / received / refund-manual)
  // -----------------------------------------------------------------
  await db()
    .from("return_requests")
    .update({
      status,
      admin_note: note ?? null,
      refund_method: action === "refund-manual" ? "manual" : null,
      refund_reference: action === "refund-manual" ? refundReference!.trim() : null,
      refunded_at: action === "refund-manual" ? nowIso : null,
      refund_status: null,
      refund_failure_reason: null,
      updated_at: nowIso,
    })
    .eq("id", id);

  // On manual refund: restore inventory and flip order to refunded
  // (auto refunds defer this work to the callback handler).
  if (action === "refund-manual" && req.order_id) {
    const { data: items } = await db()
      .from("order_items")
      .select("product_id, variant_id, quantity")
      .eq("order_id", req.order_id);
    for (const it of items ?? []) {
      await db().rpc("restore_inventory_v2", {
        p_product_id: it.product_id,
        p_variant_id: it.variant_id ?? null,
        p_qty:        it.quantity,
      });
    }
    await db()
      .from("orders")
      .update({ status: "REFUNDED", payment_status: "refunded", updated_at: nowIso })
      .eq("id", req.order_id);
  }

  revalidatePath("/admin/returns");
}

// ---------------------------------------------------------------------------
// Contact messages
// ---------------------------------------------------------------------------
export async function getContactMessages() {
  await requireAdmin();
  const { data, error } = await db()
    .from("contact_messages")
    .select("id, name, email, subject, message, is_read, created_at")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function markContactRead(id: string) {
  await requireAdmin();
  await db()
    .from("contact_messages")
    .update({ is_read: true })
    .eq("id", id);
  revalidatePath("/admin/contacts");
}

// ---------------------------------------------------------------------------
// Reviews moderation
// ---------------------------------------------------------------------------
export async function getPendingReviews() {
  await requireAdmin();
  const { data, error } = await db()
    .from("reviews")
    .select(`
      id, rating, title, body, is_verified, is_approved,
      store_reply, store_reply_at, created_at,
      products ( name, slug ),
      users ( first_name, last_name, email )
    `)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((r: any) => ({
    id: r.id,
    rating: r.rating,
    title: r.title ?? null,
    body: r.body,
    isApproved: r.is_approved,
    isVerified: r.is_verified,
    storeReply: (r.store_reply as string | null) ?? null,
    storeReplyAt: (r.store_reply_at as string | null) ?? null,
    createdAt: r.created_at,
    productName: r.products?.name ?? "Unknown product",
    productSlug: r.products?.slug ?? "",
    authorName: r.users ? `${r.users.first_name} ${r.users.last_name}` : "Anonymous",
    authorEmail: r.users?.email ?? "",
  }));
}

export async function approveReview(id: string) {
  await requireAdmin();
  await db().from("reviews").update({ is_approved: true }).eq("id", id);
  revalidatePath("/admin/reviews");
}

export async function rejectReview(id: string) {
  await requireAdmin();
  await db().from("reviews").delete().eq("id", id);
  revalidatePath("/admin/reviews");
}

export async function updateReview(
  id: string,
  patch: { rating?: number; title?: string | null; body?: string }
) {
  await requireAdmin();
  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.rating !== undefined) {
    if (patch.rating < 1 || patch.rating > 5) throw new Error("Rating must be 1-5.");
    update.rating = patch.rating;
  }
  if (patch.title !== undefined) {
    update.title = patch.title?.trim() || null;
  }
  if (patch.body !== undefined) {
    const body = patch.body.trim();
    if (body.length < 1) throw new Error("Review body cannot be empty.");
    update.body = body;
  }
  await db().from("reviews").update(update).eq("id", id);
  revalidatePath("/admin/reviews");
}

export async function setReviewReply(id: string, reply: string | null) {
  await requireAdmin();
  const trimmed = reply?.trim();
  if (trimmed && trimmed.length > 2000) {
    throw new Error("Reply is too long (max 2000 characters).");
  }
  await db()
    .from("reviews")
    .update({
      store_reply: trimmed && trimmed.length > 0 ? trimmed : null,
      store_reply_at: trimmed && trimmed.length > 0 ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  revalidatePath("/admin/reviews");
}

// ---------------------------------------------------------------------------
// Push broadcast — admin marketing tool
// ---------------------------------------------------------------------------
export interface PushBroadcastInput {
  title: string;
  body: string;
  url?: string;
}

export interface PushBroadcastSummary {
  configured: boolean;
  totalSubscribers: number;
  delivered: number;
  pruned: number;
  failed: number;
}

export async function getPushBroadcastStatus(): Promise<{
  configured: boolean;
  totalSubscribers: number;
}> {
  await requireAdmin();
  const configured = isPushConfigured();
  let totalSubscribers = 0;
  try {
    const { count } = await db()
      .from("push_subscriptions")
      .select("id", { count: "exact", head: true });
    totalSubscribers = count ?? 0;
  } catch {
    totalSubscribers = 0;
  }
  return { configured, totalSubscribers };
}

export async function broadcastPush(input: PushBroadcastInput): Promise<PushBroadcastSummary> {
  await requireAdmin();
  if (!isPushConfigured()) {
    return { configured: false, totalSubscribers: 0, delivered: 0, pruned: 0, failed: 0 };
  }
  const title = input.title?.trim();
  const body = input.body?.trim();
  if (!title || !body) throw new Error("Title and body are required");
  if (title.length > 80) throw new Error("Title must be 80 characters or less");
  if (body.length > 240) throw new Error("Body must be 240 characters or less");

  const url = input.url?.trim() || "/";
  // Only allow same-origin paths to keep service-worker openWindow predictable.
  if (!url.startsWith("/")) throw new Error("URL must be a same-origin path starting with /");

  const { count } = await db()
    .from("push_subscriptions")
    .select("id", { count: "exact", head: true });

  // Fixed tag "broadcast" means each new broadcast replaces the previous one
  // in the user's notification tray rather than stacking. Using Date.now() as
  // the tag would make every broadcast unique, defeating deduplication entirely.
  const result = await sendPushToAll({ title, body, url, tag: "broadcast" });

  // Best-effort log. If the push_broadcasts table is missing (migration not
  // applied yet) we don't want to break the broadcast itself.
  try {
    await db().from("push_broadcasts").insert({
      title,
      body,
      url,
      delivered: result.delivered,
      failed: result.failed,
      pruned: result.pruned,
    });
  } catch (err) {
    console.warn("[broadcastPush] could not log broadcast:", err);
  }

  revalidatePath("/admin/push");
  return {
    configured: true,
    totalSubscribers: count ?? 0,
    delivered: result.delivered,
    pruned: result.pruned,
    failed: result.failed,
  };
}

export async function getRecentPushBroadcasts(limit = 20) {
  await requireAdmin();
  try {
    const { data, error } = await db()
      .from("push_broadcasts")
      .select("id, title, body, url, delivered, failed, pruned, sent_at")
      .order("sent_at", { ascending: false })
      .limit(limit);
    if (error) return [];
    return data ?? [];
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Helper: create variants from sizes × colors
// ---------------------------------------------------------------------------
async function insertVariants(
  productId: string,
  sizes: string[],
  colors: ColorOption[]
): Promise<{ id: string; name: string }[]> {
  if (sizes.length === 0 && colors.length === 0) return [];

  type Combo = { size: string | null; color: ColorOption | null };
  let combos: Combo[];

  if (sizes.length > 0 && colors.length > 0) {
    combos = sizes.flatMap((size) => colors.map((color) => ({ size, color })));
  } else if (sizes.length > 0) {
    combos = sizes.map((size) => ({ size, color: null }));
  } else {
    combos = colors.map((color) => ({ size: null, color }));
  }

  const created: { id: string; name: string }[] = [];

  for (let i = 0; i < combos.length; i++) {
    const { size, color } = combos[i];
    const variantName = [size, color?.name].filter(Boolean).join(" / ");

    const { data: variant, error } = await db()
      .from("product_variants")
      .insert({ product_id: productId, name: variantName, sort_order: i })
      .select("id, name")
      .single();

    if (error || !variant) continue;
    created.push({ id: variant.id, name: variant.name });

    const options: { variant_id: string; option_name: string; option_value: string }[] = [];
    if (size) options.push({ variant_id: variant.id, option_name: "Size", option_value: size });
    if (color) {
      options.push({ variant_id: variant.id, option_name: "Color", option_value: color.name });
      options.push({ variant_id: variant.id, option_name: "Color Hex", option_value: color.hex });
    }
    if (options.length) await db().from("variant_options").insert(options);
  }

  return created;
}
