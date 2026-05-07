"use client";

import { useEffect } from "react";
import { useCartStore } from "@/lib/store";

/**
 * Clears the cart on mount when the order page renders.
 * Lives as a client island so the order page itself can stay a server component.
 */
export default function OrderClearCart() {
  const clearCart = useCartStore((s) => s.clearCart);
  useEffect(() => {
    clearCart();
  }, [clearCart]);
  return null;
}
