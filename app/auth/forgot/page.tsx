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
            <Link href="/" className="font-serif text-2xl tracking-wider text-ink block mb-10 text-center">
              BAYWOODS
            </Link>

            <Link
              href="/auth/signin"
              className="flex items-center gap-1.5 text-xs text-muted hover:text-ink transition-colors mb-6"
            >
              <ArrowLeft size={13} />
              Back to sign in
            </Link>

            <h1 className="font-serif text-3xl text-ink mb-2">Reset Password</h1>
            <p className="text-sm text-muted mb-8">
              Enter your email and we&apos;ll send you a reset link.
            </p>

            {sent ? (
              <div className="bg-forest/10 border border-forest/20 px-4 py-5 text-sm text-forest">
                <p className="font-medium mb-1">Check your inbox</p>
                <p className="text-forest/80">
                  A reset link was sent to <strong>{email}</strong>. It expires in 1 hour.
                </p>
                <button
                  type="button"
                  onClick={() => setSent(false)}
                  className="mt-4 text-xs font-medium text-forest underline underline-offset-2"
                >
                  Use a different email
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                />

                {error && (
                  <p className="text-xs text-danger bg-red-50 border border-red-100 px-3 py-2">
                    {error}
                  </p>
                )}

                <Button type="submit" loading={loading} className="w-full" size="lg">
                  Send Reset Link
                </Button>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
