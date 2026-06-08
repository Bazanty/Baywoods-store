"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { supabase } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(Boolean(data.session));
      setCheckingSession(false);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (err) {
      setError(err.message);
    } else {
      setDone(true);
      setTimeout(() => router.push("/auth/signin"), 2500);
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

            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted mb-3">/ NEW PASSWORD</p>
            <h1 className="font-display font-medium text-4xl tracking-[-0.025em] leading-[0.96] text-ink mb-3">
              Choose a new one.
            </h1>
            <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted mb-8">/ Pick something strong.</p>

            {checkingSession ? (
              <div className="h-28 bg-beige-dark animate-pulse" />
            ) : !hasSession ? (
              <div className="border-l-2 border-danger pl-4 py-3">
                <p className="font-display text-lg tracking-[-0.01em] text-ink mb-2">Reset link expired.</p>
                <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted mb-4">
                  / Open the latest reset link from your email, or request a new one.
                </p>
                <Link href="/auth/forgot" className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink underline-citrine">
                  Request new link →
                </Link>
              </div>
            ) : done ? (
              <div className="border-l-2 border-citrine pl-4 py-3">
                <p className="font-display text-lg tracking-[-0.01em] text-ink mb-2">Password updated.</p>
                <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted">/ Redirecting to sign in…</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <Input
                    label="New Password"
                    type={showPw ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-0 bottom-3 text-muted hover:text-ink transition-colors"
                  >
                    {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <Input
                  label="Confirm password"
                  type={showPw ? "text" : "password"}
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repeat password"
                />

                {error && (
                  <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-danger border-l-2 border-danger pl-3 py-2">
                    / {error}
                  </p>
                )}

                <Button type="submit" loading={loading} className="w-full" size="lg">
                  Update password →
                </Button>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
