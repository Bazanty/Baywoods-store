"use client";

import Link from "next/link";
import { Instagram, Twitter } from "lucide-react";

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.73a4.85 4.85 0 0 1-1.01-.04z" />
  </svg>
);

const columns = [
  {
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
    title: "Help",
    links: [
      { label: "FAQ", href: "/contact#faq" },
      { label: "Shipping & Delivery", href: "/contact#shipping" },
      { label: "Returns & Exchanges", href: "/contact#returns" },
      { label: "Size Guide", href: "/contact#sizing" },
      { label: "Track My Order", href: "/account/orders" },
      { label: "Contact Us", href: "/contact" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Baywoods", href: "/about" },
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms & Conditions", href: "/terms" },
      { label: "Cookie Policy", href: "/cookies" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="bg-ink text-white mt-24">
      {/* Newsletter strip */}
      <div className="border-b border-white/10">
        <div className="container-px py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div>
            <p className="font-serif text-2xl">Stay in the loop.</p>
            <p className="text-sm text-white/50 mt-1">
              New drops, exclusive deals, no spam.
            </p>
          </div>
          <form
            onSubmit={(e) => e.preventDefault()}
            className="flex w-full sm:w-auto gap-0"
          >
            <input
              type="email"
              placeholder="your@email.com"
              className="flex-1 sm:w-64 bg-white/10 border border-white/20 text-white text-sm px-4 py-3 outline-none placeholder:text-white/40 focus:border-white/40 transition-colors"
            />
            <button
              type="submit"
              className="px-5 py-3 bg-forest text-white text-sm font-medium hover:bg-forest-dark transition-colors shrink-0"
            >
              Subscribe
            </button>
          </form>
        </div>
      </div>

      {/* Main footer */}
      <div className="container-px py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link
              href="/"
              className="font-serif text-2xl font-semibold tracking-wider text-white"
            >
              BAYWOODS
            </Link>
            <p className="text-sm text-white/50 mt-4 leading-relaxed max-w-xs">
              Kenyan streetwear for the culture. Quality pieces, fair prices, delivered to your door.
            </p>
            <div className="flex gap-4 mt-6">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/50 hover:text-white transition-colors"
                aria-label="Instagram"
              >
                <Instagram size={18} />
              </a>
              <a
                href="https://tiktok.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/50 hover:text-white transition-colors"
                aria-label="TikTok"
              >
                <TikTokIcon />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/50 hover:text-white transition-colors"
                aria-label="Twitter/X"
              >
                <Twitter size={18} />
              </a>
            </div>
          </div>

          {/* Links */}
          {columns.map((col) => (
            <div key={col.title}>
              <p className="text-[10px] font-semibold tracking-[0.18em] uppercase text-white/40 mb-5">
                {col.title}
              </p>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/60 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-white/30">
            © {new Date().getFullYear()} Baywoods Store. All rights reserved.
          </p>
          <div className="flex items-center gap-3">
            {["Visa", "Mastercard", "M-Pesa", "PayPal"].map((method) => (
              <span
                key={method}
                className="text-[10px] font-medium text-white/40 border border-white/10 px-2 py-0.5"
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
