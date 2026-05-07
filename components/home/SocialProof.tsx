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
  { icon: Shield,    title: "Secure Payments",   desc: "M-Pesa, Stripe & more" },
  { icon: Star,      title: "4.8 / 5 Rating",    desc: "From 1,200+ reviews" },
];

function StarRow({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <Star key={i} size={11} className="fill-forest text-forest" />
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
      <div className="grid grid-cols-2 lg:grid-cols-4 border border-stone mb-20">
        {trust.map((t, i) => (
          <motion.div
            key={t.title}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: i * 0.07 }}
            viewport={{ once: true }}
            className="flex items-center gap-4 p-5 lg:p-6 border-r border-b border-stone last:border-r-0 lg:[&:nth-child(2)]:border-r lg:[&:nth-child(4)]:border-r-0 [&:nth-child(3)]:border-b-0 [&:nth-child(4)]:border-b-0 sm:[&:nth-child(n+3)]:border-b-0"
          >
            <t.icon size={18} className="text-forest shrink-0" strokeWidth={1.5} />
            <div>
              <p className="text-sm font-semibold text-ink leading-none">{t.title}</p>
              <p className="text-xs text-muted mt-1">{t.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Reviews header ── */}
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="section-kicker mb-2">What people say</p>
          <h2 className="section-title">Real reviews.</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} size={13} className="fill-forest text-forest" />
            ))}
          </div>
          <span className="text-sm font-semibold text-ink">4.8</span>
          <span className="text-xs text-muted">/ 1,200+ reviews</span>
        </div>
      </div>

      {/* ── Asymmetric review layout: 1 featured + 2 stacked ── */}
      {featured && (
        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-px bg-stone">
          {/* Featured */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
            viewport={{ once: true }}
            className="bg-cream p-8 lg:p-10 flex flex-col justify-between"
          >
            <div>
              <StarRow count={featured.rating} />
              <p className="mt-6 font-serif text-2xl leading-snug text-ink lg:text-3xl">
                &ldquo;{featured.body}&rdquo;
              </p>
            </div>
            <div className="mt-8 flex items-center justify-between border-t border-stone pt-5">
              <p className="text-sm font-semibold text-ink">{featured.author}</p>
              {featured.product && <p className="text-xs text-muted">{featured.product}</p>}
            </div>
          </motion.div>

          {/* Two smaller reviews stacked */}
          <div className="flex flex-col gap-px bg-stone">
            {rest.map((r, i) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 + i * 0.1 }}
                viewport={{ once: true }}
                className="bg-cream p-6 lg:p-8 flex-1 flex flex-col justify-between"
              >
                <div>
                  <StarRow count={r.rating} />
                  <p className="mt-4 text-sm text-ink leading-relaxed">&ldquo;{r.body}&rdquo;</p>
                </div>
                <div className="mt-5 pt-4 border-t border-stone flex items-center justify-between">
                  <p className="text-xs font-semibold text-ink">{r.author}</p>
                  {r.product && <p className="text-xs text-muted">{r.product}</p>}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
