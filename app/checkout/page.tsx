"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Check, ChevronRight, Lock } from "lucide-react";
import { useCartStore, cartLineKey } from "@/lib/store";
import { useAuthStore } from "@/lib/authStore";
import { formatPrice } from "@/lib/utils";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { supabase } from "@/lib/supabase/client";
import { KENYA_COUNTIES } from "@/lib/kenya";

type Step = "shipping" | "payment" | "review";
type MpesaStatus = "idle" | "pending" | "success" | "failed";

// Manual Buy Goods checkout while STK push waits on live credentials. Read the
// NEXT_PUBLIC_* flags directly (not via lib/mpesa, which pulls in node:crypto)
// so the client bundle stays clean.
const MANUAL_MPESA = process.env.NEXT_PUBLIC_MPESA_MANUAL === "true";
const MPESA_TILL = process.env.NEXT_PUBLIC_MPESA_TILL?.trim() || "5386846";

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
  postal: string;
  method: "standard" | "express";
}

interface SavedAddress {
  id: string;
  label: string;
  first_name: string;
  last_name: string;
  address: string;
  city: string;
  county: string;
  postal: string;
  phone: string;
  is_default: boolean;
}

const SHIPPING_COSTS = { standard: 350, express: 800 };

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCartStore();
  const { user } = useAuthStore();
  const userId = user?.id ?? null;
  const [step, setStep] = useState<Step>("shipping");
  const savedMpesaNumbers: { phone: string; label: string }[] =
    user?.user_metadata?.mpesa_numbers ?? [];
  const [mpesaPhone, setMpesaPhone] = useState(
    savedMpesaNumbers.length > 0 ? savedMpesaNumbers[0].phone : "07"
  );
  const [loading, setLoading] = useState(false);
  const [mpesaStatus, setMpesaStatus] = useState<MpesaStatus>("idle");
  const [mpesaMessage, setMpesaMessage] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoMsg, setPromoMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [reserveError, setReserveError] = useState<string | null>(null);
  const [reserving, setReserving] = useState(false);
  const [mpesaPhoneError, setMpesaPhoneError] = useState<string | null>(null);
  const [mpesaCode, setMpesaCode] = useState("");
  const [mpesaCodeError, setMpesaCodeError] = useState<string | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | "new" | null>(null);

  // Stable per-tab session id used to tie cart reservations to this checkout
  // attempt. Generated lazily so SSR doesn't try to touch crypto.
  const sessionIdRef = useRef<string>("");
  if (typeof window !== "undefined" && !sessionIdRef.current) {
    // Reuse the session ID across page reloads so release_session_reservations
    // at the top of the reserve route can clear the previous attempt's holds
    // instead of orphaning them and inflating the reserved count.
    const stored = sessionStorage.getItem("bw_checkout_sid");
    if (stored) {
      sessionIdRef.current = stored;
    } else {
      sessionIdRef.current =
        window.crypto?.randomUUID?.() ??
        `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      sessionStorage.setItem("bw_checkout_sid", sessionIdRef.current);
    }
  }
  const reservedRef = useRef(false);
  const reservedCountRef = useRef(0);

  // Prefill shipping form from logged-in user metadata once on mount.
  useEffect(() => {
    if (!user) return;
    const meta = user.user_metadata ?? {};
    const fullName: string = meta.full_name ?? meta.name ?? "";
    const [first = "", ...rest] = fullName.trim().split(/\s+/);
    setShipping((prev) => ({
      ...prev,
      email: prev.email || user.email || "",
      phone: prev.phone || meta.phone || "",
      firstName: prev.firstName || first,
      lastName: prev.lastName || rest.join(" "),
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Best-effort: if the user navigates away from /checkout without completing,
  // release whatever they had reserved so other shoppers aren't blocked.
  useEffect(() => {
    return () => {
      if (reservedRef.current && sessionIdRef.current) {
        navigator.sendBeacon?.(
          "/api/reservations/release",
          new Blob([JSON.stringify({ sessionId: sessionIdRef.current })], {
            type: "application/json",
          })
        );
      }
    };
  }, []);

  const [shipping, setShipping] = useState<ShippingForm>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    county: "Nairobi",
    postal: "",
    method: "standard",
  });

  // Pull the user's saved addresses so logged-in shoppers don't retype them.
  // Mirrors how saved M-Pesa numbers prefill the payment step.
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("addresses")
        .select("id, label, first_name, last_name, full_name, address, line1, city, county, state, postal_code, phone, is_default")
        .eq("user_id", userId)
        .order("is_default", { ascending: false });
      if (cancelled || error || !data?.length) return;
      const mapped: SavedAddress[] = data.map((row: Record<string, unknown>) => {
        const fullName = (row.full_name as string | null) ?? "";
        const [first = "", ...rest] = fullName.trim().split(/\s+/);
        const postal = (row.postal_code as string) ?? "";
        return {
          id: row.id as string,
          label: (row.label as string) ?? "Home",
          first_name: (row.first_name as string) ?? first,
          last_name: (row.last_name as string) ?? rest.join(" "),
          address: (row.address as string) ?? (row.line1 as string) ?? "",
          city: (row.city as string) ?? "",
          county: (row.county as string) ?? (row.state as string) ?? "",
          postal: postal === "00100" ? "" : postal,
          phone: (row.phone as string) ?? "",
          is_default: !!row.is_default,
        };
      });
      setSavedAddresses(mapped);
      const def = mapped.find((a) => a.is_default) ?? mapped[0];
      if (def) {
        setSelectedAddressId(def.id);
        setShipping((prev) => ({
          ...prev,
          firstName: def.first_name || prev.firstName,
          lastName: def.last_name || prev.lastName,
          address: def.address || prev.address,
          city: def.city || prev.city,
          county: def.county || prev.county || "Nairobi",
          postal: def.postal || prev.postal,
          phone: def.phone || prev.phone,
        }));
      }
    })();
    return () => { cancelled = true; };
  }, [userId]);

  const applySavedAddress = (addr: SavedAddress) => {
    setSelectedAddressId(addr.id);
    setShipping((prev) => ({
      ...prev,
      firstName: addr.first_name,
      lastName: addr.last_name,
      address: addr.address,
      city: addr.city,
      county: addr.county || "Nairobi",
      postal: addr.postal,
      phone: addr.phone || prev.phone,
    }));
  };

  const useNewAddress = () => {
    setSelectedAddressId("new");
    setShipping((prev) => ({
      ...prev,
      firstName: "",
      lastName: "",
      address: "",
      city: "",
      county: "Nairobi",
      postal: "",
    }));
  };

  const sub = subtotal();
  const shippingCost = sub >= 5000 ? 0 : SHIPPING_COSTS[shipping.method];
  const total = sub + shippingCost - promoDiscount;

  const buildOrderPayload = () => ({
    userId: user?.id,
    email: shipping.email,
    phone: shipping.phone,
    shippingAddress: {
      firstName: shipping.firstName,
      lastName: shipping.lastName,
      address: shipping.address,
      city: shipping.city,
      county: shipping.county,
      postal: shipping.postal.trim() || undefined,
    },
    shippingMethod: shipping.method,
    shippingCost,
    subtotal: sub,
    discountAmount: promoDiscount,
    total,
    paymentMethod: "mpesa",
    mpesaCode: MANUAL_MPESA ? mpesaCode.trim().toUpperCase() : undefined,
    sessionId: reservedRef.current ? sessionIdRef.current : undefined,
    expectedConsumed: reservedRef.current ? reservedCountRef.current : undefined,
    couponCode: promoDiscount > 0 ? promoCode.trim().toUpperCase() : undefined,
    items: items.map((item) => ({
      productId: item.product.id,
      variantId: item.variantId ?? null,
      productName: item.product.name,
      // Build the human label from whichever axes actually apply — drop the
      // "Default" colour sentinel used by size-only products.
      variantName: [item.size, item.color.name]
        .filter((part) => part && part !== "Default")
        .join(" / "),
      quantity: item.quantity,
    })),
  });

  const persistOrder = async (): Promise<{ orderId: string; accessToken: string; total: number } | null> => {
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildOrderPayload()),
      });
      const data = await res.json();
      if (!res.ok) {
        // Reservation TTL ran out between reserving and finalising - drop
        // the dead session id and bounce the user back to shipping so they
        // can re-reserve fresh stock.
        if (data?.code === "RESERVATION_EXPIRED") {
          reservedRef.current = false;
          sessionIdRef.current =
            window.crypto?.randomUUID?.() ??
            `${Date.now()}-${Math.random().toString(36).slice(2)}`;
          setStep("shipping");
          setReserveError(
            "Your item hold timed out (15 min). Your cart is unchanged - confirm details and try again."
          );
        }
        setMpesaStatus("failed");
        setMpesaMessage(data.error ?? "Failed to place order.");
        setLoading(false);
        return null;
      }
      if (!data.orderId || !data.accessToken) return null;
      return {
        orderId: data.orderId,
        accessToken: data.accessToken,
        total: typeof data.total === "number" ? data.total : total,
      };
    } catch {
      setMpesaStatus("failed");
      setMpesaMessage("Network error creating order. Please try again.");
      setLoading(false);
      return null;
    }
  };

  const goToOrder = (orderId: string | null, token?: string) => {
    // Reservation has been consumed server-side - make sure unmount cleanup
    // doesn't try to release stock that's now permanently decremented.
    reservedRef.current = false;
    sessionStorage.removeItem("bw_checkout_sid");
    if (shipping.email) {
      fetch("/api/cart-snapshot", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: shipping.email }),
      }).catch(() => {});
    }
    clearCart();
    if (orderId) {
      const qs = token ? `?t=${encodeURIComponent(token)}` : "";
      router.push(`/order/${orderId}${qs}`);
    } else {
      // Fallback: still clear and send to orders list if persistence failed
      router.push("/account/orders");
    }
  };

  // Snapshot the cart for abandoned-cart recovery once we have an email.
  const snapshotCart = async () => {
    if (!shipping.email || items.length === 0) return;
    try {
      await fetch("/api/cart-snapshot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: shipping.email,
          userId: user?.id,
          subtotal: sub,
          items: items.map((i) => ({
            productId: i.product.id,
            name: i.product.name,
            slug: i.product.slug,
            image: i.selectedImage ?? i.product.images[0],
            size: i.size,
            color: i.color.name,
            quantity: i.quantity,
            price: i.product.salePrice ?? i.product.price,
          })),
        }),
      });
    } catch {
      // best-effort - don't block checkout on snapshot failures
    }
  };

  // Reserve every cart line for this session before the user goes to payment.
  // If anything is short, surface the failing item and stay on the shipping step.
  const reserveCartStock = async (): Promise<boolean> => {
    if (reservedRef.current) return true;
    setReserving(true);
    setReserveError(null);
    try {
      const res = await fetch("/api/reservations/reserve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionIdRef.current,
          items: items.map((i) => ({
            productId: i.product.id,
            variantId: i.variantId ?? null,
            quantity: i.quantity,
            productName: i.product.name,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setReserveError(data.error ?? "Could not reserve stock. Please try again.");
        return false;
      }
      reservedRef.current = true;
      reservedCountRef.current = data.reservedCount ?? items.length;
      return true;
    } catch {
      setReserveError("Network error reserving stock. Please try again.");
      return false;
    } finally {
      setReserving(false);
    }
  };

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setPromoLoading(true);
    setPromoMsg(null);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoCode, orderTotal: sub }),
      });
      const result = await res.json();
      if (result.valid) {
        setPromoDiscount(result.discountAmount);
        setPromoMsg({
          type: "success",
          text: `${formatPrice(result.discountAmount)} discount applied${result.description ? ` - ${result.description}` : ""}!`,
        });
      } else {
        setPromoDiscount(0);
        setPromoMsg({ type: "error", text: result.message ?? "Invalid promo code." });
      }
    } catch {
      setPromoMsg({ type: "error", text: "Could not validate promo code. Try again." });
    }
    setPromoLoading(false);
  };

  const validateMpesaPhone = (phone: string): string | null => {
    const cleaned = phone.replace(/[\s\-()]/g, "");
    if (!cleaned) return "Phone number is required";
    if (/^(?:(?:\+?254)|0)[17]\d{8}$/.test(cleaned)) return null;
    if (cleaned.length < 10) return "Phone number is too short";
    return "Enter a valid Kenyan mobile number (e.g. 0712 345 678)";
  };

  // M-Pesa confirmation codes are 10 alphanumerics (e.g. QJK3B7WCLP). Accept
  // 8-12 uppercased to tolerate format drift — the admin verifies anyway.
  const validateMpesaCode = (code: string): string | null => {
    const cleaned = code.trim().toUpperCase();
    if (!cleaned) return "Enter your M-Pesa confirmation code";
    if (!/^[A-Z0-9]{8,12}$/.test(cleaned)) return "That doesn't look like an M-Pesa code (e.g. QJK3B7WCLP)";
    return null;
  };

  const handleOrder = async () => {
    const err = validateMpesaPhone(mpesaPhone);
    if (err) {
      setMpesaPhoneError(err);
      setStep("payment");
      return;
    }
    if (MANUAL_MPESA) {
      const codeErr = validateMpesaCode(mpesaCode);
      if (codeErr) {
        setMpesaCodeError(codeErr);
        setStep("payment");
        return;
      }
      await handleManualPayment();
      return;
    }
    await handleMpesaPayment();
  };

  // Manual Buy Goods flow: the customer has already paid the Till and pasted
  // their code. We just persist the order as PENDING_PAYMENT (with the code
  // attached) and hand them off to the order page — no STK push, no polling.
  // An admin verifies the code and marks it PAID from /admin/payments.
  const handleManualPayment = async () => {
    setLoading(true);
    setMpesaStatus("idle");
    setMpesaMessage("");
    const persisted = await persistOrder();
    if (!persisted) return;
    reservedRef.current = false;
    setMpesaStatus("success");
    setLoading(false);
    goToOrder(persisted.orderId, persisted.accessToken);
  };

  const handleMpesaPayment = async () => {
    setLoading(true);
    setMpesaStatus("idle");
    setMpesaMessage("");

    try {
      const persisted = await persistOrder();
      if (!persisted) return;
      const { orderId, accessToken, total: serverTotal } = persisted;

      reservedRef.current = false;

      const res = await fetch("/api/mpesa/stkpush", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: mpesaPhone, amount: serverTotal, orderId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMpesaStatus("failed");
        setMpesaMessage(data.error ?? "Failed to initiate payment. Try again.");
        setReserveError(data.error ?? "Failed to initiate payment. Confirm details and try again.");
        setStep("shipping");
        setLoading(false);
        return;
      }

      setMpesaStatus("pending");
      setMpesaMessage(data.customerMessage ?? "Check your phone and enter your M-Pesa PIN.");

      // Poll backend state only. The frontend observes paid/failed status; it
      // never marks the order paid by itself.
      let attempts = 0;
      const poll = setInterval(async () => {
        attempts++;
        try {
          const qRes = await fetch("/api/mpesa/query", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ checkoutRequestId: data.checkoutRequestId, orderId }),
          });
          const qData = await qRes.json();

          if (qData.paymentStatus === "paid") {
            clearInterval(poll);
            setMpesaStatus("success");
            setLoading(false);
            goToOrder(qData.orderId ?? orderId, accessToken);
            return;
          }

          if (qData.paymentStatus === "failed" || qData.orderStatus === "FAILED") {
            clearInterval(poll);
            setMpesaStatus("failed");
            setMpesaMessage(qData.resultDesc ?? "Payment was not completed.");
            setReserveError(qData.resultDesc ?? "Payment was not completed. Confirm details and try again.");
            setStep("shipping");
            setLoading(false);
            return;
          }

          if (qData.callbackPending) {
            setMpesaMessage(qData.resultDesc ?? "Payment received. Waiting for secure confirmation.");
          }
        } catch {
          // Query error - keep polling
        }

        if (attempts >= 15) {
          clearInterval(poll);
          setMpesaStatus("pending");
          setMpesaMessage(
            `Payment confirmation is taking longer than usual. If you entered your PIN, keep order #BW-${orderId.slice(0, 8).toUpperCase()} and check again shortly.`
          );
          setLoading(false);
        }
      }, 4000);
    } catch {
      setMpesaStatus("failed");
      setMpesaMessage("Network error. Please try again.");
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="pt-32 pb-24 flex flex-col items-center justify-center min-h-[70vh] text-center px-6">
        <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted mb-3">/ BAG</p>
        <h1 className="font-display font-medium text-4xl tracking-[-0.025em] text-ink mb-6">Empty bag.</h1>
        <Link href="/shop" className="btn-primary">
          Browse shop
        </Link>
      </div>
    );
  }

  const currentIdx = STEPS.indexOf(step);

  return (
    <div className="pt-20 lg:pt-24 pb-24">
      <div className="container-px py-8">
        {/* Header */}
        <div className="mb-10 pb-6 border-b border-ink/15">
          <Link href="/" className="font-display text-2xl tracking-[-0.02em] font-semibold text-ink">
            BAYWOODS <span className="font-mono text-[10px] tracking-[0.18em] text-muted ml-2">/ CHECKOUT</span>
          </Link>
          <div className="flex items-center flex-wrap gap-x-3 gap-y-2 mt-6">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-3">
                <button
                  onClick={() => i < currentIdx && setStep(s)}
                  disabled={i >= currentIdx}
                  className={`flex items-center gap-2.5 font-mono text-[10px] tracking-[0.18em] uppercase transition-colors ${
                    s === step ? "text-ink" : i < currentIdx ? "text-ink cursor-pointer" : "text-muted"
                  }`}
                >
                  <span
                    className={`w-6 h-6 flex items-center justify-center font-mono text-[10px] ${
                      i < currentIdx
                        ? "bg-ink text-citrine"
                        : s === step
                        ? "bg-ink text-cream"
                        : "border border-ink/25 text-muted"
                    }`}
                  >
                    {i < currentIdx ? <Check size={11} /> : String(i + 1).padStart(2, "0")}
                  </span>
                  {STEP_LABELS[s]}
                </button>
                {i < STEPS.length - 1 && (
                  <ChevronRight size={12} className="text-muted" />
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
                  <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted mb-2">/ 01 — SHIPPING</p>
                  <h2 className="font-display font-medium text-3xl tracking-[-0.02em] text-ink mb-6">Where to.</h2>

                  {/* Guest prompt */}
                  {!user && (
                    <div className="border-l-2 border-citrine bg-cream pl-4 py-3 mb-6">
                      <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-ink">
                        / Have an account?{" "}
                        <Link href="/auth/signin" className="underline-citrine">
                          Sign in →
                        </Link>{" "}
                        to autofill.
                      </p>
                    </div>
                  )}

                  {user && savedAddresses.length > 0 && (
                    <div className="mb-6">
                      <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-muted mb-2">
                        / Saved addresses
                      </p>
                      <div className="space-y-1">
                        {savedAddresses.map((addr) => {
                          const active = selectedAddressId === addr.id;
                          return (
                            <button
                              key={addr.id}
                              type="button"
                              onClick={() => applySavedAddress(addr)}
                              className={`w-full flex items-center gap-3 px-4 py-3 border text-left transition-colors ${
                                active ? "border-ink bg-cream" : "border-ink/20 hover:border-ink"
                              }`}
                            >
                              <span className={`w-4 h-4 border flex items-center justify-center shrink-0 ${active ? "border-ink" : "border-ink/30"}`}>
                                {active && <span className="w-2 h-2 bg-ink" />}
                              </span>
                              <div className="min-w-0">
                                <p className="font-display text-base tracking-[-0.01em] text-ink flex items-center gap-2 flex-wrap">
                                  {addr.first_name} {addr.last_name}
                                  {addr.is_default && (
                                    <span className="font-mono text-[9px] tracking-[0.18em] uppercase bg-ink text-citrine px-1.5 py-0.5">
                                      Default
                                    </span>
                                  )}
                                </p>
                                <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted mt-0.5 truncate">
                                  {addr.label} · {addr.address}, {addr.city}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                        <button
                          type="button"
                          onClick={useNewAddress}
                          className={`w-full flex items-center gap-3 px-4 py-3 border text-left transition-colors ${
                            selectedAddressId === "new" ? "border-ink bg-cream" : "border-ink/20 hover:border-ink"
                          }`}
                        >
                          <span className={`w-4 h-4 border flex items-center justify-center shrink-0 ${selectedAddressId === "new" ? "border-ink" : "border-ink/30"}`}>
                            {selectedAddressId === "new" && <span className="w-2 h-2 bg-ink" />}
                          </span>
                          <p className="font-mono text-[11px] tracking-[0.14em] uppercase text-muted">
                            Use a different address
                          </p>
                        </button>
                      </div>
                    </div>
                  )}

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
                        onBlur={snapshotCart}
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
                        {KENYA_COUNTIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <Input
                        label="Postal Code (optional)"
                        value={shipping.postal}
                        onChange={(e) => setShipping({ ...shipping, postal: e.target.value })}
                        placeholder="00100"
                      />
                    </div>
                  </div>

                  {/* Shipping method */}
                  <div className="mt-8">
                    <p className="label-base mb-3">Delivery method</p>
                    <div className="space-y-2">
                      {[
                        { value: "standard", label: "Standard", sub: "3–7 business days", cost: sub >= 5000 ? 0 : SHIPPING_COSTS.standard },
                        { value: "express", label: "Express", sub: "1–2 business days", cost: sub >= 5000 ? 0 : SHIPPING_COSTS.express },
                      ].map((opt) => {
                        const active = shipping.method === opt.value;
                        return (
                          <label
                            key={opt.value}
                            className={`flex items-center justify-between p-4 border cursor-pointer transition-colors ${
                              active ? "border-ink bg-cream" : "border-ink/20 hover:border-ink"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className={`w-4 h-4 border flex items-center justify-center shrink-0 ${active ? "border-ink" : "border-ink/30"}`}>
                                {active && <span className="w-2 h-2 bg-ink" />}
                              </span>
                              <input
                                type="radio"
                                name="shipping"
                                value={opt.value}
                                checked={active}
                                onChange={() => setShipping({ ...shipping, method: opt.value as "standard" | "express" })}
                                className="sr-only"
                              />
                              <div>
                                <p className="font-display text-base tracking-[-0.01em] text-ink">{opt.label}</p>
                                <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted mt-0.5">{opt.sub}</p>
                              </div>
                            </div>
                            <p className="price text-sm font-medium text-ink">
                              {opt.cost === 0 ? "Free" : formatPrice(opt.cost)}
                            </p>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {reserveError && (
                    <p className="mt-4 font-mono text-[10px] tracking-[0.14em] uppercase text-danger border-l-2 border-danger pl-3 py-2">
                      / {reserveError}
                    </p>
                  )}
                  <Button
                    className="mt-8 w-full"
                    size="lg"
                    loading={reserving}
                    onClick={async () => {
                      const ok = await reserveCartStock();
                      if (ok) {
                        await snapshotCart();
                        setStep("payment");
                      }
                    }}
                    disabled={!shipping.firstName || !shipping.lastName || !shipping.email || !shipping.phone || !shipping.address || !shipping.city}
                  >
                    Continue to payment →
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
                  <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted mb-2">/ 02 — PAYMENT</p>
                  <h2 className="font-display font-medium text-3xl tracking-[-0.02em] text-ink mb-6">How you&apos;re paying.</h2>

                  <div className="space-y-4">
                      {MANUAL_MPESA && (
                        <>
                          <div className="border border-ink/20 bg-cream p-5">
                            <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-muted mb-3">/ Pay via M-Pesa — Buy Goods</p>
                            <div className="flex items-end justify-between gap-4 pb-4 border-b border-ink/15">
                              <div>
                                <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-muted">Till number</p>
                                <p className="font-display text-3xl tracking-[-0.02em] text-ink tabular-nums mt-1">{MPESA_TILL}</p>
                              </div>
                              <div className="text-right">
                                <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-muted">Amount</p>
                                <p className="font-display text-2xl tracking-[-0.02em] text-ink tabular-nums mt-1">{formatPrice(total)}</p>
                              </div>
                            </div>
                            <ol className="mt-4 space-y-2 font-mono text-[10px] tracking-[0.1em] uppercase text-ink/70 leading-relaxed list-none">
                              <li><span className="text-ink">01 —</span> M-Pesa menu → Lipa na M-Pesa → Buy Goods and Services</li>
                              <li><span className="text-ink">02 —</span> Till number <span className="text-ink">{MPESA_TILL}</span></li>
                              <li><span className="text-ink">03 —</span> Amount <span className="text-ink">{formatPrice(total)}</span>, then enter your PIN</li>
                              <li><span className="text-ink">04 —</span> Paste the M-Pesa code from the confirmation SMS below</li>
                            </ol>
                          </div>

                          <div>
                            <Input
                              label="M-Pesa Phone Number (you paid from)"
                              type="tel"
                              value={mpesaPhone}
                              onChange={(e) => {
                                setMpesaPhone(e.target.value);
                                if (mpesaPhoneError) setMpesaPhoneError(null);
                              }}
                              onBlur={() => setMpesaPhoneError(validateMpesaPhone(mpesaPhone))}
                              placeholder="0712 345 678"
                            />
                            {mpesaPhoneError && (
                              <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-danger mt-2">
                                / {mpesaPhoneError}
                              </p>
                            )}
                          </div>

                          <div>
                            <Input
                              label="M-Pesa Confirmation Code"
                              value={mpesaCode}
                              onChange={(e) => {
                                setMpesaCode(e.target.value.toUpperCase());
                                if (mpesaCodeError) setMpesaCodeError(null);
                              }}
                              onBlur={() => setMpesaCodeError(validateMpesaCode(mpesaCode))}
                              placeholder="QJK3B7WCLP"
                            />
                            {mpesaCodeError ? (
                              <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-danger mt-2">
                                / {mpesaCodeError}
                              </p>
                            ) : (
                              <p className="font-mono text-[10px] tracking-[0.12em] uppercase text-muted mt-2 leading-relaxed">
                                / We verify this against M-Pesa before dispatch. Your order is held meanwhile.
                              </p>
                            )}
                          </div>
                        </>
                      )}
                      {!MANUAL_MPESA && (
                      <>
                      <div className="border-l-2 border-citrine bg-cream pl-4 py-3">
                        <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink mb-1">/ M-Pesa STK push</p>
                        <p className="font-mono text-[10px] tracking-[0.12em] uppercase text-muted leading-relaxed">
                          {savedMpesaNumbers.length > 0
                            ? "Select a saved number or enter a new one."
                            : "Enter your M-Pesa number. STK prompt will hit your phone."}
                        </p>
                      </div>
                      {savedMpesaNumbers.length > 0 && (
                        <div className="space-y-1">
                          {savedMpesaNumbers.map((num) => {
                            const active = mpesaPhone === num.phone;
                            return (
                              <button
                                key={num.phone}
                                type="button"
                                onClick={() => setMpesaPhone(num.phone)}
                                className={`w-full flex items-center gap-3 px-4 py-3 border text-left transition-colors ${
                                  active ? "border-ink bg-cream" : "border-ink/20 hover:border-ink"
                                }`}
                              >
                                <span className={`w-4 h-4 border flex items-center justify-center shrink-0 ${active ? "border-ink" : "border-ink/30"}`}>
                                  {active && <span className="w-2 h-2 bg-ink" />}
                                </span>
                                <div>
                                  <p className="font-display text-base tracking-[-0.01em] text-ink">{num.phone}</p>
                                  <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted">{num.label}</p>
                                </div>
                              </button>
                            );
                          })}
                          {(() => {
                            const other = !savedMpesaNumbers.some((n) => n.phone === mpesaPhone);
                            return (
                              <button
                                type="button"
                                onClick={() => setMpesaPhone("07")}
                                className={`w-full flex items-center gap-3 px-4 py-3 border text-left transition-colors ${
                                  other ? "border-ink bg-cream" : "border-ink/20 hover:border-ink"
                                }`}
                              >
                                <span className={`w-4 h-4 border flex items-center justify-center shrink-0 ${other ? "border-ink" : "border-ink/30"}`}>
                                  {other && <span className="w-2 h-2 bg-ink" />}
                                </span>
                                <p className="font-mono text-[11px] tracking-[0.14em] uppercase text-muted">Different number</p>
                              </button>
                            );
                          })()}
                        </div>
                      )}
                      {(savedMpesaNumbers.length === 0 ||
                        !savedMpesaNumbers.some((n) => n.phone === mpesaPhone)) && (
                        <div>
                          <Input
                            label="M-Pesa Phone Number"
                            type="tel"
                            value={mpesaPhone}
                            onChange={(e) => {
                              setMpesaPhone(e.target.value);
                              if (mpesaPhoneError) setMpesaPhoneError(null);
                            }}
                            onBlur={() => setMpesaPhoneError(validateMpesaPhone(mpesaPhone))}
                            placeholder="0712 345 678"
                          />
                          {mpesaPhoneError && (
                            <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-danger mt-2">
                              / {mpesaPhoneError}
                            </p>
                          )}
                        </div>
                      )}
                      </>
                      )}
                      {mpesaStatus === "pending" && mpesaMessage && (
                        <div className="border-l-2 border-citrine bg-cream pl-4 py-3 flex items-center gap-3">
                          <div className="w-3 h-3 border-2 border-ink border-t-transparent animate-spin shrink-0" />
                          <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink">{mpesaMessage}</p>
                        </div>
                      )}
                      {mpesaStatus === "failed" && mpesaMessage && (
                        <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-danger border-l-2 border-danger pl-3 py-2">
                          / {mpesaMessage}
                        </p>
                      )}
                    </div>
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
                      onClick={() => setStep("review")}
                    >
                      Review order
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
                  <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted mb-2">/ 03 — REVIEW</p>
                  <h2 className="font-display font-medium text-3xl tracking-[-0.02em] text-ink mb-6">Confirm and pay.</h2>

                  {/* Shipping summary */}
                  <div className="border border-ink/20 p-5 mb-3">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted mb-2">
                          / Shipping to
                        </p>
                        <p className="font-display text-base tracking-[-0.01em] text-ink">
                          {shipping.firstName} {shipping.lastName}
                        </p>
                        <p className="text-sm text-muted mt-1">{shipping.address}, {shipping.city}</p>
                        <p className="text-sm text-muted">{shipping.email}</p>
                      </div>
                      <button
                        onClick={() => setStep("shipping")}
                        className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink hover:text-citrine"
                      >
                        Edit →
                      </button>
                    </div>
                  </div>

                  <div className="border border-ink/20 p-5 mb-6">
                    <div className="flex justify-between items-center gap-4">
                      <div>
                        <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted mb-2">
                          / Payment
                        </p>
                        <p className="font-display text-base tracking-[-0.01em] text-ink uppercase">
                          {MANUAL_MPESA ? `M-Pesa · Till ${MPESA_TILL}` : "M-Pesa"}
                        </p>
                        <p className="font-mono text-xs tabular-nums text-muted mt-1">{mpesaPhone}</p>
                        {MANUAL_MPESA && (
                          <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-muted mt-1">
                            Code · <span className="text-ink">{mpesaCode || "—"}</span>
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => setStep("payment")}
                        className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink hover:text-citrine"
                      >
                        Edit →
                      </button>
                    </div>
                  </div>

                  {mpesaStatus === "pending" && (
                    <div className="border-l-2 border-citrine bg-cream pl-4 py-3 mb-4 flex items-center gap-3">
                      <div className="w-3 h-3 border-2 border-ink border-t-transparent animate-spin shrink-0" />
                      <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-ink">Waiting for M-Pesa payment…</p>
                    </div>
                  )}
                  {mpesaStatus === "failed" && mpesaMessage && (
                    <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-danger border-l-2 border-danger pl-3 py-2 mb-4">
                      / {mpesaMessage}
                    </p>
                  )}
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
                      {MANUAL_MPESA ? `I've paid ${formatPrice(total)} — place order` : `Pay ${formatPrice(total)} via M-Pesa`}
                    </Button>
                  </div>
                  <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted text-center mt-4 flex items-center justify-center gap-2">
                    <Lock size={10} />
                    {MANUAL_MPESA
                      ? "We confirm your M-Pesa code before dispatch"
                      : "All transactions encrypted and secure"}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Order summary sidebar */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="border border-ink/20 p-6 bg-cream">
              <p className="section-kicker mb-5">SUMMARY</p>

              <ul className="space-y-4 mb-6 border-t border-ink/15 pt-4">
                {items.map((item) => (
                  <li key={cartLineKey(item)} className="flex gap-3">
                    <div className="relative w-14 h-16 bg-beige-dark shrink-0 overflow-hidden border border-ink/10">
                      <Image
                        src={item.selectedImage ?? item.product.images[0]}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                      <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-ink text-citrine font-mono text-[10px] flex items-center justify-center">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-sm tracking-[-0.01em] text-ink line-clamp-1">{item.product.name}</p>
                      <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted mt-0.5">{item.size} · {item.color.name}</p>
                      <p className="price text-xs font-medium text-ink mt-1">
                        {formatPrice((item.product.salePrice ?? item.product.price) * item.quantity)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Promo */}
              <div className="mb-5 border-t border-ink/15 pt-4">
                <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-muted mb-2">/ Promo</p>
                <div className="flex border-b border-ink">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    placeholder="Code"
                    className="flex-1 bg-transparent font-mono text-xs tracking-[0.1em] uppercase text-ink py-2 outline-none placeholder:text-muted"
                  />
                  <button
                    onClick={handleApplyPromo}
                    disabled={promoLoading || !promoCode.trim()}
                    className="px-3 py-2 font-mono text-[10px] tracking-[0.18em] uppercase text-ink hover:text-citrine transition-colors disabled:opacity-50"
                  >
                    {promoLoading ? "…" : "Apply →"}
                  </button>
                </div>
                {promoMsg && (
                  <p className={`font-mono text-[10px] tracking-[0.14em] uppercase mt-2 ${promoMsg.type === "success" ? "text-ink" : "text-danger"}`}>
                    / {promoMsg.text}
                  </p>
                )}
              </div>

              <div className="space-y-2 pt-4 border-t border-ink/15 font-mono text-[11px] tracking-[0.12em] uppercase">
                <div className="flex justify-between text-muted">
                  <span>Subtotal</span>
                  <span className="tabular-nums text-ink">{formatPrice(sub)}</span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>Dispatch</span>
                  <span className="tabular-nums text-ink">{shippingCost === 0 ? "Free" : formatPrice(shippingCost)}</span>
                </div>
                {promoDiscount > 0 && (
                  <div className="flex justify-between text-ink">
                    <span>Discount</span>
                    <span className="tabular-nums">-{formatPrice(promoDiscount)}</span>
                  </div>
                )}
              </div>
              <div className="flex justify-between items-baseline pt-4 mt-2 border-t border-ink/15">
                <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted">Total</span>
                <span className="font-display text-2xl tracking-[-0.02em] tabular-nums text-ink">{formatPrice(total)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
