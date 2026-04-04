"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Minus, Plus, ShoppingBag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/lib/store";
import { formatPrice } from "@/lib/utils";
export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, subtotal } = useCartStore();
  const total = subtotal();
  const FREE_SHIPPING_THRESHOLD = 5000;
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - total);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 bg-ink/30 backdrop-blur-sm z-[60]"
            onClick={closeCart}
          />

          {/* Drawer */}
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-cream z-[70] flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-stone">
              <div className="flex items-center gap-2">
                <ShoppingBag size={18} />
                <span className="font-medium text-sm tracking-wide">
                  Cart ({items.reduce((s, i) => s + i.quantity, 0)})
                </span>
              </div>
              <button
                onClick={closeCart}
                className="p-1.5 text-muted hover:text-ink transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Free shipping bar */}
            {remaining > 0 && (
              <div className="px-6 py-3 bg-forest-muted border-b border-stone">
                <p className="text-xs text-forest-dark font-medium">
                  Add{" "}
                  <span className="font-semibold">{formatPrice(remaining)}</span>{" "}
                  more for free shipping
                </p>
                <div className="mt-1.5 h-1 bg-stone rounded-full overflow-hidden">
                  <div
                    className="h-full bg-forest transition-all duration-500"
                    style={{ width: `${Math.min(100, (total / FREE_SHIPPING_THRESHOLD) * 100)}%` }}
                  />
                </div>
              </div>
            )}
            {remaining === 0 && (
              <div className="px-6 py-3 bg-forest-muted border-b border-stone">
                <p className="text-xs text-forest-dark font-semibold">
                  You qualify for free shipping!
                </p>
              </div>
            )}

            {/* Items */}
            <div className="flex-1 overflow-y-auto py-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 px-6 text-center">
                  <ShoppingBag size={48} className="text-stone" strokeWidth={1} />
                  <div>
                    <p className="font-medium text-ink">Your cart is empty</p>
                    <p className="text-sm text-muted mt-1">
                      Add something you love to get started.
                    </p>
                  </div>
                  <Link
                    href="/shop"
                    onClick={closeCart}
                    className="inline-flex items-center justify-center gap-2 font-sans font-medium tracking-wide transition-all duration-200 active:scale-[0.98] border border-ink text-ink hover:bg-ink hover:text-white text-xs px-4 py-2"
                  >
                    Browse Shop
                  </Link>
                </div>
              ) : (
                <ul className="px-6 space-y-5">
                  {items.map((item) => (
                    <li key={`${item.product.id}-${item.size}-${item.color.name}`} className="flex gap-4">
                      <div className="relative w-20 h-24 bg-beige shrink-0 overflow-hidden">
                        <Image
                          src={item.product.images[0]}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <Link
                            href={`/product/${item.product.slug}`}
                            onClick={closeCart}
                            className="text-sm font-medium text-ink hover:text-forest transition-colors line-clamp-2"
                          >
                            {item.product.name}
                          </Link>
                          <button
                            onClick={() =>
                              removeItem(item.product.id, item.size, item.color.name)
                            }
                            className="text-muted hover:text-danger transition-colors shrink-0 mt-0.5"
                          >
                            <X size={14} />
                          </button>
                        </div>
                        <p className="text-xs text-muted mt-0.5">
                          {item.size} · {item.color.name}
                        </p>
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center border border-stone">
                            <button
                              onClick={() =>
                                updateQuantity(
                                  item.product.id,
                                  item.size,
                                  item.color.name,
                                  item.quantity - 1
                                )
                              }
                              className="w-7 h-7 flex items-center justify-center text-ink hover:bg-stone/50 transition-colors"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="w-8 text-center text-sm font-medium">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                updateQuantity(
                                  item.product.id,
                                  item.size,
                                  item.color.name,
                                  item.quantity + 1
                                )
                              }
                              className="w-7 h-7 flex items-center justify-center text-ink hover:bg-stone/50 transition-colors"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                          <p className="text-sm font-semibold">
                            {formatPrice(
                              (item.product.salePrice ?? item.product.price) * item.quantity
                            )}
                          </p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="border-t border-stone px-6 py-5 space-y-4">
                {/* Promo code */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Promo code"
                    className="flex-1 input-base text-xs py-2"
                  />
                  <button className="px-4 py-2 bg-ink text-white text-xs font-medium hover:bg-ink/80 transition-colors">
                    Apply
                  </button>
                </div>

                {/* Summary */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm text-muted">
                    <span>Subtotal</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted">
                    <span>Shipping</span>
                    <span>{remaining === 0 ? "Free" : "Calculated at checkout"}</span>
                  </div>
                  <div className="flex justify-between text-base font-semibold text-ink pt-2 border-t border-stone">
                    <span>Total</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                </div>

                <Link
                  href="/checkout"
                  onClick={closeCart}
                  className="w-full inline-flex items-center justify-center font-sans font-medium tracking-wide transition-all duration-200 active:scale-[0.98] bg-forest text-white hover:bg-forest-dark text-sm px-8 py-4"
                >
                  Checkout
                </Link>
                <button
                  onClick={closeCart}
                  className="w-full text-xs text-muted hover:text-ink transition-colors text-center"
                >
                  Continue Shopping
                </button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
