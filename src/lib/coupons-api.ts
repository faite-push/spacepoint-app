import { API_URL, getCsrfToken, getApiHeaders } from "./api";

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = (init.method ?? "GET").toUpperCase();
  const isMutation = ["POST", "PUT", "PATCH", "DELETE"].includes(method);

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...getApiHeaders(),
      ...(isMutation ? { "X-CSRF-Token": getCsrfToken() } : {}),
      ...(init.headers || {}),
    },
  });

  if (!res.ok) {
    let message = "Erro inesperado";
    try {
      const body = await res.json();
      message = body?.error || message;
    } catch {
      /* noop */
    }
    throw new Error(message);
  }

  if (res.status === 204) return undefined as unknown as T;
  return (await res.json()) as T;
}

export type CouponType = "PERCENTAGE" | "FIXED";

export interface CouponReference {
  id: string;
  couponId: string;
  type: "PRODUCT" | "CATEGORY" | "VARIANT";
  referenceId: string;
}

export interface Coupon {
  id: string;
  code: string;
  description: string | null;
  type: CouponType;
  value: string;
  minOrderValue: string | null;
  maxOrderValue: string | null;
  maxDiscount: string | null;
  maxUses: number | null;
  usedCount: number;
  perUserLimit: number;
  isActive: boolean;
  startDate: string | null;
  endDate: string | null;
  allowedPayments: string[];
  createdAt: string;
  updatedAt: string;
  references?: CouponReference[];
  _count?: {
    usages: number;
  };
}

export interface CouponPayload {
  code: string;
  description?: string;
  type: CouponType;
  value: number;
  minOrderValue?: number | null;
  maxOrderValue?: number | null;
  maxDiscount?: number | null;
  maxUses?: number | null;
  perUserLimit?: number;
  isActive?: boolean;
  startDate?: string | null;
  endDate?: string | null;
  allowedPayments?: string[];
  references?: { type: "PRODUCT" | "CATEGORY" | "VARIANT"; referenceId: string }[];
}

export interface CouponStats {
  totalUses: number;
  uniqueCouponsUsed: number;
  totalDiscounted: number;
  totalConverted: number;
}

export interface CouponDetailStats {
  totalUses: number;
  totalDiscounted: number;
  totalConverted: number;
}

export interface CouponSale {
  id: string;
  discount: number;
  createdAt: string;
  user: { id: string; name: string | null; email: string | null; image: string | null } | null;
  order: {
    id: string;
    status: string;
    total: number;
    subtotal: number;
    discount: number;
    paymentMethod: string | null;
    createdAt: string;
    paidAt: string | null;
  } | null;
}

export interface CouponDetailResponse {
  coupon: Coupon;
  stats: CouponDetailStats;
  sales: CouponSale[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export const couponsApi = {
  list: (search?: string) => {
    const qs = search ? `?search=${encodeURIComponent(search)}` : "";
    return request<{ coupons: Coupon[] }>(`/v2/api/admin/coupons${qs}`);
  },
  stats: (range?: { from: Date; to: Date } | string) => {
    if (typeof range === "object") {
      const fromIso = range.from.toISOString();
      const toIso = range.to.toISOString();
      return request<CouponStats>(`/v2/api/admin/coupons/stats?from=${fromIso}&to=${toIso}`);
    }
    const period = range || "all";
    return request<CouponStats>(`/v2/api/admin/coupons/stats?period=${period}`);
  },
  get: (
    id: string,
    params?: {
      from?: Date;
      to?: Date;
      search?: string;
      status?: string;
      page?: number;
      limit?: number;
    }
  ) => {
    const qs = new URLSearchParams();
    if (params?.from) qs.set("from", params.from.toISOString());
    if (params?.to) qs.set("to", params.to.toISOString());
    if (params?.search) qs.set("search", params.search);
    if (params?.status && params.status !== "all") qs.set("status", params.status);
    if (params?.page) qs.set("page", String(params.page));
    if (params?.limit) qs.set("limit", String(params.limit));
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return request<CouponDetailResponse>(`/v2/api/admin/coupons/${id}${suffix}`);
  },
  create: (payload: CouponPayload) =>
    request<Coupon>("/v2/api/admin/coupons", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  update: (id: string, payload: Partial<CouponPayload>) =>
    request<Coupon>(`/v2/api/admin/coupons/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  remove: (id: string) =>
    request<{ message: string }>(`/v2/api/admin/coupons/${id}`, {
      method: "DELETE",
    }),
  duplicate: (id: string) =>
    request<Coupon>(`/v2/api/admin/coupons/${id}/duplicate`, {
      method: "POST",
    }),
};
