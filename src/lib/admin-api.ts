import { API_URL, getCsrfToken } from "./api";

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = (init.method ?? "GET").toUpperCase();
  const isMutation = ["POST", "PUT", "PATCH", "DELETE"].includes(method);

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
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

// ─── Categories ─────────────────────────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  bannerUrl: string | null;
  showInNavbar: boolean;
  isActive: boolean;
  sortOrder: number;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: { products: number; subcategories: number };
  subcategories?: Category[];
}

export interface CategoryPayload {
  name: string;
  imageUrl?: string | null;
  bannerUrl?: string | null;
  showInNavbar?: boolean;
  isActive?: boolean;
  sortOrder?: number;
  parentId?: string | null;
}

export const categoriesApi = {
  list: () => request<{ categories: Category[] }>("/v2/api/admin/categories"),
  listFlat: () => request<{ categories: Category[] }>("/v2/api/admin/categories?flat=true"),
  get: (id: string) => request<Category>(`/v2/api/admin/categories/${id}`),
  create: (payload: CategoryPayload) =>
    request<Category>("/v2/api/admin/categories", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  reorder: (items: { id: string; sortOrder: number }[]) =>
    request<{ success: boolean }>("/v2/api/admin/categories/reorder", {
      method: "PUT",
      body: JSON.stringify({ items }),
    }),
  update: (id: string, payload: Partial<CategoryPayload>) =>
    request<Category>(`/v2/api/admin/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  remove: (id: string) =>
    request<{ success: boolean }>(`/v2/api/admin/categories/${id}`, {
      method: "DELETE",
    }),
};

// ─── Products ───────────────────────────────────────────────────────────────

export type DeliveryType = "automatic_lines" | "file" | "manual_chat" | "mixed";

export interface AdminProduct {
  id: string;
  slug: string;
  name: string;
  description: any;
  price: string;
  comparePrice: string | null;
  imageUrl: string | null;
  gallery: string[];
  stockQuantity: number;
  minPurchaseQuantity: number;
  maxPurchaseQuantity: number | null;
  onePurchasePerUser: boolean;
  isVisible: boolean;
  isActive: boolean;
  featured: boolean;
  categoryId: string | null;
  category?: { id: string; name: string; slug: string } | null;
  deliveryType: DeliveryType;
  digitalLines: string[];
  digitalFileUrl: string | null;
  manualDeliveryNote: string | null;
  postPurchaseInstructions: any;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  _count?: { codes: number; variants: number };
}

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string | null;
  name: string;
  description: any | null;
  price: string;
  comparePrice: string | null;
  imageUrl: string | null;
  gallery: string[];
  stockQuantity: number;
  minPurchaseQuantity: number;
  maxPurchaseQuantity: number | null;
  onePurchasePerUser: boolean;
  isVisible: boolean;
  isActive: boolean;
  sortOrder: number;
  deliveryType: DeliveryType;
  digitalLines: string[];
  digitalFileUrl: string | null;
  manualDeliveryNote: string | null;
  postPurchaseInstructions: any | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariantPayload {
  name: string;
  sku?: string | null;
  description?: any | null;
  price: number | string;
  comparePrice?: number | string | null;
  imageUrl?: string | null;
  gallery?: string[];
  stockQuantity?: number;
  minPurchaseQuantity?: number;
  maxPurchaseQuantity?: number | null;
  onePurchasePerUser?: boolean;
  isVisible?: boolean;
  isActive?: boolean;
  sortOrder?: number;
  deliveryType?: DeliveryType;
  digitalLines?: string[];
  digitalFileUrl?: string | null;
  manualDeliveryNote?: string | null;
  postPurchaseInstructions?: any | null;
}

export interface ProductPayload {
  name: string;
  description?: any;
  price: number | string;
  comparePrice?: number | string | null;
  imageUrl?: string | null;
  gallery?: string[];
  stockQuantity?: number;
  minPurchaseQuantity?: number;
  maxPurchaseQuantity?: number | null;
  onePurchasePerUser?: boolean;
  isVisible?: boolean;
  categoryId?: string | null;
  deliveryType?: DeliveryType;
  digitalLines?: string[];
  digitalFileUrl?: string | null;
  manualDeliveryNote?: string | null;
  postPurchaseInstructions?: any;
  sortOrder?: number;
}

export const productsApi = {
  list: (params: { search?: string; categoryId?: string; page?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.search) qs.set("search", params.search);
    if (params.categoryId) qs.set("categoryId", params.categoryId);
    if (params.page) qs.set("page", String(params.page));
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return request<{
      products: AdminProduct[];
      pagination: { page: number; pageSize: number; total: number; totalPages: number };
    }>(`/v2/api/admin/products${suffix}`);
  },
  get: (id: string) => request<AdminProduct>(`/v2/api/admin/products/${id}`),
  create: (payload: ProductPayload) =>
    request<AdminProduct>("/v2/api/admin/products", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  reorder: (items: { id: string; sortOrder: number }[]) =>
    request<{ success: boolean }>("/v2/api/admin/products/reorder", {
      method: "PUT",
      body: JSON.stringify({ items }),
    }),
  update: (id: string, payload: Partial<ProductPayload>) =>
    request<AdminProduct>(`/v2/api/admin/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  remove: (id: string) =>
    request<{ success: boolean }>(`/v2/api/admin/products/${id}`, {
      method: "DELETE",
    }),
  convertToVariant: (id: string, targetProductId: string) =>
    request<{ variant: ProductVariant; targetProductId: string }>(
      `/v2/api/admin/products/${id}/convert-to-variant`,
      {
        method: "POST",
        body: JSON.stringify({ targetProductId }),
      }
    ),
};

// ─── Product Variants ───────────────────────────────────────────────────────

export const variantsApi = {
  list: (productId: string) =>
    request<{ variants: ProductVariant[] }>(`/v2/api/admin/products/${productId}/variants`),
  get: (productId: string, variantId: string) =>
    request<ProductVariant>(`/v2/api/admin/products/${productId}/variants/${variantId}`),
  create: (productId: string, payload: ProductVariantPayload) =>
    request<ProductVariant>(`/v2/api/admin/products/${productId}/variants`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  update: (productId: string, variantId: string, payload: Partial<ProductVariantPayload>) =>
    request<ProductVariant>(`/v2/api/admin/products/${productId}/variants/${variantId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  remove: (productId: string, variantId: string) =>
    request<void>(`/v2/api/admin/products/${productId}/variants/${variantId}`, {
      method: "DELETE",
    }),
  reorder: (productId: string, items: { id: string; sortOrder: number }[]) =>
    request<{ success: boolean }>(`/v2/api/admin/products/${productId}/variants/reorder`, {
      method: "PUT",
      body: JSON.stringify({ items }),
    }),
  duplicate: (productId: string, variantId: string) =>
    request<ProductVariant>(
      `/v2/api/admin/products/${productId}/variants/${variantId}/duplicate`,
      { method: "POST" }
    ),
};

// ─── Banners ────────────────────────────────────────────────────────────────

export interface Banner {
  id: string;
  imageUrl: string;
  linkUrl: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BannerPayload {
  imageUrl: string;
  linkUrl?: string | null;
  isActive?: boolean;
}

export const bannersApi = {
  list: () => request<{ banners: Banner[] }>("/v2/api/admin/banners"),
  create: (payload: BannerPayload) =>
    request<Banner>("/v2/api/admin/banners", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  update: (id: string, payload: Partial<BannerPayload>) =>
    request<Banner>(`/v2/api/admin/banners/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  remove: (id: string) =>
    request<{ message: string }>(`/v2/api/admin/banners/${id}`, {
      method: "DELETE",
    }),
  reorder: (orderedIds: string[]) =>
    request<{ message: string }>("/v2/api/admin/banners/reorder", {
      method: "PUT",
      body: JSON.stringify({ orderedIds }),
    }),
};

// ─── Site settings ──────────────────────────────────────────────────────────

export type FooterLink = {
  label: string;
  href: string;
  badge?: string;
  external?: boolean;
};

export type SocialLink = {
  platform: string;
  url: string;
};

export type SiteConfigRecord = {
  id: string;
  bannerImageUrl: string | null;
  bannerTitle: string | null;
  bannerSubtitle: string | null;
  bannerCtaLabel: string | null;
  bannerCtaHref: string | null;
  footerText: string | null;
  metaDescription: string | null;
  metaTitle: string | null;
  storeName: string | null;
  faviconUrl: string | null;
  logoUrl: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  primaryColor: string | null;
  footerAboutText: string | null;
  footerAboutTitle: string | null;
  footerCopyright: string | null;
  footerNewsletterEnabled: boolean | null;
  footerNewsletterPlaceholder: string | null;
  footerNewsletterButtonLabel: string | null;
  footerLogoUrl: string | null;
  footerLogoHref: string | null;
  footerLogoAlt: string | null;
  footerBackgroundColor: string | null;
  footerButtonTextColor: string | null;
  footerShowNoise: boolean | null;
  footerPaddingTopHome: number | null;
  footerPaddingTopDefault: number | null;
  footerCategoryColumnTitle: string | null;
  footerSupportColumnTitle: string | null;
  socialFacebook: string | null;
  socialInstagram: string | null;
  socialTwitter: string | null;
  socialLinkedin: string | null;
  socialYoutube: string | null;
  socialLinks: SocialLink[] | null;
  footerCategoryLinks: FooterLink[] | null;
  footerSupportLinks: FooterLink[] | null;
  footerLegalLinks: FooterLink[] | null;
  topBarEnabled: boolean | null;
  topBarText: string | null;
  topBarLinkUrl: string | null;
  topBarBackgroundColor: string | null;
  topBarTextColor: string | null;
  topBarDismissible: boolean | null;
  maintenanceModeEnabled: boolean | null;
  maintenanceTitle: string | null;
  maintenanceMessage: string | null;
  maintenanceImageUrl: string | null;
  page404Title: string | null;
  page404Message: string | null;
  page404ButtonLabel: string | null;
  page404ButtonHref: string | null;
  homeReviewsEnabled: boolean | null;
  homeReviewsBadgeLabel: string | null;
  homeReviewsTitle: string | null;
  homeReviewsAverageRating: number | null;
  homeReviewsTotalCount: number | null;
  homeReviewsGoogleMapsUrl: string | null;
  homeReviewsLinkLabel: string | null;
};

export type HomeReviewRecord = {
  id: string;
  name: string;
  avatarUrl: string | null;
  rating: number;
  comment: string;
  dateLabel: string | null;
  sortOrder: number;
  isPublished: boolean;
};

export type PageSeoRecord = {
  pageKey: string;
  metaTitle: string | null;
  metaDescription: string | null;
  ogImageUrl: string | null;
};

export type InstitutionalPageRecord = {
  id: string;
  slug: string;
  title: string;
  content: any;
  metaTitle: string | null;
  metaDescription: string | null;
  isPublished: boolean;
  sortOrder: number;
};

export type SiteSettingsPayload = Partial<
  Omit<SiteConfigRecord, "id">
>;

export const siteSettingsApi = {
  get: () =>
    request<{ config: SiteConfigRecord; institutionalPages: InstitutionalPageRecord[] }>(
      "/v2/api/admin/site-settings"
    ),
  update: (payload: SiteSettingsPayload) =>
    request<SiteConfigRecord>("/v2/api/admin/site-settings", {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
};

export const institutionalPagesApi = {
  list: () =>
    request<{ pages: InstitutionalPageRecord[] }>("/v2/api/admin/institutional-pages"),
  update: (
    slug: string,
    payload: Partial<
      Pick<
        InstitutionalPageRecord,
        "title" | "content" | "isPublished" | "sortOrder" | "metaTitle" | "metaDescription"
      >
    >
  ) =>
    request<InstitutionalPageRecord>(`/v2/api/admin/institutional-pages/${slug}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
};

export const homeReviewsApi = {
  list: () => request<{ reviews: HomeReviewRecord[] }>("/v2/api/admin/home-reviews"),
  create: (payload: {
    name: string;
    comment: string;
    avatarUrl?: string | null;
    rating?: number;
    dateLabel?: string | null;
    isPublished?: boolean;
  }) =>
    request<HomeReviewRecord>("/v2/api/admin/home-reviews", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  update: (
    id: string,
    payload: Partial<{
      name: string;
      comment: string;
      avatarUrl: string | null;
      rating: number;
      dateLabel: string | null;
      isPublished: boolean;
      sortOrder: number;
    }>
  ) =>
    request<HomeReviewRecord>(`/v2/api/admin/home-reviews/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  remove: (id: string) =>
    request<{ success: boolean }>(`/v2/api/admin/home-reviews/${id}`, {
      method: "DELETE",
    }),
  reorder: (items: { id: string }[]) =>
    request<{ success: boolean }>("/v2/api/admin/home-reviews/reorder", {
      method: "PUT",
      body: JSON.stringify({ items }),
    }),
};

export const pageSeoApi = {
  list: () => request<{ pages: PageSeoRecord[] }>("/v2/api/admin/page-seo"),
  update: (pageKey: string, payload: Partial<PageSeoRecord>) =>
    request<PageSeoRecord>(`/v2/api/admin/page-seo/${pageKey}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
};

export const PAGE_SEO_LABELS: Record<string, string> = {
  home: "Página inicial",
  products: "Listagem de produtos",
  checkout: "Checkout",
  login: "Login",
  account: "Minha conta",
  category: "Categoria (template)",
  product: "Produto (template)",
};
