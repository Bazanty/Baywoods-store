"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Minus, Plus, X, ShoppingBag, ArrowRight, Truck, Shield, RotateCcw } from "lucide-react";
import { useCartStore } from "@/lib/store";
import { formatPrice } from "@/lib/utils";

const FREE_SHIPPING_THRESHOLD = 5000;

export default function CartPage() {
  const { items, removeItem, updateQuantity, subtotal } = useCartStore();
  const total = subtotal();
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - total);
  const itemCount = items.reduce((s, i) => s + i.quantity, 0);

  if (items.length === 0) {
    return <EmptyCart />;
  }

  return (
    <div className="pt-24 lg:pt-28 pb-24 bg-beige min-h-screen">
      <div className="container-px max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-muted">Shopping bag</p>
            <h1 className="font-serif text-4xl lg:text-5xl text-ink mt-2">Your Cart</h1>
          </div>
          <p className="text-sm text-muted hidden sm:block">
            {itemCount} {itemCount === 1 ? "item" : "items"}
          </p>
        </div>

        {/* Free shipping bar */}
        <div className="bg-cream border border-stone p-5 mb-6">
          {remaining > 0 ? (
            <>
              <p className="text-sm text-ink">
                You&apos;re <span className="font-semibold">{formatPrice(remaining)}</span> away
                from free shipping.
              </p>
              <div className="mt-3 h-1 bg-stone rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(total / FREE_SHIPPING_THRESHOLD) * 100}%` }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="h-full bg-forest"
                />
              </div>
            </>
          ) : (
            <p className="text-sm font-medium text-forest-dark flex items-center gap-2">
              <Truck size={16} /> You qualify for free shipping.
            </p>
          )}
        </div>

        <div className="grid lg:grid-cols-[1fr_380px] gap-8">
          {/* Items list */}
          <section>
            <ul className="bg-cream border border-stone divide-y divide-stone">
              <AnimatePresence initial={false}>
                {items.map((item) => {
                  const key = `${item.product.id}-${item.size}-${item.color.name}`;
                  const price = item.product.salePrice ?? item.product.price;
                  return (
                    <motion.li
                      key={key}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20, height: 0 }}
                      transition={{ duration: 0.25 }}
                      className="flex gap-5 p-5 lg:p-6 overflow-hidden"
                    >
                      <Link
                        href={`/product/${item.product.slug}`}
                        className="relative w-24 lg:w-28 h-32 bg-beige shrink-0 overflow-hidden group"
                      >
                        <Image
                          src={item.product.images[0]}
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
                              className="text-base font-medium text-ink hover:text-forest transition-colors line-clamp-2"
                            >
                              {item.product.name}
                            </Link>
                            <div className="flex items-center gap-3 mt-1.5 text-xs text-muted">
                              <span>Size {item.size}</span>
                              <span className="w-px h-3 bg-stone" />
                              <span className="flex items-center gap-1.5">
                                <span
                                  className="w-2.5 h-2.5 rounded-full border border-stone"
                                  style={{ backgroundColor: item.color.hex }}
                                />
                                {item.color.name}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() =>
                              removeItem(item.product.id, item.size, item.color.name)
                            }
                            aria-label="Remove item"
                            className="text-muted hover:text-danger transition-colors p-1 -m-1 shrink-0"
                          >
                            <X size={16} />
                          </button>
                        </div>

                        <div className="mt-auto pt-4 flex items-center justify-between">
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
                              className="w-9 h-9 flex items-center justify-center text-ink hover:bg-stone/50 transition-colors"
                              aria-label="Decrease quantity"
                            >
                              <Minus size={13} />
                            </button>
                            <span className="w-10 text-center text-sm font-medium tabular-nums">
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
                              className="w-9 h-9 flex items-center justify-center text-ink hover:bg-stone/50 transition-colors"
                              aria-label="Increase quantity"
                            >
                              <Plus size={13} />
                            </button>
                          </div>

                          <div className="text-right">
                            {item.product.salePrice && (
                              <p className="text-xs text-muted line-through">
                                {formatPrice(item.product.price * item.quantity)}
                              </p>
                            )}
                            <p className="text-base font-semibold text-ink">
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

            {/* Reassurance row */}
            <div className="mt-6 grid grid-cols-3 gap-3">
              <Reassurance icon={Truck} label="Free over KSh 5,000" />
              <Reassurance icon={RotateCcw} label="14-day returns" />
              <Reassurance icon={Shield} label="M-Pesa secure" />
            </div>
          </section>

          {/* Summary */}
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="bg-cream border border-stone p-6 lg:p-7">
              <h2 className="font-serif text-2xl text-ink mb-5">Summary</h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-muted">
                  <span>Subtotal ({itemCount})</span>
                  <span className="text-ink">{formatPrice(total)}</span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>Shipping</span>
                  <span className="text-ink">
                    {remaining === 0 ? "Free" : "Calculated at checkout"}
                  </span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>Tax</span>
                  <span className="text-ink">Included</span>
                </div>
              </div>

              <div className="mt-5 pt-5 border-t border-stone flex items-baseline justify-between">
                <span className="text-sm font-medium text-ink">Estimated total</span>
                <span className="font-serif text-2xl text-ink">{formatPrice(total)}</span>
              </div>

              <Link
                href="/checkout"
                className="mt-6 w-full inline-flex items-center justify-center gap-2 bg-forest text-white hover:bg-forest-dark transition-colors text-sm font-medium tracking-wide px-6 py-4"
              >
                Checkout <ArrowRight size={15} />
              </Link>

              <Link
                href="/shop"
                className="mt-3 w-full inline-flex items-center justify-center text-xs text-muted hover:text-ink transition-colors"
              >
                or continue shopping
              </Link>

              <p className="mt-5 text-[11px] text-muted text-center leading-relaxed">
                Pay with M-Pesa or card. Order ships within 24h from Nairobi.
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
    <div className="bg-cream border border-stone px-3 py-4 flex flex-col items-center gap-1.5 text-center">
      <Icon size={16} className="text-forest" strokeWidth={1.8} />
      <span className="text-[11px] text-muted leading-tight">{label}</span>
    </div>
  );
}

function EmptyCart() {
  return (
    <div className="pt-32 pb-24 bg-beige min-h-screen">
      <div className="max-w-md mx-auto text-center px-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="w-20 h-20 mx-auto bg-cream border border-stone rounded-full flex items-center justify-center mb-6"
        >
          <ShoppingBag size={26} className="text-muted" strokeWidth={1.5} />
        </motion.div>
        <h1 className="font-serif text-4xl text-ink">Your cart is empty</h1>
        <p className="text-sm text-muted mt-3 max-w-xs mx-auto">
          Looks like you haven&apos;t added anything yet. Browse the shop to find your next piece.
        </p>
        <Link
          href="/shop"
          className="mt-8 inline-flex items-center justify-center gap-2 bg-forest text-white hover:bg-forest-dark transition-colors text-sm font-medium tracking-wide px-8 py-4"
        >
          Browse shop <ArrowRight size={15} />
        </Link>
      </div>
    </div>
  );
}
