// Critical flow: guest order lookups are gated by a signed access token.
// Without a valid owner session, the only way to read an order is a token that
// was issued for that exact order and has not expired or been tampered with.
import test from "node:test";
import assert from "node:assert/strict";

import { signOrderToken, verifyOrderToken } from "../lib/orderAccessToken";

// orderAccessToken reads the secret at call time (inside sign/verify), so
// setting it here — before any test body runs — is sufficient.
process.env.ORDER_TOKEN_SECRET = "unit-test-order-token-secret";

const ORDER_A = "11111111-1111-4111-8111-111111111111";
const ORDER_B = "22222222-2222-4222-8222-222222222222";

test("accepts a freshly signed token for its own order", () => {
  const token = signOrderToken(ORDER_A);
  assert.equal(verifyOrderToken(ORDER_A, token), true);
});

test("rejects a token issued for a different order", () => {
  const token = signOrderToken(ORDER_A);
  assert.equal(verifyOrderToken(ORDER_B, token), false);
});

test("rejects a token whose signature has been tampered with", () => {
  const token = signOrderToken(ORDER_A);
  const dot = token.indexOf(".");
  const tampered = token.slice(0, dot + 1) + "x" + token.slice(dot + 2);
  assert.equal(verifyOrderToken(ORDER_A, tampered), false);
});

test("rejects an expired token", () => {
  const expired = signOrderToken(ORDER_A, -1000); // already past its TTL
  assert.equal(verifyOrderToken(ORDER_A, expired), false);
});

test("rejects missing, empty, and malformed tokens", () => {
  assert.equal(verifyOrderToken(ORDER_A, null), false);
  assert.equal(verifyOrderToken(ORDER_A, undefined), false);
  assert.equal(verifyOrderToken(ORDER_A, ""), false);
  assert.equal(verifyOrderToken(ORDER_A, "not-a-real-token"), false);
});
