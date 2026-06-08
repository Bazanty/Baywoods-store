// Critical flow: coupon validation and discount math run server-side inside
// recomputeOrder. A coupon that is expired, used up, inactive, or below its
// minimum-order threshold must never reduce the charged total.
import test from "node:test";
import assert from "node:assert/strict";

import { recomputeOrder } from "../lib/orderPricing";
import { makeFakeDb, type Row } from "./helpers/fakeSupabase";
import { buildOrderPayload } from "./helpers/fixtures";

const TEE = {
  id: "tee-1",
  name: "Nairobi Tee",
  base_price: 2000,
  compare_price: null,
  is_active: true,
  product_variants: [],
};

// Subtotal is fixed at 2 x 2000 = 4000 KES (standard shipping 350) across the
// suite so each test only varies the coupon.
const twoTees = { productId: "tee-1", quantity: 2 };

function coupon(overrides: Row = {}): Row {
  return {
    id: "coupon-1",
    code: "WELCOME",
    is_active: true,
    starts_at: "2020-01-01T00:00:00.000Z",
    expires_at: null,
    max_uses: null,
    used_count: 0,
    minimum_order: 0,
    discount_type: "percentage",
    discount_value: 10,
    description: "Test coupon",
    ...overrides,
  };
}

test("applies a percentage coupon and normalises the code casing", async () => {
  const db = makeFakeDb({ products: [TEE], coupons: [coupon()] });
  const payload = buildOrderPayload({ items: [twoTees], couponCode: "  welcome " });

  const result = await recomputeOrder(db as any, payload);

  assert.ok(result.ok);
  assert.equal(result.order.discountAmount, 400); // 10% of 4000
  assert.equal(result.order.couponId, "coupon-1");
  assert.equal(result.order.total, 3950); // 4000 + 350 - 400
});

test("applies a fixed-amount coupon", async () => {
  const db = makeFakeDb({
    products: [TEE],
    coupons: [coupon({ discount_type: "fixed", discount_value: 500 })],
  });
  const payload = buildOrderPayload({ items: [twoTees], couponCode: "WELCOME" });

  const result = await recomputeOrder(db as any, payload);

  assert.ok(result.ok);
  assert.equal(result.order.discountAmount, 500);
  assert.equal(result.order.total, 3850);
});

test("ignores an expired coupon", async () => {
  const db = makeFakeDb({
    products: [TEE],
    coupons: [coupon({ expires_at: "2021-01-01T00:00:00.000Z" })],
  });
  const payload = buildOrderPayload({ items: [twoTees], couponCode: "WELCOME" });

  const result = await recomputeOrder(db as any, payload);

  assert.ok(result.ok);
  assert.equal(result.order.discountAmount, 0);
  assert.equal(result.order.couponId, null);
});

test("ignores a coupon that has hit its usage limit", async () => {
  const db = makeFakeDb({
    products: [TEE],
    coupons: [coupon({ max_uses: 3, used_count: 3 })],
  });
  const payload = buildOrderPayload({ items: [twoTees], couponCode: "WELCOME" });

  const result = await recomputeOrder(db as any, payload);

  assert.ok(result.ok);
  assert.equal(result.order.discountAmount, 0);
  assert.equal(result.order.couponId, null);
});

test("ignores a coupon when the subtotal is below its minimum order", async () => {
  const db = makeFakeDb({
    products: [TEE],
    coupons: [coupon({ minimum_order: 999999 })],
  });
  const payload = buildOrderPayload({ items: [twoTees], couponCode: "WELCOME" });

  const result = await recomputeOrder(db as any, payload);

  assert.ok(result.ok);
  assert.equal(result.order.discountAmount, 0);
});

test("ignores an inactive coupon", async () => {
  const db = makeFakeDb({
    products: [TEE],
    coupons: [coupon({ is_active: false })],
  });
  const payload = buildOrderPayload({ items: [twoTees], couponCode: "WELCOME" });

  const result = await recomputeOrder(db as any, payload);

  assert.ok(result.ok);
  assert.equal(result.order.discountAmount, 0);
  assert.equal(result.order.couponId, null);
});

test("never lets a discount exceed the subtotal", async () => {
  const db = makeFakeDb({
    products: [TEE],
    coupons: [coupon({ discount_type: "fixed", discount_value: 999999 })],
  });
  const payload = buildOrderPayload({ items: [twoTees], couponCode: "WELCOME" });

  const result = await recomputeOrder(db as any, payload);

  assert.ok(result.ok);
  assert.equal(result.order.discountAmount, 4000); // capped at subtotal
  assert.equal(result.order.total, 350); // never negative
});
