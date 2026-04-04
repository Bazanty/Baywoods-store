"use client";

import { motion } from "framer-motion";
import { Star, Shield, Truck, RefreshCw } from "lucide-react";

const reviews = [
  {
    name: "Jay M.",
    review: "Quality is way better than expected. The heavyweight hoodie is unreal.",
    rating: 5,
    product: "Heavyweight Pullover",
  },
  {
    name: "Amina W.",
    review: "M-Pesa checkout was seamless. Got the STK push immediately. Delivery was 3 days.",
    rating: 5,
    product: "Tech Jogger Slim",
  },
  {
    name: "Kevin O.",
    review: "Finally a Kenyan brand that actually delivers. Solid quality, fair prices.",
    rating: 5,
    product: "Bay Runner Low",
  },
];

const trust = [
  { icon: Truck, title: "Free Delivery", desc: "On orders over KSh 5,000" },
  { icon: RefreshCw, title: "Easy Returns", desc: "14-day hassle-free policy" },
  { icon: Shield, title: "Secure Payments", desc: "M-Pesa, Stripe & more" },
  { icon: Star, title: "4.8 Rating", desc: "From 1,200+ reviews" },
];

export default function SocialProof() {
  return (
    <section className="container-px mt-24">
      {/* Trust badges */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-20">
        {trust.map((t, i) => (
          <motion.div
            key={t.title}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: i * 0.07 }}
            viewport={{ once: true }}
            className="flex items-start gap-3 p-5 bg-cream border border-stone"
          >
            <t.icon size={20} className="text-forest shrink-0 mt-0.5" strokeWidth={1.5} />
            <div>
              <p className="text-sm font-semibold text-ink">{t.title}</p>
              <p className="text-xs text-muted mt-0.5">{t.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Reviews */}
      <div className="text-center mb-10">
        <p className="text-[10px] font-semibold tracking-[0.25em] uppercase text-forest mb-2">
          What People Say
        </p>
        <h2 className="section-title">Real Reviews</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {reviews.map((r, i) => (
          <motion.div
            key={r.name}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            viewport={{ once: true }}
            className="bg-cream border border-stone p-6"
          >
            <div className="flex gap-0.5 mb-4">
              {Array.from({ length: r.rating }).map((_, j) => (
                <Star key={j} size={12} className="fill-forest text-forest" />
              ))}
            </div>
            <p className="text-sm text-ink leading-relaxed">&ldquo;{r.review}&rdquo;</p>
            <div className="mt-5 pt-4 border-t border-stone flex items-center justify-between">
              <p className="text-xs font-semibold text-ink">{r.name}</p>
              <p className="text-xs text-muted">{r.product}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
