"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Minus, Plus, ShoppingBag, ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCartStore, cartLineKey } from "@/lib/store";
import { formatPrice } from "@/lib/utils";

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, subtotal } = useCartStore();
  const total = subtotal();
  const FREE_SHIPPING_THRESHOLD = 5000;
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - total);
  const progress = Math.min(100, (total / FREE_SHIPPING_THRESHOLD) * 100);
  const count = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-ink/40 z-[60]"
            onClick={closeCart}
          />

          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 34, stiffness: 320 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-cream z-[70] flex flex-col border-l border-ink/20"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-ink/15">
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted">
                  / BAG
                </span>
                <span className="font-display text-xl font-medium tracking-[-0.02em] text-ink">
                  {count} {count === 1 ? "item" : "items"}
                </span>
              </div>
              <button
                onClick={closeCart}
                className="p-1.5 text-muted hover:text-ink transition-colors"
                aria-label="Close cart"
              >
                <X size={16} />
              </button>
            </div>

            {/* Free-shipping meter */}
            {items.length > 0 && (
              <div className="px-6 py-4 border-b border-ink/15">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink">
                    {remaining > 0
                      ? <>+{formatPrice(remaining)} <span className="text-muted">to free dispatch</span></>
                      : <span className="text-ink">Free dispatch unlocked</span>}
                  </p>
                  <span className="font-mono text-[10px] text-muted">{Math.round(progress)}%</span>
                </div>
                <div className="h-[3px] bg-ink/10 overflow-hidden">
                  <motion.div
                    className="h-full bg-ink"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
              </div>
            )}

            {/* Items */}
            <div className="flex-1 overflow-y-auto">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-5 px-6 text-center">
                  <div className="w-14 h-14 border border-ink/20 flex items-center justify-center">
                    <ShoppingBag size={20} strokeWidth={1.5} className="text-muted" />
                  </div>
                  <div>
                    <p className="font-display text-2xl tracking-[-0.02em] text-ink">Empty bag.</p>
                    <p className="font-mono text-[10px] tracking-[0.16em] uppercase text-muted mt-1">
                      Nothing in rotation yet.
                    </p>
                  </div>
                  <Link href="/shop" onClick={closeCart} className="btn-outline">
                    Browse shop
                  </Link>
                </div>
              ) : (
                <ul className="divide-y divide-ink/10">
                  {items.map((item) => {
                    const unit = item.product.salePrice ?? item.product.price;
                    return (
                      <li
                        key={cartLineKey(item)}
                        className="flex gap-4 px-6 py-5"
                      >
                        <Link
                          href={`/product/${item.product.slug}`}
                          onClick={closeCart}
                          className="relative w-20 h-24 bg-beige shrink-0 overflow-hidden border border-ink/10"
                        >
                          <Image
                            src={item.selectedImage ?? item.product.images[0]}
                            alt={item.product.name}
                            fill
                            className="object-cover"
                            sizes="80px"
                          />
                        </Link>
                        <div className="flex-1 min-w-0 flex flex-col">
                          <div className="flex items-start justify-between gap-2">
                            <Link
                              href={`/product/${item.product.slug}`}
                              onClick={closeCart}
                              className="font-display text-base leading-tight text-ink hover:underline-citrine line-clamp-2"
                            >
                              {item.product.name}
                            </Link>
                            <button
                              onClick={() => removeItem(item)}
                              className="text-muted hover:text-danger transition-colors shrink-0 mt-1"
                              aria-label="Remove"
                            >
                              <X size={14} />
                            </button>
                          </div>
                          <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-muted mt-1">
                            {item.size} · {item.color.name}
                          </p>
                          <div className="flex items-center justify-between mt-auto pt-3">
                            <div className="flex items-center border border-ink/30">
                              <button
                                onClick={() => updateQuantity(item, item.quantity - 1)}
                                className="w-7 h-7 flex items-center justify-center text-ink hover:bg-ink hover:text-cream transition-colors"
                                aria-label="Decrease"
                              >
                                <Minus size={11} />
                              </button>
                              <span className="w-7 text-center font-mono text-xs tabular-nums">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item, item.quantity + 1)}
                                className="w-7 h-7 flex items-center justify-center text-ink hover:bg-ink hover:text-cream transition-colors"
                                aria-label="Increase"
                              >
                                <Plus size={11} />
                              </button>
                            </div>
                            <p className="price text-sm font-medium">
                              {formatPrice(unit * item.quantity)}
                            </p>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-ink/15 px-6 py-5 space-y-4 bg-cream">
                <div className="space-y-1.5 font-mono text-xs">
                  <div className="flex justify-between text-muted tracking-[0.14em] uppercase text-[10px]">
                    <span>Subtotal</span>
                    <span className="tabular-nums">{formatPrice(total)}</span>
                  </div>
                  <div className="flex justify-between text-muted tracking-[0.14em] uppercase text-[10px]">
                    <span>Dispatch</span>
                    <span className="tabular-nums">
                      {remaining === 0 ? "Free" : "Calculated next"}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-baseline pt-3 border-t border-ink/15">
                  <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-muted">
                    Total
                  </span>
                  <span className="font-display text-2xl tracking-[-0.02em] tabular-nums">
                    {formatPrice(total)}
                  </span>
                </div>

                <Link
                  href="/checkout"
                  onClick={closeCart}
                  className="w-full btn-primary flex items-center justify-center gap-2"
                >
                  Checkout
                  <ArrowRight size={14} />
                </Link>
                <div className="flex items-center justify-between">
                  <Link
                    href="/cart"
                    onClick={closeCart}
                    className="font-mono text-[10px] tracking-[0.18em] uppercase text-ink hover:text-citrine transition-colors"
                  >
                    View full cart →
                  </Link>
                  <button
                    onClick={closeCart}
                    className="font-mono text-[10px] tracking-[0.18em] uppercase text-muted hover:text-ink transition-colors"
                  >
                    Keep browsing
                  </button>
                </div>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
