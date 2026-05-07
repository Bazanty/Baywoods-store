"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { productImages } from "@/lib/productImages";

const MAIN_IMAGE = productImages.nike[4];
const ACCENT_IMAGES = [productImages.adidas[3], productImages["new-balance"][8], productImages.vans[7]];

export default function CollectionBanner() {
  return (
    <section className="mt-20 lg:mt-24 grid lg:grid-cols-2" style={{ minHeight: "580px" }}>
      {/* ── Image panel ── */}
      <div className="relative min-h-[380px] lg:min-h-0 overflow-hidden bg-stone-light">
        <motion.div
          initial={{ scale: 1.05 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0"
        >
          <Image
            src={MAIN_IMAGE}
            alt="Baywoods FW26 campaign"
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
        </motion.div>

        {/* Small accent strip — bottom right */}
        <div className="absolute bottom-4 right-4 flex gap-1.5">
          {ACCENT_IMAGES.map((src, i) => (
            <motion.div
              key={src}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: 0.3 + i * 0.07 }}
              className="relative w-14 h-14 lg:w-20 lg:h-20 overflow-hidden border border-white/20"
            >
              <Image src={src} alt="" fill sizes="80px" className="object-cover" />
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Text panel ── */}
      <div className="bg-ink flex flex-col justify-between p-8 sm:p-12 lg:p-16">
        <div>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="section-kicker text-forest-light mb-5"
          >
            FW26 / Volume 01
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="font-serif leading-[0.95] text-white"
            style={{ fontSize: "clamp(2.75rem, 5vw, 4.5rem)" }}
          >
            Built for
            <br />
            Nairobi
            <br />
            nights.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, delay: 0.2 }}
            className="mt-7 max-w-sm text-sm leading-7 text-white/50"
          >
            Heavy fleece, terrace silhouettes, after-hours essentials.
            The new campaign is a love letter to streetwear built for this city.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55, delay: 0.3 }}
          className="mt-10 flex flex-col sm:flex-row gap-3"
        >
          <Link
            href="/shop"
            className="inline-flex h-12 items-center justify-center gap-2 bg-white px-6 text-xs font-semibold uppercase tracking-[0.16em] text-ink transition-colors hover:bg-neutral-100 active:scale-[0.98]"
          >
            Shop campaign
            <ArrowUpRight size={13} />
          </Link>
          <Link
            href="/about"
            className="inline-flex h-12 items-center justify-center gap-2 border border-white/20 px-6 text-xs font-semibold uppercase tracking-[0.16em] text-white/60 transition-colors hover:border-white/50 hover:text-white"
          >
            Read story
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
