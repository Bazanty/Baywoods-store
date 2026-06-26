"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { CartItem, Product, ProductColor, ProductVariant } from "./types";
import { supabase } from "./supabase/client";
import {
  fetchWishlist,
  addToWishlist,
  removeFromWishlist,
} from "./supabase/wishlist";

// A cart line is identified by the variant it resolves to — that's the single
// source of truth for inventory and pricing. Variant-less products (or carts
// persisted before variants existed) fall back to the product+size+colour
// triple so they still de-dupe sensibly.
export function cartLineKey(
  item: Pick<CartItem, "variantId" | "product" | "size" | "color">
): string {
  if (item.variantId) return `v:${item.variantId}`;
  return `p:${item.product.id}:${item.size}:${item.color.name}`;
}

// Resolve the variant for a (size, colour) selection. Only constrains the axes
// the product actually varies on, so a size-only product isn't forced to match
// the "Default" colour sentinel (which would silently yield no variant).
export function resolveVariant(
  product: Product,
  size: string,
  colorName: string
): ProductVariant | undefined {
  return product.variants?.find(
    (v) =>
      (product.sizes.length === 0 || (v.size ?? "") === size) &&
      (product.colors.length === 0 || (v.colorName ?? "") === colorName)
  );
}

// Images carry no colour/variant FK in the DB, so a positional colour→image
// index is only trustworthy when there's exactly one image per colour.
// Otherwise the index is noise and we fall back to the primary image.
function pickLineImage(product: Product, color: ProductColor): string | undefined {
  if (product.colors.length > 1 && product.images.length === product.colors.length) {
    const idx = product.colors.findIndex((c) => c.name === color.name);
    if (idx >= 0 && product.images[idx]) return product.images[idx];
  }
  return product.images[0];
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  wishlist: string[];
  _userId: string | null;
  _wishlistChannel: RealtimeChannel | null;
  addItem: (product: Product, size: string, color: ProductColor, variant?: ProductVariant) => void;
  removeItem: (item: CartItem) => void;
  updateQuantity: (item: CartItem, qty: number) => void;
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

      addItem: (product, size, color, variant) => {
        // The selected variant is the source of truth. Trust the one the product
        // page resolved; only fall back to matching here for older callers.
        const resolved = variant ?? resolveVariant(product, size, color.name);
        const draft: CartItem = {
          product,
          size,
          color,
          quantity: 1,
          variantId: resolved?.id,
          selectedImage: pickLineImage(product, color),
        };
        const key = cartLineKey(draft);

        set((s) => {
          const existing = s.items.find((i) => cartLineKey(i) === key);
          return {
            items: existing
              ? s.items.map((i) =>
                  cartLineKey(i) === key ? { ...i, quantity: i.quantity + 1 } : i
                )
              : [...s.items, draft],
            isOpen: true,
          };
        });
      },

      removeItem: (item) => {
        const key = cartLineKey(item);
        set((s) => ({ items: s.items.filter((i) => cartLineKey(i) !== key) }));
      },

      updateQuantity: (item, qty) => {
        if (qty < 1) {
          get().removeItem(item);
          return;
        }
        const key = cartLineKey(item);
        set((s) => ({
          items: s.items.map((i) =>
            cartLineKey(i) === key ? { ...i, quantity: qty } : i
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
