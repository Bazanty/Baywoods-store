import crypto from "node:crypto";

const DEFAULT_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

function getSecret(): string {
  const s =
    process.env.ORDER_TOKEN_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.ADMIN_SECRET_TOKEN ||
    "";
  return s;
}

export function signOrderToken(orderId: string, ttlMs = DEFAULT_TTL_MS): string {
  const secret = getSecret();
  if (!secret) throw new Error("ORDER_TOKEN_SECRET (or SUPABASE_SERVICE_ROLE_KEY) is not configured");
  const exp = Date.now() + ttlMs;
  const sig = crypto
    .createHmac("sha256", secret)
    .update(`${orderId}.${exp}`)
    .digest("base64url");
  return `${exp}.${sig}`;
}

export function verifyOrderToken(orderId: string, token: string | null | undefined): boolean {
  const secret = getSecret();
  if (!secret || !token) return false;
  const dot = token.indexOf(".");
  if (dot <= 0) return false;
  const expStr = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Date.now()) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${orderId}.${exp}`)
    .digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  try {
    return crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
