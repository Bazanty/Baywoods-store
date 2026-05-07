"use client";

import { create } from "zustand";
import { supabase } from "./supabase/client";
import { useCartStore } from "./store";
import type { User } from "@supabase/supabase-js";

interface AuthStore {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signInWithOAuth: (provider: "google" | "apple") => Promise<string | null>;
  signUp: (opts: { email: string; password: string; firstName: string; lastName: string; phone?: string }) => Promise<string | null>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<string | null>;
  init: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  loading: false,
  initialized: false,

  init: async () => {
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user ?? null;
    set({ user, initialized: true });
    if (user) useCartStore.getState().loadWishlist(user.id);

    supabase.auth.onAuthStateChange((_event, session) => {
      const next = session?.user ?? null;
      set({ user: next });
      if (next) {
        useCartStore.getState().loadWishlist(next.id);
      } else {
        useCartStore.getState().clearUser();
      }
    });
  },

  signIn: async (email, password) => {
    set({ loading: true });
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    set({ loading: false });
    return error ? error.message : null;
  },

  signInWithOAuth: async (provider) => {
    set({ loading: true });
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/account` },
    });
    set({ loading: false });
    return error ? error.message : null;
  },

  signUp: async ({ email, password, firstName, lastName, phone }) => {
    set({ loading: true });
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { first_name: firstName, last_name: lastName, phone: phone ?? "" },
      },
    });
    set({ loading: false });
    return error ? error.message : null;
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null });
  },

  resetPassword: async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
    return error ? error.message : null;
  },
}));
