"use client";

import { useState, useEffect } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, Product, ProductVariant } from "@/types/shop";
import { cartItemKey } from "@/types/shop";
import { apiFetch } from "@/lib/api";

export type Coupon = {
  id: string;
  code: string;
  type: "PERCENTAGE" | "FIXED";
  value: number;
  minOrderValue: number | null;
  maxDiscount: number | null;
};

type CartState = {
  items: CartItem[];
  isOpen: boolean;
  appliedCoupon: Coupon | null;
  setIsOpen: (isOpen: boolean) => void;
  addProduct: (product: Product, variant?: ProductVariant | null) => void;
  removeItem: (cartKey: string) => void;
  setQuantity: (cartKey: string, quantity: number) => void;
  clear: () => void;
  total: () => number;
  subtotal: () => number;
  discount: () => number;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: () => void;
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
    stockQuantity: variant ? variant.stockQuantity : product.stockQuantity,
    maxPurchaseQuantity: variant ? variant.maxPurchaseQuantity : null,
  };
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      appliedCoupon: null,
      setIsOpen: (isOpen) => set({ isOpen }),
      addProduct: (product, variant) => {
        if (product.hasVariants && !variant) return;

        const entry = buildCartItem(product, variant);
        set((state) => {
          const current = state.items.find((item) => item.cartKey === entry.cartKey);
          if (current) {
            const maxQ = current.maxPurchaseQuantity || current.stockQuantity || 99;
            return {
              items: state.items.map((item) =>
                item.cartKey === entry.cartKey
                  ? { ...item, quantity: Math.min(item.quantity + 1, maxQ) }
                  : item
              ),
              isOpen: true,
            };
          }
          return { items: [...state.items, entry], isOpen: true };
        });
      },
      removeItem: (cartKey) =>
        set((state) => ({
          items: state.items.filter((item) => item.cartKey !== cartKey),
        })),
      setQuantity: (cartKey, quantity) =>
        set((state) => ({
          items: state.items.map((item) => {
            if (item.cartKey === cartKey) {
              const maxQ = item.maxPurchaseQuantity || item.stockQuantity || 99;
              return { ...item, quantity: Math.max(1, Math.min(maxQ, quantity)) };
            }
            return item;
          }),
        })),
      clear: () => set({ items: [], appliedCoupon: null }),
      subtotal: () => get().items.reduce((sum, item) => sum + item.price * item.quantity, 0),
      discount: () => {
        const { appliedCoupon, subtotal } = get();
        if (!appliedCoupon) return 0;
        
        const sub = subtotal();
        if (appliedCoupon.minOrderValue != null) {
          const minCents = Math.round(appliedCoupon.minOrderValue * 100);
          if (sub < minCents) return 0;
        }

        let disc = 0;
        if (appliedCoupon.type === "PERCENTAGE") {
          // appliedCoupon.value é porcentagem (ex: 10 significa 10%)
          disc = Math.floor(sub * (appliedCoupon.value / 100));
        } else {
          // appliedCoupon.value é valor fixo em R$
          disc = Math.round(appliedCoupon.value * 100);
        }

        if (appliedCoupon.maxDiscount != null) {
          const maxDiscountCents = Math.round(appliedCoupon.maxDiscount * 100);
          if (disc > maxDiscountCents) disc = maxDiscountCents;
        }

        return disc;
      },
      total: () => {
        const sub = get().subtotal();
        const disc = get().discount();
        return Math.max(0, sub - disc);
      },
      applyCoupon: async (code) => {
        try {
          const res = await apiFetch<{ coupon: Coupon }>(`/v2/api/coupons/validate?code=${encodeURIComponent(code)}`);
          if (res.coupon) {
            set({ appliedCoupon: res.coupon });
          }
        } catch (error: any) {
          throw new Error(error.message || "Cupom inválido");
        }
      },
      removeCoupon: () => set({ appliedCoupon: null }),
    }),
    { name: "spacepoint-cart-v3", skipHydration: true }
  )
);

/** Aguarda reidratação do localStorage antes de renderizar valores do carrinho */
export function useCartHydrated() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const finish = () => setHydrated(true);
    const unsub = useCartStore.persist.onFinishHydration(finish);
    void useCartStore.persist.rehydrate();
    if (useCartStore.persist.hasHydrated()) {
      finish();
    }
    return unsub;
  }, []);

  return hydrated;
}
