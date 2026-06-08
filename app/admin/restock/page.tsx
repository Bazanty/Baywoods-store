import Link from "next/link";
import { getRestockSubscribers, deleteRestockSubscriber } from "@/app/admin/actions";

export const dynamic = "force-dynamic";

export default async function RestockSubscribersPage() {
  let rows: Awaited<ReturnType<typeof getRestockSubscribers>> = [];
  let loadError = "";

  try {
    rows = await getRestockSubscribers();
  } catch (err) {
    loadError = err instanceof Error ? err.message : "Could not load restock subscribers.";
  }

  // Group by product for a tidier admin view.
  const groups = new Map<string, typeof rows>();
  for (const row of rows) {
    const key = row.productId;
    const bucket = groups.get(key) ?? [];
    bucket.push(row);
    groups.set(key, bucket);
  }

  const pending = rows.filter((r) => !r.notifiedAt).length;

  return (
    <div className="px-6 lg:px-10 py-10 max-w-5xl">
      <div className="border-b border-ink/15 pb-6 mb-8">
        <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted mb-3">
          <span className="text-ink">/</span> RESTOCK
        </p>
        <div className="flex items-end justify-between flex-wrap gap-4">
          <h1 className="font-display font-medium tracking-[-0.025em] leading-[0.92] text-ink text-4xl sm:text-5xl">
            Restock waitlist.
          </h1>
          <p className="font-mono text-[11px] tracking-[0.14em] uppercase">
            <span className="text-ink">{pending} waiting</span>
            <span className="text-muted"> · {rows.length} total</span>
          </p>
        </div>
      </div>

      {loadError && (
        <div className="mb-6 border border-danger/30 bg-cream p-5">
          <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-danger">
            / Restock subscriptions table missing
          </p>
          <p className="mt-2 font-mono text-[10px] tracking-[0.14em] uppercase text-muted">
            / Apply migration supabase/migrations/20260523120000_restock_subscriptions.sql.
          </p>
        </div>
      )}

      {!loadError && groups.size === 0 && (
        <div className="border border-ink/15 py-14 text-center font-mono text-[10px] tracking-[0.16em] uppercase text-muted">
          / No one is waiting on a restock right now.
        </div>
      )}

      <div className="space-y-6">
        {Array.from(groups.entries()).map(([productId, items], gi) => {
          const head = items[0];
          return (
            <div key={productId} className="border border-ink/15 bg-cream">
              <div className="flex items-baseline justify-between gap-3 px-5 py-4 border-b border-ink/15 flex-wrap">
                <div className="flex items-baseline gap-3 min-w-0">
                  <span className="font-mono text-[10px] tracking-[0.18em] text-muted">
                    /{String(gi + 1).padStart(2, "0")}
                  </span>
                  {head.productSlug ? (
                    <Link
                      href={`/product/${head.productSlug}`}
                      className="font-display text-lg tracking-[-0.01em] text-ink truncate hover:underline-citrine"
                    >
                      {head.productName}
                    </Link>
                  ) : (
                    <span className="font-display text-lg tracking-[-0.01em] text-ink truncate">
                      {head.productName}
                    </span>
                  )}
                </div>
                <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted">
                  {items.length} subscriber{items.length === 1 ? "" : "s"}
                </p>
              </div>
              <ul className="divide-y divide-ink/10">
                {items.map((s) => (
                  <li key={s.id} className="px-5 py-3 flex items-baseline justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <a
                        href={`mailto:${s.email}`}
                        className="font-mono text-sm tracking-[0.04em] text-ink underline-citrine"
                      >
                        {s.email}
                      </a>
                      {s.variantName && (
                        <span className="ml-3 font-mono text-[10px] tracking-[0.14em] uppercase text-muted">
                          {s.variantName}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted">
                        {s.notifiedAt
                          ? `notified ${new Date(s.notifiedAt).toLocaleDateString("en-KE", { day: "2-digit", month: "short" })}`
                          : `waiting since ${new Date(s.createdAt).toLocaleDateString("en-KE", { day: "2-digit", month: "short" })}`}
                      </span>
                      <form
                        action={async () => {
                          "use server";
                          await deleteRestockSubscriber(s.id);
                        }}
                      >
                        <button
                          type="submit"
                          className="font-mono text-[10px] tracking-[0.16em] uppercase text-muted hover:text-danger transition-colors"
                        >
                          Remove
                        </button>
                      </form>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
