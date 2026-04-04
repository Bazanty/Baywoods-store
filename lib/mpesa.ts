/**
 * Safaricom Daraja API helpers.
 * Supports both sandbox and production based on NODE_ENV.
 *
 * Required env vars:
 *   MPESA_CONSUMER_KEY
 *   MPESA_CONSUMER_SECRET
 *   MPESA_SHORTCODE        – Till or Paybill number
 *   MPESA_PASSKEY          – Lipa Na M-Pesa passkey (from Daraja portal)
 *   MPESA_CALLBACK_URL     – Public HTTPS URL Safaricom POSTs results to
 */

const BASE =
  process.env.NODE_ENV === "production"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";

// Safaricom sandbox test credentials — only used when NODE_ENV !== "production"
const SANDBOX_SHORTCODE = "174379";
const SANDBOX_PASSKEY = "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919";

export async function getAccessToken(): Promise<string> {
  const key = process.env.MPESA_CONSUMER_KEY!;
  const secret = process.env.MPESA_CONSUMER_SECRET!;
  const credentials = Buffer.from(`${key}:${secret}`).toString("base64");

  const res = await fetch(
    `${BASE}/oauth/v1/generate?grant_type=client_credentials`,
    {
      method: "GET",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        "User-Agent": "BaywoodsStore/1.0",
      },
      cache: "no-store",
    }
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`M-Pesa auth failed: ${body}`);
  }

  const data = await res.json();
  return data.access_token as string;
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
}

export async function initiateStkPush(opts: {
  phone: string;
  amount: number;
  orderId: string;
  description: string;
}): Promise<StkPushResult> {
  const token = await getAccessToken();
  const isProd = process.env.NODE_ENV === "production";
  const shortcode = isProd ? process.env.MPESA_SHORTCODE! : SANDBOX_SHORTCODE;
  const passkey = isProd ? process.env.MPESA_PASSKEY! : SANDBOX_PASSKEY;
  const callbackUrl = process.env.MPESA_CALLBACK_URL!;

  const timestamp = new Date()
    .toISOString()
    .replace(/[^0-9]/g, "")
    .slice(0, 14);
  const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");

  // Sandbox only supports CustomerPayBillOnline; production Till uses CustomerBuyGoodsOnline
  const transactionType = isProd ? "CustomerBuyGoodsOnline" : "CustomerPayBillOnline";

  const body = {
    BusinessShortCode: shortcode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: transactionType,
    Amount: Math.ceil(opts.amount),
    PartyA: formatPhone(opts.phone),
    PartyB: shortcode,
    PhoneNumber: formatPhone(opts.phone),
    CallBackURL: callbackUrl,
    AccountReference: `BW-${opts.orderId}`,
    TransactionDesc: opts.description.slice(0, 13),
  };

  const res = await fetch(`${BASE}/mpesa/stkpush/v1/processrequest`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": "BaywoodsStore/1.0",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`STK push failed: ${err}`);
  }

  return res.json();
}

export interface StkQueryResult {
  ResponseCode: string;
  ResponseDescription: string;
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResultCode: string;
  ResultDesc: string;
}

export async function queryStkPush(checkoutRequestId: string): Promise<StkQueryResult> {
  const token = await getAccessToken();
  const isProd = process.env.NODE_ENV === "production";
  const shortcode = isProd ? process.env.MPESA_SHORTCODE! : SANDBOX_SHORTCODE;
  const passkey = isProd ? process.env.MPESA_PASSKEY! : SANDBOX_PASSKEY;

  const timestamp = new Date()
    .toISOString()
    .replace(/[^0-9]/g, "")
    .slice(0, 14);
  const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");

  const res = await fetch(`${BASE}/mpesa/stkpushquery/v1/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "User-Agent": "BaywoodsStore/1.0",
    },
    body: JSON.stringify({
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`STK query failed: ${err}`);
  }

  return res.json();
}
