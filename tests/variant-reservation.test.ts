// Critical flow: before an order is created the server confirms that the exact
// product/variant buckets in the cart are still held under the checkout
// session. A reservation for a different variant must not satisfy the check.
import test from "node:test";
import assert from "node:assert/strict";

import { validateReservedStock } from "../lib/orderPricing";
import { makeFakeDb } from "./helpers/fakeSupabase";
import { buildResolvedItem } from "./helpers/fixtures";

const SESSION = "sess-1";

test("rejects checkout when no reservation session is supplied", async () => {
  const db = makeFakeDb();
  const res = await validateReservedStock(db as any, undefined, [buildResolvedItem()]);

  assert.ok(res);
  assert.equal(res.status, 409);
  const body = await res.json();
  assert.equal(body.code, "RESERVATION_REQUIRED");
});

test("passes when the variant is held in sufficient quantity", async () => {
  const db = makeFakeDb({
    inventory: [{ id: "inv-1", product_id: "prod-1", variant_id: "var-A" }],
    cart_reservations: [
      { session_id: SESSION, product_id: "prod-1", variant_id: "var-A", quantity: 2 },
    ],
  });
  const item = buildResolvedItem({ variantId: "var-A", quantity: 2 });

  const res = await validateReservedStock(db as any, SESSION, [item]);

  assert.equal(res, null);
});

test("rejects when the held quantity is below the ordered quantity", async () => {
  const db = makeFakeDb({
    inventory: [{ id: "inv-1", product_id: "prod-1", variant_id: "var-A" }],
    cart_reservations: [
      { session_id: SESSION, product_id: "prod-1", variant_id: "var-A", quantity: 1 },
    ],
  });
  const item = buildResolvedItem({ variantId: "var-A", quantity: 2 });

  const res = await validateReservedStock(db as any, SESSION, [item]);

  assert.ok(res);
  assert.equal(res.status, 409);
  const body = await res.json();
  assert.equal(body.code, "RESERVATION_EXPIRED");
});

test("does not let a reservation for a different variant satisfy the check", async () => {
  const db = makeFakeDb({
    inventory: [{ id: "inv-1", product_id: "prod-1", variant_id: "var-A" }],
    // Stock is held for var-B, but the cart line is var-A.
    cart_reservations: [
      { session_id: SESSION, product_id: "prod-1", variant_id: "var-B", quantity: 5 },
    ],
  });
  const item = buildResolvedItem({ variantId: "var-A", quantity: 2 });

  const res = await validateReservedStock(db as any, SESSION, [item]);

  assert.ok(res);
  assert.equal(res.status, 409);
  const body = await res.json();
  assert.equal(body.code, "RESERVATION_EXPIRED");
});

test("skips the check for products that have no inventory row", async () => {
  const db = makeFakeDb({ inventory: [], cart_reservations: [] });
  const item = buildResolvedItem({ variantId: "var-A", quantity: 4 });

  const res = await validateReservedStock(db as any, SESSION, [item]);

  assert.equal(res, null);
});

test("fails closed when the inventory lookup errors", async () => {
  const db = makeFakeDb({ tableErrors: { inventory: { message: "db unavailable" } } });
  const item = buildResolvedItem({ variantId: "var-A", quantity: 1 });

  const res = await validateReservedStock(db as any, SESSION, [item]);

  assert.ok(res);
  assert.equal(res.status, 409);
  const body = await res.json();
  assert.equal(body.code, "OUT_OF_STOCK");
});
