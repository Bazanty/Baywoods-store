"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils";
import { sendShippingUpdateEmail, sendDeliveredEmail } from "@/lib/email";
import { sendShippingUpdateSms } from "@/lib/sms";
import { requireAdmin } from "@/lib/adminAuth";

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
}

// ---------------------------------------------------------------------------
// Create product
// ---------------------------------------------------------------------------
export async function createProduct(payload: ProductPayload) {
  requireAdmin();
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
      category_id: category?.id ?? null,
      base_price: payload.basePrice,
      compare_price: payload.comparePrice ?? null,
      sku: payload.sku || null,
      is_featured: payload.isFeatured,
      is_active: payload.isActive,
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
  await insertVariants(productId, payload.sizes, payload.colors);

  // 5. Insert inventory
  await db().from("inventory").insert({
    product_id: productId,
    variant_id: null,
    quantity: payload.stockQuantity,
    reserved: 0,
  });

  revalidatePath("/admin/products");
  return { productId, slug };
}

// ---------------------------------------------------------------------------
// Update product
// ---------------------------------------------------------------------------
export async function updateProduct(productId: string, payload: ProductPayload) {
  requireAdmin();
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
      category_id: category?.id ?? null,
      base_price: payload.basePrice,
      compare_price: payload.comparePrice ?? null,
      sku: payload.sku || null,
      is_featured: payload.isFeatured,
      is_active: payload.isActive,
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

  // Replace variants
  const { data: existingVariants } = await db()
    .from("product_variants")
    .select("id")
    .eq("product_id", productId);

  if (existingVariants?.length) {
    const ids = existingVariants.map((v) => v.id);
    await db().from("variant_options").delete().in("variant_id", ids);
    await db().from("product_variants").delete().eq("product_id", productId);
  }

  await insertVariants(productId, payload.sizes, payload.colors);

  // Update inventory quantity
  await db()
    .from("inventory")
    .update({ quantity: payload.stockQuantity })
    .eq("product_id", productId)
    .is("variant_id", null);

  const { data: updated } = await db().from("products").select("slug").eq("id", productId).single();
  revalidatePath("/admin/products");
  if (updated?.slug) revalidatePath(`/product/${updated.slug}`);
}

// ---------------------------------------------------------------------------
// Toggle active / draft
// ---------------------------------------------------------------------------
export async function toggleProductActive(productId: string, active: boolean) {
  requireAdmin();
  await db().from("products").update({ is_active: active }).eq("id", productId);
  revalidatePath("/admin/products");
}

// ---------------------------------------------------------------------------
// Hard-delete product (removes all related rows via cascade)
// ---------------------------------------------------------------------------
export async function deleteProduct(productId: string) {
  requireAdmin();
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
  requireAdmin();
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
  requireAdmin();
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
  requireAdmin();
  const updates: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === "shipped") updates.shipped_at = new Date().toISOString();
  if (status === "delivered") updates.delivered_at = new Date().toISOString();
  if (status === "cancelled") updates.cancelled_at = new Date().toISOString();
  if (trackingNumber !== undefined) updates.tracking_number = trackingNumber || null;

  const { error } = await db().from("orders").update(updates).eq("id", orderId);
  if (error) throw new Error(error.message);

  // Send lifecycle notifications
  if (status === "shipped" || status === "delivered") {
    const { data: order } = await db()
      .from("orders")
      .select("email, shipping_name, shipping_phone, tracking_number")
      .eq("id", orderId)
      .single();

    if (order?.email) {
      Promise.allSettled([
        status === "shipped" && order.tracking_number
          ? sendShippingUpdateEmail({
              orderId,
              email: order.email,
              customerName: order.shipping_name,
              trackingNumber: order.tracking_number,
            })
          : Promise.resolve(),
        status === "shipped" && order.tracking_number && order.shipping_phone
          ? sendShippingUpdateSms({
              phone: order.shipping_phone,
              customerName: order.shipping_name,
              orderId,
              trackingNumber: order.tracking_number,
            })
          : Promise.resolve(),
        status === "delivered"
          ? sendDeliveredEmail({
              orderId,
              email: order.email,
              customerName: order.shipping_name,
            })
          : Promise.resolve(),
      ]).catch(() => {});
    }
  }

  revalidatePath("/admin/orders");
}

// ---------------------------------------------------------------------------
// Bulk product operations
// ---------------------------------------------------------------------------
export async function bulkToggleProducts(ids: string[], active: boolean) {
  requireAdmin();
  const { error } = await db()
    .from("products")
    .update({ is_active: active })
    .in("id", ids);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/products");
}

export async function bulkDeleteProducts(ids: string[]) {
  requireAdmin();
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
  requireAdmin();
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
  requireAdmin();
  await db().from("coupons").update({ is_active: active }).eq("id", couponId);
  revalidatePath("/admin/coupons");
}

