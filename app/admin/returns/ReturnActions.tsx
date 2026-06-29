"use client";

import { useState, useTransition } from "react";
import { actionReturnRequest } from "@/app/admin/actions";

interface Props {
  id: string;
  status: string;
  refundStatus: string | null;
  mpesaRefundConfigured: boolean;
}

export default function ReturnActions({ id, status, refundStatus, mpesaRefundConfigured }: Props) {
  const [pending, start] = useTransition();
  const [note, setNote] = useState("");
  const [refundRef, setRefundRef] = useState("");
  const [mode, setMode] = useState<"none" | "manual">("none");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const run = (
    action: "approve" | "deny" | "received" | "refund-manual" | "refund-auto"
  ) =>
    start(async () => {
      setError(null);
      try {
        if (action === "refund-manual" && refundRef.trim().length < 3) {
          setError("Add the M-Pesa reversal ID or receipt note.");
          return;
        }
        await actionReturnRequest(
          id,
          action,
          note.trim() || undefined,
          action === "refund-manual" ? refundRef.trim() : undefined
        );
        setDone(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed.");
      }
    });

  if (done) {
    return <p className="text-xs text-forest">Done</p>;
  }

  return (
    <div className="flex flex-col gap-2 md:items-end">
      {status === "requested" && (
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Admin note (optional)"
          rows={2}
          className="text-xs border border-stone bg-cream px-2.5 py-1.5 text-ink outline-none focus:border-ink resize-none w-48 placeholder:text-muted"
        />
      )}

      {status === "requested" && (
        <>
          <button
            disabled={pending}
            onClick={() => run("approve")}
            className="w-full px-3 py-1.5 text-xs bg-ink text-cream disabled:opacity-50 hover:bg-forest-dark transition-colors"
          >
            {pending ? "…" : "Approve"}
          </button>
          <button
            disabled={pending}
            onClick={() => run("deny")}
            className="w-full px-3 py-1.5 text-xs border border-stone text-ink disabled:opacity-50 hover:border-ink transition-colors"
          >
            {pending ? "…" : "Deny"}
          </button>
        </>
      )}

      {status === "approved" && (
        <button
          disabled={pending}
          onClick={() => run("received")}
          className="px-3 py-1.5 text-xs bg-cobalt text-cream disabled:opacity-50 hover:opacity-90 transition-colors"
        >
          {pending ? "…" : "Mark received"}
        </button>
      )}

      {status === "received" && mode === "none" && (
        <>
          {mpesaRefundConfigured && (
            <button
              disabled={pending}
              onClick={() => run("refund-auto")}
              className="w-full px-3 py-1.5 text-xs bg-ink text-citrine disabled:opacity-50 hover:bg-forest-dark transition-colors"
            >
              {pending ? "Sending…" : "Auto-refund via M-Pesa"}
            </button>
          )}
          <button
            disabled={pending}
            onClick={() => setMode("manual")}
            className="w-full px-3 py-1.5 text-xs border border-stone text-ink disabled:opacity-50 hover:border-ink transition-colors"
          >
            Record manual refund
          </button>
          {!mpesaRefundConfigured && (
            <p className="text-[10px] text-muted w-48 text-right leading-snug">
              Auto-refund via Daraja is not configured yet. Use manual refund recording.
            </p>
          )}
        </>
      )}

      {/* Retry section — shown when the provider accepted the request but the async
          callback came back with a failure. The server action allows retrying
          in this state (refund_status: failed, status: refunded). */}
      {status === "refunded" && refundStatus === "failed" && mpesaRefundConfigured && (
        <button
          disabled={pending}
          onClick={() => run("refund-auto")}
          className="w-full px-3 py-1.5 text-xs bg-danger text-cream disabled:opacity-50 hover:opacity-85 transition-colors"
        >
          {pending ? "Retrying…" : "Retry auto-refund"}
        </button>
      )}

      {status === "received" && mode === "manual" && (
        <>
          <input
            type="text"
            value={refundRef}
            onChange={(e) => setRefundRef(e.target.value)}
            placeholder="M-Pesa reversal ID / note"
            className="text-xs border border-stone bg-cream px-2.5 py-1.5 text-ink outline-none focus:border-ink w-48 placeholder:text-muted"
          />
          <div className="flex gap-1 w-full">
            <button
              disabled={pending}
              onClick={() => run("refund-manual")}
              className="flex-1 px-3 py-1.5 text-xs bg-ink text-citrine disabled:opacity-50 hover:bg-forest-dark transition-colors"
            >
              {pending ? "…" : "Save manual refund"}
            </button>
            <button
              onClick={() => { setMode("none"); setError(null); }}
              className="px-3 py-1.5 text-xs border border-stone text-muted hover:text-ink transition-colors"
            >
              Back
            </button>
          </div>
        </>
      )}

      {error && <p className="text-[10px] text-danger w-48 text-right">{error}</p>}
    </div>
  );
}
