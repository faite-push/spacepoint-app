import { apiFetch, generateIdempotencyKey } from "@/lib/api";
import type { ProductListParams, ProductListPagination } from "@/lib/product-list-params";
import { toApiProductParams } from "@/lib/product-list-params";
import type { Order, Product } from "@/types/shop";

export type ProductListResult = {
  products: Product[];
  pagination: ProductListPagination;
  facets?: { platforms: string[] };
};

export async function fetchProductListing(params?: ProductListParams): Promise<ProductListResult> {
  const query = params ? `?${new URLSearchParams(toApiProductParams(params)).toString()}` : "";
  return apiFetch<ProductListResult>(`/v2/api/products${query}`);
}

export async function fetchProducts(params?: ProductListParams | Record<string, string>): Promise<Product[]> {
  const normalized =
    params && ("sortBy" in params || "page" in params)
      ? toApiProductParams(params as ProductListParams)
      : (params as Record<string, string> | undefined);

  const query = normalized ? `?${new URLSearchParams(normalized).toString()}` : "";
  const data = await apiFetch<ProductListResult>(`/v2/api/products${query}`);
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

export async function fetchCheckoutPaymentOptions(paymentMethod?: "PIX" | "CARD"): Promise<{
  gateway: string | null;
  pixGateway: string | null;
  cardGateway: string | null;
  methods: string[];
  requiredCustomerFields?: string[];
  requiredFieldsByMethod?: { PIX: string[]; CARD: string[] };
}> {
  const query = paymentMethod ? `?paymentMethod=${paymentMethod}` : "";
  return apiFetch(`/v2/api/orders/payment-options${query}`);
}

export async function createOrder(
  items: Array<{ productId: string; variantId?: string | null; quantity: number }>,
  opts?: {
    couponCode?: string | null;
    paymentMethod?: string;
    checkoutData?: any;
    deliveryOption?: "standard" | "express";
  }
): Promise<Order> {
  const data = await apiFetch<{ order: Order }>("/v2/api/orders", {
    method: "POST",
    headers: { "Idempotency-Key": generateIdempotencyKey() },
    body: JSON.stringify({
      items,
      couponCode: opts?.couponCode ?? null,
      paymentMethod: opts?.paymentMethod ?? "PIX",
      checkoutData: opts?.checkoutData ?? null,
      deliveryOption: opts?.deliveryOption ?? "standard",
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
