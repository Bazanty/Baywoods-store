"use client";

import { motion } from "framer-motion";
import { Truck, ShieldCheck, RefreshCcw, Smartphone } from "lucide-react";

const reasons = [
  {
    icon: Truck,
    title: "Nairobi-fast delivery",
    body: "Same-day around CBD, next-day across the city. Countrywide G4S in 2–4 days.",
    stat: "24h",
    statLabel: "city dispatch",
  },
  {
    icon: Smartphone,
    title: "M-Pesa, the easy way",
    body: "STK push checkout — no till numbers, no Paybill confusion. Pay in two taps.",
    stat: "2",
    statLabel: "tap checkout",
  },
  {
    icon: RefreshCcw,
    title: "14-day fit guarantee",
    body: "Wrong size? Free swap within 14 days, no questions asked.",
    stat: "14d",
    statLabel: "free returns",
  },
  {
    icon: ShieldCheck,
    title: "100% authentic",
    body: "Every pair sourced direct or verified. Fakes are refunded twice over.",
    stat: "100%",
    statLabel: "authenticated",
  },
];

export default function WhyChooseUs() {
  return (
    <section className="mt-24 bg-beige lg:mt-28">
      <div className="container-px py-16 lg:py-20">
        {/* Header */}
        <div className="mb-14 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <p className="section-kicker mb-3">The Baywoods promise</p>
            <h2 className="font-serif text-3xl leading-[1.05] text-ink lg:text-5xl">
              Why thousands of Kenyans
              <br className="hidden lg:inline" /> shop with us.
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-7 text-muted lg:text-right">
            Built for Kenya, from checkout to delivery. M-Pesa accepted, returns handled, authenticity guaranteed.
          </p>
        </div>

        {/* Reason grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-t border-stone">
          {reasons.map((reason, i) => (
            <motion.div
              key={reason.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="group border-b border-r border-stone p-7 lg:p-8 hover:bg-beige-dark transition-colors duration-300 last:border-r-0 sm:[&:nth-child(2)]:border-r-0 lg:[&:nth-child(2)]:border-r lg:[&:nth-child(4)]:border-r-0"
            >
              {/* Stat number */}
              <div className="mb-6 flex items-end justify-between">
                <span className="font-serif text-4xl leading-none text-ink">{reason.stat}</span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
                  {reason.statLabel}
                </span>
              </div>

              <reason.icon
                size={20}
                strokeWidth={1.4}
                className="mb-4 text-forest group-hover:scale-110 transition-transform duration-500"
              />
              <h3 className="text-sm font-semibold text-ink mb-2">{reason.title}</h3>
              <p className="text-xs leading-relaxed text-muted">{reason.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
