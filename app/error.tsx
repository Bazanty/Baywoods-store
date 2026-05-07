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
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 bg-beige">
      <p className="text-[10px] font-semibold tracking-[0.25em] uppercase text-danger mb-3">
        Something went wrong
      </p>
      <h1 className="font-serif text-4xl text-ink mb-4">Unexpected Error</h1>
      <p className="text-sm text-muted max-w-sm mb-8">
        We hit an unexpected error. Please try again, or contact support if the problem persists.
      </p>
      {error.digest && (
        <p className="text-[11px] text-muted mb-5">Reference: {error.digest}</p>
      )}
      <div className="flex flex-wrap justify-center gap-3">
        <button
          onClick={reset}
          className="px-6 py-3 bg-forest text-white text-sm font-medium hover:bg-forest-dark transition-colors"
        >
          Try Again
        </button>
        <Link href="/" className="px-6 py-3 border border-stone text-sm font-medium text-ink hover:border-ink transition-colors">
          Go Home
        </Link>
      </div>
    </div>
  );
}
