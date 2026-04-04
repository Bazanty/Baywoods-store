"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 pt-20">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <p className="font-serif text-[120px] lg:text-[160px] text-stone leading-none select-none">
          404
        </p>
        <h1 className="font-serif text-2xl lg:text-3xl text-ink mt-2 mb-4">
          This page doesn&apos;t exist.
        </h1>
        <p className="text-sm text-muted max-w-sm mb-8">
          The page you&apos;re looking for may have moved, been renamed, or never existed. Let&apos;s get you back on track.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link href="/" className="btn-primary">
            Go Home
          </Link>
          <Link href="/shop" className="btn-outline">
            Browse Shop
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
