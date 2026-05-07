import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "Terms and conditions for shopping at Baywoods Store.",
};

const LAST_UPDATED = "1 May 2026";

const sections = [
  {
    id: "acceptance",
    heading: "Acceptance of Terms",
    body: [
      "By accessing or using baywoods.co.ke, placing an order, or creating an account, you agree to be bound by these Terms & Conditions and our Privacy Policy.",
      "If you do not agree, please do not use the Site. We reserve the right to update these terms at any time. Continued use after changes are published constitutes acceptance.",
    ],
  },
  {
    id: "eligibility",
    heading: "Eligibility",
    body: [
      "You must be at least 16 years old to create an account or place an order. By using the Site you represent that you meet this requirement.",
      "Orders must be placed from within Kenya. International shipping is not currently available.",
    ],
  },
  {
    id: "orders",
    heading: "Orders & Payment",
    body: [
      "All prices are displayed in Kenyan Shillings (KES) and include VAT where applicable.",
      "We accept M-Pesa (via Safaricom Daraja STK Push) and card payments (via Stripe). Payment is required in full at the time of placing your order.",
      "An order confirmation email does not constitute acceptance of your order. Acceptance occurs when we dispatch the goods and send you a shipping confirmation.",
      "We reserve the right to cancel or refuse any order if stock is unavailable, payment cannot be verified, or we suspect fraudulent activity. In such cases a full refund will be issued.",
      "Coupon codes are single-use per account unless stated otherwise, cannot be combined, and have no cash value.",
    ],
  },
  {
    id: "shipping",
    heading: "Shipping & Delivery",
    body: [
      "Standard shipping (3–7 business days) costs KES 350. Express shipping (1–2 business days) costs KES 800. Free shipping thresholds may apply during promotions.",
      "Delivery timelines are estimates and may be affected by public holidays, carrier delays, or events outside our control. We are not liable for delays once goods have been handed to the carrier.",
      "Risk of loss and title pass to you upon delivery. Please inspect your order upon receipt and report any damage or discrepancy within 48 hours.",
    ],
  },
  {
    id: "returns",
    heading: "Returns & Exchanges",
    body: [
      "You may return most unused, unworn items with original tags attached within 14 days of delivery. Sale items are final sale unless they arrive defective.",
      "To initiate a return, contact us at support@baywoods.co.ke with your order number and reason. We will provide return instructions.",
      "Defective or incorrectly dispatched items are returned at our cost. Change-of-mind returns are returned at the customer's cost.",
      "Refunds are processed within 5–7 business days of receiving the returned item, to the original payment method.",
      "Items returned in a used, worn, or damaged condition (beyond normal inspection) will not be accepted and will be returned to you.",
    ],
  },
  {
    id: "products",
    heading: "Product Descriptions",
    body: [
      "We make every effort to display product colours, sizes, and descriptions accurately. However, actual colours may vary slightly due to monitor settings.",
      "Sizes are indicated in product descriptions. Refer to our size guide before ordering. We are not responsible for incorrect sizing where a size guide is provided.",
      "We reserve the right to discontinue products, change pricing, or modify product descriptions without prior notice.",
    ],
  },
  {
    id: "intellectual-property",
    heading: "Intellectual Property",
    body: [
      "All content on this Site — including text, images, logos, and code — is owned by or licensed to Baywoods Store and protected by copyright.",
      "You may not reproduce, distribute, or use our content without written permission, except as permitted by law (e.g. fair use for commentary or review).",
    ],
  },
  {
    id: "liability",
    heading: "Limitation of Liability",
    body: [
      "To the maximum extent permitted by Kenyan law, Baywoods Store is not liable for any indirect, incidental, or consequential damages arising from your use of the Site or our products.",
      "Our total liability to you for any claim shall not exceed the amount you paid for the order giving rise to that claim.",
      "Nothing in these terms limits liability for death, personal injury caused by our negligence, fraud, or any other liability that cannot be excluded by law.",
    ],
  },
  {
    id: "governing-law",
    heading: "Governing Law",
    body: [
      "These terms are governed by the laws of Kenya. Any disputes shall be subject to the exclusive jurisdiction of the courts of Kenya.",
    ],
  },
  {
    id: "contact",
    heading: "Contact",
    body: [
      "Questions about these terms? Email us at legal@baywoods.co.ke or visit our Contact page.",
    ],
  },
];

export default function TermsPage() {
  return (
    <div className="pt-24 lg:pt-28 pb-24">
      <div className="container-px">
        <div className="max-w-2xl mx-auto lg:mx-0 lg:max-w-3xl">
          {/* Header */}
          <div className="mb-12 lg:mb-16">
            <p className="text-[10px] font-semibold tracking-[0.25em] uppercase text-forest mb-3">
              Legal
            </p>
            <h1 className="font-serif text-5xl lg:text-6xl text-ink mb-4">Terms &amp; Conditions</h1>
            <p className="text-sm text-muted">Last updated: {LAST_UPDATED}</p>
          </div>

          {/* Intro */}
          <p className="text-[15px] text-ink/80 leading-relaxed mb-12 border-l-2 border-forest pl-5">
            Please read these terms carefully before using our website or placing an order.
            They form a legally binding agreement between you and Baywoods Store.
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
            <Link href="/privacy" className="hover:text-ink transition-colors">Privacy Policy</Link>
            <Link href="/cookies" className="hover:text-ink transition-colors">Cookie Policy</Link>
            <Link href="/contact" className="hover:text-ink transition-colors">Contact Us</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
