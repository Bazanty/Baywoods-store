"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 pt-20 bg-cream">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-xl"
      >
        <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-muted mb-6">/ ERROR · 404</p>
        <p className="font-display font-medium text-[clamp(8rem,22vw,18rem)] text-ink tracking-[-0.04em] leading-none select-none">
          <span className="relative inline-block">
            4<span aria-hidden className="absolute inset-x-0 bottom-3 h-6 bg-citrine -z-0" /><span className="relative z-10">0</span>4
          </span>
        </p>
        <h1 className="font-display text-3xl lg:text-4xl tracking-[-0.02em] text-ink mt-4 mb-4">
          Page not found.
        </h1>
        <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted mb-8 max-w-md mx-auto leading-relaxed">
          / The page you&apos;re looking for may have moved, been renamed, or never existed.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link href="/" className="btn-primary">Go home →</Link>
          <Link href="/shop" className="btn-outline">Browse shop</Link>
        </div>
      </motion.div>
    </div>
  );
}
