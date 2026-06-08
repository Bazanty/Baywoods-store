"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Star, Shield, Truck, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

interface LiveReview {
  id: string;
  rating: number;
  body: string;
  author: string;
  product: string;
}

const FALLBACK_REVIEWS: LiveReview[] = [
  { id: "f1", rating: 5, body: "Quality is way better than expected. The heavyweight hoodie is unreal.", author: "Jay M.", product: "Heavyweight Pullover" },
  { id: "f2", rating: 5, body: "M-Pesa checkout was seamless. Got the STK push immediately. Delivery was 3 days.", author: "Amina W.", product: "Tech Jogger Slim" },
  { id: "f3", rating: 5, body: "Finally a Kenyan brand that actually delivers. Solid quality, fair prices.", author: "Kevin O.", product: "Bay Runner Low" },
];

const trust = [
  { icon: Truck,     title: "Free Delivery",    desc: "On orders over KSh 5,000" },
  { icon: RefreshCw, title: "Easy Returns",      desc: "14-day hassle-free policy" },
  { icon: Shield,    title: "Secure Payments",   desc: "M-Pesa STK checkout" },
  { icon: Star,      title: "4.8 / 5 Rating",    desc: "From 1,200+ reviews" },
];

function StarRow({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} size={11} className="fill-ink text-ink" />
      ))}
    </div>
  );
}

export default function SocialProof() {
  const [reviews, setReviews] = useState<LiveReview[]>(FALLBACK_REVIEWS);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("reviews")
        .select(`id, rating, body, users ( first_name, last_name ), products ( name )`)
        .eq("is_approved", true)
        .gte("rating", 4)
        .order("created_at", { ascending: false })
        .limit(3);

      if (data?.length) {
        setReviews(
          data.map((r: any) => ({
            id: r.id,
            rating: r.rating,
            body: r.body ?? "",
            author: r.users
              ? `${r.users.first_name} ${String(r.users.last_name ?? "")[0] ?? ""}.`
              : "Customer",
            product: r.products?.name ?? "",
          }))
        );
      }
    })();
  }, []);

  const [featured, ...rest] = reviews;

  return (
    <section className="container-px mt-24 lg:mt-28">
      {/* ── Trust strip ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 border border-ink/15 mb-20">
        {trust.map((t, i) => (
          <motion.div
            key={t.title}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: i * 0.07 }}
            viewport={{ once: true }}
            className="relative flex items-center gap-4 p-5 lg:p-6 border-r border-b border-ink/15 last:border-r-0 lg:[&:nth-child(2)]:border-r lg:[&:nth-child(4)]:border-r-0 [&:nth-child(3)]:border-b-0 [&:nth-child(4)]:border-b-0 sm:[&:nth-child(n+3)]:border-b-0 hover:bg-beige-dark transition-colors"
          >
            <span className="absolute top-2 left-2 font-mono text-[9px] tracking-[0.2em] text-muted">
              0{i + 1}
            </span>
            <t.icon size={18} className="text-ink shrink-0" strokeWidth={1.5} />
            <div>
              <p className="font-display text-base tracking-[-0.01em] text-ink leading-none">{t.title}</p>
              <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted mt-2">{t.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Reviews header ── */}
      <div className="mb-10 grid grid-cols-12 items-end gap-6 border-b border-ink/15 pb-6">
        <div className="col-span-12 sm:col-span-8">
          <h2 className="section-title">Real reviews.</h2>
        </div>
        <div className="col-span-12 sm:col-span-4 sm:text-right flex sm:justify-end items-center gap-2">
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={13} className="fill-ink text-ink" />
            ))}
          </div>
          <span className="font-display text-lg text-ink">4.8</span>
          <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted">/ 1,200+</span>
        </div>
      </div>

      {/* ── Asymmetric review layout: 1 featured + 2 stacked ── */}
      {featured && (
        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-px bg-ink/15">
          {/* Featured */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            viewport={{ once: true }}
            className="bg-cream p-8 lg:p-10 flex flex-col justify-between border border-ink/15"
          >
            <div>
              <StarRow count={featured.rating} />
              <p className="mt-6 font-display text-2xl leading-tight tracking-[-0.015em] text-ink lg:text-3xl">
                &ldquo;{featured.body}&rdquo;
              </p>
            </div>
            <div className="mt-8 flex items-center justify-between border-t border-ink/15 pt-5">
              <p className="font-display text-base tracking-[-0.01em] text-ink">{featured.author}</p>
              {featured.product && <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted">{featured.product}</p>}
            </div>
          </motion.div>

          {/* Two smaller reviews stacked */}
          <div className="flex flex-col gap-px bg-ink/15">
            {rest.map((r, i) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 + i * 0.1 }}
                viewport={{ once: true }}
                className="bg-cream p-6 lg:p-8 flex-1 flex flex-col justify-between border border-ink/15"
              >
                <div>
                  <StarRow count={r.rating} />
                  <p className="mt-4 text-sm text-ink leading-relaxed">&ldquo;{r.body}&rdquo;</p>
                </div>
                <div className="mt-5 pt-4 border-t border-ink/15 flex items-center justify-between">
                  <p className="font-display text-sm text-ink">{r.author}</p>
                  {r.product && <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted">{r.product}</p>}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
