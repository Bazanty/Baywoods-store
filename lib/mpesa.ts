import { createHmac, timingSafeEqual } from "crypto";

/**
 * M-Pesa Daraja API (direct Safaricom integration).
 *
 * Required env vars for STK push:
 *   MPESA_CONSUMER_KEY
 *   MPESA_CONSUMER_SECRET
 *   MPESA_SHORTCODE        — Business ShortCode (must match the API credentials)
 *   MPESA_PASSKEY          — Lipa Na M-Pesa Online passkey from the Daraja portal
 *   MPESA_CALLBACK_URL     — Public HTTPS URL that Safaricom posts callbacks to
 *   MPESA_ENVIRONMENT      — "sandbox" | "production"  (default: sandbox)
 *
 * Manual fallback (active while live credentials are pending):
 *   NEXT_PUBLIC_MPESA_MANUAL=true   — show Buy Goods Till at checkout
 *   NEXT_PUBLIC_MPESA_TILL          — till number shown to customers
 */

const DARAJA_SANDBOX = "https://sandbox.safaricom.co.ke";
const DARAJA_PRODUCTION = "https://api.safaricom.co.ke";

export function getDarajaEnvironment(): "sandbox" | "production" {
  return process.env.MPESA_ENVIRONMENT === "production" ? "production" : "sandbox";
}

function getDarajaBaseUrl(): string {
  return getDarajaEnvironment() === "production" ? DARAJA_PRODUCTION : DARAJA_SANDBOX;
}

export function isPaymentMockEnabled(): boolean {
  return process.env.MPESA_MOCK === "true";
}

/**
 * When true, checkout shows a Buy Goods Till instead of triggering an STK push.
 * Customers pay and paste their confirmation code; an admin verifies it in
 * M-Pesa Business before marking the order PAID.
 * Flip to "false" to reactivate STK push once live Daraja credentials are ready.
 */
export function isManualMpesaEnabled(): boolean {
  return process.env.NEXT_PUBLIC_MPESA_MANUAL === "true";
}

export function getMpesaTill(): string {
  return process.env.NEXT_PUBLIC_MPESA_TILL?.trim() || "";
}

/**
 * Loose check for a customer-pasted M-Pesa code. Real codes are 10 uppercase
 * alphanumerics (e.g. "QJK3B7WCLP"); we accept 8-12 to tolerate format drift.
 * This is a sanity gate only — the admin still verifies before confirming.
 */
export function isLikelyMpesaCode(raw: string): boolean {
  return /^[A-Z0-9]{8,12}$/.test(raw.trim().toUpperCase());
}

/** Normalise a Kenyan number to 254XXXXXXXXX format. */
export function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("254")) return digits;
  if (digits.startsWith("0")) return `254${digits.slice(1)}`;
  if (digits.startsWith("7") || digits.startsWith("1")) return `254${digits}`;
  return digits;
}

// ---------------------------------------------------------------------------
// Internal Daraja helpers
// ---------------------------------------------------------------------------

function getDarajaTimestamp(): string {
  return new Date().toISOString().replace(/[-T:.Z]/g, "").slice(0, 14);
}

function getDarajaPassword(shortcode: string, passkey: string, timestamp: string): string {
  return Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");
}

