"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CartItem, Product, ProductColor } from "./types";

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  wishlist: string[];
  addItem: (product: Product, size: string, color: ProductColor) => void;
  removeItem: (productId: string, size: string, colorName: string) => void;
  updateQuantity: (productId: string, size: string, colorName: string, qty: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleWishlist: (productId: string) => void;
  isWishlisted: (productId: string) => boolean;
  itemCount: () => number;
  subtotal: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      wishlist: [],

      addItem: (product, size, color) => {
        const existing = get().items.find(
          (i) =>
            i.product.id === product.id &&
            i.size === size &&
            i.color.name === color.name
        );
        if (existing) {
          set((s) => ({
            items: s.items.map((i) =>
              i.product.id === product.id &&
              i.size === size &&
              i.color.name === color.name
                ? { ...i, quantity: i.quantity + 1 }
                : i
            ),
          }));
        } else {
          set((s) => ({ items: [...s.items, { product, size, color, quantity: 1 }] }));
        }
        set({ isOpen: true });
      },

      removeItem: (productId, size, colorName) => {
        set((s) => ({
          items: s.items.filter(
            (i) =>
              !(i.product.id === productId && i.size === size && i.color.name === colorName)
          ),
        }));
      },

      updateQuantity: (productId, size, colorName, qty) => {
        if (qty < 1) {
          get().removeItem(productId, size, colorName);
          return;
        }
        set((s) => ({
          items: s.items.map((i) =>
            i.product.id === productId &&
            i.size === size &&
            i.color.name === colorName
              ? { ...i, quantity: qty }
              : i
          ),
        }));
      },

      clearCart: () => set({ items: [] }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      toggleWishlist: (productId) => {
        const { wishlist } = get();
        set({
          wishlist: wishlist.includes(productId)
            ? wishlist.filter((id) => id !== productId)
            : [...wishlist, productId],
        });
      },

      isWishlisted: (productId) => get().wishlist.includes(productId),

      itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      subtotal: () =>
        get().items.reduce(
          (sum, i) =>
            sum + (i.product.salePrice ?? i.product.price) * i.quantity,
          0
        ),
    }),
    { name: "baywoods-cart" }
  )
);
