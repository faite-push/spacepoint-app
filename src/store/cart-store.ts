"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, Product, ProductVariant } from "@/types/shop";
import { cartItemKey } from "@/types/shop";

type CartState = {
  items: CartItem[];
  addProduct: (product: Product, variant?: ProductVariant | null) => void;
  removeItem: (cartKey: string) => void;
  setQuantity: (cartKey: string, quantity: number) => void;
  clear: () => void;
  total: () => number;
};

function buildCartItem(product: Product, variant?: ProductVariant | null): CartItem {
  const variantId = variant?.id ?? null;
  const image =
    variant?.imageUrl ||
    product.imageUrl ||
    product.images[0] ||
    undefined;

  const displayName = variant ? `${product.name} — ${variant.name}` : product.name;
  const price = variant?.price ?? product.price;

  return {
    cartKey: cartItemKey(product.id, variantId),
    productId: product.id,
    variantId,
    variantName: variant?.name ?? null,
    slug: product.slug,
    name: displayName,
    price,
    image,
    platform: product.platform,
    quantity: 1,
  };
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addProduct: (product, variant) => {
        if (product.hasVariants && !variant) return;

        const entry = buildCartItem(product, variant);
        set((state) => {
          const current = state.items.find((item) => item.cartKey === entry.cartKey);
          if (current) {
            return {
              items: state.items.map((item) =>
                item.cartKey === entry.cartKey
                  ? { ...item, quantity: Math.min(item.quantity + 1, 10) }
                  : item
              ),
            };
          }
          return { items: [...state.items, entry] };
        });
      },
      removeItem: (cartKey) =>
        set((state) => ({
          items: state.items.filter((item) => item.cartKey !== cartKey),
        })),
      setQuantity: (cartKey, quantity) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.cartKey === cartKey
              ? { ...item, quantity: Math.max(1, Math.min(10, quantity)) }
              : item
          ),
        })),
      clear: () => set({ items: [] }),
      total: () => get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    }),
    { name: "spacepoint-cart-v2" }
  )
);
