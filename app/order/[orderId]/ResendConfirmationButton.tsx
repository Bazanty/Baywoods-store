"use client";

import { useState } from "react";
import { Mail } from "lucide-react";

interface Props {
  orderId: string;
  token?: string;
}

export default function ResendConfirmationButton({ orderId, token }: Props) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleResend = async () => {
    setLoading(true);
    setMsg(null);
    try {
      const qs = token ? `?token=${encodeURIComponent(token)}` : "";
      const res = await fetch(`/api/orders/${orderId}/resend-confirmation${qs}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ type: "error", text: data.error ?? "Could not resend." });
      } else {
        setMsg({ type: "success", text: `Sent to ${data.email}` });
      }
    } catch {
      setMsg({ type: "error", text: "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleResend}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 font-mono text-[10px] tracking-[0.18em] uppercase border border-ink/30 text-ink hover:border-ink hover:bg-cream transition-colors disabled:opacity-50"
      >
        <Mail size={11} />
        {loading ? "Sending…" : "Resend confirmation email"}
      </button>
      {msg && (
        <p
          className={`font-mono text-[10px] tracking-[0.14em] uppercase border-l-2 pl-3 py-2 ${
            msg.type === "success" ? "text-ink border-citrine" : "text-danger border-danger"
          }`}
        >
          / {msg.text}
        </p>
      )}
    </div>
  );
}
