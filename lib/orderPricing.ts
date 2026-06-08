// Server-authoritative checkout pricing and reservation checks.
//
// Extracted from `app/api/orders/route.ts` so it can be unit-tested directly:
// Next.js route files may only export the HTTP method handlers, so shared
// checkout logic lives here instead. `app/api/orders/route.ts` is the only
// production caller.
import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import type { SupabaseClient } from "@supabase/supabase-js";

interface ClientOrderItem {
  productId: string;
  variantId?: string | null;
  productName?: string;
  variantName?: string;
  // unitPrice / lineTotal sent by client are intentionally IGNORED.
  unitPrice?: number;
  lineTotal?: number;
  quantity: number;
}

export interface CreateOrderPayload {
  userId?: string;
  email: string;
  phone: string;
  shippingAddress: {
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    county: string;
    postal?: string;
  };
  shippingMethod: "standard" | "express";
  // The following totals are sent by the client but are RECOMPUTED on the
  // server. They're accepted only for a sanity-mismatch check.
  shippingCost?: number;
  subtotal?: number;
  discountAmount?: number;
  total?: number;
  paymentMethod?: string;
  items: ClientOrderItem[];
  sessionId?: string;
  couponCode?: string;
}

export interface ResolvedItem {
  productId: string;
  variantId: string | null;
  productName: string;
  variantName: string;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
}

export interface ResolvedOrder {
  items: ResolvedItem[];
  subtotal: number;
  shippingCost: number;
  shippingMethod: "standard" | "express";
  discountAmount: number;
  couponId: string | null;
  total: number;
}

const STANDARD_SHIPPING_KES = 350;
const EXPRESS_SHIPPING_KES = 800;
const FREE_SHIPPING_THRESHOLD = 5000;
export const TOTAL_TOLERANCE_KES = 1; // accept rounding noise only

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

// Recomputes every monetary value from authoritative DB rows so a tampered
// client cart can never influence the charged amount.
export async function recomputeOrder(
  db: SupabaseClient,
  payload: CreateOrderPayload
): Promise<{ ok: true; order: ResolvedOrder } | { ok: false; status: number; error: string }> {
  const productIds = Array.from(new Set(payload.items.map((i) => i.productId)));
  if (productIds.length === 0) {
    return { ok: false, status: 400, error: "Cart is empty." };
  }

  const { data: products, error: productsError } = await db
    .from("products")
    .select(
      `id, name, base_price, compare_price, is_active,
       product_variants ( id, name, price, is_active )`
    )
    .in("id", productIds);

  if (productsError || !products) {
    return { ok: false, status: 500, error: "Could not verify products." };
  }

  const productMap = new Map(products.map((p: any) => [p.id, p]));

  const resolved: ResolvedItem[] = [];
  let subtotal = 0;

  for (const item of payload.items) {
    const product: any = productMap.get(item.productId);
    if (!product) {
      return { ok: false, status: 400, error: "An item in your cart is no longer available." };
    }
    if (!product.is_active) {
      return { ok: false, status: 400, error: `"${product.name}" is no longer available.` };
    }
    if (!Number.isInteger(item.quantity) || item.quantity <= 0 || item.quantity > 100) {
      return { ok: false, status: 400, error: `Invalid quantity for "${product.name}".` };
    }

    let variantPriceOverride: number | null = null;
    let variantName = item.variantName ?? "";
    if (item.variantId) {
      const variant = (product.product_variants ?? []).find(
        (v: any) => v.id === item.variantId
      );
      if (!variant) {
        return {
          ok: false,
          status: 400,
          error: `Selected option for "${product.name}" is unavailable.`,
        };
      }
      if (variant.is_active === false) {
        return {
          ok: false,
          status: 400,
          error: `Selected option for "${product.name}" is unavailable.`,
        };
      }
      if (variant.price != null) variantPriceOverride = Number(variant.price);
      if (!variantName) variantName = variant.name ?? "";
    }

    // `base_price` is the sell price. `compare_price` is only the original
    // strikethrough price used for merchandising, never the amount to charge.
    const effectivePrice = variantPriceOverride ?? Number(product.base_price);
    if (!Number.isFinite(effectivePrice) || effectivePrice < 0) {
      return { ok: false, status: 500, error: `Invalid price for "${product.name}".` };
    }

    const unitPrice = round2(effectivePrice);
    const lineTotal = round2(unitPrice * item.quantity);
    subtotal += lineTotal;

    resolved.push({
      productId: item.productId,
      variantId: item.variantId ?? null,
      productName: product.name,
      variantName,
      unitPrice,
      quantity: item.quantity,
      lineTotal,
    });
  }

  subtotal = round2(subtotal);

  const shippingMethod = payload.shippingMethod === "express" ? "express" : "standard";
  const shippingCost =
    subtotal >= FREE_SHIPPING_THRESHOLD
      ? 0
      : shippingMethod === "express"
      ? EXPRESS_SHIPPING_KES
      : STANDARD_SHIPPING_KES;

  let discountAmount = 0;
  let couponId: string | null = null;
  const couponCode = (payload.couponCode ?? "").trim().toUpperCase();
  if (couponCode) {
    const nowIso = new Date().toISOString();
    const { data: coupon } = await db
      .from("coupons")
      .select("*")
      .eq("code", couponCode)
      .eq("is_active", true)
      .lte("starts_at", nowIso)
      .maybeSingle();

    if (coupon) {
      const expired = coupon.expires_at && coupon.expires_at < nowIso;
      const maxedOut = coupon.max_uses != null && coupon.used_count >= coupon.max_uses;
      const meetsMin = subtotal >= Number(coupon.minimum_order ?? 0);
      if (!expired && !maxedOut && meetsMin) {
        const raw =
          coupon.discount_type === "percentage"
            ? (subtotal * Number(coupon.discount_value)) / 100
            : Number(coupon.discount_value);
        discountAmount = round2(Math.min(raw, subtotal));
        couponId = coupon.id;
      }
    }
  }

  const total = Math.max(0, round2(subtotal + shippingCost - discountAmount));

  return {
    ok: true,
    order: {
      items: resolved,
      subtotal,
      shippingCost,
      shippingMethod,
      discountAmount,
      couponId,
      total,
    },
  };
}