export async function deleteCoupon(couponId: string) {
  requireAdmin();
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
      .in("status", ["pending", "confirmed", "processing", "shipped", "delivered"]);

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
  requireAdmin();
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
    const existing = map.get(key);
    if (existing) {
      existing.orderCount++;
      if (o.status !== "cancelled" && o.status !== "refunded") {
        existing.totalSpent += Number(o.total);
      }
    } else {
      map.set(key, {
        email: o.email ?? "",
        userId: o.user_id,
        name: o.shipping_name ?? "",
        orderCount: 1,
        totalSpent:
          o.status !== "cancelled" && o.status !== "refunded" ? Number(o.total) : 0,
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
  requireAdmin();
  const { data, error } = await db()
    .from("inventory")
    .select(`
      id, quantity, reserved, updated_at,
      products ( id, name, slug, is_active )
    `)
    .is("variant_id", null);
  if (error) throw new Error(error.message);
  return (data ?? [])
    .map((row: any) => ({
      id: row.id,
      productId: row.products?.id,
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

export async function restockInventory(productId: string, delta: number) {
  requireAdmin();
  if (!Number.isFinite(delta)) throw new Error("Invalid delta");
  const { data: current } = await db()
    .from("inventory")
    .select("quantity")
    .eq("product_id", productId)
    .is("variant_id", null)
    .single();
  if (!current) throw new Error("Inventory row not found");
  const next = Math.max(0, current.quantity + delta);
  await db()
    .from("inventory")
    .update({ quantity: next, updated_at: new Date().toISOString() })
    .eq("product_id", productId)
    .is("variant_id", null);
  revalidatePath("/admin/inventory");
}

// ---------------------------------------------------------------------------
// Return requests
// ---------------------------------------------------------------------------
export async function getReturnRequests() {
  requireAdmin();
  const { data, error } = await db()
    .from("return_requests")
    .select(`
      id, order_id, email, reason, status, admin_note, created_at,
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
    createdAt: r.created_at,
  }));
}

export async function actionReturnRequest(
  id: string,
  action: "approve" | "deny" | "received" | "refund",
  note?: string
) {
  requireAdmin();
  const status =
    action === "approve" ? "approved"
    : action === "deny" ? "denied"
    : action === "received" ? "received"
    : "refunded";

  const { data: req } = await db()
    .from("return_requests")
    .select("order_id, status")
    .eq("id", id)
    .single();
  if (!req) throw new Error("Return request not found");

  await db()
    .from("return_requests")
    .update({
      status,
      admin_note: note ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  // On refund: restore inventory and flip order to refunded
  if (action === "refund" && req.order_id) {
    const { data: items } = await db()
      .from("order_items")
      .select("product_id, quantity")
      .eq("order_id", req.order_id);
    for (const it of items ?? []) {
      await db().rpc("restore_inventory", {
        p_product_id: it.product_id,
        p_qty:        it.quantity,
      });
    }
    await db()
      .from("orders")
      .update({ status: "refunded", payment_status: "refunded", updated_at: new Date().toISOString() })
      .eq("id", req.order_id);
  }

  revalidatePath("/admin/returns");
}

// ---------------------------------------------------------------------------
// Contact messages
// ---------------------------------------------------------------------------
export async function getContactMessages() {
  requireAdmin();
  const { data, error } = await db()
    .from("contact_messages")
    .select("id, name, email, subject, message, is_read, created_at")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function markContactRead(id: string) {
  requireAdmin();
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
  requireAdmin();
  const { data, error } = await db()
    .from("reviews")
    .select(`
      id, rating, title, body, is_verified, is_approved, created_at,
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
    createdAt: r.created_at,
    productName: r.products?.name ?? "Unknown product",
    productSlug: r.products?.slug ?? "",
    authorName: r.users ? `${r.users.first_name} ${r.users.last_name}` : "Anonymous",
    authorEmail: r.users?.email ?? "",
  }));
}

export async function approveReview(id: string) {
  requireAdmin();
  await db().from("reviews").update({ is_approved: true }).eq("id", id);
  revalidatePath("/admin/reviews");
}

export async function rejectReview(id: string) {
  requireAdmin();
  await db().from("reviews").delete().eq("id", id);
  revalidatePath("/admin/reviews");
}

// ---------------------------------------------------------------------------
// Helper: create variants from sizes × colors
// ---------------------------------------------------------------------------
async function insertVariants(
  productId: string,
  sizes: string[],
  colors: ColorOption[]
) {
  if (sizes.length === 0 && colors.length === 0) return;

  type Combo = { size: string | null; color: ColorOption | null };
  let combos: Combo[];

  if (sizes.length > 0 && colors.length > 0) {
    combos = sizes.flatMap((size) => colors.map((color) => ({ size, color })));
  } else if (sizes.length > 0) {
    combos = sizes.map((size) => ({ size, color: null }));
  } else {
    combos = colors.map((color) => ({ size: null, color }));
  }

  for (let i = 0; i < combos.length; i++) {
    const { size, color } = combos[i];
    const variantName = [size, color?.name].filter(Boolean).join(" / ");

    const { data: variant, error } = await db()
      .from("product_variants")
      .insert({ product_id: productId, name: variantName, sort_order: i })
      .select("id")
      .single();

    if (error || !variant) continue;

    const options: { variant_id: string; option_name: string; option_value: string }[] = [];
    if (size) options.push({ variant_id: variant.id, option_name: "Size", option_value: size });
    if (color) {
      options.push({ variant_id: variant.id, option_name: "Color", option_value: color.name });
      options.push({ variant_id: variant.id, option_name: "Color Hex", option_value: color.hex });
    }
    if (options.length) await db().from("variant_options").insert(options);
  }
}
