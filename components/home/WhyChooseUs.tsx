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
        <div className="mb-14 grid grid-cols-12 gap-6 items-end border-b border-ink/15 pb-6">
          <div className="col-span-12 lg:col-span-7">
            <h2 className="font-display font-medium tracking-[-0.025em] leading-[0.94] text-ink text-4xl sm:text-5xl lg:text-[3.5rem]">
              Why thousands of Kenyans <br className="hidden lg:inline" /> shop with us.
            </h2>
          </div>
          <p className="col-span-12 lg:col-span-5 lg:text-right font-mono text-[11px] tracking-[0.16em] uppercase text-muted leading-relaxed">
            Built for Kenya, from checkout to delivery. M-Pesa, returns, authenticity &mdash; handled.
          </p>
        </div>

        {/* Reason grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 border-t border-ink/15">
          {reasons.map((reason, i) => (
            <motion.div
              key={reason.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
              className="group relative border-b border-r border-ink/15 p-7 lg:p-8 hover:bg-beige-dark transition-colors duration-300 last:border-r-0 sm:[&:nth-child(2)]:border-r-0 lg:[&:nth-child(2)]:border-r lg:[&:nth-child(4)]:border-r-0"
            >
              {/* Numbered chapter */}
              <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted">
                / {String(i + 1).padStart(2, "0")}
              </p>

              <div className="mt-6 flex items-end justify-between">
                <span className="font-display text-5xl leading-none tracking-[-0.03em] text-ink">{reason.stat}</span>
                <span className="font-mono text-[10px] tracking-[0.16em] uppercase text-muted">
                  {reason.statLabel}
                </span>
              </div>

              <reason.icon
                size={20}
                strokeWidth={1.5}
                className="mt-6 mb-4 text-ink group-hover:text-citrine transition-colors duration-300"
              />
              <h3 className="font-display text-lg tracking-[-0.01em] text-ink mb-2">{reason.title}</h3>
              <p className="text-xs leading-relaxed text-muted">{reason.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
