import { createHmac, timingSafeEqual } from "crypto";

/**
 * M-Pesa payment helpers backed by Lipana.
 *
 * The storefront still uses the internal "mpesa" payment method and database
 * columns. This adapter maps Lipana's transaction IDs and webhook payloads into
 * the existing STK contract used by the checkout and reconciliation
 * code.
 *
 * Required env vars for live Lipana payments:
 *   LIPANA_SECRET_KEY
 *   LIPANA_WEBHOOK_SECRET
 *   LIPANA_ENVIRONMENT=sandbox|production
 *   LIPANA_WEBHOOK_URL=https://your-domain.vercel.app/api/mpesa/callback
 */

const LIPANA_PRODUCTION_BASE = "https://api.lipana.dev/v1";
const LIPANA_SANDBOX_BASE = "https://api-sandbox.lipana.dev/v1";

type LipanaEnvironment = "sandbox" | "production";

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function pickString(source: Record<string, unknown>, ...keys: string[]): string | null {
  for (const key of keys) {
    const value = source[key];
    if (value == null) continue;
    const text = String(value).trim();
    if (text) return text;
  }
  return null;
}

function pickNumber(source: Record<string, unknown>, ...keys: string[]): number | null {
  for (const key of keys) {
    const value = source[key];
    if (value == null || value === "") continue;
    const num = Number(value);
    if (Number.isFinite(num)) return num;
  }
  return null;
}

export function getLipanaEnvironment(): LipanaEnvironment {
  return process.env.LIPANA_ENVIRONMENT === "production" ? "production" : "sandbox";
}

export function getLipanaBaseUrl(): string {
  const override = process.env.LIPANA_BASE_URL?.trim();
  if (override) return override.replace(/\/+$/, "");
  return getLipanaEnvironment() === "production" ? LIPANA_PRODUCTION_BASE : LIPANA_SANDBOX_BASE;
}

export function isPaymentMockEnabled(): boolean {
  return process.env.LIPANA_MOCK === "true" || process.env.MPESA_MOCK === "true";
}

function getLipanaSecretKey(): string {
  const key = process.env.LIPANA_SECRET_KEY?.trim();
  if (!key) {
    throw new Error("LIPANA_SECRET_KEY is required for Lipana payments.");
  }
  return key;
}

async function lipanaFetch<T>(
  path: string,
  init: RequestInit & { idempotencyKey?: string } = {}
): Promise<T> {
  const { idempotencyKey, headers, ...requestInit } = init;
  const res = await fetch(`${getLipanaBaseUrl()}${path}`, {
    ...requestInit,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": "BaywoodsStore/1.0",
      "x-api-key": getLipanaSecretKey(),
      ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
      ...headers,
    },
    cache: "no-store",
  });

  const text = await res.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  if (!res.ok) {
    const data = asRecord(body);
    const message = data
      ? pickString(data, "message", "error", "detail") ?? text
      : text || res.statusText;
    throw new Error(`Lipana request failed (${res.status}): ${message}`);
  }

  const data = asRecord(body);
  return ((data && "data" in data ? data.data : body) ?? {}) as T;
}

/**
 * Normalize a Kenyan phone number to 254XXXXXXXXX format.
 * Accepts: 07XXXXXXXX, +254XXXXXXXXX, 254XXXXXXXXX
 */
export function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("254")) return digits;
  if (digits.startsWith("0")) return `254${digits.slice(1)}`;
  if (digits.startsWith("7") || digits.startsWith("1")) return `254${digits}`;
  return digits;
}

export interface StkPushResult {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseCode: string;
  ResponseDescription: string;
  CustomerMessage: string;
  LipanaTransactionID?: string;
  ProviderResponse?: unknown;
}

interface LipanaStkPushResponse {
  id?: string;
  _id?: string;
  transactionId?: string;
  checkoutRequestID?: string;
  checkoutRequestId?: string;
  checkout_request_id?: string;
  merchantRequestID?: string;
  merchantRequestId?: string;
  responseCode?: string;
  ResponseCode?: string;
  responseDescription?: string;
  ResponseDescription?: string;
  customerMessage?: string;
  CustomerMessage?: string;
  message?: string;
  status?: string;
}

export async function initiateStkPush(opts: {
  phone: string;
  amount: number;
  orderId: string;
  description: string;
}): Promise<StkPushResult> {
  const amount = Math.ceil(opts.amount);
  const response = await lipanaFetch<LipanaStkPushResponse>("/transactions/push-stk", {
    method: "POST",
    body: JSON.stringify({
      phone: `+${formatPhone(opts.phone)}`,
      amount,
      accountReference: `BW-${opts.orderId}`,
      transactionDesc: opts.description,
    }),
  });

  const transactionId =
    response.transactionId ?? response.id ?? response._id ?? response.merchantRequestID ?? response.merchantRequestId;
  const checkoutRequestId =
    response.checkoutRequestID ?? response.checkoutRequestId ?? response.checkout_request_id ?? transactionId;
  const responseCode = response.responseCode ?? response.ResponseCode ?? "0";
  const responseDescription =
    response.responseDescription ??
    response.ResponseDescription ??
    response.message ??
    "STK push initiated successfully.";
  const customerMessage =
    response.customerMessage ??
    response.CustomerMessage ??
    response.message ??
    "STK push sent to your phone. Please complete the payment on your phone.";

  if (!checkoutRequestId || !transactionId) {
    throw new Error("Lipana did not return a usable transaction ID.");
  }

  return {
    MerchantRequestID: transactionId,
    CheckoutRequestID: checkoutRequestId,
    ResponseCode: String(responseCode),
    ResponseDescription: responseDescription,
    CustomerMessage: customerMessage,
    LipanaTransactionID: transactionId,
    ProviderResponse: response,
  };
}

