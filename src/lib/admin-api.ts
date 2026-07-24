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
    }
    throw new Error(message);
  }

  if (res.status === 204) return undefined as unknown as T;
  return (await res.json()) as T;
}

export type MerchantImportSample = {
  name: string;
  price: number;
  comparePrice: number | null;
  category: string;
  variants: string[];
  imageUrl: string | null;
};

export type MerchantImportResult = {
  dryRun: boolean;
  itemCount: number;
  productCount: number;
  variantCount: number;
  categoryParents: string[];
  sample: MerchantImportSample[];
  created?: number;
  skipped?: number;
  variantsCreated?: number;
  categoriesCreated?: number;
  errors?: { product: string; error: string }[];
};

async function uploadMerchantXml<T>(
  path: string,
  file: File,
  fields?: Record<string, string | boolean | undefined>
): Promise<T> {
  const form = new FormData();
  form.append("file", file);
  if (fields) {
    for (const [key, value] of Object.entries(fields)) {
      if (value === undefined) continue;
      form.append(key, String(value));
    }
  }

  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    credentials: "include",
    headers: {
      ...getApiHeaders(),
      "X-CSRF-Token": getCsrfToken(),
    },
    body: form,
  });

  if (!res.ok) {
    let message = "Erro inesperado";
    try {
      const body = await res.json();
      message = body?.error || message;
    } catch {
    }
    throw new Error(message);
  }

  return (await res.json()) as T;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  bannerUrl: string | null;
  showInNavbar: boolean;
  showInFooter: boolean;
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
  showInFooter?: boolean;
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

export type DeliveryType = "automatic_lines" | "file" | "manual_chat" | "mixed" | "manual" | "automatic_text";

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
  featured?: boolean;
}

