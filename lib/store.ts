"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { CartItem, Product, ProductColor } from "./types";
import {
  fetchWishlist,
  addToWishlist,
  removeFromWishlist,
} from "./supabase/wishlist";

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  wishlist: string[];
  _userId: string | null;
  addItem: (product: Product, size: string, color: ProductColor) => void;
  removeItem: (productId: string, size: string, colorName: string) => void;
  updateQuantity: (productId: string, size: string, colorName: string, qty: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleWishlist: (productId: string) => void;
  isWishlisted: (productId: string) => boolean;
  loadWishlist: (userId: string) => Promise<void>;
  clearUser: () => void;
  itemCount: () => number;
  subtotal: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      wishlist: [],
      _userId: null,

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
          // Resolve the matching variant row so the order route can decrement
          // the right inventory bucket. Falls back to undefined for products
          // that only carry base inventory.
          const variantId = product.variants?.find(
            (v) =>
              (v.size ?? "") === size &&
              (v.colorName ?? "") === color.name
          )?.id
            ?? product.variants?.find(
              (v) => v.size === size || v.colorName === color.name
            )?.id;
          set((s) => ({
            items: [...s.items, { product, size, color, quantity: 1, variantId }],
          }));
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
        const { wishlist, _userId } = get();
        const removing = wishlist.includes(productId);
        set({
          wishlist: removing
            ? wishlist.filter((id) => id !== productId)
            : [...wishlist, productId],
        });
        if (_userId) {
          (removing
            ? removeFromWishlist(_userId, productId)
            : addToWishlist(_userId, productId)
          ).catch(() => {});
        }
      },

      isWishlisted: (productId) => get().wishlist.includes(productId),

      loadWishlist: async (userId) => {
        set({ _userId: userId });
        try {
          const remote = await fetchWishlist(userId);
          const local = get().wishlist;
          const merged = Array.from(new Set([...remote, ...local]));
          const newItems = local.filter((id) => !remote.includes(id));
          await Promise.all(newItems.map((id) => addToWishlist(userId, id)));
          set({ wishlist: merged });
        } catch {
          // keep local wishlist as fallback
        }
      },

      clearUser: () => set({ _userId: null }),

      itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      subtotal: () =>
        get().items.reduce(
          (sum, i) =>
            sum + (i.product.salePrice ?? i.product.price) * i.quantity,
          0
        ),
    }),
    {
      name: "baywoods-cart",
      partialize: (state) => ({
        items: state.items,
        wishlist: state.wishlist,
      }),
    }
  )
);
