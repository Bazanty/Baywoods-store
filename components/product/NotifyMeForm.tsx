"use client";

import { useEffect, useState } from "react";
import { Bell, Check } from "lucide-react";
import { useAuthStore } from "@/lib/authStore";

interface Props {
  productId: string;
  variantId?: string | null;
  compact?: boolean;
}

export default function NotifyMeForm({ productId, variantId, compact }: Props) {
  const user = useAuthStore((s) => s.user);
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user?.email && !email) setEmail(user.email);
  }, [user, email]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || status === "submitting") return;

    setStatus("submitting");
    setMessage(null);
    try {
      const res = await fetch("/api/restock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, variantId: variantId ?? null, email: email.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus("error");
        setMessage(data?.error ?? "Could not save subscription");
        return;
      }
      setStatus("success");
      setMessage(data.alreadySubscribed ? "You're already on the list." : "We'll email you the moment it's back.");
    } catch {
      setStatus("error");
      setMessage("Network error — please try again.");
    }
  };

  if (status === "success") {
    return (
      <div className={`${compact ? "p-3" : "p-4"} border border-ink/15 bg-beige flex items-start gap-3`}>
        <Check size={16} className="text-citrine bg-ink shrink-0 mt-0.5" />
        <div className="min-w-0">
          <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink">On the list</p>
          <p className="font-display text-sm text-ink mt-1">{message}</p>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className={`${compact ? "p-3" : "p-4"} border border-ink/15 bg-beige flex flex-col gap-3`}
    >
      <div className="flex items-center gap-2">
        <Bell size={14} className="text-ink" />
        <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink">/ Notify me when back</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="flex-1 bg-cream border border-ink/20 text-ink text-sm px-3 py-2.5 focus:border-ink outline-none"
          autoComplete="email"
        />
        <button
          type="submit"
          disabled={status === "submitting"}
          className="bg-ink text-cream font-mono text-[11px] tracking-[0.18em] uppercase px-5 py-2.5 hover:bg-forest-dark disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {status === "submitting" ? "Saving…" : "Notify me"}
        </button>
      </div>
      {status === "error" && message && (
        <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-danger">{message}</p>
      )}
      {status !== "error" && (
        <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted">
          / One email when it&apos;s back — no marketing.
        </p>
      )}
    </form>
  );
}
