"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, Loader2 } from "lucide-react";

type Status =
  | "checking"
  | "unsupported"
  | "missing-key"
  | "denied"
  | "off"
  | "on"
  | "subscribing"
  | "unsubscribing";

function urlBase64ToArrayBuffer(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < rawData.length; i += 1) view[i] = rawData.charCodeAt(i);
  return buffer;
}

export default function PushToggle() {
  const [status, setStatus] = useState<Status>("checking");
  const [error, setError] = useState<string | null>(null);

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  useEffect(() => {
    let cancelled = false;

    async function init() {
      if (typeof window === "undefined") return;
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        if (!cancelled) setStatus("unsupported");
        return;
      }
      if (!publicKey) {
        if (!cancelled) setStatus("missing-key");
        return;
      }
      try {
        const registration = await navigator.serviceWorker.ready;
        const existing = await registration.pushManager.getSubscription();
        if (cancelled) return;

        const permission = Notification.permission;
        if (permission === "denied") {
          setStatus("denied");
          return;
        }
        setStatus(existing ? "on" : "off");
      } catch {
        if (!cancelled) setStatus("off");
      }
    }
    init();

    return () => {
      cancelled = true;
    };
  }, [publicKey]);

  const subscribe = async () => {
    setError(null);
    if (!publicKey) {
      setStatus("missing-key");
      return;
    }
    setStatus("subscribing");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "off");
        return;
      }
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToArrayBuffer(publicKey),
      });
      const res = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(subscription.toJSON()),
      });
      if (!res.ok) throw new Error("Save failed");
      setStatus("on");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not enable notifications");
      setStatus("off");
    }
  };

  const unsubscribe = async () => {
    setError(null);
    setStatus("unsubscribing");
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        }).catch(() => null);
        await subscription.unsubscribe();
      }
      setStatus("off");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not turn off notifications");
      setStatus("on");
    }
  };

  if (status === "checking") {
    return (
      <div className="border border-ink/15 bg-cream p-4 flex items-center gap-3">
        <Loader2 size={14} className="animate-spin text-muted" />
        <span className="font-mono text-[10px] tracking-[0.16em] uppercase text-muted">/ Checking browser…</span>
      </div>
    );
  }

  if (status === "unsupported") {
    return <StatusBox icon={<BellOff size={16} />} title="Not supported" hint="This browser doesn't support web push notifications." />;
  }

  if (status === "missing-key") {
    return (
      <StatusBox
        icon={<BellOff size={16} />}
        title="Push isn't configured"
        hint="Server missing NEXT_PUBLIC_VAPID_PUBLIC_KEY. Generate VAPID keys with `npx web-push generate-vapid-keys` and set them in the environment."
      />
    );
  }

  if (status === "denied") {
    return (
      <StatusBox
        icon={<BellOff size={16} />}
        title="Notifications blocked"
        hint="You blocked notifications for this site. Re-enable them from the browser's site settings, then refresh."
      />
    );
  }

  const enabled = status === "on" || status === "unsubscribing";
  const busy = status === "subscribing" || status === "unsubscribing";

  return (
    <div className="border border-ink/15 bg-cream p-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {enabled ? <Bell size={14} className="text-ink" /> : <BellOff size={14} className="text-muted" />}
            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-ink">
              / {enabled ? "Push: on" : "Push: off"}
            </p>
          </div>
          <p className="font-display text-sm text-ink/80">
            {enabled
              ? "We'll send a push for order updates, restocks, and new drops."
              : "Get notified about your orders, restocks, and new drops on this device."}
          </p>
        </div>
        {enabled ? (
          <button
            onClick={unsubscribe}
            disabled={busy}
            className="font-mono text-[10px] tracking-[0.18em] uppercase border border-ink/25 text-ink px-4 py-2 hover:bg-ink hover:text-cream transition-colors disabled:opacity-50"
          >
            {busy ? "Turning off…" : "Turn off"}
          </button>
        ) : (
          <button
            onClick={subscribe}
            disabled={busy}
            className="font-mono text-[10px] tracking-[0.18em] uppercase bg-ink text-cream px-4 py-2 hover:bg-forest-dark transition-colors disabled:opacity-50"
          >
            {busy ? "Enabling…" : "Enable push"}
          </button>
        )}
      </div>
      {error && (
        <p className="mt-3 font-mono text-[10px] tracking-[0.16em] uppercase text-danger">/ {error}</p>
      )}
    </div>
  );
}

function StatusBox({ icon, title, hint }: { icon: React.ReactNode; title: string; hint: string }) {
  return (
    <div className="border border-ink/15 bg-cream p-4">
      <div className="flex items-center gap-2 mb-1 text-muted">{icon}
        <p className="font-mono text-[10px] tracking-[0.2em] uppercase">/ {title}</p>
      </div>
      <p className="font-display text-sm text-ink/80">{hint}</p>
    </div>
  );
}
