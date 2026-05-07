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
      // best-effort
    }
    setSubmitted(true);
    setEmail("");
  };

  return (
    <section className="mt-24 bg-ink lg:mt-28">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        viewport={{ once: true }}
        className="container-px grid grid-cols-1 gap-10 py-16 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-20 lg:py-20"
      >
        {/* Copy */}
        <div>
          <p className="section-kicker text-forest-light mb-4">Join the community</p>
          <h2 className="font-serif text-3xl leading-[1.05] text-white lg:text-5xl">
            Be first on every drop.
          </h2>
          <p className="mt-4 max-w-md text-sm leading-7 text-white/45">
            New arrivals, exclusive deals, and early access — direct to your inbox. No spam, ever.
          </p>
        </div>

        {/* Form */}
        <div className="w-full lg:w-auto lg:min-w-[400px]">
          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-6"
            >
              <p className="font-serif text-2xl text-white">You&apos;re in.</p>
              <p className="mt-1 text-sm text-white/45">Check your inbox for a welcome gift.</p>
            </motion.div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="flex">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="flex-1 bg-white/8 border border-white/15 text-white text-sm px-5 py-4 outline-none placeholder:text-white/30 focus:border-white/35 transition-colors"
                />
                <button
                  type="submit"
                  className="shrink-0 bg-forest px-5 py-4 text-white transition-colors hover:bg-forest-dark"
                  aria-label="Subscribe"
                >
                  <ArrowRight size={16} />
                </button>
              </form>
              <p className="mt-3 text-xs text-white/25">
                By subscribing you agree to our Privacy Policy.
              </p>
            </>
          )}
        </div>
      </motion.div>
    </section>
  );
}
