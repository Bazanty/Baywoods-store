import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Baywoods Store collects, uses, and protects your personal information.",
};

const LAST_UPDATED = "1 May 2026";

const sections = [
  {
    id: "information-we-collect",
    heading: "Information We Collect",
    body: [
      "When you create an account we collect your name, email address, phone number, and password (stored as a secure hash). We never store your raw password.",
      "When you place an order we collect your shipping address, M-Pesa payment details, and order history. M-Pesa payments are processed through Safaricom's Daraja API.",
      "We automatically collect certain technical data when you use our site: IP address, browser type, referring URL, pages viewed, and device type. This helps us improve the site and diagnose issues.",
    ],
  },
  {
    id: "how-we-use-it",
    heading: "How We Use Your Information",
    body: [
      "To process and fulfil your orders, including sending order confirmations, shipping updates, and delivery notifications via email and SMS.",
      "To manage your account, authenticate you when you log in, and remember your preferences.",
      "To send you marketing emails and SMS messages about new arrivals, promotions, and sales — but only if you have opted in. You can unsubscribe at any time.",
      "To prevent fraud, detect abuse, and keep our platform secure.",
      "To improve our products and website based on aggregate analytics. We do not sell individual data.",
    ],
  },
  {
    id: "sharing",
    heading: "Who We Share Your Data With",
    body: [
      "Safaricom / M-Pesa (via Daraja API) — for mobile money processing.",
      "Resend — for transactional and marketing emails.",
      "Africa's Talking — for SMS notifications.",
      "Cloudinary — for storing product and user-uploaded images.",
      "Supabase — our database and authentication provider, hosted on AWS.",
      "We do not sell, rent, or trade your personal data to third parties for their own marketing.",
    ],
  },
  {
    id: "retention",
    heading: "How Long We Keep Your Data",
    body: [
      "Account data is retained as long as your account is active. You can delete your account at any time from Account Settings.",
      "Order records are retained for 7 years for tax and accounting purposes, even after account deletion.",
      "Marketing preferences and email logs are deleted within 30 days of unsubscribing.",
    ],
  },
  {
    id: "your-rights",
    heading: "Your Rights",
    body: [
      "You have the right to access a copy of the personal data we hold about you.",
      "You have the right to correct inaccurate data — you can do this directly in Account Settings.",
      "You have the right to request deletion of your personal data, subject to our legal retention obligations.",
      "You have the right to opt out of marketing communications at any time using the unsubscribe link in any email we send.",
      "To exercise any of these rights, contact us at privacy@baywoods.co.ke.",
    ],
  },
  {
    id: "cookies",
    heading: "Cookies",
    body: [
      "We use essential cookies to keep you logged in and remember your cart. These cannot be disabled without breaking core functionality.",
      "We use analytics cookies (via Vercel Analytics) to understand how visitors use our site. These are anonymised and do not identify you personally.",
      "See our Cookie Policy for full details.",
    ],
  },
  {
    id: "security",
    heading: "Security",
    body: [
      "All data is transmitted over HTTPS. Passwords are hashed using bcrypt. Payment data is handled exclusively by PCI-DSS compliant third parties.",
      "We perform regular security reviews and apply updates promptly. However, no internet transmission is 100% secure, and we cannot guarantee absolute security.",
    ],
  },
  {
    id: "changes",
    heading: "Changes to This Policy",
    body: [
      "We may update this policy as our services evolve. We will notify you of significant changes via email or a banner on the site. Continued use of the site after changes constitutes acceptance.",
    ],
  },
  {
    id: "contact",
    heading: "Contact",
    body: [
      "If you have questions about this policy or want to exercise your rights, email us at privacy@baywoods.co.ke or write to: Baywoods Store, Nairobi, Kenya.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="pt-24 lg:pt-28 pb-24">
      <div className="container-px">
        <div className="max-w-2xl mx-auto lg:mx-0 lg:max-w-3xl">
          {/* Header */}
          <div className="mb-12 lg:mb-16">
            <p className="text-[10px] font-semibold tracking-[0.25em] uppercase text-forest mb-3">
              Legal
            </p>
            <h1 className="font-serif text-5xl lg:text-6xl text-ink mb-4">Privacy Policy</h1>
            <p className="text-sm text-muted">Last updated: {LAST_UPDATED}</p>
          </div>

          {/* Intro */}
          <p className="text-[15px] text-ink/80 leading-relaxed mb-12 border-l-2 border-forest pl-5">
            Baywoods Store (&ldquo;we&rdquo;, &ldquo;us&rdquo;) is committed to protecting your privacy.
            This policy explains what data we collect, why we collect it, and your rights over it.
            It applies to all users of baywoods.co.ke.
          </p>

          {/* ToC */}
          <nav className="mb-14 p-6 bg-cream border border-stone">
            <p className="text-xs font-semibold tracking-widest uppercase text-muted mb-4">Contents</p>
            <ol className="space-y-2">
              {sections.map((s, i) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="text-sm text-ink/70 hover:text-forest transition-colors"
                  >
                    {i + 1}. {s.heading}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          {/* Sections */}
          <div className="space-y-12">
            {sections.map((s, i) => (
              <section key={s.id} id={s.id}>
                <h2 className="font-serif text-2xl text-ink mb-5">
                  {i + 1}. {s.heading}
                </h2>
                <ul className="space-y-3">
                  {s.body.map((para, j) => (
                    <li key={j} className="flex gap-3 text-[15px] text-ink/75 leading-relaxed">
                      <span className="shrink-0 w-1 h-1 rounded-full bg-forest/40 mt-[0.6em]" />
                      <span>{para}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          {/* Footer nav */}
          <div className="mt-16 pt-8 border-t border-stone flex flex-wrap gap-5 text-sm text-muted">
            <Link href="/terms" className="hover:text-ink transition-colors">Terms &amp; Conditions</Link>
            <Link href="/cookies" className="hover:text-ink transition-colors">Cookie Policy</Link>
            <Link href="/contact" className="hover:text-ink transition-colors">Contact Us</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