export const productsApi = {
  list: (params: { search?: string; categoryId?: string; page?: number; pageSize?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.search) qs.set("search", params.search);
    if (params.categoryId) qs.set("categoryId", params.categoryId);
    if (params.page) qs.set("page", String(params.page));
    if (params.pageSize) qs.set("pageSize", String(params.pageSize));
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return request<{
      products: AdminProduct[];
      pagination: { page: number; pageSize: number; total: number; totalPages: number };
    }>(`/v2/api/admin/products${suffix}`);
  },
  listAll: async (params: { search?: string; categoryId?: string } = {}) => {
    const pageSize = 2000;
    let page = 1;
    const products: AdminProduct[] = [];

    while (page <= 50) {
      const result = await productsApi.list({ ...params, page, pageSize });
      products.push(...result.products);
      if (page >= result.pagination.totalPages) break;
      page += 1;
    }

    return { products };
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
  bulkActions: (payload: {
    action: "price" | "visibility";
    productIds?: string[];
    applyTo?: "products" | "variants" | "both";
    includeVariants?: boolean;
    targetField?: "price" | "comparePrice";
    mode?: "fixed" | "increase_percent" | "decrease_percent";
    value?: number;
    alsoApplyToComparePrice?: boolean;
    isVisible?: boolean;
  }) =>
    request<{
      success: boolean;
      updatedProducts: number;
      updatedVariants?: number;
      applyTo?: "products" | "variants" | "both";
    }>("/v2/api/admin/products/bulk-actions", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  previewMerchantImport: (file: File) =>
    uploadMerchantXml<MerchantImportResult>(
      "/v2/api/admin/products/import/merchant/preview",
      file
    ),
  importMerchantXml: (file: File, options?: { skipExisting?: boolean }) =>
    uploadMerchantXml<MerchantImportResult>(
      "/v2/api/admin/products/import/merchant",
      file,
      { skipExisting: options?.skipExisting !== false }
    ),
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
  bulkGenerate: (
    productId: string,
    payload: {
      variants: Array<{
        name: string;
        price: number;
        comparePrice?: number | null;
        stockQuantity?: number;
      }>;
      defaults?: Partial<ProductVariantPayload>;
    }
  ) =>
    request<{ variants: ProductVariant[]; created: number; skipped: string[] }>(
      `/v2/api/admin/products/${productId}/variants/bulk-generate`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    ),
};

export type InventoryStockStatus = "ok" | "low" | "out";

export interface InventoryVariantItem {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  categoryName: string | null;
  name: string;
  sku: string | null;
  deliveryType: DeliveryType;
  isVisible: boolean;
  available: number;
  reserved: number;
  delivered: number;
  totalCodes: number;
  stockStatus: InventoryStockStatus;
}

export interface InventoryCodeItem {
  id: string;
  code: string;
  maskedCode: string;
  status: string;
  createdAt: string;
  deliveredAt: string | null;
  orderItemId: string | null;
}

export const inventoryApi = {
  list: (params?: {
    search?: string;
    status?: "all" | InventoryStockStatus;
    deliveryType?: DeliveryType | "all";
    page?: number;
    pageSize?: number;
  }) => {
    const qs = new URLSearchParams();
    if (params?.search) qs.set("search", params.search);
    if (params?.status) qs.set("status", params.status);
    if (params?.deliveryType) qs.set("deliveryType", params.deliveryType);
    if (params?.page) qs.set("page", String(params.page));
    if (params?.pageSize) qs.set("pageSize", String(params.pageSize));
    const query = qs.toString();
    return request<{
      items: InventoryVariantItem[];
      summary: {
        totalVariants: number;
        lowStock: number;
        outOfStock: number;
        inStock: number;
      };
      pagination: {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
      };
    }>(`/v2/api/admin/inventory${query ? `?${query}` : ""}`);
  },
  listCodes: (
    variantId: string,
    params?: { status?: string; page?: number; pageSize?: number }
  ) => {
    const qs = new URLSearchParams();
    if (params?.status) qs.set("status", params.status);
    if (params?.page) qs.set("page", String(params.page));
    if (params?.pageSize) qs.set("pageSize", String(params.pageSize));
    const query = qs.toString();
    return request<{
      variant: {
        id: string;
        name: string;
        sku: string | null;
        deliveryType: DeliveryType;
        productId: string;
        productName: string;
      };
      codes: InventoryCodeItem[];
      pagination: {
        page: number;
        pageSize: number;
        total: number;
        totalPages: number;
      };
    }>(`/v2/api/admin/inventory/variants/${variantId}/codes${query ? `?${query}` : ""}`);
  },
  bulkUploadCodes: (variantId: string, payload: { content?: string; lines?: string[] }) =>
    request<{ success: boolean; added: number; duplicates: number; available: number; totalLines: number }>(
      `/v2/api/admin/inventory/variants/${variantId}/codes/bulk`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    ),
  updateManualStock: (variantId: string, stockQuantity: number) =>
    request<{ success: boolean; variant: { id: string; stockQuantity: number; deliveryType: DeliveryType } }>(
      `/v2/api/admin/inventory/variants/${variantId}/stock`,
      {
        method: "PATCH",
        body: JSON.stringify({ stockQuantity }),
      }
    ),
  removeCode: (codeId: string) =>
    request<{ success: boolean }>(`/v2/api/admin/inventory/codes/${codeId}`, {
      method: "DELETE",
    }),
};

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
  footerMarketplaceColumnTitle: string | null;
  footerCompanyColumnTitle: string | null;
  socialFacebook: string | null;
  socialInstagram: string | null;
  socialTwitter: string | null;
  socialLinkedin: string | null;
  socialYoutube: string | null;
  socialLinks: SocialLink[] | null;
  footerCategoryLinks: FooterLink[] | null;
  footerSupportLinks: FooterLink[] | null;
  footerMarketplaceLinks: FooterLink[] | null;
  footerCompanyLinks: FooterLink[] | null;
  footerBottomLinks: FooterLink[] | null;
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
  homeFamousEnabled: boolean | null;
  homeFamousTitlePrimary: string | null;
  homeFamousTitleSecondary: string | null;
  // Vitrine Dinâmica
  homeShowcaseEnabled: boolean | null;
  homeShowcaseTitle: string | null;
  homeShowcaseSubtitle: string | null;
  // Pop-up Entrada/Saída
  popupEnabled: boolean | null;
  popupTitle: string | null;
  popupDescription: string | null;
  popupImageUrl: string | null;
  popupCtaLabel: string | null;
  popupCtaLink: string | null;
  popupTrigger: "entry" | "exit" | "delay" | null;
  popupDelay: number | null;
  chatPreChatEnabled: boolean | null;
  chatPreChatQuestions: string | null;
  chatWelcomeMessage: string | null;
  chatAutomatedMessages: string | null;
  pluginsConfig?: PluginsConfig | null;
  reviewsSettings?: ReviewsSettings | null;
  checkoutSettings?: CheckoutSettings | null;
};

export type ReviewsSettings = {
  enabled: boolean;
  showOnHomepage: boolean;
  homeTitle: string;
  homeSubtitle: string;
  autoPublish: boolean;
  allowScreenshots: boolean;
  opinionTags: string[];
};

export type CheckoutFieldConfig = {
  key: string;
  label: string;
  type: "text" | "email" | "tel" | "number" | "cpf";
  placeholder: string;
  required: boolean;
  enabled: boolean;
  prefillFromUser: "name" | "email" | null;
};

export type CheckoutDeliveryOptions = {
  enabled: boolean;
  standardLabel: string;
  standardDescription: string;
  expressLabel: string;
  expressDescription: string;
  expressFeeCents: number;
};

export type CheckoutAuthMode = "inline_at_payment" | "login_before_checkout";

export type CheckoutSettings = {
  termsCheckedByDefault: boolean;
  prefillUserName: boolean;
  prefillUserEmail: boolean;
  authMode?: CheckoutAuthMode;
  fields: CheckoutFieldConfig[];
  deliveryOptions?: CheckoutDeliveryOptions;
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

export type FamousClientRecord = {
  id: string;
  name: string;
  subtitle: string | null;
  avatarUrl: string | null;
  videoUrl: string | null;
  sortOrder: number;
  isActive: boolean;
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
  layoutType: import("@/lib/site-api").InstitutionalLayoutType | null;
  layoutData: import("@/lib/site-api").InstitutionalLayoutData | null;
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
        | "title"
        | "content"
        | "layoutType"
        | "layoutData"
        | "isPublished"
        | "sortOrder"
        | "metaTitle"
        | "metaDescription"
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

export const famousClientsApi = {
  list: () => request<{ clients: FamousClientRecord[] }>("/v2/api/admin/famous-clients"),
  create: (payload: {
    name: string;
    subtitle?: string | null;
    avatarUrl?: string | null;
    videoUrl?: string | null;
    isActive?: boolean;
  }) =>
    request<FamousClientRecord>("/v2/api/admin/famous-clients", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  update: (
    id: string,
    payload: Partial<{
      name: string;
      subtitle: string | null;
      avatarUrl: string | null;
      videoUrl: string | null;
      isActive: boolean;
      sortOrder: number;
    }>
  ) =>
    request<FamousClientRecord>(`/v2/api/admin/famous-clients/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  remove: (id: string) =>
    request<{ success: boolean }>(`/v2/api/admin/famous-clients/${id}`, {
      method: "DELETE",
    }),
  reorder: (items: { id: string }[]) =>
    request<{ success: boolean }>("/v2/api/admin/famous-clients/reorder", {
      method: "PUT",
      body: JSON.stringify({ items }),
    }),
};

export type HomeShowcaseSectionRecord = {
  id: string;
  title: string;
  subtitle: string | null;
  enabled: boolean;
  sortOrder: number;
  maxItems: number;
  products?: Array<{
    id: string;
    sectionId: string;
    productId: string;
    sortOrder: number;
    product: {
      id: string;
      name: string;
      slug: string;
      imageUrl: string | null;
      featured: boolean;
      isActive: boolean;
      isVisible: boolean;
    };
  }>;
  _count?: { products: number };
};

export type FeaturedProductRow = {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  featured: boolean;
  isActive: boolean;
  isVisible: boolean;
};

export const homeShowcaseApi = {
  list: () =>
    request<{ sections: HomeShowcaseSectionRecord[] }>("/v2/api/admin/home-showcase-sections"),
  listFeaturedProducts: () =>
    request<{ products: FeaturedProductRow[] }>("/v2/api/admin/home-showcase/featured-products"),
  create: (payload: {
    title: string;
    subtitle?: string | null;
    enabled?: boolean;
    maxItems?: number;
    productIds?: string[];
  }) =>
    request<HomeShowcaseSectionRecord>("/v2/api/admin/home-showcase-sections", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  update: (
    id: string,
    payload: Partial<{
      title: string;
      subtitle: string | null;
      enabled: boolean;
      sortOrder: number;
      maxItems: number;
      productIds: string[];
    }>
  ) =>
    request<HomeShowcaseSectionRecord>(`/v2/api/admin/home-showcase-sections/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  remove: (id: string) =>
    request<{ success: boolean }>(`/v2/api/admin/home-showcase-sections/${id}`, {
      method: "DELETE",
    }),
  reorder: (items: { id: string }[]) =>
    request<{ success: boolean }>("/v2/api/admin/home-showcase-sections/reorder", {
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

// ─── Media Library ──────────────────────────────────────────────────────────

export interface MediaItem {
  id: string;
  url: string;
  filename: string;
  size: number;
  type: string;
  createdAt: string;
  updatedAt: string;
}

export const mediaApi = {
  list: (params: { search?: string; page?: number; type?: string } = {}) => {
    const qs = new URLSearchParams();
    if (params.search) qs.set("search", params.search);
    if (params.page) qs.set("page", String(params.page));
    if (params.type) qs.set("type", params.type);
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return request<{
      items: MediaItem[];
      pagination: { page: number; pageSize: number; total: number; totalPages: number };
    }>(`/v2/api/admin/media${suffix}`);
  },
  remove: (id: string) =>
    request<{ success: boolean }>(`/v2/api/admin/media/${id}`, {
      method: "DELETE",
    }),
};

// ─── Orders ─────────────────────────────────────────────────────────────────

export interface OrderItemDetail {
  id: string;
  quantity: number;
  unitPrice: number;
  variantName?: string;
  product: {
    name: string;
    imageUrl?: string;
  };
  codes: { code: string; deliveredAt?: string; status?: string }[];
}

export interface AdminOrderPayment {
  id: string;
  status: string;
  provider: string;
  amount: number;
  externalId?: string | null;
  createdAt: string;
}

export interface AdminOrder {
  id: string;
  status: string;
  subtotal: number;
  discount: number;
  total: number;
  deliveryFee: number;
  deliveryOption?: string | null;
  customerName: string;
  customerEmail: string;
  customerImage?: string;
  paymentMethod: string;
  paymentProvider?: string | null;
  itemsPreview?: string;
  couponCode?: string;
  checkoutData?: Record<string, any>;
  createdAt: string;
  paidAt: string | null;
  itemsCount: number;
  adminNotes?: string;
  payments?: AdminOrderPayment[];
  items?: OrderItemDetail[];
}

export const ordersApi = {
  list: (params: { search?: string; status?: string | string[]; from?: string; to?: string; page?: number } = {}) => {
    const qs = new URLSearchParams();
    if (params.search) qs.set("search", params.search);
    if (params.status) {
      const statuses = Array.isArray(params.status) ? params.status : [params.status];
      const joined = statuses.filter(Boolean).join(",");
      if (joined) qs.set("status", joined);
    }
    if (params.from) qs.set("from", params.from);
    if (params.to) qs.set("to", params.to);
    if (params.page) qs.set("page", String(params.page));
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return request<{
      orders: AdminOrder[];
      summary: {
        totalRevenue: number;
        totalOrders: number;
        avgTicket: number;
        paidPct: number;
      };
      pagination: { page: number; pageSize: number; total: number; totalPages: number };
    }>(`/v2/api/admin/orders${suffix}`);
  },
  updateStatus: (id: string, status: string) =>
    request<AdminOrder>(`/v2/api/admin/orders/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  getOne: (id: string) =>
    request<AdminOrder>(`/v2/api/admin/orders/${id}`),
  updateNotes: (id: string, adminNotes: string) =>
    request<AdminOrder>(`/v2/api/admin/orders/${id}/notes`, {
      method: "PATCH",
      body: JSON.stringify({ adminNotes }),
    }),
  bulkUpdateStatus: (ids: string[], status: string) =>
    request<{ success: boolean }>("/v2/api/admin/orders/bulk-status", {
      method: "PATCH",
      body: JSON.stringify({ ids, status }),
    }),
  refund: (id: string, payload: { reason?: string; skipGateway?: boolean } = {}) =>
    request<{ success: boolean; order: AdminOrder; paymentId: string; gatewayRefund?: unknown }>(
      `/v2/api/admin/orders/${id}/refund`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    ),
};

// ─── Gateways ───────────────────────────────────────────────────────────────

export interface GatewayConfig {
  id: string;
  slug: string;
  name: string;
  config: any;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const gatewaysApi = {
  list: () => request<{ gateways: GatewayConfig[] }>("/v2/api/admin/gateways"),
  validate: async (slug: string, config: Record<string, unknown>) => {
    const res = await fetch(`${API_URL}/v2/api/admin/gateways/${slug}/validate`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        "X-CSRF-Token": getCsrfToken(),
      },
      body: JSON.stringify({ config }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = new Error(body?.error || "Credenciais inválidas") as Error & { enforceSandbox?: boolean };
      err.enforceSandbox = body?.enforceSandbox === true;
      throw err;
    }
    return body as { valid: boolean; message: string; enforceSandbox?: boolean };
  },
  update: (slug: string, payload: { name: string; config: any; isActive?: boolean }) =>
    request<GatewayConfig>(`/v2/api/admin/gateways/${slug}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  toggle: (slug: string, isActive: boolean) =>
    request<GatewayConfig>(`/v2/api/admin/gateways/${slug}/toggle`, {
      method: "PATCH",
      body: JSON.stringify({ isActive }),
    }),
  toggleMethod: (slug: string, method: "PIX" | "CARD", enabled: boolean) =>
    request<GatewayConfig>(`/v2/api/admin/gateways/${slug}/toggle-method`, {
      method: "PATCH",
      body: JSON.stringify({ method, enabled }),
    }),
};

// ─── Chat System ───────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  chatId: string;
  senderId: string;
  senderName?: string | null;
  senderRole?: string | null;
  senderStaffTitle?: string | null;
  content: string;
  type: "TEXT" | "IMAGE" | "SYSTEM" | "AUTOMATED" | "ORDER_APPROVED" | "DELIVERY";
  fileUrl: string | null;
  isPinned?: boolean;
  createdAt: string;
}

export interface ChatLabelReference {
  id: string;
  type: 'PRODUCT' | 'CATEGORY' | 'VARIANT';
  referenceId: string;
  label?: string;
}

export interface ChatLabel {
  id: string;
  name: string;
  color: string;
  references?: ChatLabelReference[];
}

export interface Chat {
  id: string;
  orderId: string;
  status: "OPEN" | "CLOSED" | "ARCHIVED";
  isArchived?: boolean;
  isResolved?: boolean;
  rating: number | null;
  ratingComment: string | null;
  ratingTags?: string[] | null;
  isAnonymousRating?: boolean;
  reviewStatus?: 'PENDING' | 'PUBLISHED' | 'ARCHIVED' | null;
  sellerResponse?: string | null;
  assignedToId?: string | null;
  assignedTo?: { id: string; name: string | null; email: string | null; image: string | null } | null;
  firstAdminResponseAt?: string | null;
  unreadCount?: number;
  createdAt: string;
  updatedAt: string;
  lastAdminReadAt?: string | null;
  messages: ChatMessage[];
  messagesMeta?: {
    hasMore: boolean;
    oldestId: string | null;
  };
  labels: ChatLabel[];
  order: {
    id: string;
    status: string;
    subtotal: number;
    discount: number;
    total: number;
    deliveryOption?: string | null;
    deliveryFee?: number;
    paymentMethod: string | null;
    createdAt: string;
    paidAt: string | null;
    adminNotes?: string | null;
    clientIp?: string | null;
    userAgent?: string | null;
    payments?: Array<{
      id: string;
      externalId: string | null;
      provider: string | null;
      status: string;
      amount?: number;
      createdAt: string;
    }>;
    user: {
      id: string;
      name: string | null;
      email: string | null;
      image: string | null;
    };
    items: Array<{
      id: string;
      quantity: number;
      unitPrice: number;
      variantName: string | null;
      product: {
        name: string;
        imageUrl: string | null;
        deliveryType?: DeliveryType;
      };
      variant?: {
        name: string;
        deliveryType?: DeliveryType;
      } | null;
      codes?: Array<{
        id: string;
        code: string;
        deliveredAt: string | null;
        status: string;
      }>;
    }>;
  };
  userStats?: {
    totalSpent: number;
    ordersCount: number;
    itemsCount: number;
  };
}

export interface ChatMacro {
  id: string;
  shortcut: string;
  content: string;
  category?: string;
  createdAt: string;
  updatedAt: string;
}

export type ClientListSort =
  | 'spent_desc'
  | 'spent_asc'
  | 'orders_desc'
  | 'created_desc'
  | 'last_access_desc'
  | 'name_asc';

export type ClientListFilters = {
  search?: string;
  page?: number;
  sort?: ClientListSort;
  purchases?: 'all' | 'with' | 'without';
  access?: 'all' | 'recent' | 'never';
  roleType?: 'all' | 'customer' | 'team';
};

export interface AdminClient {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  createdAt: string;
  lastAccessAt?: string | null;
  phone?: string | null;
  document?: string | null;
  provider?: string | null;
  isAdmin?: boolean;
  roleId?: string | null;
  role?: { id: string; name: string } | null;
  ordersCount: number;
  totalSpent: number;
  totalItemsCount: number;
  totalDiscounts: number;
  recentOrders?: Array<{ id: string; total: number; status: string; createdAt: string }>;
}

export type ClientImportResult = {
  dryRun: boolean;
  totalRows: number;
  validRows: number;
  uniqueEmails: number;
  duplicateEmailsInFile: number;
  invalidRows: number;
  created: number;
  updated: number;
  skipped: number;
  errors?: Array<{ row?: number; email?: string; error: string }>;
  sample: Array<{
    email: string;
    name: string | null;
    document: string | null;
    phone: string | null;
    externalId: string | null;
    createdAt: string | null;
    exists: boolean;
  }>;
};

export const clientsApi = {
  previewImport: (file: File) =>
    uploadMerchantXml<ClientImportResult>(
      "/v2/api/admin/clients/import/preview",
      file
    ),
  importSpreadsheet: (
    file: File,
    options?: { skipExisting?: boolean; updateExisting?: boolean }
  ) =>
    uploadMerchantXml<ClientImportResult>(
      "/v2/api/admin/clients/import",
      file,
      {
        skipExisting: options?.skipExisting !== false,
        updateExisting: options?.updateExisting === true,
      }
    ),
};

export type PluginField = {
  key: string;
  label: string;
  placeholder?: string;
  /** Campo sensível: mascarado no admin e não exibido na vitrine. */
  secret?: boolean;
  /** Texto de ajuda abaixo do input. */
  hint?: string;
  /** Se false, o campo pode ficar vazio. Default: true (exceto secret). */
  required?: boolean;
  /** Regex (string) para validar o valor. */
  pattern?: string;
  patternMessage?: string;
};

export type PluginDefinition = {
  id: string;
  name: string;
  description: string;
  category: 'marketing' | 'atendimento' | 'metricas';
  fields: PluginField[];
  logoUrl?: string;
  /** Path público exibido após instalar (ex.: feed do Merchant). */
  publicResourcePath?: string;
  publicResourceLabel?: string;
};

export type PluginInstallState = {
  enabled: boolean;
  config: Record<string, string>;
};

export type PluginsConfig = Record<string, PluginInstallState>;

export interface ChatReview extends Chat {
  order: Chat['order'];
}

export const chatApi = {
  getById: (chatId: string) => request<Chat>(`/v2/api/chats/${chatId}`),
  getByOrder: (orderId: string, params?: { messageLimit?: number; before?: string }) => {
    const qs = new URLSearchParams();
    if (params?.messageLimit) qs.set('messageLimit', String(params.messageLimit));
    if (params?.before) qs.set('before', params.before);
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return request<Chat>(`/v2/api/chats/order/${orderId}${suffix}`);
  },
  listMessages: (orderId: string, params?: { before?: string; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.before) qs.set('before', params.before);
    if (params?.limit) qs.set('limit', String(params.limit));
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return request<{
      messages: ChatMessage[];
      messagesMeta: { hasMore: boolean; oldestId: string | null };
    }>(`/v2/api/chats/order/${orderId}/messages${suffix}`);
  },
  sendMessage: (chatId: string, payload: { content: string; type?: string; fileUrl?: string }) =>
    request<ChatMessage>(`/v2/api/chats/${chatId}/messages`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  list: (params?: { search?: string; status?: string; labelId?: string; deliveryFilter?: string; page?: number; sortBy?: string }) => {
    const qs = new URLSearchParams();
    if (params?.search) qs.set("search", params.search);
    if (params?.status) qs.set("status", params.status);
    if (params?.labelId) qs.set("labelId", params.labelId);
    if (params?.deliveryFilter) qs.set("deliveryFilter", params.deliveryFilter);
    if (params?.page) qs.set("page", String(params.page));
    if (params?.sortBy) qs.set("sortBy", params.sortBy);
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return request<{ chats: Chat[]; total: number; page: number; totalPages: number }>(`/v2/api/chats${suffix}`);
  },
  updateLabels: (chatId: string, labelIds: string[]) =>
    request<Chat>(`/v2/api/chats/${chatId}/labels`, {
      method: "PUT",
      body: JSON.stringify({ labelIds }),
    }),
  updateStatus: (chatId: string, payload: { status?: string; rating?: number; ratingComment?: string; isResolved?: boolean; isArchived?: boolean }) =>
    request<Chat>(`/v2/api/chats/${chatId}/status`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  listLabels: () => request<{ labels: ChatLabel[] }>("/v2/api/chats/labels"),
  createLabel: (payload: { name: string; color: string; references?: { type: 'PRODUCT' | 'CATEGORY' | 'VARIANT'; referenceId: string }[] }) =>
    request<ChatLabel>("/v2/api/chats/labels", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateLabel: (id: string, payload: { name?: string; color?: string; references?: { type: 'PRODUCT' | 'CATEGORY' | 'VARIANT'; referenceId: string }[] }) =>
    request<ChatLabel>(`/v2/api/chats/labels/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  deleteLabel: (id: string) =>
    request<{ success: boolean }>(`/v2/api/chats/labels/${id}`, {
      method: "DELETE",
    }),
  listMacros: () => request<{ macros: ChatMacro[] }>("/v2/api/chats/macros"),
  createMacro: (shortcut: string, content: string, category?: string) =>
    request<ChatMacro>("/v2/api/chats/macros", {
      method: "POST",
      body: JSON.stringify({ shortcut, content, category }),
    }),
  deleteMacro: (id: string) =>
    request<{ success: boolean }>(`/v2/api/chats/macros/${id}`, {
      method: "DELETE",
    }),
  updateMacro: (id: string, shortcut: string, content: string, category?: string) =>
    request<ChatMacro>(`/v2/api/chats/macros/${id}`, {
      method: "PUT",
      body: JSON.stringify({ shortcut, content, category }),
    }),
  assignChat: (chatId: string, assignedToId: string | null) =>
    request<Chat>(`/v2/api/chats/${chatId}/assign`, {
      method: "PATCH",
      body: JSON.stringify({ assignedToId }),
    }),
  submitRating: (chatId: string, payload: { rating: number; ratingComment?: string; ratingTags?: string[]; isAnonymous?: boolean }) =>
    request<Chat>(`/v2/api/chats/${chatId}/rating`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  reopenChat: (chatId: string) =>
    request<Chat>(`/v2/api/chats/${chatId}/reopen`, { method: "POST" }),
  listClients: (params?: ClientListFilters) => {
    const qs = new URLSearchParams();
    if (params?.search) qs.set('search', params.search);
    if (params?.page) qs.set('page', String(params.page));
    if (params?.sort) qs.set('sort', params.sort);
    if (params?.purchases && params.purchases !== 'all') qs.set('purchases', params.purchases);
    if (params?.access && params.access !== 'all') qs.set('access', params.access);
    if (params?.roleType && params.roleType !== 'all') qs.set('roleType', params.roleType);
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return request<{ clients: AdminClient[]; total: number; page: number; totalPages: number }>(`/v2/api/admin/clients${suffix}`);
  },
  listReviews: (params?: { page?: number; minRating?: number; status?: string; search?: string }) => {
    const qs = new URLSearchParams();
    if (params?.page) qs.set("page", String(params.page));
    if (params?.minRating) qs.set("minRating", String(params.minRating));
    if (params?.status) qs.set("status", params.status);
    if (params?.search) qs.set("search", params.search);
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return request<{ reviews: ChatReview[]; total: number; page: number; totalPages: number; averageRating: number }>(`/v2/api/admin/chat-reviews${suffix}`);
  },
  updateReview: (chatId: string, payload: { reviewStatus?: 'PENDING' | 'PUBLISHED' | 'ARCHIVED'; sellerResponse?: string | null }) =>
    request<ChatReview>(`/v2/api/admin/chat-reviews/${chatId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deleteReview: (chatId: string) =>
    request<ChatReview>(`/v2/api/admin/chat-reviews/${chatId}`, { method: "DELETE" }),
  markAsRead: (chatId: string) =>
    request<{ success: boolean; lastAdminReadAt: string }>(`/v2/api/chats/${chatId}/read`, {
      method: "PATCH",
    }),
  deliverItem: (chatId: string, itemId: string, payload?: { content?: string; mode?: 'text' | 'lines'; useStock?: boolean }) =>
    request<Chat>(`/v2/api/chats/${chatId}/items/${itemId}/deliver`, {
      method: "POST",
      body: JSON.stringify(payload || {}),
    }),
};

export type NewsletterSubscriber = {
  id: string;
  email: string;
  source: string;
  userId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  user?: { id: string; name: string | null; email: string | null } | null;
};

export const newsletterApi = {
  list: (params?: { search?: string; page?: number; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.search) qs.set("search", params.search);
    if (params?.page) qs.set("page", String(params.page));
    if (params?.limit) qs.set("limit", String(params.limit));
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return request<{
      subscribers: NewsletterSubscriber[];
      pagination: { page: number; limit: number; total: number; pages: number };
    }>(`/v2/api/admin/newsletter/subscribers${suffix}`);
  },
  remove: (id: string) =>
    request<{ success: boolean }>(`/v2/api/admin/newsletter/subscribers/${id}`, {
      method: "DELETE",
    }),
  exportCsv: async () => {
    const res = await fetch(`${API_URL}/v2/api/admin/newsletter/subscribers/export`, {
      credentials: "include",
      headers: getApiHeaders(),
    });
    if (!res.ok) {
      let message = "Erro ao exportar inscritos";
      try {
        const body = await res.json();
        message = body?.error || message;
      } catch {
      }
      throw new Error(message);
    }
    return res.blob();
  },
};

export type AdminAuditLog = {
  id: string;
  action: string;
  targetType: string | null;
  targetId: string | null;
  metadata: Record<string, unknown> | null;
  ip: string | null;
  createdAt: string;
  actor: { id: string; name: string | null; email: string | null; image: string | null; role?: { name: string } | null } | null;
};

export type AdminAuditActor = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
};

export const auditLogsApi = {
  list: (params?: {
    action?: string;
    actorUserId?: string;
    targetId?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }) => {
    const qs = new URLSearchParams();
    if (params?.action) qs.set("action", params.action);
    if (params?.actorUserId) qs.set("actorUserId", params.actorUserId);
    if (params?.targetId) qs.set("targetId", params.targetId);
    if (params?.from) qs.set("from", params.from);
    if (params?.to) qs.set("to", params.to);
    if (params?.page) qs.set("page", String(params.page));
    if (params?.limit) qs.set("limit", String(params.limit));
    const suffix = qs.toString() ? `?${qs.toString()}` : "";
    return request<{
      logs: AdminAuditLog[];
      actors: AdminAuditActor[];
      actions: string[];
      actionLabels: Record<string, string>;
      pagination: { page: number; limit: number; total: number; pages: number };
    }>(`/v2/api/admin/audit-logs${suffix}`);
  },
};

export type MarketingMetricType = "carts" | "abandoned_products" | "cancelled_orders";

export type MarketingAutomationSettings = {
  enabled: boolean;
  inactivityMinutes: number;
  delayHours: number;
  minSubtotalCents: number;
  sendRecoveryEmail: boolean;
  notificationWindowStart: string;
  notificationWindowEnd: string;
  cartSendMode: "automated" | "manual";
  whatsappCartMessage: string;
  whatsappOrderMessage: string;
  cartEmailDelays: number[];
  abandonedProductEnabled: boolean;
  abandonedProductDelays: number[];
  cancelledOrderEnabled: boolean;
  cancelledOrderDelays: number[];
};

export type MarketingAutomationSettingsResponse = {
  settings: MarketingAutomationSettings;
  defaults: {
    whatsappCartMessage: string;
    whatsappOrderMessage: string;
    cartEmailDelays: number[];
    abandonedProductDelays: number[];
    cancelledOrderDelays: number[];
    notificationWindowStart: string;
    notificationWindowEnd: string;
    inactivityMinutes?: number;
    minSubtotalCents?: number;
    enabled?: boolean;
  };
  options: {
    cartEmailDelays: number[];
    abandonedProductDelays: number[];
    cancelledOrderDelays: number[];
    maxRecoverySteps?: number;
  };
};

export type MarketingAutomationMetrics = {
  metricType: MarketingMetricType | "combined" | null;
  metricTypes?: MarketingMetricType[];
  from: string;
  to: string;
  recoveredOrders: number;
  recoveredRevenueCents: number;
  unfinishedOrders: number;
  lostRevenueCents: number;
  emailsSent: number;
  openRate: number;
  clickRate: number;
  conversionRate: number;
  averageTicketCents: number;
};

export type MarketingCartItem = {
  id: string;
  productId: string;
  variantId: string | null;
  quantity: number;
  unitPrice: number;
  name: string;
  imageUrl: string | null;
};

export type MarketingAbandonedCart = {
  id: string;
  email: string | null;
  phone: string | null;
  document: string | null;
  customerName: string | null;
  isVisitor: boolean;
  subtotalCents: number;
  couponCode: string | null;
  lastActivityAt: string;
  recoveryEmailSentAt: string | null;
  emailOpenedAt: string | null;
  emailClickedAt: string | null;
  convertedAt: string | null;
  recoveredAt: string | null;
  recoveryUrl: string | null;
  whatsappUrl: string | null;
  itemsCount: number;
  items: MarketingCartItem[];
  userId: string | null;
};

export type MarketingUnpaidOrder = {
  id: string;
  customerName: string;
  email: string | null;
  phone: string | null;
  document: string | null;
  total: number;
  paymentMethod: string | null;
  paymentExpiresAt: string | null;
  status?: string;
  createdAt: string;
  recoveryUrl: string;
  whatsappUrl: string | null;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    unitPrice: number;
    imageUrl: string | null;
  }>;
};

function marketingQs(params?: Record<string, string | number | undefined | null>) {
  const qs = new URLSearchParams();
  if (!params) return "";
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    qs.set(key, String(value));
  }
  const suffix = qs.toString();
  return suffix ? `?${suffix}` : "";
}

export const marketingAutomationsApi = {
  metrics: (params: {
    from: string;
    to: string;
    metricTypes?: MarketingMetricType[];
    metricType?: MarketingMetricType;
  }) => {
    const qs: Record<string, string | number | undefined | null> = {
      from: params.from,
      to: params.to,
    };
    if (params.metricTypes) {
      qs.metricTypes = params.metricTypes.join(",");
    } else if (params.metricType) {
      qs.metricType = params.metricType;
    }
    return request<MarketingAutomationMetrics>(
      `/v2/api/admin/marketing/automations/metrics${marketingQs(qs)}`
    );
  },
  listCarts: (params?: { from?: string; to?: string; search?: string; page?: number; pageSize?: number }) =>
    request<{ carts: MarketingAbandonedCart[]; total: number; page: number; totalPages: number }>(
      `/v2/api/admin/marketing/automations/carts${marketingQs(params)}`
    ),
  getCart: (id: string) =>
    request<MarketingAbandonedCart>(`/v2/api/admin/marketing/automations/carts/${id}`),
  archiveCart: (id: string) =>
    request<{ success: boolean }>(`/v2/api/admin/marketing/automations/carts/${id}`, {
      method: "DELETE",
    }),
  createOrderFromCart: (id: string) =>
    request<MarketingUnpaidOrder>(`/v2/api/admin/marketing/automations/carts/${id}/create-order`, {
      method: "POST",
    }),
  sendCartRecoveryEmail: (id: string) =>
    request<{
      success: boolean;
      email: string;
      delayHours: number;
      stepIndex: number;
      stepTotal: number;
    }>(`/v2/api/admin/marketing/automations/carts/${id}/send-email`, {
      method: "POST",
    }),
  listOrders: (params?: { from?: string; to?: string; search?: string; page?: number; pageSize?: number }) =>
    request<{ orders: MarketingUnpaidOrder[]; total: number; page: number; totalPages: number }>(
      `/v2/api/admin/marketing/automations/orders${marketingQs(params)}`
    ),
  getOrder: (id: string) =>
    request<MarketingUnpaidOrder>(`/v2/api/admin/marketing/automations/orders/${id}`),
  archiveOrder: (id: string) =>
    request<{ success: boolean }>(`/v2/api/admin/marketing/automations/orders/${id}`, {
      method: "DELETE",
    }),
  getSettings: () =>
    request<MarketingAutomationSettingsResponse>(
      "/v2/api/admin/marketing/automations/settings"
    ),
  updateSettings: (payload: Partial<MarketingAutomationSettings>) =>
    request<MarketingAutomationSettingsResponse>(
      "/v2/api/admin/marketing/automations/settings",
      {
        method: "PUT",
        body: JSON.stringify(payload),
      }
    ),
};

export type EmailTemplateBlock = {
  id: string;
  key: string;
  title: string;
  description: string;
  kind: "component" | "body";
  defaultTitle?: string;
  defaultSubtitle?: string;
};

export type EmailTemplatesState = {
  headerHtml: string;
  footerHtml: string;
  subjects: Record<string, string>;
  preheaders: Record<string, string>;
  bodies: Record<string, string>;
};

export type EmailTemplatesResponse = {
  templates: EmailTemplatesState;
  branding: {
    storeName: string;
    logoUrl: string;
    logoWhiteUrl?: string;
    storeUrl?: string;
    contactEmail: string;
    contactPhone: string;
    year: string;
  };
  catalog: {
    components: EmailTemplateBlock[];
    transactional: EmailTemplateBlock[];
    abandonedCart: EmailTemplateBlock[];
    abandonedProduct: EmailTemplateBlock[];
    cancelledOrder?: EmailTemplateBlock[];
  };
  defaults: {
    headerHtml: string;
    footerHtml: string;
    sampleBodyHtml: string;
    bodies: Record<string, string>;
    subjects: Record<string, string>;
    preheaders: Record<string, string>;
  };
};

export const emailTemplatesApi = {
  get: () => request<EmailTemplatesResponse>("/v2/api/admin/marketing/email-templates"),
  update: (payload: Partial<EmailTemplatesState>) =>
    request<EmailTemplatesResponse>("/v2/api/admin/marketing/email-templates", {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  preview: (payload: {
    headerHtml?: string;
    footerHtml?: string;
    bodyHtml?: string;
    title?: string;
    subtitle?: string;
    templateKey?: string;
    preheader?: string;
  }) =>
    request<{ html: string }>("/v2/api/admin/marketing/email-templates/preview", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  sendTest: (payload: {
    to: string;
    blockId?: string;
    templateKey?: string;
    headerHtml?: string;
    footerHtml?: string;
    bodyHtml?: string;
    title?: string;
    subtitle?: string;
    subject?: string;
    preheader?: string;
  }) =>
    request<{ success: boolean; to: string; subject: string }>(
      "/v2/api/admin/marketing/email-templates/send-test",
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    ),
};