// Confirms the exact product/variant buckets in the order are still held under
// the checkout session before the order is committed.
export async function validateReservedStock(
  db: SupabaseClient,
  sessionId: string | undefined,
  items: ResolvedItem[]
): Promise<NextResponse | null> {
  if (!sessionId) {
    return NextResponse.json(
      { code: "RESERVATION_REQUIRED", error: "Stock must be reserved before payment." },
      { status: 409 }
    );
  }

  try {
    await db.rpc("expire_reservations");
  } catch (err) {
    Sentry.captureException(err);
  }

  for (const item of items) {
    const inventoryQuery = item.variantId
      ? db.from("inventory").select("id").eq("product_id", item.productId).eq("variant_id", item.variantId)
      : db.from("inventory").select("id").eq("product_id", item.productId).is("variant_id", null);

    const { data: inventoryRows, error: inventoryError } = await inventoryQuery.limit(1);
    if (inventoryError) {
      Sentry.captureException(inventoryError);
      return NextResponse.json(
        { code: "OUT_OF_STOCK", error: `"${item.productName}" is not available for purchase.` },
        { status: 409 }
      );
    }
    if (!inventoryRows?.length) {
      // No inventory row — product has no stock tracking, skip reservation check.
      continue;
    }

    const reservationQuery = item.variantId
      ? db
          .from("cart_reservations")
          .select("quantity")
          .eq("session_id", sessionId)
          .eq("product_id", item.productId)
          .eq("variant_id", item.variantId)
      : db
          .from("cart_reservations")
          .select("quantity")
          .eq("session_id", sessionId)
          .eq("product_id", item.productId)
          .is("variant_id", null);

    const { data: reservations, error: reservationError } = await reservationQuery;
    if (reservationError) {
      Sentry.captureException(reservationError);
      return NextResponse.json(
        { code: "RESERVATION_CHECK_FAILED", error: "Could not verify reserved stock. Try again." },
        { status: 500 }
      );
    }

    const reservedQty = (reservations ?? []).reduce(
      (sum, row) => sum + Number(row.quantity ?? 0),
      0
    );
    if (reservedQty < item.quantity) {
      return NextResponse.json(
        {
          code: "RESERVATION_EXPIRED",
          error: `"${item.productName}" is no longer held for you. Confirm details and try again.`,
        },
        { status: 409 }
      );
    }
  }

  return null;
}
