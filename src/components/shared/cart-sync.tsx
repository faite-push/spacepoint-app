"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/context/auth-context";
import { useCartStore } from "@/store/cart-store";
import { syncAbandonedCart } from "@/lib/cart-api";
import { getVisitorId } from "@/lib/visitor-id";

const SYNC_DELAY_MS = 3000;

export function CartSync() {
  const { user, loading } = useAuth();
  const items = useCartStore((s) => s.items);
  const appliedCoupon = useCartStore((s) => s.appliedCoupon);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPayloadRef = useRef("");

  useEffect(() => {
    if (loading) return;

    const visitorId = getVisitorId();
    if (!visitorId) return;

    const payload = JSON.stringify({
      visitorId,
      userId: user?.id ?? null,
      items: items.map((item) => ({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
      })),
      couponCode: appliedCoupon?.code ?? null,
      email: user?.email ?? null,
      customerName: user?.name ?? null,
    });

    if (payload === lastPayloadRef.current) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      lastPayloadRef.current = payload;
      syncAbandonedCart({
        visitorId,
        items: items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
        })),
        couponCode: appliedCoupon?.code ?? null,
        email: user?.email ?? null,
        customerName: user?.name ?? null,
      }).catch(() => {});
    }, SYNC_DELAY_MS);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [items, appliedCoupon, user?.id, user?.email, user?.name, loading]);

  return null;
}
