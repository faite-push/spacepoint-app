"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/context/auth-context";
import { getVisitorId } from "@/lib/visitor-id";
import { trackProductInterestView } from "@/lib/product-interest-api";

const VIEW_DELAY_MS = 2500;

type Props = {
  productId: string;
  variantId?: string | null;
};

/** Registra visualização na PDP para a automação de abandono de produto. */
export function ProductViewTracker({ productId, variantId }: Props) {
  const { user, loading } = useAuth();
  const sentKeyRef = useRef("");

  useEffect(() => {
    if (loading || !productId) return;

    const visitorId = getVisitorId();
    if (!visitorId) return;

    const key = `${visitorId}:${productId}:${variantId || ""}:${user?.id || ""}`;
    if (key === sentKeyRef.current) return;

    const timer = setTimeout(() => {
      sentKeyRef.current = key;
      trackProductInterestView({
        visitorId,
        productId,
        variantId: variantId || null,
        email: user?.email ?? null,
        customerName: user?.name ?? null,
      }).catch(() => {});
    }, VIEW_DELAY_MS);

    return () => clearTimeout(timer);
  }, [productId, variantId, user?.id, user?.email, user?.name, loading]);

  return null;
}
