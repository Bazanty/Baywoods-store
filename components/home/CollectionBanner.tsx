"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

// Editorial campaign slot. Two stacked photos on the left, an oversized
// pull-quote / CTA on the right. Keeps depth without sliding into the
// generic two-column hero look every store template ships with.

const SHOTS = [
  "https://res.cloudinary.com/dltbrta8h/image/upload/v1775833680/baywoodstore/nike/mnxorpjr7xfnskb0bubz.jpg",
  "https://res.cloudinary.com/dltbrta8h/image/upload/v1775833785/baywoodstore/vans/uowsorzhqv0ldyvphsny.jpg",
];

export default function CollectionBanner() {
  return (
    <section className="container-px mt-28">
      <div className="grid grid-cols-12 gap-4 lg:gap-8 items-center">
        {/* Left — stacked photo collage */}
        <div className="col-span-12 lg:col-span-7 grid grid-cols-5 gap-3 lg:gap-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="col-span-3 relative aspect-[4/5] overflow-hidden bg-beige-dark"
          >
            <Image
              src={SHOTS[0]}
              alt="FW26 lookbook"
              fill
              sizes="(max-width: 1024px) 60vw, 35vw"
              className="object-cover"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="col-span-2 relative aspect-[3/4] overflow-hidden bg-beige-dark mt-12 lg:mt-20"
          >
            <Image
              src={SHOTS[1]}
              alt="FW26 lookbook"
              fill
              sizes="(max-width: 1024px) 40vw, 25vw"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/30 via-transparent to-transparent" />
          </motion.div>
        </div>

        {/* Right — copy */}
        <div className="col-span-12 lg:col-span-5 lg:pl-6">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-[10px] font-semibold tracking-[0.32em] uppercase text-forest mb-4"
          >
            FW26 · Volume 01
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="font-serif text-4xl lg:text-5xl xl:text-6xl text-ink leading-[1.05] tracking-tight"
          >
            Built for the
            <br />
            <span className="italic text-forest">Nairobi</span> nights.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-6 max-w-md text-sm leading-7 text-muted"
          >
            Heavy fleece, terrace silhouettes, after-hours essentials. The new
            campaign is a love letter to streetwear that actually shows up for
            the city it&apos;s made for.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.32 }}
            className="mt-8 flex items-center gap-4"
          >
            <Link
              href="/shop"
              className="group inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-white transition-transform hover:-translate-y-0.5"
            >
              Shop the campaign
              <ArrowUpRight
                size={14}
                className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </Link>
            <Link
              href="/about"
              className="text-[11px] font-semibold tracking-[0.24em] uppercase text-muted underline underline-offset-4 hover:text-ink transition-colors"
            >
              Read the story
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
