import { apiFetch } from "@/lib/api";

export async function trackProductInterestView(payload: {
  visitorId: string;
  productId: string;
  variantId?: string | null;
  email?: string | null;
  customerName?: string | null;
}): Promise<{ tracked: boolean; reason?: string; id?: string }> {
  return apiFetch("/v2/api/product-interest/view", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
