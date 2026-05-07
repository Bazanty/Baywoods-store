"use client";

import { useState, useTransition } from "react";
import { updateOrderStatus } from "../actions";

const STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];

interface Props {
  orderId: string;
  currentStatus: string;
  currentTracking: string;
}

export default function OrderStatusControl({ orderId, currentStatus, currentTracking }: Props) {
  const [status, setStatus] = useState(currentStatus);
  const [tracking, setTracking] = useState(currentTracking);
  const [isPending, startTransition] = useTransition();
  const [msg, setMsg] = useState("");

  const dirty = status !== currentStatus || tracking !== currentTracking;

  const handleSave = () => {
    startTransition(async () => {
      try {
        await updateOrderStatus(orderId, status, tracking);
        setMsg("Updated");
        setTimeout(() => setMsg(""), 2000);
      } catch (e: any) {
        setMsg(e.message);
      }
    });
  };

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <select
        value={status}
        onChange={(e) => setStatus(e.target.value)}
        className="text-xs border border-stone bg-white px-2.5 py-1.5 text-ink outline-none focus:border-ink"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
        ))}
      </select>

      <input
        type="text"
        value={tracking}
        onChange={(e) => setTracking(e.target.value)}
        placeholder="Tracking number"
        className="text-xs border border-stone bg-white px-2.5 py-1.5 text-ink outline-none focus:border-ink w-40 placeholder:text-muted"
      />

      {dirty && (
        <button
          onClick={handleSave}
          disabled={isPending}
          className="text-xs bg-forest text-white px-3 py-1.5 hover:bg-forest-dark transition-colors disabled:opacity-50"
        >
          {isPending ? "Saving…" : "Save"}
        </button>
      )}

      {msg && (
        <span className="text-xs text-forest">{msg}</span>
      )}
    </div>
  );
}
