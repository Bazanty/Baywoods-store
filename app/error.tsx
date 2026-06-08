"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 bg-cream">
      <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-danger mb-6">/ ERROR · 500</p>
      <p className="font-display font-medium text-[clamp(6rem,16vw,12rem)] text-ink tracking-[-0.04em] leading-none select-none">
        Oops.
      </p>
      <h1 className="font-display text-3xl tracking-[-0.02em] text-ink mt-4 mb-4">Something went wrong.</h1>
      <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted max-w-sm mb-6">
        / Please try again, or contact support if it persists.
      </p>
      {error.digest && (
        <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-muted mb-6">
          / REF · <span className="text-ink">{error.digest}</span>
        </p>
      )}
      <div className="flex flex-wrap justify-center gap-3">
        <button onClick={reset} className="btn-primary">
          Try again →
        </button>
        <Link href="/" className="btn-outline">
          Go home
        </Link>
      </div>
    </div>
  );
}
