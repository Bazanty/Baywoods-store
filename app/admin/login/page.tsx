"use client";

import { useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Loader2, Eye, EyeOff } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);

  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPassword = password.trim();
    if (!cleanPassword) return;
    setError("");
    setLoading(true);

    const res = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: cleanPassword }),
    });

    setLoading(false);

    if (res.ok) {
      const from = params?.get("from") ?? "/admin";
      router.replace(from);
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error ?? "Incorrect password.");
      setPassword("");
      inputRef.current?.focus();
    }
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <span className="font-display text-xl tracking-[-0.02em] font-semibold text-ink">BAYWOODS</span>
          <p className="font-mono text-[10px] text-muted tracking-[0.2em] uppercase mt-2">/ Admin panel</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="border border-ink/20 px-8 py-10 space-y-5"
        >
          <div className="flex items-center justify-center w-10 h-10 bg-ink mx-auto mb-2">
            <Lock size={15} className="text-citrine" strokeWidth={1.75} />
          </div>

          <div>
            <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-muted mb-2">/ Admin password</p>
            <div className="relative border-b border-ink/30 focus-within:border-ink">
              <input
                ref={inputRef}
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                autoFocus
                className="w-full bg-transparent text-ink text-sm py-3 pr-8 outline-none placeholder:text-muted"
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                className="absolute right-0 top-1/2 -translate-y-1/2 text-muted hover:text-ink transition-colors"
                tabIndex={-1}
              >
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-danger border-l-2 border-danger pl-3 py-2">
              / {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full bg-ink text-cream font-mono text-[11px] tracking-[0.2em] uppercase py-3.5 hover:bg-forest-dark hover:text-citrine transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={12} className="animate-spin" />}
            {loading ? "Verifying…" : "Sign in →"}
          </button>
        </form>
      </div>
    </div>
  );
}
