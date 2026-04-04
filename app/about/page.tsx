"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

const values = [
  {
    title: "Quality First",
    desc: "Every piece goes through quality checks before it reaches you. No cutting corners.",
  },
  {
    title: "Built for Kenya",
    desc: "M-Pesa payments, local delivery, Kenyan sizing — made for how you actually shop.",
  },
  {
    title: "Trend-Forward",
    desc: "We follow the culture so you don't have to. Fresh drops every week.",
  },
  {
    title: "Accessible Price",
    desc: "Premium feel without the premium tax. Streetwear for everyone.",
  },
];

export default function AboutPage() {
  return (
    <div className="pt-20 pb-24">
      {/* Hero */}
      <div className="relative h-[50vh] min-h-[320px] overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=1400&q=85"
          alt="Baywoods Store"
          fill
          className="object-cover object-top"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-ink/50" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="font-serif text-display-xl text-white"
          >
            About Baywoods
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="text-white/70 text-sm max-w-md mt-4"
          >
            Kenyan streetwear for the culture
          </motion.p>
        </div>
      </div>

      <div className="container-px py-16">
        {/* Story */}
        <div className="max-w-3xl mx-auto mb-20">
          <p className="text-[10px] font-semibold tracking-[0.25em] uppercase text-forest mb-4">
            Our Story
          </p>
          <h2 className="font-serif text-4xl text-ink mb-6 leading-tight">
            Built from the streets of Nairobi.
          </h2>
          <div className="space-y-4 text-sm text-ink/70 leading-relaxed">
            <p>
              Baywoods Store was born out of frustration — great style shouldn&apos;t cost a fortune, and finding premium streetwear in Kenya shouldn&apos;t be a hustle. We set out to change that.
            </p>
            <p>
              Founded in 2024, we curate and deliver trend-forward pieces that work for the Kenyan climate, culture, and wallet. From heavyweight hoodies to clean runners, every item in our collection is selected for quality, wearability, and style.
            </p>
            <p>
              We built Baywoods for the next generation of Kenyan creatives — the ones who care about what they wear, but also need it to work in real life.
            </p>
          </div>
        </div>

        {/* Values */}
        <div className="mb-20">
          <p className="text-[10px] font-semibold tracking-[0.25em] uppercase text-forest mb-6 text-center">
            What We Stand For
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {values.map((v, i) => (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: i * 0.08 }}
                viewport={{ once: true }}
                className="p-6 border border-stone bg-cream"
              >
                <p className="font-serif text-xl text-ink mb-2">{v.title}</p>
                <p className="text-sm text-muted leading-relaxed">{v.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Numbers */}
        <div className="bg-ink text-white p-10 lg:p-16 mb-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 text-center">
            {[
              { value: "2024", label: "Founded" },
              { value: "500+", label: "Products" },
              { value: "1,200+", label: "Happy Customers" },
              { value: "4.8★", label: "Average Rating" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="font-serif text-4xl text-white">{stat.value}</p>
                <p className="text-xs text-white/50 mt-2 tracking-widest uppercase">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <h2 className="font-serif text-3xl text-ink mb-4">Ready to shop?</h2>
          <p className="text-sm text-muted mb-8">
            Browse the full collection and find your next favourite piece.
          </p>
          <Link href="/shop" className="btn-primary">
            Shop Now
          </Link>
        </div>
      </div>
    </div>
  );
}
