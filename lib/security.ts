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

export const SAFARICOM_CALLBACK_IP_LIST = [...SAFARICOM_CALLBACK_IPS];

export function isKnownSafaricomIp(ip: string | null): boolean {
  return !!ip && SAFARICOM_CALLBACK_IPS.has(ip);
}

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
  return isKnownSafaricomIp(ip);
}

// ---------------------------------------------------------------------------
// Rate limiter — Upstash Redis (production) with in-memory fallback (dev)
//
// Set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN in .env.local to use
// the Redis-backed sliding-window limiter across multiple serverless instances.
// Without those env vars the in-memory fallback is used, which is fine for
// local dev but resets on every cold start in production.
// ---------------------------------------------------------------------------

// --- In-memory fallback -------------------------------------------------
type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

function rateLimitInMemory(
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

// --- Upstash path -------------------------------------------------------
// Lazily instantiated so imports don't fail when the packages are absent
// or env vars are unset.

type RateLimitResult = { ok: boolean; remaining: number; retryAfter: number };

let upstashEnabled: boolean | null = null;
// Cache Ratelimit instances by "limit:windowMs" to avoid recreating per request.
const upstashLimiters = new Map<string, unknown>();

async function rateLimitUpstash(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  try {
    // Dynamic imports so the build doesn't break if the packages aren't installed.
    const { Ratelimit } = await import("@upstash/ratelimit");
    const { Redis } = await import("@upstash/redis");

    const cacheKey = `${limit}:${windowMs}`;
    if (!upstashLimiters.has(cacheKey)) {
      const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
      });
      const durationSecs = Math.max(1, Math.round(windowMs / 1000));
      upstashLimiters.set(
        cacheKey,
        new Ratelimit({
          redis,
          limiter: Ratelimit.slidingWindow(limit, `${durationSecs} s`),
          prefix: "bw_rl",
        })
      );
    }

    const limiter = upstashLimiters.get(cacheKey) as InstanceType<
      typeof Ratelimit
    >;
    const { success, remaining, reset } = await limiter.limit(key);
    const retryAfter = success ? 0 : Math.max(0, Math.ceil((reset - Date.now()) / 1000));
    return { ok: success, remaining, retryAfter };
  } catch (err) {
    // If Upstash is misconfigured or unreachable, fall back gracefully.
    console.warn("[rateLimit] Upstash error, falling back to in-memory:", err);
    return rateLimitInMemory(key, limit, windowMs);
  }
}

// --- Public API ---------------------------------------------------------

export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  if (upstashEnabled === null) {
    upstashEnabled = !!(
      process.env.UPSTASH_REDIS_REST_URL &&
      process.env.UPSTASH_REDIS_REST_TOKEN
    );
  }

  if (upstashEnabled) {
    return rateLimitUpstash(key, limit, windowMs);
  }

  return Promise.resolve(rateLimitInMemory(key, limit, windowMs));
}
