"use client";

import { useState, useTransition } from "react";
import { Pencil, X, Check } from "lucide-react";
import { updateOrderShipping } from "@/app/admin/actions";
import { KENYA_COUNTIES } from "@/lib/kenya";

interface Props {
  orderId: string;
  editable: boolean;
  initial: {
    name: string;
    line1: string;
    city: string;
    state: string;
    postal: string;
    phone: string;
  };
}

export default function ShippingEditor({ orderId, editable, initial }: Props) {
  const [editing, setEditing] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(initial);

  const set = <K extends keyof typeof initial>(key: K, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSave = () =>
    start(async () => {
      setError(null);
      try {
        await updateOrderShipping(orderId, {
          name: form.name,
          line1: form.line1,
          city: form.city,
          state: form.state,
          postal: form.postal,
          phone: form.phone,
        });
        setEditing(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save.");
      }
    });

  if (!editing) {
    return (
      <div>
        {editable && (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink hover:text-citrine inline-flex items-center gap-1.5 mt-3"
          >
            <Pencil size={11} /> Edit address
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="mt-4 pt-4 border-t border-ink/15 space-y-2">
      <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted">/ Edit shipping</p>
      <input
        value={form.name}
        onChange={(e) => set("name", e.target.value)}
        placeholder="Recipient name"
        className="w-full text-sm border border-stone bg-cream px-2.5 py-1.5 text-ink outline-none focus:border-ink placeholder:text-muted"
      />
      <input
        value={form.line1}
        onChange={(e) => set("line1", e.target.value)}
        placeholder="Street address"
        className="w-full text-sm border border-stone bg-cream px-2.5 py-1.5 text-ink outline-none focus:border-ink placeholder:text-muted"
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          value={form.city}
          onChange={(e) => set("city", e.target.value)}
          placeholder="City"
          className="text-sm border border-stone bg-cream px-2.5 py-1.5 text-ink outline-none focus:border-ink placeholder:text-muted"
        />
        <select
          value={form.state}
          onChange={(e) => set("state", e.target.value)}
          className="text-sm border border-stone bg-cream px-2.5 py-1.5 text-ink outline-none focus:border-ink"
        >
          {KENYA_COUNTIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input
          value={form.postal}
          onChange={(e) => set("postal", e.target.value)}
          placeholder="Postal (optional)"
          className="text-sm border border-stone bg-cream px-2.5 py-1.5 text-ink outline-none focus:border-ink placeholder:text-muted"
        />
        <input
          value={form.phone}
          onChange={(e) => set("phone", e.target.value)}
          placeholder="Phone"
          className="text-sm border border-stone bg-cream px-2.5 py-1.5 text-ink outline-none focus:border-ink placeholder:text-muted"
        />
      </div>
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          disabled={pending}
          onClick={handleSave}
          className="flex-1 font-mono text-[10px] tracking-[0.18em] uppercase bg-ink text-citrine px-3 py-2 hover:bg-forest-dark transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
        >
          <Check size={11} />
          {pending ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={() => { setEditing(false); setForm(initial); setError(null); }}
          className="font-mono text-[10px] tracking-[0.18em] uppercase border border-ink/30 text-ink px-3 py-2 hover:border-ink transition-colors inline-flex items-center justify-center"
        >
          <X size={11} />
        </button>
      </div>
      {error && (
        <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-danger border-l-2 border-danger pl-3 py-2">
          / {error}
        </p>
      )}
    </div>
  );
}
