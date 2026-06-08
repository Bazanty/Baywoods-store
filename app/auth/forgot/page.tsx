"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useAuthStore } from "@/lib/authStore";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { resetPassword } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) return;
    setLoading(true);
    setError(null);
    const err = await resetPassword(normalizedEmail);
    setLoading(false);
    if (err) {
      setError(err);
    } else {
      setEmail(normalizedEmail);
      setSent(true);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16 flex items-center">
      <div className="container-px w-full">
        <div className="max-w-sm mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Link href="/" className="font-display text-xl tracking-[-0.02em] font-semibold text-ink block mb-12 text-center">
              BAYWOODS <span className="font-mono text-[10px] tracking-[0.18em] text-muted ml-1">/ NRB</span>
            </Link>

            <Link
              href="/auth/signin"
              className="flex items-center gap-1.5 font-mono text-[10px] tracking-[0.18em] uppercase text-muted hover:text-ink transition-colors mb-6"
            >
              <ArrowLeft size={11} />
              Back to sign in
            </Link>

            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted mb-3">/ RESET</p>
            <h1 className="font-display font-medium text-4xl tracking-[-0.025em] leading-[0.96] text-ink mb-3">
              Forgot password.
            </h1>
            <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted mb-8">
              / Enter your email — we&apos;ll send a reset link.
            </p>

            {sent ? (
              <div className="border-l-2 border-citrine pl-4 py-3">
                <p className="font-display text-lg tracking-[-0.01em] text-ink mb-2">Check your inbox.</p>
                <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted">
                  / Reset link sent to <strong className="text-ink">{email}</strong>. Expires in 1 hour.
                </p>
                <button
                  type="button"
                  onClick={() => setSent(false)}
                  className="mt-4 font-mono text-[10px] tracking-[0.18em] uppercase text-ink underline-citrine"
                >
                  Use a different email →
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <Input
                  label="Email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                />

                {error && (
                  <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-danger border-l-2 border-danger pl-3 py-2">
                    / {error}
                  </p>
                )}

                <Button type="submit" loading={loading} className="w-full" size="lg">
                  Send reset link →
                </Button>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
