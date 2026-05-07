"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { heroImages } from "@/lib/heroImages";

const HIGHLIGHTS = [
  { value: "276", label: "lookbook frames" },
  { value: "24h", label: "Nairobi dispatch" },
  { value: "M-Pesa", label: "fast checkout" },
];

const TICKER_ITEMS = [
  "New arrivals weekly",
  "Authentic pairs only",
  "M-Pesa accepted",
  "Curated streetwear edit",
  "Kenya-wide delivery",
  "Fresh campaign visuals",
];

export default function Hero() {
  const gallery = useMemo(() => heroImages.slice(0, 36), []);
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (gallery.length < 2) return;
    const id = window.setInterval(() => {
      setActive((current) => (current + 1) % gallery.length);
    }, 3600);
    return () => window.clearInterval(id);
  }, [gallery.length]);

  if (gallery.length === 0) return null;

  const lead  = gallery[active % gallery.length];
  const sideA = gallery[(active + 8)  % gallery.length];
  const sideB = gallery[(active + 15) % gallery.length];
  const strip = [2, 5, 11, 18, 27].map((o) => gallery[(active + o) % gallery.length]);

  return (
    <section className="relative overflow-hidden bg-neutral-950 text-white">
      <div className="container-px pt-24 lg:pt-28">
        <div className="grid min-h-[82vh] grid-cols-1 gap-10 pb-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-12">

          {/* ── Left: copy ── */}
          <div className="max-w-2xl">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="section-kicker text-forest-light"
            >
              Drop 01 / Nairobi
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.05 }}
              className="mt-5 font-serif text-5xl leading-[0.95] text-white sm:text-6xl lg:text-7xl"
            >
              BAYWOODS
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.12 }}
              className="mt-6 max-w-xl text-base leading-8 text-white/70 sm:text-lg"
            >
              Kenyan streetwear built around real rotation pieces: sneakers,
              heavyweight layers, clean accessories, and a checkout flow that
              works locally.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.18 }}
              className="mt-8 flex flex-col gap-3 sm:flex-row"
            >
              <Link
                href="/shop"
                className="inline-flex h-12 items-center justify-center gap-2 bg-white px-6 text-sm font-semibold text-neutral-900 transition-colors hover:bg-neutral-100 active:scale-[0.98]"
              >
                Shop the drop
                <ArrowRight size={16} strokeWidth={2} />
              </Link>
              <Link
                href="/new-arrivals"
                className="inline-flex h-12 items-center justify-center gap-2 border border-white/30 px-6 text-sm font-semibold text-white transition-colors hover:border-white hover:bg-white/10 active:scale-[0.98]"
              >
                New arrivals
                <ArrowUpRight size={16} strokeWidth={2} />
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.24 }}
              className="mt-10 grid max-w-xl grid-cols-3 border-y border-white/10"
            >
              {HIGHLIGHTS.map((item) => (
                <div key={item.label} className="py-5 pr-4">
                  <p className="text-2xl font-semibold text-white">{item.value}</p>
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
                    {item.label}
                  </p>
                </div>
              ))}
            </motion.div>
          </div>

          {/* ── Right: image gallery ── */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.12 }}
            className="grid grid-cols-5 gap-3"
          >
            {/* Lead + side pair */}
            <div className="col-span-5 grid grid-cols-5 gap-3 lg:col-span-4">
              <div className="relative col-span-5 aspect-[4/5] overflow-hidden bg-white/5 sm:col-span-3">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={lead}
                    initial={{ opacity: 0, scale: 1.02 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.99 }}
                    transition={{ duration: 0.45 }}
                    className="absolute inset-0"
                  >
                    <Image
                      src={lead}
                      alt="Baywoods lookbook"
                      fill
                      priority
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 60vw, 38vw"
                      className="object-cover"
                    />
                  </motion.div>
                </AnimatePresence>
                <div className="absolute inset-x-0 bottom-0 border-t border-white/15 bg-ink/75 px-4 py-3 backdrop-blur">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/70">
                    Lookbook frame {(active % 9) + 1}
                  </p>
                </div>
              </div>

              <div className="col-span-5 grid grid-cols-2 gap-3 sm:col-span-2 sm:grid-cols-1">
                <div className="relative aspect-[4/5] overflow-hidden bg-white/5">
                  <Image
                    src={sideA}
                    alt="Streetwear detail"
                    fill
                    sizes="(max-width: 640px) 50vw, 18vw"
                    className="object-cover"
                  />
                </div>
                <div className="relative aspect-[4/5] overflow-hidden bg-white/5">
                  <Image
                    src={sideB}
                    alt="Sneaker detail"
                    fill
                    sizes="(max-width: 640px) 50vw, 18vw"
                    className="object-cover"
                  />
                </div>
              </div>
            </div>

            {/* Bottom strip — hidden on mobile to reduce clutter */}
            <div className="col-span-5 hidden grid-cols-5 gap-3 sm:grid">
              {strip.map((src, i) => (
                <div
                  key={`${src}-${i}`}
                  className="relative aspect-square overflow-hidden bg-white/5"
                >
                  <Image
                    src={src}
                    alt={`Baywoods campaign ${i + 1}`}
                    fill
                    sizes="20vw"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Ticker */}
      <div className="border-t border-white/10 bg-beige text-ink">
        <div className="overflow-hidden py-4">
          <div className="flex min-w-max animate-ticker gap-8 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted hover:[animation-play-state:paused]">
            {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
              <span key={`${item}-${i}`} className="flex items-center gap-8">
                {item}
                <span className="h-1 w-1 bg-forest" />
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
