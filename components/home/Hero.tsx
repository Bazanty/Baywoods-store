"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ArrowUpRight, ShoppingBag } from "lucide-react";

const ease = [0.22, 1, 0.36, 1] as const;

export default function Hero() {
  return (
    <section className="relative isolate grain min-h-[calc(100svh-3.5rem)] overflow-hidden pt-14 lg:min-h-[calc(100svh-4rem)] lg:pt-16">
      {/* Dark brown → black gradient base with a warm gold bloom */}
      <div
        aria-hidden
        className="absolute inset-0 -z-30 bg-[radial-gradient(120%_120%_at_15%_10%,#3a241d_0%,#2a1a16_38%,#140d0b_72%,#0b0b0b_100%)]"
      />
      <div
        aria-hidden
        className="absolute -z-20 right-[-10%] top-[8%] h-[60%] w-[60%] rounded-full bg-[radial-gradient(circle,rgba(184,137,69,0.30),rgba(184,137,69,0)_70%)] blur-3xl"
      />
      <div
        aria-hidden
        className="absolute -z-20 left-[-12%] bottom-[-10%] h-[55%] w-[55%] rounded-full bg-[radial-gradient(circle,rgba(74,47,39,0.7),transparent_70%)] blur-3xl"
      />

      {/* Oversized wordmark, set low-contrast into the background */}
      <span
        aria-hidden
        className="pointer-events-none absolute left-4 top-[14%] z-0 select-none font-display text-[22vw] font-semibold uppercase leading-[0.8] tracking-[-0.04em] text-cream/[0.04] sm:left-8 lg:left-14 lg:text-[15rem] xl:text-[18rem]"
      >
        Baywoods
      </span>

      <div className="relative z-10 grid min-h-[calc(100svh-3.5rem)] grid-rows-[1fr_1fr] lg:min-h-[calc(100svh-4rem)] lg:grid-cols-[1.05fr_0.95fr] lg:grid-rows-1">
        {/* Copy column */}
        <div className="flex flex-col justify-end px-5 pb-8 pt-24 sm:px-8 lg:justify-center lg:px-16 lg:pb-0 lg:pt-16">
          <motion.span
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease }}
            className="inline-flex items-center gap-2 font-mono text-[10px] font-medium uppercase tracking-[0.28em] text-gold"
          >
            <span className="h-px w-7 bg-gold" /> FW26 — Drop 01
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease, delay: 0.06 }}
            className="mt-5 max-w-[15ch] font-display text-[15vw] font-semibold uppercase leading-[0.86] tracking-[-0.03em] text-cream sm:text-7xl lg:text-[5.5rem] xl:text-[6.5rem]"
          >
            Step into{" "}
            <span className="text-gold [text-shadow:0_2px_30px_rgba(184,137,69,0.35)]">legacy</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease, delay: 0.14 }}
            className="mt-6 max-w-[34ch] text-sm leading-7 text-cream/70 sm:text-base"
          >
            Premium streetwear. Built for confidence. Curated footwear with bold
            contrasts and timeless silhouettes — every pair a statement.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease, delay: 0.22 }}
            className="mt-9 flex flex-wrap items-center gap-3"
          >
            <Link href="/shop" className="btn-primary group">
              Shop Now
              <ArrowRight size={15} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <Link href="/shop/shoes" className="btn-outline group">
              View Collection
              <ArrowUpRight size={15} className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, ease, delay: 0.4 }}
            className="mt-10 flex items-center gap-6 border-t border-cream/10 pt-6 font-mono text-[10px] uppercase tracking-[0.2em] text-muted"
          >
            <span className="text-cream">Est. 2026 · Nairobi</span>
            <span className="hidden sm:inline">Free dispatch over KSh 5K</span>
            <span className="hidden md:inline">M-Pesa ready</span>
          </motion.div>
        </div>

        {/* Product column */}
        <div className="relative flex min-h-[24rem] items-center justify-center overflow-hidden px-4 pb-12 sm:px-8 lg:min-h-0 lg:pb-0">
          <div
            aria-hidden
            className="absolute inset-x-[14%] top-[16%] h-[48%] rounded-full bg-[radial-gradient(circle,rgba(184,137,69,0.4),rgba(184,137,69,0)_68%)] blur-2xl"
          />
          <div
            aria-hidden
            className="absolute bottom-[14%] left-1/2 h-10 w-[62%] -translate-x-1/2 rounded-full bg-black/50 blur-2xl"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotate: -10 }}
            animate={{ opacity: 1, scale: 1, rotate: -7 }}
            transition={{ duration: 0.9, ease, delay: 0.1 }}
            className="relative z-10 h-[20rem] w-full max-w-[36rem] sm:h-[26rem] lg:h-[32rem] xl:h-[36rem]"
          >
            <Image
              src="/hero-shoe-airmax95.png"
              alt="Featured sneaker drop"
              fill
              priority
              sizes="(max-width: 768px) 92vw, 46vw"
              className="object-contain drop-shadow-[0_42px_60px_rgba(0,0,0,0.6)]"
            />
          </motion.div>

          <div className="absolute right-4 top-6 z-20 flex items-center gap-2 font-mono text-[10px] font-medium uppercase tracking-[0.2em] text-muted sm:right-8 lg:top-10">
            <ShoppingBag size={13} className="text-gold" />
            <span>Latest drop</span>
          </div>
        </div>
      </div>
    </section>
  );
}
