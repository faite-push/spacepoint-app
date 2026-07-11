import { apiFetch } from "@/lib/api";

export type CartSyncItem = {
  productId: string;
  variantId?: string | null;
  quantity: number;
};

export async function syncAbandonedCart(payload: {
  visitorId: string;
  items: CartSyncItem[];
  couponCode?: string | null;
  email?: string | null;
  customerName?: string | null;
}): Promise<void> {
  await apiFetch("/v2/api/cart/sync", {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export async function captureCartEmail(payload: {
  visitorId: string;
  email: string;
  customerName?: string | null;
}): Promise<void> {
  await apiFetch("/v2/api/cart/email", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function clearAbandonedCart(visitorId: string): Promise<void> {
  await apiFetch(`/v2/api/cart?visitorId=${encodeURIComponent(visitorId)}`, {
    method: "DELETE",
  });
}
