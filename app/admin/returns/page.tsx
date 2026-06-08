import { getReturnRequests, isMpesaRefundConfigured } from "@/app/admin/actions";
import { formatPrice } from "@/lib/utils";
import ReturnActions from "./ReturnActions";

export const dynamic = "force-dynamic";

const statusTone: Record<string, string> = {
  requested: "border border-ink/30 text-ink",
  approved:  "bg-ink text-citrine",
  denied:    "bg-danger text-cream",
  received:  "border border-ink text-ink",
  refunded:  "bg-citrine text-ink",
};

const refundStatusTone: Record<string, string> = {
  pending: "border border-ink/30 text-ink",
  success: "bg-citrine text-ink",
  failed:  "bg-danger text-cream",
};

export default async function ReturnsPage() {
  const [requests, mpesaConfigured] = await Promise.all([
    getReturnRequests(),
    isMpesaRefundConfigured(),
  ]);
  const pending = requests.filter((r) => r.status === "requested").length;

  return (
    <div className="px-6 lg:px-10 py-10">
      <div className="border-b border-ink/15 pb-6 mb-8 max-w-5xl">
        <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted mb-3">
          <span className="text-ink">/</span> RETURNS
        </p>
        <div className="flex items-end justify-between flex-wrap gap-4">
          <h1 className="font-display font-medium tracking-[-0.025em] leading-[0.92] text-ink text-4xl sm:text-5xl">Return requests.</h1>
          <p className="font-mono text-[11px] tracking-[0.14em] uppercase">
            <span className="text-ink">{pending} pending</span>
            <span className="text-muted"> · {requests.length} total</span>
          </p>
        </div>
        <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted mt-3">
          / M-Pesa auto-refund: <span className={mpesaConfigured ? "text-ink" : "text-danger"}>{mpesaConfigured ? "configured" : "manual only"}</span>
        </p>
      </div>

      <div className="space-y-3 max-w-5xl">
        {requests.map((r, i) => (
          <div key={r.id} className="border border-ink/15 bg-cream p-5 grid md:grid-cols-[2fr_1fr_auto] gap-5 items-start">
            <div>
              <div className="flex items-center gap-3 mb-2 flex-wrap">
                <span className="font-mono text-[10px] tracking-[0.16em] text-muted">/{String(i + 1).padStart(2, "0")}</span>
                <span className="font-mono text-xs tracking-[0.06em] text-ink">#{r.orderId.slice(0, 8).toUpperCase()}</span>
                <span className={`font-mono text-[9px] uppercase tracking-[0.2em] px-2 py-0.5 ${statusTone[r.status] ?? "border border-ink/30 text-ink"}`}>
                  {r.status}
                </span>
                {r.refundStatus && (
                  <span className={`font-mono text-[9px] uppercase tracking-[0.2em] px-2 py-0.5 ${refundStatusTone[r.refundStatus] ?? "border border-ink/30 text-ink"}`}>
                    M-Pesa {r.refundStatus}
                  </span>
                )}
              </div>
              <p className="font-display text-base tracking-[-0.01em] text-ink">{r.customerName}</p>
              <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted">{r.email}</p>
              <p className="text-sm text-ink/75 mt-3 whitespace-pre-line">{r.reason}</p>
              {r.adminNote && (
                <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted mt-2">/ Note: {r.adminNote}</p>
              )}
              {r.refundReference && (
                <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink mt-2">
                  / Refund ref: <span className="text-citrine">{r.refundReference}</span>
                  {r.refundMethod && <span className="text-muted ml-2">({r.refundMethod === "mpesa_reversal" ? "auto" : "manual"})</span>}
                  {r.refundedAt && (
                    <span className="text-muted ml-2">
                      · {new Date(r.refundedAt).toLocaleDateString("en-KE", { day: "2-digit", month: "short", year: "numeric" })}
                    </span>
                  )}
                </p>
              )}
              {r.refundStatus === "failed" && r.refundFailureReason && (
                <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-danger border-l-2 border-danger pl-3 py-2 mt-2">
                  / Reversal failed: {r.refundFailureReason}
                </p>
              )}
              {r.refundStatus === "pending" && (
                <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted mt-2">
                  / Awaiting Safaricom confirmation. Inventory and order status will update on success.
                </p>
              )}
            </div>
            <div className="text-right md:text-right">
              <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-muted">/ Order total</p>
              <p className="font-display text-lg tracking-[-0.01em] text-ink tabular-nums">{formatPrice(r.orderTotal)}</p>
              <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted mt-2">
                {new Date(r.createdAt).toLocaleDateString("en-KE", { day: "2-digit", month: "short", year: "numeric" })}
              </p>
            </div>
            <ReturnActions id={r.id} status={r.status} mpesaRefundConfigured={mpesaConfigured} />
          </div>
        ))}

        {requests.length === 0 && (
          <div className="border border-ink/15 py-14 text-center font-mono text-[10px] tracking-[0.16em] uppercase text-muted">
            / No return requests yet.
          </div>
        )}
      </div>
    </div>
  );
}
