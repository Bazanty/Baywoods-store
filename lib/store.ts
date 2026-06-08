"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { CartItem, Product, ProductColor } from "./types";
import { supabase } from "./supabase/client";
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
  _wishlistChannel: RealtimeChannel | null;
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
      _wishlistChannel: null,

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
        // Tear down any prior subscription before starting a new one — this
        // guards against duplicate handlers when loadWishlist re-runs on
        // auth state changes (token refresh, tab focus, etc.).
        const prior = get()._wishlistChannel;
        if (prior) {
          await supabase.removeChannel(prior);
        }
        set({ _userId: userId, _wishlistChannel: null });

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

        // Subscribe to remote wishlist mutations so changes on another device
        // appear here without a manual refresh. Realtime must be enabled for
        // the wishlists table in Supabase for these events to fire.
        const channel = supabase
          .channel(`wishlist:${userId}`)
          .on(
            "postgres_changes",
            { event: "INSERT", schema: "public", table: "wishlists", filter: `user_id=eq.${userId}` },
            (payload) => {
              const productId = (payload.new as { product_id?: string })?.product_id;
              if (!productId) return;
              set((s) =>
                s.wishlist.includes(productId)
                  ? s
                  : { wishlist: [...s.wishlist, productId] }
              );
            }
          )
          .on(
            "postgres_changes",
            { event: "DELETE", schema: "public", table: "wishlists", filter: `user_id=eq.${userId}` },
            (payload) => {
              const productId = (payload.old as { product_id?: string })?.product_id;
              if (!productId) return;
              set((s) => ({ wishlist: s.wishlist.filter((id) => id !== productId) }));
            }
          )
          .subscribe();
        set({ _wishlistChannel: channel });
      },

      clearUser: () => {
        const channel = get()._wishlistChannel;
        if (channel) {
          supabase.removeChannel(channel);
        }
        set({ _userId: null, _wishlistChannel: null });
      },

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
