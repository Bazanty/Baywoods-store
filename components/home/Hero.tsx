"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

const ticker = [
  "SHOES", "HOODIES", "JOGGERS", "CAPS", "ACCESSORIES",
  "FREE SHIPPING OVER KSH 5,000", "NEW ARRIVALS WEEKLY",
  "SHOES", "HOODIES", "JOGGERS", "CAPS", "ACCESSORIES",
  "FREE SHIPPING OVER KSH 5,000", "NEW ARRIVALS WEEKLY",
];

const words = ["WEAR", "THE", "STREET."];

export default function Hero() {
  return (
    <section className="relative min-h-screen bg-beige flex flex-col overflow-hidden">
      {/* Main content */}
      <div className="flex-1 container-px flex flex-col lg:flex-row items-center pt-24 lg:pt-32 pb-12 gap-8 lg:gap-0">
        {/* Text side */}
        <div className="flex-1 flex flex-col justify-center z-10">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-[10px] font-medium tracking-[0.3em] uppercase text-forest mb-6"
          >
            New Collection · 2026
          </motion.p>

          <div className="overflow-hidden">
            {words.map((word, i) => (
              <motion.span
                key={word}
                initial={{ y: "110%" }}
                animate={{ y: 0 }}
                transition={{
                  duration: 0.7,
                  delay: 0.2 + i * 0.12,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="block font-serif text-display-2xl text-ink leading-none tracking-tight"
              >
                {word}
              </motion.span>
            ))}
          </div>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="text-sm text-muted max-w-xs mt-6 leading-relaxed"
          >
            Streetwear built for the culture. Premium pieces, Kenyan prices, M-Pesa accepted.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.85 }}
            className="flex flex-wrap gap-3 mt-8"
          >
            <Link
              href="/shop"
              className="btn-primary"
            >
              Shop Now
            </Link>
            <Link
              href="/new-arrivals"
              className="btn-outline"
            >
              New Arrivals
            </Link>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.1 }}
            className="flex gap-8 mt-12 pt-8 border-t border-stone"
          >
            {[
              { value: "500+", label: "Products" },
              { value: "4.8★", label: "Avg Rating" },
              { value: "2-Day", label: "Express Delivery" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-xl font-serif font-semibold text-ink">{stat.value}</p>
                <p className="text-xs text-muted mt-0.5">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Image side */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full lg:w-[52%] h-[420px] lg:h-[600px] lg:-mr-16 xl:-mr-24"
        >
          <Image
            src="https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=1200&q=90"
            alt="Baywoods Collection"
            fill
            priority
            className="object-cover object-top"
            sizes="(max-width: 1024px) 100vw, 55vw"
          />
          {/* Floating badge */}
          <div className="absolute bottom-6 left-6 bg-white/90 backdrop-blur-sm px-4 py-3 shadow-lg">
            <p className="text-[10px] font-semibold tracking-widest uppercase text-forest">
              New In
            </p>
            <p className="text-sm font-medium text-ink mt-0.5">
              Heavyweight Pullover
            </p>
            <p className="text-sm font-semibold text-forest mt-1">KSh 5,500</p>
          </div>
        </motion.div>
      </div>

      {/* Ticker */}
      <div className="border-t border-stone bg-beige-dark overflow-hidden py-3">
        <motion.div
          animate={{ x: 0 }}
          className="flex gap-0 whitespace-nowrap animate-ticker"
        >
          {ticker.map((item, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-4 text-[10px] font-semibold tracking-[0.2em] uppercase text-ink/40 px-6"
            >
              {item}
              <span className="text-forest">·</span>
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
