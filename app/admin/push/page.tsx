import { getPushBroadcastStatus, getRecentPushBroadcasts } from "../actions";
import BroadcastForm from "./BroadcastForm";

export const dynamic = "force-dynamic";

function formatSentAt(value: string) {
  return new Date(value).toLocaleString("en-KE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminPushPage() {
  const [{ configured, totalSubscribers }, history] = await Promise.all([
    getPushBroadcastStatus(),
    getRecentPushBroadcasts(20),
  ]);

  return (
    <div className="px-6 lg:px-10 py-10 max-w-4xl">
      <div className="border-b border-ink/15 pb-6 mb-8">
        <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted mb-3">
          <span className="text-ink">/</span> PUSH
        </p>
        <div className="flex items-end justify-between flex-wrap gap-4">
          <h1 className="font-display font-medium tracking-[-0.025em] leading-[0.92] text-ink text-4xl sm:text-5xl">
            Push broadcast.
          </h1>
          <p className="font-mono text-[11px] tracking-[0.14em] uppercase">
            <span className="text-ink">{totalSubscribers} subscriber{totalSubscribers === 1 ? "" : "s"}</span>
            <span className="text-muted"> · {configured ? "VAPID configured" : "VAPID missing"}</span>
          </p>
        </div>
      </div>

      {!configured && (
        <div className="mb-6 border border-danger/30 bg-cream p-5">
          <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-danger">
            / Web Push isn&apos;t configured
          </p>
          <p className="mt-2 font-mono text-[10px] tracking-[0.14em] uppercase text-muted leading-relaxed">
            / Run <span className="text-ink">npx web-push generate-vapid-keys</span> and set
            <span className="text-ink"> NEXT_PUBLIC_VAPID_PUBLIC_KEY</span>,
            <span className="text-ink"> VAPID_PRIVATE_KEY</span>, and
            <span className="text-ink"> VAPID_SUBJECT</span> in the environment. Apply the
            <span className="text-ink"> 20260523140000_push_subscriptions.sql</span> migration so the
            <span className="text-ink"> push_subscriptions</span> table exists.
          </p>
        </div>
      )}

      <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-muted mb-6 max-w-2xl">
        / Sends a single notification to every active subscription. Order and restock
        notifications fire automatically — use this for drops and sales.
      </p>

      <BroadcastForm disabled={!configured || totalSubscribers === 0} />

      <div className="mt-12">
        <div className="border-b border-ink/15 pb-3 mb-4 flex items-center justify-between">
          <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink">/ Recent broadcasts</p>
          <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted">
            {history.length} shown
          </span>
        </div>

        {history.length === 0 ? (
          <div className="border border-ink/15 py-10 text-center font-mono text-[10px] tracking-[0.16em] uppercase text-muted">
            / Nothing sent yet.
          </div>
        ) : (
          <ul className="border border-ink/15 divide-y divide-ink/10">
            {history.map((b: any, i: number) => (
              <li key={b.id} className="px-5 py-4 bg-cream">
                <div className="flex items-baseline justify-between gap-4 flex-wrap">
                  <div className="flex items-baseline gap-3 min-w-0">
                    <span className="font-mono text-[10px] tracking-[0.16em] text-muted shrink-0">
                      /{String(i + 1).padStart(2, "0")}
                    </span>
                    <p className="font-display text-base tracking-[-0.01em] text-ink truncate">{b.title}</p>
                  </div>
                  <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted shrink-0">
                    {formatSentAt(b.sent_at)}
                  </p>
                </div>
                <p className="text-sm text-ink/75 leading-relaxed mt-2">{b.body}</p>
                <div className="flex items-center gap-x-5 gap-y-1 flex-wrap mt-3 font-mono text-[10px] tracking-[0.14em] uppercase">
                  <span className="text-ink">Delivered <span className="text-citrine">{b.delivered}</span></span>
                  {b.failed > 0 && <span className="text-danger">Failed {b.failed}</span>}
                  {b.pruned > 0 && <span className="text-muted">Pruned {b.pruned}</span>}
                  {b.url && b.url !== "/" && (
                    <span className="text-muted">/ Linked to <span className="text-ink">{b.url}</span></span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
