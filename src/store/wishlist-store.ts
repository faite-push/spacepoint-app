"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  addWishlistItem,
  removeWishlistItem,
  syncWishlist,
} from "@/lib/wishlist-api";
import type { Product } from "@/types/shop";

type WishlistStore = {
  items: Product[];
  cloudUserId: string | null;
  syncing: boolean;
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  toggleItem: (product: Product) => void;
  setCloudUserId: (userId: string | null) => void;
  syncForUser: (userId: string) => Promise<void>;
};

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      cloudUserId: null,
      syncing: false,

      addItem: (product) => {
        if (!get().isInWishlist(product.id)) {
          set((state) => ({ items: [...state.items, product] }));
        }
      },

      removeItem: (productId) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== productId),
        }));

        const userId = get().cloudUserId;
        if (userId) {
          removeWishlistItem(productId).catch(() => {});
        }
      },

      isInWishlist: (productId) => get().items.some((item) => item.id === productId),

      toggleItem: (product) => {
        const wasIn = get().isInWishlist(product.id);

        if (wasIn) {
          get().removeItem(product.id);
        } else {
          get().addItem(product);
          const userId = get().cloudUserId;
          if (userId) {
            addWishlistItem(product.id).catch(() => {
              get().removeItem(product.id);
            });
          }
        }
      },

      setCloudUserId: (userId) => set({ cloudUserId: userId }),

      syncForUser: async (userId) => {
        if (get().syncing) return;

        set({ syncing: true, cloudUserId: userId });

        try {
          const localIds = get().items.map((item) => item.id);
          const products = await syncWishlist(localIds);
          set({ items: products, cloudUserId: userId });
        } catch {
          set({ cloudUserId: userId });
        } finally {
          set({ syncing: false });
        }
      },
    }),
    {
      name: "spacepoint-wishlist",
      partialize: (state) => ({ items: state.items }),
    }
  )
);
