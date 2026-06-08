/**
 * Recently viewed product tracking.
 *
 * Stores up to MAX_RECENT product slugs in localStorage. For logged-in users
 * the list is also mirrored to Supabase (see /api/recently-viewed) so it
 * follows them across devices.
 */

const KEY = "bw_recently_viewed_v1";
const MAX_RECENT = 12;

export interface RecentlyViewedEntry {
  slug: string;
  ts: number;
}

function read(): RecentlyViewedEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((e): e is RecentlyViewedEntry =>
        typeof e === "object" &&
        e !== null &&
        typeof (e as any).slug === "string" &&
        typeof (e as any).ts === "number"
      )
      .slice(0, MAX_RECENT);
  } catch {
    return [];
  }
}

function write(entries: RecentlyViewedEntry[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(entries.slice(0, MAX_RECENT)));
  } catch {
    // quota exceeded — best effort, ignore
  }
}

export function trackRecentlyViewed(slug: string) {
  if (!slug || typeof window === "undefined") return;
  const existing = read().filter((e) => e.slug !== slug);
  const next: RecentlyViewedEntry[] = [{ slug, ts: Date.now() }, ...existing].slice(0, MAX_RECENT);
  write(next);

  // Best-effort server sync for authed users. The endpoint silently ignores
  // anonymous requests and never blocks the page.
  if (typeof navigator !== "undefined" && navigator.sendBeacon) {
    try {
      const blob = new Blob([JSON.stringify({ slug })], { type: "application/json" });
      navigator.sendBeacon("/api/recently-viewed", blob);
    } catch {
      // ignore
    }
  }
}

export function getRecentlyViewedSlugs(): string[] {
  return read().map((e) => e.slug);
}

export function clearRecentlyViewed() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
