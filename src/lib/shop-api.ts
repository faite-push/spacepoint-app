import { apiFetch, generateIdempotencyKey } from "@/lib/api";
import type { Order, Product } from "@/types/shop";

export async function fetchProducts(params?: Record<string, string>): Promise<Product[]> {
  const query = params ? `?${new URLSearchParams(params).toString()}` : "";
  const data = await apiFetch<{ products: Product[] }>(`/v2/api/products${query}`);
  return data.products;
}

export async function fetchProduct(slug: string): Promise<Product> {
  const data = await apiFetch<{ product: Product }>(
    `/v2/api/products/${encodeURIComponent(slug)}`
  );
  return data.product;
}

export async function fetchMyOrders(): Promise<Order[]> {
  const data = await apiFetch<{ orders: Order[] }>("/v2/api/orders/me");
  return data.orders;
}

export async function fetchOrder(id: string, paymentMethod?: string): Promise<{ order: Order; paymentData?: any }> {
  const query = paymentMethod ? `?paymentMethod=${encodeURIComponent(paymentMethod)}` : "";
  const data = await apiFetch<{ order: Order; paymentData?: any }>(`/v2/api/orders/${id}${query}`);
  return data;
}

export async function fetchCheckoutPaymentOptions(): Promise<{
  gateway: string | null;
  pixGateway: string | null;
  cardGateway: string | null;
  methods: string[];
}> {
  return apiFetch("/v2/api/orders/payment-options");
}

export async function createOrder(
  items: Array<{ productId: string; variantId?: string | null; quantity: number }>,
  opts?: { couponCode?: string | null; paymentMethod?: string }
): Promise<Order> {
  const data = await apiFetch<{ order: Order }>("/v2/api/orders", {
    method: "POST",
    headers: { "Idempotency-Key": generateIdempotencyKey() },
    body: JSON.stringify({
      items,
      couponCode: opts?.couponCode ?? null,
      paymentMethod: opts?.paymentMethod ?? "PIX",
    }),
  });
  return data.order;
}

export function formatPrice(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value / 100);
}

export function formatPriceLabel(product: Product): string {
  if (product.priceFrom && product.hasVariants) {
    return `${formatPrice(product.price)}`;
  }
  return formatPrice(product.price);
}
