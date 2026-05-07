import { NextRequest } from "next/server";

// Safaricom Daraja documented egress IPs for STK callbacks.
// Keep this list in sync with https://developer.safaricom.co.ke docs.
const SAFARICOM_CALLBACK_IPS = new Set([
  "196.201.214.200",
  "196.201.214.206",
  "196.201.213.114",
  "196.201.214.207",
  "196.201.214.208",
  "196.201.213.44",
  "196.201.212.127",
  "196.201.212.129",
  "196.201.212.136",
  "196.201.212.138",
  "196.201.212.128",
  "196.201.212.122",
  "196.201.212.133",
]);

export function getClientIp(req: NextRequest): string | null {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return null;
}

export function isSafaricomIp(ip: string | null): boolean {
  if (!ip) return false;
  if (process.env.MPESA_SKIP_IP_CHECK === "true") return true;
  return SAFARICOM_CALLBACK_IPS.has(ip);
}

// Lightweight in-memory rate limiter.
// For multi-instance deployments swap this for Upstash Redis — same interface.
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { ok: boolean; remaining: number; retryAfter: number } {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfter: 0 };
  }

  if (existing.count >= limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfter: Math.ceil((existing.resetAt - now) / 1000),
    };
  }

  existing.count++;
  return { ok: true, remaining: limit - existing.count, retryAfter: 0 };
}

// Opportunistically prune expired buckets so the map can't grow unbounded.
setInterval(() => {
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt < now) buckets.delete(key);
  }
}, 60_000).unref?.();
