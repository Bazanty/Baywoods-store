"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { heroImages } from "@/lib/heroImages";

const ROTATE_MS = 6500;
const TINT_HOLD_MS = 5000;


type RGB = { r: number; g: number; b: number };
type ColorBucket = RGB & { n: number };
const colorCache = new Map<string, RGB | null>();

function getDominantColor(src: string): Promise<RGB | null> {
  if (colorCache.has(src)) return Promise.resolve(colorCache.get(src) ?? null);

  return new Promise((resolve) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous"; 

    img.onload = () => {
      try {
        const size = 48;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return resolve(null);

        ctx.drawImage(img, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);

        const buckets = new Map<string, ColorBucket>();
        const q = (v: number) => Math.round(v / 48) * 48;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];
          if (a < 200) continue;

          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          if (max > 234 && min > 214) continue; // skip near-white product bg
          if (max < 30) continue; // skip near-black

          const key = `${q(r)},${q(g)},${q(b)}`;
          const bk = buckets.get(key) ?? { n: 0, r: 0, g: 0, b: 0 };
          bk.n += 1;
          bk.r += r;
          bk.g += g;
          bk.b += b;
          buckets.set(key, bk);
        }

        const best = Array.from(buckets.values()).reduce<ColorBucket | null>(
          (winner, bk) => (!winner || bk.n > winner.n ? bk : winner),
          null
        );

        const result: RGB | null = best
          ? {
              r: Math.round(best.r / best.n),
              g: Math.round(best.g / best.n),
              b: Math.round(best.b / best.n),
            }
          : null;

        colorCache.set(src, result);
        resolve(result);
      } catch {
        resolve(null);
      }
    };

    img.onerror = () => {
      colorCache.set(src, null);
      resolve(null);
    };

    img.src = src;
  });
}

function toBackground(rgb: RGB): string {
  let { r, g, b } = rgb;
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  if (lum < 0.6) {
    const lift = (0.6 - lum) * 1.05;
    r = Math.round(r + (255 - r) * lift);
    g = Math.round(g + (255 - g) * lift);
    b = Math.round(b + (255 - b) * lift);
  }
  return `rgb(${r}, ${g}, ${b})`;
}

export default function Hero() {
  const gallery = useMemo(() => heroImages.slice(0, 36), []);
  const [active, setActive] = useState(0);
  const [tint, setTint] = useState<string | null>(null);

  // auto-rotate the lookbook
  useEffect(() => {
    if (gallery.length < 2) return;
    const id = window.setInterval(() => {
      setActive((c) => (c + 1) % gallery.length);
    }, ROTATE_MS);
    return () => window.clearInterval(id);
  }, [gallery.length]);

  const lead = gallery.length ? gallery[active % gallery.length] : "";

  useEffect(() => {
    if (!lead) return;
    let cancelled = false;
    let revertId: number | undefined;

    getDominantColor(lead).then((rgb) => {
      if (cancelled) return;
      if (!rgb) {
        setTint(null);
        return;
      }
      setTint(toBackground(rgb));
      revertId = window.setTimeout(() => {
        if (!cancelled) setTint(null);
      }, TINT_HOLD_MS);
    });

    return () => {
      cancelled = true;
      if (revertId) window.clearTimeout(revertId);
    };
  }, [lead]);

  if (gallery.length === 0) return null;

  const sideA = gallery[(active + 8) % gallery.length];
  const sideB = gallery[(active + 15) % gallery.length];

  return (
    <section className="relative overflow-hidden bg-cream text-ink">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0 transition-colors duration-700 ease-out"
        style={{ backgroundColor: tint ?? "transparent" }}
      />

      <div className="container-px relative z-10 pt-20 lg:pt-24">
        {/* Top index strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex items-baseline justify-between border-b border-ink/15 pb-3 mb-8 lg:mb-12 font-mono text-[10px] tracking-[0.2em] uppercase text-muted"
        >
          <span><span className="text-ink">/ 01</span> &nbsp; DROP &mdash; FW26 / NAIROBI</span>
          <span className="hidden sm:inline">{new Date().toLocaleDateString("en-KE", { month: "short", year: "numeric" }).toUpperCase()}</span>
        </motion.div>

        <div className="grid min-h-[78vh] grid-cols-12 gap-x-4 gap-y-8 pb-12 lg:gap-x-8 lg:items-end">
          <div className="col-span-12 lg:col-span-7 flex flex-col">
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="font-display font-medium text-ink tracking-[-0.035em] leading-[0.88] text-[14vw] sm:text-[11vw] lg:text-[8.5vw] xl:text-[8rem]"
            >
              Streetwear,<br />
              <span className="relative inline-block">
                <span className="relative z-10">assembled</span>
                <span aria-hidden className="absolute inset-x-0 bottom-[0.18em] h-[0.32em] bg-citrine -z-0" />
              </span>{" "}
              <span className="text-muted/40">in</span><br />
              Nairobi.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="mt-8 max-w-md text-base leading-7 text-ink/70"
            >
              Real rotation pieces — sneakers, heavyweight layers, clean accessories.
              Built around how we actually move here.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.22 }}
              className="mt-8 flex flex-col gap-3 sm:flex-row"
            >
              <Link href="/shop" className="btn-primary group">
                Shop the drop
                <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
              </Link>
              <Link href="/new-arrivals" className="btn-outline group">
                New arrivals
                <ArrowUpRight size={14} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            </motion.div>

          </div>

          {/* Right: image stack */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, delay: 0.1 }}
            className="col-span-12 lg:col-span-5 grid grid-cols-3 gap-2 self-stretch"
          >
            <div className="col-span-3 sm:col-span-2 relative aspect-[4/5] overflow-hidden bg-beige-dark border border-ink/10">
              <AnimatePresence mode="wait">
                <motion.div
                  key={lead}
                  initial={{ opacity: 0, y: -56 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 28 }}
                  transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute inset-0"
                >
                  <Image
                    src={lead}
                    alt="Baywoods lookbook"
                    fill
                    priority
                    sizes="(max-width: 1024px) 60vw, 35vw"
                    className="object-cover"
                  />
                </motion.div>
              </AnimatePresence>
              {/* meta strip */}
              <div className="absolute top-3 left-3 font-mono text-[10px] tracking-[0.2em] uppercase text-cream bg-ink/80 backdrop-blur-sm px-2 py-1">
                FR · {String((active % 9) + 1).padStart(2, "0")}
              </div>
            </div>

            <div className="col-span-3 sm:col-span-1 grid grid-cols-2 sm:grid-cols-1 gap-2">
              <div className="relative aspect-square sm:aspect-[4/5] overflow-hidden bg-beige-dark border border-ink/10">
                <Image
                  src={sideA}
                  alt="Streetwear detail"
                  fill
                  sizes="(max-width: 640px) 50vw, 18vw"
                  className="object-cover"
                />
              </div>
              <div className="relative aspect-square sm:aspect-[4/5] overflow-hidden bg-beige-dark border border-ink/10">
                <Image
                  src={sideB}
                  alt="Sneaker detail"
                  fill
                  sizes="(max-width: 640px) 50vw, 18vw"
                  className="object-cover"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
