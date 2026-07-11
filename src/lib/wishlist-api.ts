import { apiFetch } from "@/lib/api";
import type { Product } from "@/types/shop";

export async function fetchMyWishlist(): Promise<Product[]> {
  const data = await apiFetch<{ products: Product[] }>("/v2/api/wishlist/me");
  return data.products;
}

export async function syncWishlist(productIds: string[]): Promise<Product[]> {
  const data = await apiFetch<{ products: Product[] }>("/v2/api/wishlist/sync", {
    method: "POST",
    body: JSON.stringify({ productIds }),
  });
  return data.products;
}

export async function addWishlistItem(productId: string): Promise<void> {
  await apiFetch("/v2/api/wishlist", {
    method: "POST",
    body: JSON.stringify({ productId }),
  });
}

export async function removeWishlistItem(productId: string): Promise<void> {
  await apiFetch(`/v2/api/wishlist/${encodeURIComponent(productId)}`, {
    method: "DELETE",
  });
}
