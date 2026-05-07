"use client";

import { useState } from "react";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Lock } from "lucide-react";
import Button from "@/components/ui/Button";

interface StripeCardFormProps {
  clientSecret: string;
  billingName: string;
  billingEmail: string;
  onSuccess: (paymentIntentId: string) => void;
  onError: (message: string) => void;
}

export default function StripeCardForm({
  clientSecret,
  billingName,
  billingEmail,
  onSuccess,
  onError,
}: StripeCardFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) {
      onError("Card payment is still loading. Please try again.");
      return;
    }

    setLoading(true);
    const card = elements.getElement(CardElement);
    if (!card) {
      setLoading(false);
      onError("Card details could not be loaded. Please refresh and try again.");
      return;
    }

    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card,
        billing_details: { name: billingName, email: billingEmail },
      },
    });

    setLoading(false);

    if (error) {
      onError(error.message ?? "Card payment failed.");
    } else if (paymentIntent?.status === "succeeded") {
      onSuccess(paymentIntent.id);
    } else {
      onError("Payment did not complete. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-3.5 border border-stone bg-white rounded-sm">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: "14px",
                color: "#1E293B",
                fontFamily: "Inter, Arial, sans-serif",
                "::placeholder": { color: "#94a3b8" },
              },
              invalid: { color: "#dc2626" },
            },
          }}
        />
      </div>

      <div className="flex items-center gap-2 text-xs text-muted">
        <Lock size={11} className="text-forest" />
        Secured by Stripe - your card details are encrypted
      </div>

      <Button type="submit" className="w-full" size="lg" loading={loading} disabled={!stripe || !elements}>
        Pay Now
      </Button>
    </form>
  );
}
