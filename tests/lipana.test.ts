import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";

import {
  formatPhone,
  lipanaStatusToResultCode,
  normalizeLipanaPaymentPayload,
  verifyLipanaWebhookSignature,
} from "../lib/mpesa";

test("verifies Lipana webhook signatures with HMAC SHA-256", () => {
  const secret = "test_webhook_secret";
  const payload = JSON.stringify({
    event: "payment.success",
    data: { transactionId: "TXN123", checkoutRequestID: "ws_CO_123" },
  });
  const signature = createHmac("sha256", secret).update(payload).digest("hex");

  assert.equal(verifyLipanaWebhookSignature(payload, signature, secret), true);
  assert.equal(verifyLipanaWebhookSignature(payload, "bad-signature", secret), false);
  assert.equal(verifyLipanaWebhookSignature(payload, `sha256=${signature}`, secret), true);
});

test("normalizes Lipana successful payment payloads", () => {
  const normalized = normalizeLipanaPaymentPayload({
    event: "payment.success",
    data: {
      transactionId: "TXN1234567890",
      status: "success",
      checkoutRequestID: "ws_CO_1912202310204401234567890",
      mpesaReceiptNumber: "RCP123",
      phone: "+254712345678",
      amount: 5000,
    },
  });

  assert.ok(normalized);
  assert.equal(normalized.resultCode, "0");
  assert.equal(normalized.transactionId, "TXN1234567890");
  assert.equal(normalized.checkoutRequestId, "ws_CO_1912202310204401234567890");
  assert.equal(normalized.receipt, "RCP123");
  assert.equal(normalized.phone, "+254712345678");
  assert.equal(normalized.amount, 5000);
});

test("maps Lipana terminal statuses to existing M-Pesa result codes", () => {
  assert.equal(lipanaStatusToResultCode("success"), "0");
  assert.equal(lipanaStatusToResultCode("failed"), "1");
  assert.equal(lipanaStatusToResultCode("cancelled"), "1032");
  assert.equal(lipanaStatusToResultCode("pending"), "");
});

test("keeps Kenyan phone normalization stable for checkout validation", () => {
  assert.equal(formatPhone("0712345678"), "254712345678");
  assert.equal(formatPhone("+254712345678"), "254712345678");
  assert.equal(formatPhone("712345678"), "254712345678");
});
