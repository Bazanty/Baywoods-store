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
    } catch {
      // Best effort
    }
    setSubmitted(true);
    setEmail("");
  };

  return (
    <section className="mt-24">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="bg-ink text-white mx-4 sm:mx-6 lg:mx-10 xl:mx-16 p-10 lg:p-16 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8"
      >
        <div className="max-w-lg">
          <p className="text-[10px] font-semibold tracking-[0.25em] uppercase text-forest-light mb-3">
            Join the Community
          </p>
          <h2 className="font-serif text-3xl lg:text-4xl text-white leading-tight">
            Be first to know about drops, deals & exclusive releases.
          </h2>
          <p className="text-sm text-white/50 mt-3">
            No spam, ever. Unsubscribe anytime.
          </p>
        </div>

        <div className="w-full lg:w-auto lg:min-w-[380px]">
          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-4"
            >
              <p className="text-forest-light font-semibold">You&apos;re in!</p>
              <p className="text-white/50 text-sm mt-1">
                Check your inbox for a welcome gift.
              </p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="flex">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="flex-1 bg-white/10 border border-white/20 text-white text-sm px-4 py-3.5 outline-none placeholder:text-white/40 focus:border-white/40 transition-colors"
              />
              <button
                type="submit"
                className="px-5 py-3.5 bg-forest hover:bg-forest-dark text-white transition-colors shrink-0"
                aria-label="Subscribe"
              >
                <ArrowRight size={16} />
              </button>
            </form>
          )}
          <p className="text-xs text-white/30 mt-3">
            By subscribing you agree to our Privacy Policy.
          </p>
        </div>
      </motion.div>
    </section>
  );
}
