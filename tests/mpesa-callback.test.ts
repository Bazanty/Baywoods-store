// Daraja STK callbacks only run for requests originating from Safaricom's
// documented callback IP allowlist (see lib/security.ts isSafaricomIp).
//
// Note: the stock decrement itself lives in the `finalize_mpesa_payment` /
// `consume_reservations` Postgres functions and needs an integration database
// to exercise; it is out of scope for these unit tests.
import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";

import {
  isKnownSafaricomIp,
  isSafaricomIp,
  getClientIp,
  SAFARICOM_CALLBACK_IP_LIST,
} from "../lib/security";

const KNOWN_IP = SAFARICOM_CALLBACK_IP_LIST[0]!;

test("recognises Safaricom callback IPs and rejects everything else", () => {
  assert.ok(SAFARICOM_CALLBACK_IP_LIST.length > 0);
  assert.equal(isKnownSafaricomIp(KNOWN_IP), true);
  assert.equal(isKnownSafaricomIp("8.8.8.8"), false);
  assert.equal(isKnownSafaricomIp(null), false);
});

test("isSafaricomIp rejects unknown and missing IPs by default", () => {
  delete process.env.MPESA_SKIP_IP_CHECK;
  assert.equal(isSafaricomIp(null), false);
  assert.equal(isSafaricomIp("8.8.8.8"), false);
  assert.equal(isSafaricomIp(KNOWN_IP), true);
});

test("isSafaricomIp honours the MPESA_SKIP_IP_CHECK escape hatch", () => {
  const original = process.env.MPESA_SKIP_IP_CHECK;
  process.env.MPESA_SKIP_IP_CHECK = "true";
  try {
    assert.equal(isSafaricomIp("8.8.8.8"), true);
  } finally {
    if (original === undefined) delete process.env.MPESA_SKIP_IP_CHECK;
    else process.env.MPESA_SKIP_IP_CHECK = original;
  }
});

test("getClientIp reads the first hop of x-forwarded-for", () => {
  const req = new NextRequest("http://localhost/api/mpesa/callback", {
    headers: { "x-forwarded-for": "196.201.214.200, 10.0.0.1" },
  });
  assert.equal(getClientIp(req), "196.201.214.200");
});

test("getClientIp falls back to x-real-ip and to null", () => {
  const withReal = new NextRequest("http://localhost/api/mpesa/callback", {
    headers: { "x-real-ip": "196.201.213.44" },
  });
  assert.equal(getClientIp(withReal), "196.201.213.44");

  const noHeaders = new NextRequest("http://localhost/api/mpesa/callback");
  assert.equal(getClientIp(noHeaders), null);
});
