"use client";

import { motion } from "framer-motion";
import { Truck, ShieldCheck, RefreshCcw, Smartphone } from "lucide-react";

const reasons = [
  {
    icon: Truck,
    title: "Nairobi-fast delivery",
    body: "Same-day around CBD, next-day across the city. Countrywide G4S in 2-4 days.",
  },
  {
    icon: Smartphone,
    title: "M-Pesa, the easy way",
    body: "STK push checkout — no till numbers, no Paybill confusion. Pay in two taps.",
  },
  {
    icon: RefreshCcw,
    title: "14-day fit guarantee",
    body: "Wrong size? Free swap within 14 days, no questions asked.",
  },
  {
    icon: ShieldCheck,
    title: "100% authentic",
    body: "Every pair sourced direct or verified. Fakes get refunded 2×.",
  },
];

export default function WhyChooseUs() {
  return (
    <section className="container-px mt-28">
      <div className="max-w-2xl">
        <p className="text-[10px] font-semibold tracking-[0.28em] uppercase text-forest mb-3">
          The Baywoods promise
        </p>
        <h2 className="font-serif text-3xl lg:text-5xl text-ink leading-[1.05] tracking-tight">
          Why thousands of Kenyans
          <br className="hidden lg:inline" /> already shop with us.
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px mt-12 bg-stone/40 border border-stone/40">
        {reasons.map((reason, i) => (
          <motion.div
            key={reason.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.55, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="group relative bg-cream p-7 lg:p-8 hover:bg-beige-dark transition-colors duration-300"
          >
            <div className="flex items-center justify-between mb-6">
              <reason.icon
                size={22}
                strokeWidth={1.4}
                className="text-forest group-hover:scale-110 transition-transform duration-500"
              />
              <span className="text-[10px] font-semibold tracking-[0.18em] uppercase text-muted">
                0{i + 1}
              </span>
            </div>
            <h3 className="text-base font-semibold text-ink mb-2">{reason.title}</h3>
            <p className="text-xs leading-relaxed text-muted">{reason.body}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
