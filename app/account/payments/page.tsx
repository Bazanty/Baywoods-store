"use client";

import Link from "next/link";
import { ChevronLeft, CreditCard, Smartphone } from "lucide-react";

export default function PaymentMethodsPage() {
  return (
    <div className="pt-24 lg:pt-28 pb-24">
      <div className="container-px py-8 max-w-2xl">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/account" className="text-muted hover:text-ink transition-colors">
            <ChevronLeft size={18} />
          </Link>
          <h1 className="font-serif text-3xl text-ink">Payment Methods</h1>
        </div>

        <div className="space-y-4 mb-8">
          {/* M-Pesa is always available */}
          <div className="bg-cream border border-forest/30 p-5">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-forest/10 flex items-center justify-center">
                <Smartphone size={18} className="text-forest" />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">M-Pesa</p>
                <p className="text-xs text-muted">Lipa Na M-Pesa — always available at checkout</p>
              </div>
              <span className="ml-auto text-[10px] font-semibold bg-forest text-white px-2 py-0.5">
                Active
              </span>
            </div>
          </div>
        </div>

        {/* Saved cards placeholder */}
        <div className="text-center py-12 border border-dashed border-stone">
          <CreditCard size={36} className="text-stone mx-auto mb-3" strokeWidth={1} />
          <p className="text-sm font-medium text-ink mb-1">No saved cards</p>
          <p className="text-xs text-muted max-w-xs mx-auto">
            Card saving will be available once Stripe is fully integrated. You can always pay with M-Pesa at checkout.
          </p>
        </div>
      </div>
    </div>
  );
}
