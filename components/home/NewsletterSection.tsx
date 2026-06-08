"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export default function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    try {
      await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
    } catch {}
    setSubmitted(true);
    setEmail("");
  };

  return (
    <section className="mt-24 lg:mt-28">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        viewport={{ once: true }}
        className="container-px relative border-y border-ink/15 grain bg-cream py-16 lg:py-24"
      >
        <div className="grid grid-cols-12 gap-y-10 lg:gap-x-12 items-start">
          {/* Copy */}
          <div className="col-span-12 lg:col-span-7">
            <h2
              className="font-display font-medium tracking-[-0.025em] leading-[0.92] text-ink"
              style={{ fontSize: "clamp(2.5rem, 6vw, 5.25rem)" }}
            >
              First on <br className="hidden sm:inline" />every <span className="relative inline-block">
                <span className="relative z-10">drop.</span>
                <span aria-hidden className="absolute inset-x-0 bottom-[0.18em] h-[0.3em] bg-citrine -z-0" />
              </span>
            </h2>
            <p className="mt-6 max-w-md text-sm leading-7 text-ink/70">
              New arrivals, exclusive deals, early access &mdash; direct to your inbox. No spam, no filler. Unsubscribe whenever.
            </p>
          </div>

          {/* Form column */}
          <div className="col-span-12 lg:col-span-5 lg:pt-6">
            {submitted ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="border-l-2 border-citrine pl-4 py-2"
              >
                <p className="font-display text-2xl tracking-[-0.02em]">You&apos;re in.</p>
                <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-muted mt-2">
                  / Check your inbox for a welcome note.
                </p>
              </motion.div>
            ) : (
              <>
                <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted mb-3">
                  / Email
                </p>
                <form onSubmit={handleSubmit} className="flex items-end border-b-2 border-ink">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="flex-1 bg-transparent text-ink text-lg py-3 outline-none placeholder:text-muted"
                  />
                  <button
                    type="submit"
                    className="px-4 py-3 font-mono text-[10px] tracking-[0.2em] uppercase text-ink hover:text-citrine transition-colors flex items-center gap-2"
                    aria-label="Subscribe"
                  >
                    Subscribe
                    <ArrowRight size={13} />
                  </button>
                </form>
                <p className="mt-3 font-mono text-[10px] tracking-[0.14em] uppercase text-muted">
                  / By subscribing you agree to our Privacy Policy.
                </p>
              </>
            )}

            {/* Decorative meta — small numbers */}
            <div className="mt-10 grid grid-cols-3 gap-4 border-t border-ink/15 pt-5 font-mono text-[10px] tracking-[0.16em] uppercase">
              <div>
                <p className="text-ink">12K+</p>
                <p className="text-muted mt-1">subscribers</p>
              </div>
              <div>
                <p className="text-ink">Weekly</p>
                <p className="text-muted mt-1">cadence</p>
              </div>
              <div>
                <p className="text-ink">0%</p>
                <p className="text-muted mt-1">spam</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}
