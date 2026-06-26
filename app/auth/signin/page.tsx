"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useAuthStore } from "@/lib/authStore";

// Only surface Google sign-in once the Supabase Google provider is configured
// with a valid Client ID/secret. Flip NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true after
// setup so users never hit Google's "invalid_client" dead end.
const GOOGLE_AUTH_ENABLED = process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === "true";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The Google block depends on a build-time NEXT_PUBLIC_* flag whose value can
  // differ between the server runtime and the client bundle. Defer it to after
  // mount so the server HTML and first client render always match (no hydration
  // mismatch); it then appears once mounted on the client.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const { signIn, signInWithOAuth, loading } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const err = await signIn(email, password);
    if (err) {
      setError(err);
    } else {
      router.push("/account");
    }
  };

  const handleOAuth = async (provider: "google") => {
    setError(null);
    const err = await signInWithOAuth(provider);
    if (err) setError(err);
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

            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted mb-3">/ 01 — SIGN IN</p>
            <h1 className="font-display font-medium text-4xl tracking-[-0.025em] leading-[0.96] text-ink mb-3">
              Welcome back.
            </h1>
            <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted mb-8">
              / No account?{" "}
              <Link href="/auth/signup" className="text-ink underline-citrine">
                Sign up →
              </Link>
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="Email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
              />
              <div className="relative">
                <Input
                  label="Password"
                  type={showPw ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-0 bottom-3 text-muted hover:text-ink transition-colors"
                >
                  {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>

              <div className="flex justify-end">
                <Link href="/auth/forgot" className="font-mono text-[10px] tracking-[0.16em] uppercase text-muted hover:text-ink">
                  Forgot password? →
                </Link>
              </div>

              {error && (
                <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-danger border-l-2 border-danger pl-3 py-2">
                  / {error}
                </p>
              )}

              <Button type="submit" loading={loading} className="w-full" size="lg">
                Sign in →
              </Button>
            </form>

            {mounted && GOOGLE_AUTH_ENABLED && (
              <>
                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-ink/15" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="bg-cream px-3 font-mono text-[10px] tracking-[0.18em] uppercase text-muted">or</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleOAuth("google")}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 border border-ink/25 py-3.5 font-mono text-[11px] tracking-[0.16em] uppercase text-ink hover:bg-ink hover:text-citrine transition-colors disabled:opacity-50"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Continue with Google
                </button>
              </>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
