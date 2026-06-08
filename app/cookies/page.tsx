import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "How Baywoods Store uses cookies and similar tracking technologies.",
};

const LAST_UPDATED = "1 May 2026";

type CookieRow = { name: string; provider: string; purpose: string; duration: string };

const cookieTable: { category: string; description: string; canDisable: boolean; cookies: CookieRow[] }[] = [
  {
    category: "Essential",
    description: "Required for the site to function. Cannot be disabled.",
    canDisable: false,
    cookies: [
      { name: "sb-access-token", provider: "Supabase", purpose: "Keeps you logged in", duration: "1 hour" },
      { name: "sb-refresh-token", provider: "Supabase", purpose: "Renews your login session", duration: "60 days" },
      { name: "admin_session", provider: "Baywoods", purpose: "Admin panel authentication", duration: "Session" },
    ],
  },
  {
    category: "Functional",
    description: "Enhance your experience but are not strictly required.",
    canDisable: true,
    cookies: [
      { name: "cart (localStorage)", provider: "Baywoods", purpose: "Persists your shopping cart between visits", duration: "Persistent" },
      { name: "wishlist (localStorage)", provider: "Baywoods", purpose: "Remembers your saved items", duration: "Persistent" },
    ],
  },
  {
    category: "Analytics",
    description: "Help us understand how visitors use the site. All data is anonymised.",
    canDisable: true,
    cookies: [
      { name: "va-* (Vercel Analytics)", provider: "Vercel", purpose: "Page views and performance metrics — no cross-site tracking", duration: "Session" },
      { name: "_sentry-*", provider: "Sentry", purpose: "Error tracking and performance monitoring", duration: "Session" },
    ],
  },
];

export default function CookiesPage() {
  return (
    <div className="pt-24 lg:pt-28 pb-24">
      <div className="container-px">
        <div className="max-w-2xl mx-auto lg:mx-0 lg:max-w-3xl">
          {/* Header */}
          <div className="mb-12 lg:mb-16">
            <p className="text-[10px] font-semibold tracking-[0.25em] uppercase text-forest mb-3">
              Legal
            </p>
            <h1 className="font-serif text-5xl lg:text-6xl text-ink mb-4">Cookie Policy</h1>
            <p className="text-sm text-muted">Last updated: {LAST_UPDATED}</p>
          </div>

          {/* Intro */}
          <p className="text-[15px] text-ink/80 leading-relaxed mb-12 border-l-2 border-forest pl-5">
            Baywoods Store uses cookies and similar browser storage (localStorage) to make our site
            work, remember your preferences, and understand how it is used. This page explains what
            we use, why, and how you can control it.
          </p>

          {/* What are cookies */}
          <section className="mb-12" id="what-are-cookies">
            <h2 className="font-serif text-2xl text-ink mb-4">What are cookies?</h2>
            <p className="text-[15px] text-ink/75 leading-relaxed">
              Cookies are small text files stored in your browser when you visit a website. They allow
              the site to recognise your browser and remember state — like whether you are logged in.
              localStorage is a similar mechanism that stores data in your browser without an expiry date
              unless you clear it manually.
            </p>
          </section>

          {/* Cookie table */}
          <section className="mb-12" id="cookies-we-use">
            <h2 className="font-serif text-2xl text-ink mb-8">Cookies we use</h2>

            <div className="space-y-10">
              {cookieTable.map((cat) => (
                <div key={cat.category}>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-serif text-xl text-ink">{cat.category}</h3>
                    {!cat.canDisable && (
                      <span className="text-[10px] font-semibold tracking-wide uppercase bg-ink text-citrine px-2 py-0.5">
                        Required
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted mb-4">{cat.description}</p>
                  <div className="border border-stone overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-cream border-b border-stone">
                          <th className="text-left text-[10px] font-semibold tracking-widest uppercase text-muted px-4 py-3">Name</th>
                          <th className="text-left text-[10px] font-semibold tracking-widest uppercase text-muted px-4 py-3">Provider</th>
                          <th className="text-left text-[10px] font-semibold tracking-widest uppercase text-muted px-4 py-3 hidden sm:table-cell">Purpose</th>
                          <th className="text-left text-[10px] font-semibold tracking-widest uppercase text-muted px-4 py-3">Duration</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone">
                        {cat.cookies.map((row) => (
                          <tr key={row.name} className="bg-cream hover:bg-stone/20 transition-colors">
                            <td className="px-4 py-3 font-mono text-xs text-ink whitespace-nowrap">{row.name}</td>
                            <td className="px-4 py-3 text-ink/70">{row.provider}</td>
                            <td className="px-4 py-3 text-ink/70 hidden sm:table-cell">{row.purpose}</td>
                            <td className="px-4 py-3 text-ink/70 whitespace-nowrap">{row.duration}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Control */}
          <section className="mb-12" id="your-choices">
            <h2 className="font-serif text-2xl text-ink mb-4">Your choices</h2>
            <div className="space-y-4 text-[15px] text-ink/75 leading-relaxed">
              <p>
                <strong className="font-medium text-ink">Browser settings</strong> — All modern browsers allow you
                to view, manage, and delete cookies via their settings. Disabling essential cookies will break
                login and the shopping cart.
              </p>
              <p>
                <strong className="font-medium text-ink">Analytics opt-out</strong> — Vercel Analytics respects
                the browser&apos;s Do Not Track signal. Enable it in your browser settings to opt out.
              </p>
              <p>
                <strong className="font-medium text-ink">localStorage</strong> — You can clear localStorage at
                any time from your browser&apos;s developer tools or privacy settings. This will reset your cart
                and wishlist.
              </p>
            </div>
          </section>

          {/* Updates */}
          <section className="mb-12" id="updates">
            <h2 className="font-serif text-2xl text-ink mb-4">Updates to this policy</h2>
            <p className="text-[15px] text-ink/75 leading-relaxed">
              If we introduce new cookies or change how we use existing ones, we will update this page
              and note the date above. Significant changes will also be communicated via a banner on the site.
            </p>
          </section>

          {/* Contact */}
          <section className="mb-12" id="contact">
            <h2 className="font-serif text-2xl text-ink mb-4">Contact</h2>
            <p className="text-[15px] text-ink/75 leading-relaxed">
              Questions about cookies? Email us at{" "}
              <a href="mailto:privacy@baywoods.co.ke" className="text-forest underline underline-offset-2">
                privacy@baywoods.co.ke
              </a>{" "}
              or visit our{" "}
              <Link href="/contact" className="text-forest underline underline-offset-2">
                Contact page
              </Link>.
            </p>
          </section>

          {/* Footer nav */}
          <div className="mt-8 pt-8 border-t border-stone flex flex-wrap gap-5 text-sm text-muted">
            <Link href="/privacy" className="hover:text-ink transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-ink transition-colors">Terms &amp; Conditions</Link>
            <Link href="/contact" className="hover:text-ink transition-colors">Contact Us</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
