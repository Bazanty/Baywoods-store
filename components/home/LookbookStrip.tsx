"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { heroImages } from "@/lib/heroImages";

// Pick a curated spread from the lookbook — vary the offsets for visual mix
const PICKS = [7, 14, 22, 31, 44, 55, 67, 80, 91, 103].map((i) => heroImages[i % heroImages.length]);

export default function LookbookStrip() {
  return (
    <section className="mt-28 overflow-hidden">
      {/* Header */}
      <div className="container-px mb-8 grid grid-cols-12 items-end gap-4 border-b border-ink/15 pb-6">
        <div className="col-span-12 sm:col-span-9">
          <h2 className="section-title">The culture, documented.</h2>
        </div>
        <Link
          href="/shop"
          className="col-span-12 sm:col-span-3 sm:justify-self-end inline-flex items-center gap-1 font-mono text-[10px] tracking-[0.2em] uppercase text-ink hover:text-citrine transition-colors"
        >
          Shop all <ArrowUpRight size={12} />
        </Link>
      </div>

      {/* Scrollable strip — bleeds full width, snaps on mobile */}
      <div className="flex gap-3 overflow-x-auto scroll-px-4 snap-x snap-mandatory pl-4 sm:pl-6 lg:pl-10 xl:pl-16 pr-4 sm:pr-6 lg:pr-10 xl:pr-16 no-scrollbar pb-2">
        {PICKS.map((src, i) => (
          <motion.div
            key={src}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.55, delay: Math.min(i, 4) * 0.07, ease: [0.22, 1, 0.36, 1] }}
            className="relative shrink-0 snap-start overflow-hidden bg-stone-light"
            style={{ width: "clamp(200px, 28vw, 320px)", aspectRatio: "3/4" }}
          >
            <Image
              src={src}
              alt={`Baywoods lookbook ${i + 1}`}
              fill
              sizes="(max-width: 640px) 56vw, (max-width: 1024px) 28vw, 320px"
              className="object-cover transition-transform duration-700 hover:scale-[1.04]"
            />
          </motion.div>
        ))}
      </div>
    </section>
  );
}
