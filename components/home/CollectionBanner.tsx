"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { productImages } from "@/lib/productImages";

// Clean studio pair — shown contained so it sits matted, not cropped huge.
const FEATURE_IMAGE = productImages.nike[0];
const DETAIL_IMAGES = [
  { src: productImages.adidas[3], label: "Campus 00s" },
  { src: productImages.nike[7], label: "Dunk Low" },
  { src: productImages.vans[2], label: "Knu Skool" },
];

const META = [
  ["Pieces", "36"],
  ["Launches", "Weekly"],
  ["Lensed", "Westlands"],
];

export default function CollectionBanner() {
  return (
    <section className="container-px mt-24 lg:mt-28">
      <div className="grain overflow-hidden border border-ink/15 bg-cream">
        <div className="grid lg:grid-cols-[0.82fr_1.18fr]">
          {/* Copy rail */}
          <div className="flex flex-col justify-between gap-12 border-b border-ink/15 p-8 sm:p-12 lg:border-b-0 lg:border-r lg:p-14">
            <div>
              <motion.h2
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="font-display font-medium leading-[0.9] tracking-[-0.03em] text-ink"
                style={{ fontSize: "clamp(2.5rem, 5.5vw, 4.5rem)" }}
              >
                Built for{" "}
                <span className="relative inline-block">
                  <span className="relative z-10">Nairobi</span>
                  <span aria-hidden className="absolute inset-x-0 bottom-[0.16em] -z-0 h-[0.28em] bg-citrine" />
                </span>{" "}
                nights.
              </motion.h2>

              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.55, delay: 0.18 }}
                className="mt-7 max-w-sm text-sm leading-7 text-ink/70"
              >
                Heavy fleece, terrace silhouettes, after-hours essentials — a rotation
                built for how the city actually moves once the sun drops.
              </motion.p>
            </div>

            <div>
              <dl className="grid max-w-sm grid-cols-3 gap-4 border-t border-ink/15 pt-5 font-mono text-[10px] uppercase tracking-[0.16em]">
                {META.map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-muted">{k}</dt>
                    <dd className="mt-1 text-ink">{v}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/shop" className="btn-primary group">
                  Shop campaign
                  <ArrowUpRight size={13} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                </Link>
                <Link href="/about" className="btn-outline">
                  Read story
                </Link>
              </div>
            </div>
          </div>

          {/* Studio panel — product matted with breathing room */}
          <div className="relative flex flex-col bg-beige">
            <motion.div
              initial={{ opacity: 0, scale: 1.03 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className="relative flex-1 px-8 pt-12 pb-6 sm:px-14 lg:px-20"
            >
              <span className="absolute left-6 top-6 font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
                FW26 / Vol.01
              </span>
              <div className="relative mx-auto aspect-[5/4] w-full max-w-xl">
                <Image
                  src={FEATURE_IMAGE}
                  alt="Baywoods FW26 — featured pair"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 60vw"
                  className="object-contain"
                />
              </div>
            </motion.div>

            {/* Detail strip */}
            <div className="flex items-center gap-3 border-t border-ink/15 px-6 py-4 sm:px-10">
              <span className="hidden shrink-0 font-mono text-[10px] uppercase tracking-[0.18em] text-muted sm:inline">
                In the drop
              </span>
              <div className="flex flex-1 gap-2">
                {DETAIL_IMAGES.map((item, i) => (
                  <motion.div
                    key={item.src}
                    initial={{ opacity: 0, y: 8 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: 0.25 + i * 0.08 }}
                    className="group relative aspect-square w-16 overflow-hidden border border-ink/15 bg-cream lg:w-20"
                  >
                    <Image src={item.src} alt={item.label} fill sizes="80px" className="object-cover transition-transform duration-500 group-hover:scale-105" />
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
