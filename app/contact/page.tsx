"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, MessageCircle, Clock, ChevronDown } from "lucide-react";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";

const faqs = [
  {
    q: "How long does delivery take?",
    a: "Standard shipping takes 3–7 business days. Express shipping delivers within 1–2 business days. We ship across Kenya via multiple carriers.",
  },
  {
    q: "Can I pay with M-Pesa?",
    a: "Yes! We support M-Pesa via Safaricom Daraja STK Push. You'll receive a payment prompt on your phone at checkout. Till Number: 5234789.",
  },
  {
    q: "What's your returns policy?",
    a: "We accept returns within 14 days of delivery. Items must be unworn, unwashed, with original tags attached. Defective or wrong items get free returns. Refunds process within 5–7 business days.",
  },
  {
    q: "How do I track my order?",
    a: "Once your order ships, you'll receive an SMS and email with your tracking number. You can also view order status in your account under 'My Orders'.",
  },
  {
    q: "What if something doesn't fit?",
    a: "We offer free size exchanges within the 14-day window. Use our size guide before ordering to find the right fit. When in doubt, size up.",
  },
  {
    q: "Do you ship outside Kenya?",
    a: "Currently we ship within Kenya only. International shipping is planned for Phase 4 of our roadmap. Sign up for our newsletter to be notified.",
  },
];

export default function ContactPage() {
  const [open, setOpen] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    } catch {
      // Best effort — show success regardless
    }
    setLoading(false);
    setSent(true);
  };

  const set = (field: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => setForm((f) => ({ ...f, [field]: e.target.value }));

  return (
    <div className="pt-24 lg:pt-28 pb-24">
      <div className="container-px py-8">
        {/* Header */}
        <div className="mb-12">
          <p className="text-[10px] font-semibold tracking-[0.25em] uppercase text-forest mb-2">
            Get in Touch
          </p>
          <h1 className="font-serif text-5xl text-ink">Help Center</h1>
        </div>

        <div className="grid lg:grid-cols-[1fr_380px] gap-12">
          {/* FAQ */}
          <div id="faq">
            <h2 className="font-serif text-2xl text-ink mb-6">Frequently Asked</h2>
            <div className="space-y-0">
              {faqs.map((faq, i) => (
                <div key={i} className="border-b border-stone">
                  <button
                    onClick={() => setOpen(open === i ? null : i)}
                    className="w-full flex items-start justify-between py-5 text-left gap-4"
                  >
                    <p className="text-sm font-medium text-ink">{faq.q}</p>
                    <ChevronDown
                      size={15}
                      className={`text-muted shrink-0 mt-0.5 transition-transform duration-200 ${
                        open === i ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                  {open === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="pb-5"
                    >
                      <p className="text-sm text-muted leading-relaxed">{faq.a}</p>
                    </motion.div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Contact form + channels */}
          <div className="space-y-6">
            {/* Quick channels */}
            <div className="space-y-3">
              <a
                href="https://wa.me/254700000000"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-4 bg-cream border border-stone hover:border-forest transition-colors group"
              >
                <MessageCircle
                  size={18}
                  className="text-forest group-hover:text-forest-dark transition-colors"
                  strokeWidth={1.5}
                />
                <div>
                  <p className="text-sm font-medium text-ink">WhatsApp Support</p>
                  <p className="text-xs text-muted">Fastest response · usually within 1 hour</p>
                </div>
              </a>
              <a
                href="mailto:hello@baywoodsstore.com"
                className="flex items-center gap-3 p-4 bg-cream border border-stone hover:border-forest transition-colors group"
              >
                <Mail
                  size={18}
                  className="text-forest group-hover:text-forest-dark transition-colors"
                  strokeWidth={1.5}
                />
                <div>
                  <p className="text-sm font-medium text-ink">Email Us</p>
                  <p className="text-xs text-muted">hello@baywoodsstore.com</p>
                </div>
              </a>
              <div className="flex items-center gap-3 p-4 bg-cream border border-stone">
                <Clock size={18} className="text-muted" strokeWidth={1.5} />
                <div>
                  <p className="text-sm font-medium text-ink">Support Hours</p>
                  <p className="text-xs text-muted">Mon–Fri, 8am–6pm EAT</p>
                </div>
              </div>
            </div>

            {/* Contact form */}
            <div className="bg-cream border border-stone p-6">
              <h3 className="font-serif text-lg text-ink mb-5">Send a Message</h3>

              {sent ? (
                <div className="text-center py-6">
                  <p className="text-forest font-semibold mb-1">Message sent!</p>
                  <p className="text-xs text-muted">
                    We&apos;ll get back to you within 24 hours.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input
                    label="Name"
                    required
                    value={form.name}
                    onChange={set("name")}
                    placeholder="Your name"
                  />
                  <Input
                    label="Email"
                    type="email"
                    required
                    value={form.email}
                    onChange={set("email")}
                    placeholder="you@email.com"
                  />
                  <div>
                    <label className="label-base">Subject</label>
                    <select
                      value={form.subject}
                      onChange={set("subject")}
                      required
                      className="input-base"
                    >
                      <option value="">Select a topic</option>
                      <option value="order">Order Issue</option>
                      <option value="return">Return / Exchange</option>
                      <option value="shipping">Shipping Query</option>
                      <option value="product">Product Question</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="label-base">Message</label>
                    <textarea
                      required
                      value={form.message}
                      onChange={set("message")}
                      rows={4}
                      placeholder="How can we help?"
                      className="input-base resize-none"
                    />
                  </div>
                  <Button type="submit" loading={loading} className="w-full">
                    Send Message
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