export interface NormalizedLipanaPayment {
  provider: "lipana";
  event: string | null;
  transactionId: string | null;
  merchantRequestId: string | null;
  checkoutRequestId: string | null;
  resultCode: string;
  resultDesc: string;
  receipt: string | null;
  phone: string | null;
  amount: number | null;
  status: string | null;
  raw: unknown;
}

export function lipanaStatusToResultCode(status: string | null, event?: string | null): string {
  const normalizedStatus = status?.toLowerCase() ?? "";
  const normalizedEvent = event?.toLowerCase() ?? "";

  if (
    normalizedEvent === "payment.success" ||
    normalizedStatus === "success" ||
    normalizedStatus === "paid" ||
    normalizedStatus === "completed"
  ) {
    return "0";
  }
  if (normalizedStatus === "cancelled" || normalizedStatus === "canceled") return "1032";
  if (
    normalizedEvent === "payment.failed" ||
    normalizedStatus === "failed" ||
    normalizedStatus === "error"
  ) {
    return "1";
  }
  return "";
}

function lipanaResultDescription(status: string | null, event: string | null): string {
  const normalizedStatus = status?.toLowerCase() ?? "";
  if (event === "payment.success" || normalizedStatus === "success" || normalizedStatus === "paid") {
    return "Lipana confirmed the M-Pesa payment.";
  }
  if (event === "payment.failed" || normalizedStatus === "failed" || normalizedStatus === "error") {
    return "Lipana reported that the M-Pesa payment failed.";
  }
  if (normalizedStatus === "cancelled" || normalizedStatus === "canceled") {
    return "M-Pesa payment was cancelled before completion.";
  }
  return "The request is being processed.";
}

export function normalizeLipanaPaymentPayload(payload: unknown): NormalizedLipanaPayment | null {
  const body = asRecord(payload);
  if (!body) return null;

  const data = asRecord(body.data) ?? body;
  const event = pickString(body, "event")?.toLowerCase() ?? null;
  const status = pickString(data, "status")?.toLowerCase() ?? pickString(body, "status")?.toLowerCase() ?? null;
  const transactionId = pickString(data, "transactionId", "transaction_id", "id", "_id");
  const checkoutRequestId = pickString(
    data,
    "checkoutRequestID",
    "checkoutRequestId",
    "checkout_request_id"
  );

  if (!event && !transactionId && !checkoutRequestId) return null;

  const resultCode = lipanaStatusToResultCode(status, event);
  const resultDesc =
    pickString(data, "resultDesc", "ResultDesc", "message", "responseDescription") ??
    lipanaResultDescription(status, event);

  return {
    provider: "lipana",
    event,
    transactionId,
    merchantRequestId: pickString(data, "merchantRequestID", "merchantRequestId") ?? transactionId,
    checkoutRequestId,
    resultCode,
    resultDesc,
    receipt: pickString(
      data,
      "mpesaReceiptNumber",
      "MpesaReceiptNumber",
      "mpesaReceipt",
      "mpesa_receipt",
      "receipt",
      "receiptNumber"
    ),
    phone: pickString(data, "phone", "msisdn", "PhoneNumber"),
    amount: pickNumber(data, "amount", "mpesaAmount", "mpesa_amount"),
    status,
    raw: payload,
  };
}

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
  transactionId?: string | null
): Promise<StkQueryResult> {
  const lookupId = (transactionId || checkoutRequestId).trim();
  if (!lookupId) throw new Error("Lipana transaction ID is required.");

  const transaction = await lipanaFetch<Record<string, unknown>>(
    `/transactions/${encodeURIComponent(lookupId)}`,
    { method: "GET" }
  );
  const normalized = normalizeLipanaPaymentPayload(transaction);

  if (!normalized) {
    throw new Error("Lipana returned an unrecognized transaction payload.");
  }

  return {
    ResponseCode: "0",
    ResponseDescription: "Lipana transaction retrieved successfully.",
    MerchantRequestID: normalized.merchantRequestId ?? lookupId,
    CheckoutRequestID: normalized.checkoutRequestId ?? checkoutRequestId,
    ResultCode: normalized.resultCode,
    ResultDesc: normalized.resultDesc,
    MpesaReceiptNumber: normalized.receipt,
    PhoneNumber: normalized.phone,
    Amount: normalized.amount,
    Raw: transaction,
  };
}

export function verifyLipanaWebhookSignature(
  payload: string,
  signature: string | null,
  secret = process.env.LIPANA_WEBHOOK_SECRET
): boolean {
  if (!signature || !secret) return false;

  const cleanSignature = signature.replace(/^sha256=/i, "").trim();
  const expectedSignature = createHmac("sha256", secret).update(payload).digest("hex");

  try {
    return timingSafeEqual(Buffer.from(cleanSignature), Buffer.from(expectedSignature));
  } catch {
    return false;
  }
}

// Lipana's public docs currently expose payouts, but not a receipt-specific
// reversal flow for refunding a specific receipt. Keep the admin auto-refund
// switch off until that flow is intentionally implemented.
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
  throw new Error("Lipana auto-refund is not implemented yet. Use the manual refund flow.");
}
