"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Minus, Plus, X, ShoppingBag, ArrowRight, Truck, Shield, RotateCcw } from "lucide-react";
import { useCartStore, cartLineKey } from "@/lib/store";
import { formatPrice } from "@/lib/utils";

const FREE_SHIPPING_THRESHOLD = 5000;

export default function CartPage() {
  const { items, removeItem, updateQuantity, subtotal } = useCartStore();
  const total = subtotal();
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - total);
  const itemCount = items.reduce((s, i) => s + i.quantity, 0);
  const progress = Math.min(100, (total / FREE_SHIPPING_THRESHOLD) * 100);

  if (items.length === 0) {
    return <EmptyCart />;
  }

  return (
    <div className="pt-20 lg:pt-24 pb-24 min-h-screen">
      <div className="container-px max-w-6xl mx-auto">
        {/* Header */}
        <div className="py-10 border-b border-ink/15 mb-10">
          <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted mb-4">
            <span className="text-ink">/</span> BAG
          </p>
          <div className="flex items-end justify-between flex-wrap gap-4">
            <h1 className="font-display font-medium tracking-[-0.025em] leading-[0.92] text-ink text-5xl sm:text-6xl">
              Your cart.
            </h1>
            <p className="font-mono text-[11px] tracking-[0.14em] uppercase text-ink">
              {String(itemCount).padStart(2, "0")} {itemCount === 1 ? "item" : "items"}
            </p>
          </div>
        </div>

        {/* Free shipping meter */}
        <div className="mb-8">
          <div className="flex items-baseline justify-between mb-2">
            <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink">
              {remaining > 0
                ? <>+{formatPrice(remaining)} <span className="text-muted">to free dispatch</span></>
                : <span className="inline-flex items-center gap-2"><Truck size={12} /> Free dispatch unlocked</span>}
            </p>
            <span className="font-mono text-[10px] text-muted">{Math.round(progress)}%</span>
          </div>
          <div className="h-[3px] bg-ink/10 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="h-full bg-ink"
            />
          </div>
        </div>

        <div className="grid lg:grid-cols-[1fr_380px] gap-10">
          {/* Items */}
          <section>
            <ul className="border-y border-ink/15 divide-y divide-ink/10">
              <AnimatePresence initial={false}>
                {items.map((item, i) => {
                  const key = cartLineKey(item);
                  const price = item.product.salePrice ?? item.product.price;
                  return (
                    <motion.li
                      key={key}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="flex gap-5 py-6 overflow-hidden"
                    >
                      <span className="font-mono text-[10px] tracking-[0.16em] text-muted pt-1 shrink-0 w-8">
                        /{String(i + 1).padStart(2, "0")}
                      </span>

                      <Link
                        href={`/product/${item.product.slug}`}
                        className="relative w-24 lg:w-28 h-32 bg-beige-dark shrink-0 overflow-hidden group border border-ink/10"
                      >
                        <Image
                          src={item.selectedImage ?? item.product.images[0]}
                          alt={item.product.name}
                          fill
                          sizes="(min-width: 1024px) 112px, 96px"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </Link>

                      <div className="flex-1 flex flex-col min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <Link
                              href={`/product/${item.product.slug}`}
                              className="font-display text-lg tracking-[-0.01em] text-ink hover:underline-citrine line-clamp-2"
                            >
                              {item.product.name}
                            </Link>
                            <div className="flex items-center gap-3 mt-2 font-mono text-[10px] tracking-[0.14em] uppercase text-muted">
                              <span>Size {item.size}</span>
                              <span aria-hidden>·</span>
                              <span className="flex items-center gap-1.5">
                                <span
                                  className="w-2.5 h-2.5 border border-ink/30"
                                  style={{ backgroundColor: item.color.hex }}
                                />
                                {item.color.name}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => removeItem(item)}
                            aria-label="Remove item"
                            className="text-muted hover:text-danger transition-colors p-1 -m-1 shrink-0"
                          >
                            <X size={14} />
                          </button>
                        </div>

                        <div className="mt-auto pt-4 flex items-center justify-between">
                          <div className="flex items-center border border-ink/30">
                            <button
                              onClick={() => updateQuantity(item, item.quantity - 1)}
                              className="w-9 h-9 flex items-center justify-center text-ink hover:bg-ink hover:text-cream transition-colors"
                              aria-label="Decrease quantity"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="w-9 text-center font-mono text-xs tabular-nums">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item, item.quantity + 1)}
                              className="w-9 h-9 flex items-center justify-center text-ink hover:bg-ink hover:text-cream transition-colors"
                              aria-label="Increase quantity"
                            >
                              <Plus size={12} />
                            </button>
                          </div>

                          <div className="text-right">
                            {item.product.salePrice && (
                              <p className="font-mono text-[10px] tabular-nums text-muted line-through">
                                {formatPrice(item.product.price * item.quantity)}
                              </p>
                            )}
                            <p className="price text-base font-medium text-ink">
                              {formatPrice(price * item.quantity)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.li>
                  );
                })}
              </AnimatePresence>
            </ul>

            <div className="mt-8 grid grid-cols-3 border border-ink/15 divide-x divide-ink/15">
              <Reassurance icon={Truck} label="Free over KSh 5K" />
              <Reassurance icon={RotateCcw} label="14-day returns" />
              <Reassurance icon={Shield} label="M-Pesa secure" />
            </div>
          </section>

          {/* Summary */}
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="border border-ink/20 p-6 lg:p-7 bg-cream">
              <p className="section-kicker mb-4">SUMMARY</p>
              <h2 className="font-display text-2xl tracking-[-0.02em] text-ink mb-6">
                Estimated total.
              </h2>

              <div className="space-y-2.5 font-mono text-[11px] tracking-[0.12em] uppercase">
                <div className="flex justify-between text-muted">
                  <span>Subtotal ({itemCount})</span>
                  <span className="tabular-nums text-ink">{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>Dispatch</span>
                  <span className="tabular-nums text-ink">
                    {remaining === 0 ? "Free" : "Calculated"}
                  </span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>Tax</span>
                  <span className="tabular-nums text-ink">Included</span>
                </div>
              </div>

              <div className="mt-6 pt-5 border-t border-ink/15 flex items-baseline justify-between">
                <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted">Total</span>
                <span className="font-display text-3xl tracking-[-0.02em] tabular-nums text-ink">
                  {formatPrice(total)}
                </span>
              </div>

              <Link
                href="/checkout"
                className="mt-6 w-full btn-primary flex items-center justify-center gap-2"
              >
                Checkout <ArrowRight size={13} />
              </Link>

              <Link
                href="/shop"
                className="mt-3 w-full block text-center font-mono text-[10px] tracking-[0.18em] uppercase text-muted hover:text-ink transition-colors"
              >
                or continue shopping
              </Link>

              <p className="mt-5 font-mono text-[10px] tracking-[0.14em] uppercase text-muted text-center leading-relaxed border-t border-ink/15 pt-4">
                / M-Pesa or card &middot; Ships 24h from Nairobi
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function Reassurance({ icon: Icon, label }: { icon: typeof Truck; label: string }) {
  return (
    <div className="px-3 py-4 flex flex-col items-center gap-2 text-center">
      <Icon size={14} className="text-ink" strokeWidth={1.5} />
      <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted leading-tight">{label}</span>
    </div>
  );
}

function EmptyCart() {
  return (
    <div className="pt-28 pb-24 min-h-screen">
      <div className="max-w-md mx-auto text-center px-6">
        <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted mb-4">/ BAG</p>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="w-16 h-16 mx-auto border border-ink/20 flex items-center justify-center mb-6"
        >
          <ShoppingBag size={22} className="text-muted" strokeWidth={1.5} />
        </motion.div>
        <h1 className="font-display font-medium text-5xl tracking-[-0.025em] text-ink">Empty bag.</h1>
        <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-muted mt-4 max-w-xs mx-auto">
          / Nothing in rotation yet. Browse the shop to find your next piece.
        </p>
        <Link href="/shop" className="btn-primary mt-8 inline-flex">
          Browse shop <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  );
}
