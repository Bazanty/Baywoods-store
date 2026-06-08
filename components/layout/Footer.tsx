"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Instagram, Twitter } from "lucide-react";

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.73a4.85 4.85 0 0 1-1.01-.04z" />
  </svg>
);

const columns = [
  {
    n: "01",
    title: "Shop",
    links: [
      { label: "New Arrivals", href: "/new-arrivals" },
      { label: "Shoes", href: "/shop/shoes" },
      { label: "Hoodies", href: "/shop/hoodies" },
      { label: "Joggers", href: "/shop/joggers" },
      { label: "Accessories", href: "/shop/accessories" },
      { label: "Sale", href: "/sale" },
    ],
  },
  {
    n: "02",
    title: "Help",
    links: [
      { label: "FAQ", href: "/contact#faq" },
      { label: "Shipping & Delivery", href: "/contact#shipping" },
      { label: "Returns & Exchanges", href: "/contact#returns" },
      { label: "Size Guide", href: "/contact#sizing" },
      { label: "Track My Order", href: "/order/track" },
      { label: "Contact Us", href: "/contact" },
    ],
  },
  {
    n: "03",
    title: "Studio",
    links: [
      { label: "About Baywoods", href: "/about" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms & Conditions", href: "/terms" },
      { label: "Cookie Policy", href: "/cookies" },
    ],
  },
];

export default function Footer() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) throw new Error("Newsletter request failed");
      setEmail("");
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  return (
    <footer className="mt-20 lg:mt-24 border-t border-ink/15 bg-cream text-ink">
      {/* Newsletter strip */}
      <div className="border-b border-ink/15">
        <div className="container-px py-12 grid gap-6 md:grid-cols-[1.2fr_1fr] md:items-end">
          <div>
            <p className="section-kicker mb-4">00 — STAY POSTED</p>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl tracking-[-0.02em] leading-[0.96]">
              Drops, before <br className="hidden sm:inline" />everyone else.
            </h2>
          </div>
          <form onSubmit={handleNewsletter} className="w-full">
            <div className="flex items-center border-b-2 border-ink">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 bg-transparent text-ink text-base px-0 py-3 outline-none placeholder:text-muted"
              />
              <button
                type="submit"
                disabled={status === "loading"}
                className="px-4 py-3 font-mono text-[10px] tracking-[0.2em] uppercase text-ink hover:text-citrine transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {status === "loading" ? "Joining" : "Join"}
                <ArrowUpRight size={12} />
              </button>
            </div>
            {status === "success" && (
              <p className="mt-2 font-mono text-[10px] tracking-[0.16em] uppercase text-ink">
                / You&apos;re on the list.
              </p>
            )}
            {status === "error" && (
              <p className="mt-2 font-mono text-[10px] tracking-[0.16em] uppercase text-danger">
                / Could not subscribe. Try again.
              </p>
            )}
          </form>
        </div>
      </div>

      {/* Main footer */}
      <div className="container-px py-14">
        <div className="grid grid-cols-2 md:grid-cols-12 gap-y-10 md:gap-x-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-4">
            <Link
              href="/"
              className="font-display text-3xl tracking-[-0.02em] font-semibold text-ink"
            >
              BAYWOODS
            </Link>
            <p className="text-sm text-muted mt-4 leading-relaxed max-w-xs">
              Kenyan streetwear, assembled with intention. Real rotation pieces, fair prices, delivered nationwide.
            </p>
            <div className="flex gap-3 mt-6">
              {[
                { Icon: Instagram, href: "https://instagram.com", label: "Instagram" },
                { Icon: TikTokIcon, href: "https://tiktok.com", label: "TikTok" },
                { Icon: Twitter, href: "https://twitter.com", label: "Twitter" },
              ].map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-9 h-9 flex items-center justify-center border border-ink/20 text-ink/70 hover:bg-ink hover:text-citrine hover:border-ink transition-colors"
                >
                  <Icon />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {columns.map((col) => (
            <div key={col.title} className="md:col-span-2">
              <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted mb-5">
                <span className="text-ink">{col.n}</span>
                {" / "}
                {col.title}
              </p>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-ink/75 hover:text-ink hover:underline-citrine transition-all"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Contact block */}
          <div className="col-span-2 md:col-span-2">
            <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted mb-5">
              <span className="text-ink">04</span> / Locate
            </p>
            <p className="text-sm text-ink/75 leading-relaxed">
              Nairobi, Kenya<br />
              Mon–Sat · 9am – 7pm EAT
            </p>
            <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-muted mt-3">
              support@baywoods.co.ke
            </p>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-14 pt-6 border-t border-ink/15 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-muted">
            © {new Date().getFullYear()} Baywoods Store · Nairobi
          </p>
          <div className="flex items-center gap-2">
            {["M-Pesa"].map((method) => (
              <span
                key={method}
                className="font-mono text-[10px] tracking-[0.12em] uppercase text-ink/60 border border-ink/20 px-2 py-1"
              >
                {method}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
