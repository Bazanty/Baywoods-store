"use client";

import { useState, useTransition } from "react";
import { createCoupon } from "../actions";
import { Plus } from "lucide-react";

export default function NewCouponForm() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    code: "",
    description: "",
    discountType: "percentage" as "percentage" | "fixed",
    discountValue: "",
    minimumOrder: "",
    maxUses: "",
    expiresAt: "",
  });

  const set = (field: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      try {
        await createCoupon({
          code: form.code,
          description: form.description,
          discountType: form.discountType,
          discountValue: Number(form.discountValue),
          minimumOrder: Number(form.minimumOrder) || 0,
          maxUses: form.maxUses ? Number(form.maxUses) : null,
          expiresAt: form.expiresAt || null,
        });
        setForm({
          code: "", description: "", discountType: "percentage",
          discountValue: "", minimumOrder: "", maxUses: "", expiresAt: "",
        });
        setOpen(false);
      } catch (err: any) {
        setError(err.message);
      }
    });
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-sm bg-ink text-cream px-5 py-2.5 hover:bg-ink/90 transition-colors"
      >
        <Plus size={14} />
        New Coupon
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-cream rounded p-6 space-y-4">
      <p className="text-sm font-medium text-ink">Create Coupon</p>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-muted block mb-1">Code</label>
          <input
            required
            value={form.code}
            onChange={set("code")}
            placeholder="SUMMER20"
            className="w-full border border-stone px-3 py-2 text-sm text-ink uppercase outline-none focus:border-ink"
          />
        </div>
        <div>
          <label className="text-xs text-muted block mb-1">Description</label>
          <input
            value={form.description}
            onChange={set("description")}
            placeholder="Summer sale 20% off"
            className="w-full border border-stone px-3 py-2 text-sm text-ink outline-none focus:border-ink"
          />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div>
          <label className="text-xs text-muted block mb-1">Type</label>
          <select
            value={form.discountType}
            onChange={set("discountType")}
            className="w-full border border-stone px-3 py-2 text-sm text-ink outline-none focus:border-ink"
          >
            <option value="percentage">Percentage</option>
            <option value="fixed">Fixed (KSh)</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-muted block mb-1">Value</label>
          <input
            required
            type="number"
            min="1"
            value={form.discountValue}
            onChange={set("discountValue")}
            placeholder={form.discountType === "percentage" ? "20" : "500"}
            className="w-full border border-stone px-3 py-2 text-sm text-ink outline-none focus:border-ink"
          />
        </div>
        <div>
          <label className="text-xs text-muted block mb-1">Min Order (KSh)</label>
          <input
            type="number"
            min="0"
            value={form.minimumOrder}
            onChange={set("minimumOrder")}
            placeholder="0"
            className="w-full border border-stone px-3 py-2 text-sm text-ink outline-none focus:border-ink"
          />
        </div>
        <div>
          <label className="text-xs text-muted block mb-1">Max Uses</label>
          <input
            type="number"
            min="1"
            value={form.maxUses}
            onChange={set("maxUses")}
            placeholder="Unlimited"
            className="w-full border border-stone px-3 py-2 text-sm text-ink outline-none focus:border-ink"
          />
        </div>
      </div>

      <div className="max-w-xs">
        <label className="text-xs text-muted block mb-1">Expires</label>
        <input
          type="date"
          value={form.expiresAt}
          onChange={set("expiresAt")}
          className="w-full border border-stone px-3 py-2 text-sm text-ink outline-none focus:border-ink"
        />
      </div>

      {error && <p className="text-xs text-danger">{error}</p>}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs border border-ink text-ink px-4 py-2 hover:bg-ink hover:text-cream transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="text-xs bg-ink text-cream px-4 py-2 hover:bg-forest-dark transition-colors disabled:opacity-50"
        >
          {isPending ? "Creating…" : "Create Coupon"}
        </button>
      </div>
    </form>
  );
}
