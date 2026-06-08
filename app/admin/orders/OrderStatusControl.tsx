"use client";

import { useState, useTransition } from "react";
import { updateOrderStatus } from "../actions";
import { ORDER_STATUSES, orderStatusLabel, normalizeOrderStatus } from "@/lib/orderStatus";

interface Props {
  orderId: string;
  currentStatus: string;
  currentTracking: string;
}

export default function OrderStatusControl({ orderId, currentStatus, currentTracking }: Props) {
  const [status, setStatus] = useState(normalizeOrderStatus(currentStatus));
  const [tracking, setTracking] = useState(currentTracking);
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const needsTracking = status === "OUT_FOR_DELIVERY" && !tracking.trim();
  const dirty = status !== normalizeOrderStatus(currentStatus) || tracking !== currentTracking;

  const handleSave = () => {
    if (needsTracking) return;

    startTransition(async () => {
      try {
        await updateOrderStatus(orderId, status, tracking);
        const notified = (status === "OUT_FOR_DELIVERY" || status === "DELIVERED") && tracking.trim();
        setMsg({ text: notified ? "Saved - customer notified" : "Saved", ok: true });
        setTimeout(() => setMsg(null), 3000);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Failed to save";
        setMsg({ text: message, ok: false });
      }
    });
  };

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <select
        value={status}
        onChange={(e) => setStatus(normalizeOrderStatus(e.target.value))}
        className="text-xs border border-stone bg-cream px-2.5 py-1.5 text-ink outline-none focus:border-ink"
      >
        {ORDER_STATUSES.map((s) => (
          <option key={s} value={s}>{orderStatusLabel(s)}</option>
        ))}
      </select>

      <div className="flex flex-col gap-0.5">
        <input
          type="text"
          value={tracking}
          onChange={(e) => setTracking(e.target.value)}
          placeholder="Tracking number"
          className={`text-xs border bg-cream px-2.5 py-1.5 text-ink outline-none w-44 placeholder:text-muted ${
            needsTracking ? "border-amber-400 focus:border-amber-500" : "border-stone focus:border-ink"
          }`}
        />
        {needsTracking && (
          <p className="text-[10px] text-amber-600">Required to notify customer</p>
        )}
      </div>

      {dirty && (
        <button
          onClick={handleSave}
          disabled={isPending || needsTracking}
          className="text-xs bg-ink text-cream px-3 py-1.5 hover:bg-forest-dark transition-colors disabled:opacity-40"
        >
          {isPending ? "Saving..." : "Save"}
        </button>
      )}

      {msg && (
        <span className={`text-xs ${msg.ok ? "text-forest" : "text-danger"}`}>
          {msg.text}
        </span>
      )}
    </div>
  );
}
