"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

interface Props {
  orderId: string;
  token?: string;
}

export default function CancelOrderButton({ orderId, token }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCancel = async () => {
    if (!window.confirm("Cancel this order? Your held stock will be released.")) return;
    setLoading(true);
    setError(null);
    try {
      const qs = token ? `?token=${encodeURIComponent(token)}` : "";
      const res = await fetch(`/api/orders/${orderId}/cancel${qs}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not cancel.");
        setLoading(false);
        return;
      }
      router.push("/account/orders");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleCancel}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 font-mono text-[10px] tracking-[0.18em] uppercase border border-danger/40 text-danger hover:bg-danger hover:text-cream transition-colors disabled:opacity-50"
      >
        <X size={11} />
        {loading ? "Cancelling…" : "Cancel order"}
      </button>
      {error && (
        <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-danger border-l-2 border-danger pl-3 py-2">
          / {error}
        </p>
      )}
    </div>
  );
}
