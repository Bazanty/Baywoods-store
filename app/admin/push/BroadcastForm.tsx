"use client";

import { useState, useTransition } from "react";
import { Send } from "lucide-react";
import { broadcastPush, type PushBroadcastSummary } from "../actions";

export default function BroadcastForm({ disabled }: { disabled: boolean }) {
  const [form, setForm] = useState({ title: "", body: "", url: "/" });
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<PushBroadcastSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    if (disabled) return;
    if (!confirm(`Send "${form.title || "(no title)"}" to every push subscriber?`)) return;

    startTransition(async () => {
      try {
        const summary = await broadcastPush(form);
        setResult(summary);
        setForm({ title: "", body: "", url: "/" });
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to send broadcast");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="border border-ink/15 bg-cream p-6 space-y-5 max-w-2xl">
      <div>
        <label className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted block mb-2">
          / Title
        </label>
        <input
          required
          maxLength={80}
          value={form.title}
          onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          placeholder="New drop — Spring 2026"
          className="w-full bg-beige border border-ink/20 text-ink text-sm px-3 py-2.5 outline-none focus:border-ink"
        />
        <p className="font-mono text-[9px] tracking-[0.14em] uppercase text-muted mt-1">
          {form.title.length} / 80
        </p>
      </div>

      <div>
        <label className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted block mb-2">
          / Body
        </label>
        <textarea
          required
          maxLength={240}
          rows={3}
          value={form.body}
          onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
          placeholder="Twelve new pieces are live. Tap to shop before they're gone."
          className="w-full bg-beige border border-ink/20 text-ink text-sm px-3 py-2.5 outline-none focus:border-ink resize-none"
        />
        <p className="font-mono text-[9px] tracking-[0.14em] uppercase text-muted mt-1">
          {form.body.length} / 240
        </p>
      </div>

      <div>
        <label className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted block mb-2">
          / Landing path
        </label>
        <input
          required
          pattern="^/.*"
          value={form.url}
          onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
          placeholder="/shop or /new-arrivals"
          className="w-full bg-beige border border-ink/20 text-ink text-sm px-3 py-2.5 outline-none focus:border-ink font-mono"
        />
        <p className="font-mono text-[9px] tracking-[0.14em] uppercase text-muted mt-1">
          / Must start with / — same-origin only.
        </p>
      </div>

      {error && (
        <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-danger">/ {error}</p>
      )}
      {result && (
        <div className="border border-ink/15 bg-beige p-4">
          <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink">
            / Sent · {result.delivered} delivered · {result.failed} failed · {result.pruned} pruned
          </p>
          <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted mt-1">
            {result.totalSubscribers} active subscriptions at send time.
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={disabled || isPending || !form.title.trim() || !form.body.trim()}
        className="bg-ink text-cream font-mono text-[11px] tracking-[0.18em] uppercase px-5 py-3 hover:bg-forest-dark disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
      >
        <Send size={12} />
        {isPending ? "Sending…" : "Send to everyone"}
      </button>
    </form>
  );
}