async function getDarajaToken(): Promise<string> {
  const key = process.env.MPESA_CONSUMER_KEY?.trim();
  const secret = process.env.MPESA_CONSUMER_SECRET?.trim();
  if (!key || !secret) throw new Error("MPESA_CONSUMER_KEY and MPESA_CONSUMER_SECRET are required.");

  const creds = Buffer.from(`${key}:${secret}`).toString("base64");
  const res = await fetch(
    `${getDarajaBaseUrl()}/oauth/v1/generate?grant_type=client_credentials`,
    { headers: { Authorization: `Basic ${creds}` }, cache: "no-store" }
  );
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Daraja OAuth failed (${res.status}): ${text}`);
  }
  const data = await res.json();
  if (!data.access_token) throw new Error("Daraja OAuth: missing access_token in response.");
  return data.access_token as string;
}

// ---------------------------------------------------------------------------
// STK push
// ---------------------------------------------------------------------------

export interface StkPushResult {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
}

export async function initiateStkPush(opts: {
  phone: string;
  amount: number;
  orderId: string;
  description: string;
}): Promise<StkPushResult> {
  const shortcode = process.env.MPESA_SHORTCODE?.trim();
  const passkey = process.env.MPESA_PASSKEY?.trim();
  const callbackUrl = process.env.MPESA_CALLBACK_URL?.trim();
  const till = getMpesaTill() || shortcode;

  if (!shortcode || !passkey || !callbackUrl) {
    throw new Error("MPESA_SHORTCODE, MPESA_PASSKEY, and MPESA_CALLBACK_URL are required.");
  }

  const token = await getDarajaToken();
  const timestamp = getDarajaTimestamp();
  const password = getDarajaPassword(shortcode, passkey, timestamp);

  const res = await fetch(`${getDarajaBaseUrl()}/mpesa/stkpush/v1/processrequest`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerBuyGoodsOnline",
      Amount: Math.ceil(opts.amount),
      PartyA: opts.phone,
      PartyB: till,
      PhoneNumber: opts.phone,
      CallBackURL: callbackUrl,
      AccountReference: `BW-${opts.orderId}`,
      TransactionDesc: opts.description,
    }),
    cache: "no-store",
  });

  const data = await res.json();
  if (!res.ok || (data.ResponseCode !== undefined && String(data.ResponseCode) !== "0")) {
    const reason = data.ResponseDescription ?? data.errorMessage ?? data.errorCode ?? `HTTP ${res.status}`;
    throw new Error(`Daraja STK push failed: ${reason}`);
  }

  return {
    MerchantRequestID: String(data.MerchantRequestID ?? ""),
    CheckoutRequestID: String(data.CheckoutRequestID ?? ""),
    ResponseCode: String(data.ResponseCode ?? "0"),
    ResponseDescription: String(data.ResponseDescription ?? ""),
    CustomerMessage: String(data.CustomerMessage ?? "Check your phone and enter your M-Pesa PIN."),
  };
}

// ---------------------------------------------------------------------------
// STK status query
// ---------------------------------------------------------------------------

export interface StkQueryResult {
  ResponseCode: string;
  ResponseDescription: string;
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResultCode: string;
  ResultDesc: string;
  MpesaReceiptNumber?: string | null;
  PhoneNumber?: string | null;
  Amount?: number | null;
  Raw?: unknown;
}

export async function queryStkPush(
  checkoutRequestId: string,
  _merchantRequestId?: string | null
): Promise<StkQueryResult> {
  const shortcode = process.env.MPESA_SHORTCODE?.trim();
  const passkey = process.env.MPESA_PASSKEY?.trim();
  if (!shortcode || !passkey) throw new Error("MPESA_SHORTCODE and MPESA_PASSKEY are required.");

  const token = await getDarajaToken();
  const timestamp = getDarajaTimestamp();
  const password = getDarajaPassword(shortcode, passkey, timestamp);

  const res = await fetch(`${getDarajaBaseUrl()}/mpesa/stkpushquery/v1/query`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId,
    }),
    cache: "no-store",
  });

  const data = await res.json();
  return {
    ResponseCode: String(data.ResponseCode ?? ""),
    ResponseDescription: String(data.ResponseDescription ?? ""),
    MerchantRequestID: String(data.MerchantRequestID ?? ""),
    CheckoutRequestID: String(data.CheckoutRequestID ?? checkoutRequestId),
    ResultCode: String(data.ResultCode ?? ""),
    ResultDesc: String(data.ResultDesc ?? ""),
    Raw: data,
  };
}

// ---------------------------------------------------------------------------
// Reversal (not yet implemented)
// ---------------------------------------------------------------------------

export function isReversalConfigured(): boolean {
  return false;
}

export interface ReversalResult {
  OriginatorConversationID: string;
  ConversationID: string;
  ResponseCode: string;
  ResponseDescription: string;
}

export async function initiateReversal(_opts: {
  receipt: string;
  amount: number;
  remarks?: string;
  orderId?: string;
}): Promise<ReversalResult> {
  throw new Error("Daraja auto-reversal is not implemented yet. Use the manual refund flow.");
}

// ---------------------------------------------------------------------------
// Webhook signature verification (kept for reference; Daraja uses IP allowlist
// rather than HMAC — see lib/security.ts isSafaricomIp)
// ---------------------------------------------------------------------------

export function verifyDarajaWebhookSecret(
  headerSecret: string | null,
  expectedSecret = process.env.MPESA_WEBHOOK_SECRET
): boolean {
  if (!headerSecret || !expectedSecret) return false;
  try {
    return timingSafeEqual(Buffer.from(headerSecret), Buffer.from(expectedSecret));
  } catch {
    return false;
  }
}
