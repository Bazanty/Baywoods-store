// Critical flow: the server recalculates every order total from authoritative
// DB rows and never trusts prices/totals sent by the browser.
import test from "node:test";
import assert from "node:assert/strict";

import { recomputeOrder } from "../lib/orderPricing";
import { makeFakeDb } from "./helpers/fakeSupabase";
import { buildOrderPayload } from "./helpers/fixtures";

const TEE = {
  id: "tee-1",
  name: "Nairobi Tee",
  base_price: 2000,
  compare_price: null,
  is_active: true,
  product_variants: [],
};

test("recomputes line totals from DB prices and ignores client-supplied amounts", async () => {
  const db = makeFakeDb({ products: [TEE] });
  const payload = buildOrderPayload({
    // Browser sends a unit price of 1 KES and a total of 5 KES.
    items: [{ productId: "tee-1", quantity: 2, unitPrice: 1, lineTotal: 2 }],
    subtotal: 2,
    total: 5,
  });

  const result = await recomputeOrder(db as any, payload);

  assert.ok(result.ok);
  assert.equal(result.order.items[0]!.unitPrice, 2000);
  assert.equal(result.order.subtotal, 4000);
  assert.equal(result.order.shippingCost, 350);
  assert.equal(result.order.total, 4350);

  // The route rejects a payload.total this far from the server total
  // (TOTAL_TOLERANCE_KES is 1 KES) as a PRICE_MISMATCH.
  assert.ok(Math.abs((payload.total ?? 0) - result.order.total) > 1);
});

test("waives shipping once the subtotal crosses the free-shipping threshold", async () => {
  const db = makeFakeDb({ products: [TEE] });
  const payload = buildOrderPayload({
    items: [{ productId: "tee-1", quantity: 3 }], // 6000 KES, over 5000
  });

  const result = await recomputeOrder(db as any, payload);

  assert.ok(result.ok);
  assert.equal(result.order.subtotal, 6000);
  assert.equal(result.order.shippingCost, 0);
  assert.equal(result.order.total, 6000);
});

test("applies the express shipping rate when requested", async () => {
  const db = makeFakeDb({ products: [TEE] });
  const payload = buildOrderPayload({
    shippingMethod: "express",
    items: [{ productId: "tee-1", quantity: 2 }],
  });

  const result = await recomputeOrder(db as any, payload);

  assert.ok(result.ok);
  assert.equal(result.order.shippingCost, 800);
  assert.equal(result.order.total, 4800);
});

test("uses the variant price override, not the base product price", async () => {
  const db = makeFakeDb({
    products: [
      {
        id: "hoodie-1",
        name: "Coastal Hoodie",
        base_price: 3000,
        compare_price: null,
        is_active: true,
        product_variants: [
          { id: "hoodie-L", name: "Large", price: 3500, is_active: true },
        ],
      },
    ],
  });
  const payload = buildOrderPayload({
    items: [{ productId: "hoodie-1", variantId: "hoodie-L", quantity: 1 }],
  });

  const result = await recomputeOrder(db as any, payload);

  assert.ok(result.ok);
  assert.equal(result.order.items[0]!.unitPrice, 3500);
  assert.equal(result.order.subtotal, 3500);
});

test("rejects an order containing an inactive product", async () => {
  const db = makeFakeDb({
    products: [{ ...TEE, is_active: false }],
  });
  const payload = buildOrderPayload({ items: [{ productId: "tee-1", quantity: 1 }] });

  const result = await recomputeOrder(db as any, payload);

  assert.ok(!result.ok);
  assert.equal(result.status, 400);
});

test("rejects out-of-range quantities", async () => {
  const db = makeFakeDb({ products: [TEE] });

  const zero = await recomputeOrder(
    db as any,
    buildOrderPayload({ items: [{ productId: "tee-1", quantity: 0 }] })
  );
  const tooMany = await recomputeOrder(
    db as any,
    buildOrderPayload({ items: [{ productId: "tee-1", quantity: 150 }] })
  );

  assert.ok(!zero.ok);
  assert.equal(zero.status, 400);
  assert.ok(!tooMany.ok);
  assert.equal(tooMany.status, 400);
});

test("rejects an order referencing a product that no longer exists", async () => {
  const db = makeFakeDb({ products: [TEE] });
  const payload = buildOrderPayload({ items: [{ productId: "ghost", quantity: 1 }] });

  const result = await recomputeOrder(db as any, payload);

  assert.ok(!result.ok);
  assert.equal(result.status, 400);
});
