"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Check, ChevronRight, Lock } from "lucide-react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useCartStore } from "@/lib/store";
import { useAuthStore } from "@/lib/authStore";
import { validateCoupon } from "@/lib/supabase/queries";
import { formatPrice } from "@/lib/utils";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import StripeCardForm from "@/components/checkout/StripeCardForm";

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

type Step = "shipping" | "payment" | "review";
type MpesaStatus = "idle" | "pending" | "success" | "failed";
const STEPS: Step[] = ["shipping", "payment", "review"];
const STEP_LABELS: Record<Step, string> = {
  shipping: "Shipping",
  payment: "Payment",
  review: "Review",
};

interface ShippingForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  county: string;
  method: "standard" | "express";
}

const SHIPPING_COSTS = { standard: 350, express: 800 };

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCartStore();
  const { user } = useAuthStore();
  const [step, setStep] = useState<Step>("shipping");
  const [paymentMethod, setPaymentMethod] = useState<"mpesa" | "card" | "paypal">("mpesa");
  const [mpesaPhone, setMpesaPhone] = useState("07");
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [orderNumber] = useState(() => Math.floor(Math.random() * 9000 + 1000));
  const [mpesaStatus, setMpesaStatus] = useState<MpesaStatus>("idle");
  const [mpesaMessage, setMpesaMessage] = useState("");
  const [checkoutRequestId, setCheckoutRequestId] = useState<string | null>(null);
  const [stripeClientSecret, setStripeClientSecret] = useState<string | null>(null);
  const [promoCode, setPromoCode] = useState("");
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoMsg, setPromoMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);

  const [shipping, setShipping] = useState<ShippingForm>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    county: "Nairobi",
    method: "standard",
  });

  const sub = subtotal();
  const shippingCost = sub >= 5000 ? 0 : SHIPPING_COSTS[shipping.method];
  const total = sub + shippingCost - promoDiscount;

  const buildOrderPayload = (resolvedCheckoutRequestId?: string) => ({
    userId: user?.id,
    email: shipping.email,
    phone: shipping.phone,
    shippingAddress: {
      firstName: shipping.firstName,
      lastName: shipping.lastName,
      address: shipping.address,
      city: shipping.city,
      county: shipping.county,
    },
    shippingMethod: shipping.method,
    shippingCost,
    subtotal: sub,
    total,
    paymentMethod,
    checkoutRequestId: resolvedCheckoutRequestId,
    items: items.map((item) => ({
      productId: item.product.id,
      productName: item.product.name,
      variantName: `${item.size} / ${item.color.name}`,
      unitPrice: item.product.salePrice ?? item.product.price,
      quantity: item.quantity,
      lineTotal: (item.product.salePrice ?? item.product.price) * item.quantity,
    })),
  });

  const persistOrder = async (resolvedCheckoutRequestId?: string, stripePaymentIntentId?: string) => {
    try {
      await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...buildOrderPayload(resolvedCheckoutRequestId), stripePaymentIntentId }),
      });
    } catch {
      // Order persistence failure — don't block user confirmation
    }
  };

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    setPromoMsg(null);
    try {
      const result = await validateCoupon(promoCode, sub);
      if (result.valid) {
        setPromoDiscount(result.discountAmount);
        setPromoMsg({ type: "success", text: `Discount of ${formatPrice(result.discountAmount)} applied!` });
      } else {
        setPromoDiscount(0);
        setPromoMsg({ type: "error", text: result.message ?? "Invalid coupon." });
      }
    } catch {
      setPromoMsg({ type: "error", text: "Failed to validate coupon. Try again." });
    }
    setPromoLoading(false);
  };

  const handleOrder = async () => {
    if (paymentMethod === "mpesa") {
      await handleMpesaPayment();
    } else if (paymentMethod === "paypal") {
      setLoading(true);
      await persistOrder();
      setLoading(false);
      clearCart();
      setConfirmed(true);
    }
    // card is handled by StripeCardForm inline
  };

  const handleStripePayment = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: total, currency: "kes" }),
      });
      const { clientSecret, error: piError } = await res.json();
      if (piError) throw new Error(piError);
      setStripeClientSecret(clientSecret);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not initialise payment";
      setMpesaStatus("failed");
      setMpesaMessage(msg);
    }
    setLoading(false);
  };

  const handleStripeSuccess = async (paymentIntentId: string) => {
    await persistOrder(undefined, paymentIntentId);
    clearCart();
    setConfirmed(true);
  };

  const handleStripeError = (message: string) => {
    setMpesaStatus("failed");
    setMpesaMessage(message);
  };

  const handleMpesaPayment = async () => {
    setLoading(true);
    setMpesaStatus("idle");
    setMpesaMessage("");

    try {
      const res = await fetch("/api/mpesa/stkpush", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: mpesaPhone, amount: total, orderId: String(orderNumber) }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMpesaStatus("failed");
        setMpesaMessage(data.error ?? "Failed to initiate payment. Try again.");
        setLoading(false);
        return;
      }

      setCheckoutRequestId(data.checkoutRequestId);
      setMpesaStatus("pending");
      setMpesaMessage(data.customerMessage ?? "Check your phone and enter your M-Pesa PIN.");

      // Poll for payment status every 4 seconds, up to 10 attempts
      let attempts = 0;
      const poll = setInterval(async () => {
        attempts++;
        try {
          const qRes = await fetch("/api/mpesa/query", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ checkoutRequestId: data.checkoutRequestId }),
          });
          const qData = await qRes.json();

          if (qData.resultCode === "0") {
            clearInterval(poll);
            setMpesaStatus("success");
            await persistOrder(data.checkoutRequestId);
            setLoading(false);
            clearCart();
            setConfirmed(true);
            return;
          }

          if (qData.resultCode && qData.resultCode !== "0") {
            clearInterval(poll);
            setMpesaStatus("failed");
            setMpesaMessage(qData.resultDesc ?? "Payment was not completed.");
            setLoading(false);
            return;
          }
        } catch {
          // Query error — keep polling
        }

        if (attempts >= 10) {
          clearInterval(poll);
          setMpesaStatus("failed");
          setMpesaMessage("Payment timed out. Please try again.");
          setLoading(false);
        }
      }, 4000);
    } catch {
      setMpesaStatus("failed");
      setMpesaMessage("Network error. Please try again.");
      setLoading(false);
    }
  };

  if (confirmed) {
    return (
      <div className="pt-32 pb-24 flex flex-col items-center justify-center min-h-[70vh] text-center px-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", damping: 20 }}
          className="w-16 h-16 bg-forest rounded-full flex items-center justify-center mb-6"
        >
          <Check size={28} className="text-white" />
        </motion.div>
        <h1 className="font-serif text-4xl text-ink mb-3">Order Confirmed!</h1>
        <p className="text-muted text-sm max-w-sm mb-2">
          Your order has been placed. You'll receive an email and SMS confirmation shortly.
        </p>
        <p className="text-xs text-muted mb-8">Order #BW-2026-{orderNumber}</p>
        <div className="flex gap-3">
          <Link
            href="/account/orders"
            className="inline-flex items-center justify-center gap-2 font-sans font-medium tracking-wide transition-all duration-200 active:scale-[0.98] border border-ink text-ink hover:bg-ink hover:text-white text-sm px-6 py-3"
          >
            Track Order
          </Link>
          <Link
            href="/shop"
            className="inline-flex items-center justify-center gap-2 font-sans font-medium tracking-wide transition-all duration-200 active:scale-[0.98] bg-forest text-white hover:bg-forest-dark text-sm px-6 py-3"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="pt-32 pb-24 flex flex-col items-center justify-center min-h-[70vh] text-center px-6">
        <h1 className="font-serif text-3xl text-ink mb-4">Your cart is empty</h1>
        <Link
          href="/shop"
          className="inline-flex items-center justify-center gap-2 font-sans font-medium tracking-wide transition-all duration-200 active:scale-[0.98] bg-forest text-white hover:bg-forest-dark text-sm px-6 py-3"
        >
          Shop Now
        </Link>
      </div>
    );
  }

  const currentIdx = STEPS.indexOf(step);

  return (
    <div className="pt-20 lg:pt-24 pb-24">
      <div className="container-px py-8">
        {/* Header */}
        <div className="mb-10">
          <Link href="/" className="font-serif text-2xl tracking-wider text-ink">
            BAYWOODS
          </Link>
          <div className="flex items-center gap-2 mt-6">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <button
                  onClick={() => i < currentIdx && setStep(s)}
                  disabled={i >= currentIdx}
                  className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                    s === step ? "text-ink" : i < currentIdx ? "text-forest cursor-pointer" : "text-muted"
                  }`}
                >
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${
                      i < currentIdx
                        ? "bg-forest text-white"
                        : s === step
                        ? "bg-ink text-white"
                        : "bg-stone text-muted"
                    }`}
                  >
                    {i < currentIdx ? <Check size={12} /> : i + 1}
                  </span>
                  {STEP_LABELS[s]}
                </button>
                {i < STEPS.length - 1 && (
                  <ChevronRight size={14} className="text-stone" />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_400px] gap-10">
          {/* Left: Steps */}
          <div>
            <AnimatePresence mode="wait">
              {step === "shipping" && (
                <motion.div
                  key="shipping"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.25 }}
                >
                  <h2 className="font-serif text-2xl text-ink mb-6">Shipping Information</h2>

                  {/* Guest / sign in */}
                  <div className="bg-forest-muted border border-forest/20 p-4 mb-6 flex items-center justify-between">
                    <p className="text-sm text-forest-dark">
                      Have an account?{" "}
                      <Link href="/auth/signin" className="font-semibold underline underline-offset-2">
                        Sign in
                      </Link>{" "}
                      to autofill your details.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="First Name"
                      value={shipping.firstName}
                      onChange={(e) => setShipping({ ...shipping, firstName: e.target.value })}
                      placeholder="Brian"
                    />
                    <Input
                      label="Last Name"
                      value={shipping.lastName}
                      onChange={(e) => setShipping({ ...shipping, lastName: e.target.value })}
                      placeholder="Nyakundi"
                    />
                    <div className="col-span-2">
                      <Input
                        label="Email"
                        type="email"
                        value={shipping.email}
                        onChange={(e) => setShipping({ ...shipping, email: e.target.value })}
                        placeholder="brian@email.com"
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        label="Phone"
                        type="tel"
                        value={shipping.phone}
                        onChange={(e) => setShipping({ ...shipping, phone: e.target.value })}
                        placeholder="0712 345 678"
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        label="Street Address"
                        value={shipping.address}
                        onChange={(e) => setShipping({ ...shipping, address: e.target.value })}
                        placeholder="123 Kimathi Street, CBD"
                      />
                    </div>
                    <Input
                      label="City"
                      value={shipping.city}
                      onChange={(e) => setShipping({ ...shipping, city: e.target.value })}
                      placeholder="Nairobi"
                    />
                    <div>
                      <label className="label-base">County</label>
                      <select
                        value={shipping.county}
                        onChange={(e) => setShipping({ ...shipping, county: e.target.value })}
                        className="input-base"
                      >
                        {["Nairobi", "Mombasa", "Kisumu", "Nakuru", "Eldoret", "Thika", "Other"].map(
                          (c) => (
                            <option key={c} value={c}>{c}</option>
                          )
                        )}
                      </select>
                    </div>
                  </div>

                  {/* Shipping method */}
                  <div className="mt-8">
                    <p className="label-base mb-3">Delivery Method</p>
                    <div className="space-y-3">
                      {[
                        { value: "standard", label: "Standard Shipping", sub: "3–7 business days", cost: sub >= 5000 ? 0 : SHIPPING_COSTS.standard },
                        { value: "express", label: "Express Shipping", sub: "1–2 business days", cost: sub >= 5000 ? 0 : SHIPPING_COSTS.express },
                      ].map((opt) => (
                        <label
                          key={opt.value}
                          className={`flex items-center justify-between p-4 border cursor-pointer transition-colors ${
                            shipping.method === opt.value ? "border-ink bg-cream" : "border-stone hover:border-ink"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="shipping"
                              value={opt.value}
                              checked={shipping.method === (opt.value as "standard" | "express")}
                              onChange={() => setShipping({ ...shipping, method: opt.value as "standard" | "express" })}
                              className="accent-forest"
                            />
                            <div>
                              <p className="text-sm font-medium text-ink">{opt.label}</p>
                              <p className="text-xs text-muted">{opt.sub}</p>
                            </div>
                          </div>
                          <p className="text-sm font-semibold text-ink">
                            {opt.cost === 0 ? "Free" : formatPrice(opt.cost)}
                          </p>
                        </label>
                      ))}
                    </div>
                  </div>

                  <Button
                    className="mt-8 w-full"
                    size="lg"
                    onClick={() => setStep("payment")}
                    disabled={!shipping.firstName || !shipping.lastName || !shipping.email || !shipping.phone || !shipping.address || !shipping.city}
                  >
                    Continue to Payment
                  </Button>
                </motion.div>
              )}

              {step === "payment" && (
                <motion.div
                  key="payment"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.25 }}
                >
                  <h2 className="font-serif text-2xl text-ink mb-6">Payment</h2>

                  {/* Method tabs */}
                  <div className="flex border border-stone mb-6">
                    {[
                      { value: "mpesa", label: "M-Pesa" },
                      { value: "card", label: "Card" },
                      { value: "paypal", label: "PayPal" },
                    ].map((m) => (
                      <button
                        key={m.value}
                        onClick={() => setPaymentMethod(m.value as typeof paymentMethod)}
                        className={`flex-1 py-3 text-sm font-medium transition-colors ${
                          paymentMethod === m.value
                            ? "bg-ink text-white"
                            : "text-muted hover:text-ink hover:bg-stone/30"
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>

                  {paymentMethod === "mpesa" && (
                    <div className="space-y-4">
                      <div className="bg-forest-muted border border-forest/20 p-4">
                        <p className="text-sm text-forest-dark font-medium mb-1">M-Pesa STK Push</p>
                        <p className="text-xs text-muted">
                          Enter your M-Pesa number. A payment prompt will be sent to your phone.
                        </p>
                      </div>
                      <Input
                        label="M-Pesa Phone Number"
                        type="tel"
                        value={mpesaPhone}
                        onChange={(e) => setMpesaPhone(e.target.value)}
                        placeholder="0712 345 678"
                      />
                      {mpesaStatus === "pending" && mpesaMessage && (
                        <div className="bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800 flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full border-2 border-amber-500 border-t-transparent animate-spin shrink-0" />
                          {mpesaMessage}
                        </div>
                      )}
                      {mpesaStatus === "failed" && mpesaMessage && (
                        <p className="text-xs text-danger bg-red-50 border border-red-100 px-3 py-2">
                          {mpesaMessage}
                        </p>
                      )}
                    </div>
                  )}

                  {paymentMethod === "card" && (
                    <div className="space-y-4">
                      {stripeClientSecret && stripePromise ? (
                        <Elements stripe={stripePromise} options={{ clientSecret: stripeClientSecret }}>
                          <StripeCardForm
                            clientSecret={stripeClientSecret}
                            billingName={`${shipping.firstName} ${shipping.lastName}`}
                            billingEmail={shipping.email}
                            onSuccess={handleStripeSuccess}
                            onError={handleStripeError}
                          />
                        </Elements>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-xs text-muted bg-stone/30 border border-stone px-4 py-3">
                            Click &quot;Review Order&quot; to load the secure card payment form.
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted">
                            <Lock size={11} className="text-forest" />
                            Secured by Stripe — your card details are encrypted
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {paymentMethod === "paypal" && (
                    <div className="text-center py-8">
                      <p className="text-sm text-muted">
                        You'll be redirected to PayPal to complete your payment securely.
                      </p>
                    </div>
                  )}

                  <div className="flex gap-3 mt-8">
                    <Button
                      variant="outline"
                      onClick={() => setStep("shipping")}
                      className="w-1/3"
                      disabled={loading}
                    >
                      Back
                    </Button>
                    <Button
                      className="flex-1"
                      size="lg"
                      loading={loading}
                      onClick={async () => {
                        if (paymentMethod === "card" && !stripeClientSecret) {
                          await handleStripePayment();
                        } else {
                          setStep("review");
                        }
                      }}
                    >
                      {paymentMethod === "card" && !stripeClientSecret ? "Load Card Form" : "Review Order"}
                    </Button>
                  </div>
                </motion.div>
              )}

              {step === "review" && (
                <motion.div
                  key="review"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  transition={{ duration: 0.25 }}
                >
                  <h2 className="font-serif text-2xl text-ink mb-6">Review & Confirm</h2>

                  {/* Shipping summary */}
                  <div className="bg-cream border border-stone p-5 mb-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-xs font-semibold tracking-widest uppercase text-muted mb-2">
                          Shipping To
                        </p>
                        <p className="text-sm font-medium text-ink">
                          {shipping.firstName} {shipping.lastName}
                        </p>
                        <p className="text-sm text-muted">{shipping.address}, {shipping.city}</p>
                        <p className="text-sm text-muted">{shipping.email}</p>
                      </div>
                      <button
                        onClick={() => setStep("shipping")}
                        className="text-xs text-forest underline underline-offset-2"
                      >
                        Edit
                      </button>
                    </div>
                  </div>

                  <div className="bg-cream border border-stone p-5 mb-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-xs font-semibold tracking-widest uppercase text-muted mb-2">
                          Payment
                        </p>
                        <p className="text-sm font-medium text-ink capitalize">{paymentMethod}</p>
                        {paymentMethod === "mpesa" && (
                          <p className="text-sm text-muted">{mpesaPhone}</p>
                        )}
                      </div>
                      <button
                        onClick={() => setStep("payment")}
                        className="text-xs text-forest underline underline-offset-2"
                      >
                        Edit
                      </button>
                    </div>
                  </div>

                  {mpesaStatus === "pending" && (
                    <div className="bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800 flex items-center gap-2 mb-4">
                      <div className="w-3 h-3 rounded-full border-2 border-amber-500 border-t-transparent animate-spin shrink-0" />
                      Waiting for M-Pesa payment…
                    </div>
                  )}
                  {mpesaStatus === "failed" && mpesaMessage && (
                    <p className="text-xs text-danger bg-red-50 border border-red-100 px-3 py-2 mb-4">
                      {mpesaMessage}
                    </p>
                  )}

                  {paymentMethod === "card" && stripeClientSecret && stripePromise ? (
                    <div className="mt-2">
                      <Elements stripe={stripePromise} options={{ clientSecret: stripeClientSecret }}>
                        <StripeCardForm
                          clientSecret={stripeClientSecret}
                          billingName={`${shipping.firstName} ${shipping.lastName}`}
                          billingEmail={shipping.email}
                          onSuccess={handleStripeSuccess}
                          onError={handleStripeError}
                        />
                      </Elements>
                    </div>
                  ) : (
                    <div className="flex gap-3">
                      <Button
                        variant="outline"
                        onClick={() => setStep("payment")}
                        className="w-1/3"
                        disabled={loading}
                      >
                        Back
                      </Button>
                      <Button
                        className="flex-1"
                        size="lg"
                        loading={loading}
                        onClick={handleOrder}
                      >
                        {paymentMethod === "mpesa"
                          ? `Pay ${formatPrice(total)} via M-Pesa`
                          : `Place Order — ${formatPrice(total)}`}
                      </Button>
                    </div>
                  )}

                  <p className="text-xs text-muted text-center mt-4 flex items-center justify-center gap-1">
                    <Lock size={11} /> All transactions are encrypted and secure
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Order summary sidebar */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="bg-cream border border-stone p-6">
              <p className="text-xs font-semibold tracking-widest uppercase text-muted mb-5">
                Order Summary
              </p>

              <ul className="space-y-4 mb-5">
                {items.map((item) => (
                  <li key={`${item.product.id}-${item.size}-${item.color.name}`} className="flex gap-3">
                    <div className="relative w-14 h-16 bg-beige shrink-0 overflow-hidden">
                      <Image
                        src={item.product.images[0]}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                      <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-ink text-white text-[10px] font-semibold rounded-full flex items-center justify-center">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-ink line-clamp-1">{item.product.name}</p>
                      <p className="text-xs text-muted">{item.size} · {item.color.name}</p>
                      <p className="text-xs font-semibold mt-0.5">
                        {formatPrice((item.product.salePrice ?? item.product.price) * item.quantity)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Promo */}
              <div className="mb-5">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    placeholder="Promo code"
                    className="input-base text-xs py-2"
                  />
                  <button
                    onClick={handleApplyPromo}
                    disabled={promoLoading || !promoCode.trim()}
                    className="px-3 py-2 bg-ink text-white text-xs font-medium hover:bg-ink/80 transition-colors shrink-0 disabled:opacity-50"
                  >
                    {promoLoading ? "…" : "Apply"}
                  </button>
                </div>
                {promoMsg && (
                  <p className={`text-xs mt-1.5 ${promoMsg.type === "success" ? "text-forest" : "text-danger"}`}>
                    {promoMsg.text}
                  </p>
                )}
              </div>

              <div className="space-y-2 pt-4 border-t border-stone">
                <div className="flex justify-between text-sm text-muted">
                  <span>Subtotal</span>
                  <span>{formatPrice(sub)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted">
                  <span>Shipping</span>
                  <span>{shippingCost === 0 ? "Free" : formatPrice(shippingCost)}</span>
                </div>
                {promoDiscount > 0 && (
                  <div className="flex justify-between text-sm text-forest">
                    <span>Discount</span>
                    <span>-{formatPrice(promoDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-base font-semibold text-ink pt-2 border-t border-stone">
                  <span>Total</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
