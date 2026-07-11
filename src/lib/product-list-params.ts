export type ProductSortBy = "relevance" | "price" | "name" | "newest";

export type ProductListParams = {
  search?: string;
  category?: string;
  platform?: string;
  minPrice?: string;
  maxPrice?: string;
  inStock?: string;
  featured?: string;
  sortBy?: ProductSortBy;
  sortOrder?: "asc" | "desc";
  page?: string;
  limit?: string;
  includeSubcategories?: string;
};

export type ProductListPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export const DEFAULT_PRODUCT_LIMIT = 20;

export const SORT_OPTIONS: Array<{ value: ProductSortBy; label: string; sortOrder: "asc" | "desc" }> = [
  { value: "relevance", label: "Relevância", sortOrder: "desc" },
  { value: "price", label: "Menor preço", sortOrder: "asc" },
  { value: "price", label: "Maior preço", sortOrder: "desc" },
  { value: "newest", label: "Mais recentes", sortOrder: "desc" },
  { value: "name", label: "Nome (A-Z)", sortOrder: "asc" },
];

export function sortOptionKey(sortBy: ProductSortBy, sortOrder: "asc" | "desc") {
  return `${sortBy}:${sortOrder}`;
}

export function parseSortOptionKey(key: string): { sortBy: ProductSortBy; sortOrder: "asc" | "desc" } {
  const [sortBy, sortOrder] = key.split(":");
  if (sortBy === "price" || sortBy === "name" || sortBy === "newest") {
    return { sortBy, sortOrder: sortOrder === "asc" ? "asc" : "desc" };
  }
  return { sortBy: "relevance", sortOrder: "desc" };
}

export function readProductListParams(
  searchParams: URLSearchParams,
  defaults?: Partial<ProductListParams>
): ProductListParams {
  const sortBy = (searchParams.get("sortBy") as ProductSortBy) || defaults?.sortBy || "relevance";
  const sortOrder = (searchParams.get("sortOrder") as "asc" | "desc") || defaults?.sortOrder || "desc";

  return {
    search: searchParams.get("q") || searchParams.get("search") || defaults?.search || undefined,
    category: searchParams.get("category") || defaults?.category || undefined,
    platform: searchParams.get("platform") || defaults?.platform || undefined,
    minPrice: searchParams.get("minPrice") || defaults?.minPrice || undefined,
    maxPrice: searchParams.get("maxPrice") || defaults?.maxPrice || undefined,
    inStock: searchParams.get("inStock") || defaults?.inStock || undefined,
    featured: searchParams.get("featured") || defaults?.featured || undefined,
    sortBy,
    sortOrder,
    page: searchParams.get("page") || defaults?.page || "1",
    limit: searchParams.get("limit") || defaults?.limit || String(DEFAULT_PRODUCT_LIMIT),
    includeSubcategories:
      searchParams.get("includeSubcategories") || defaults?.includeSubcategories || undefined,
  };
}

export function buildProductListQuery(
  params: ProductListParams,
  opts?: { searchKey?: "q" | "search" }
): URLSearchParams {
  const qs = new URLSearchParams();
  const searchKey = opts?.searchKey ?? "search";

  if (params.search?.trim()) qs.set(searchKey, params.search.trim());
  if (params.category) qs.set("category", params.category);
  if (params.platform) qs.set("platform", params.platform);
  if (params.minPrice) qs.set("minPrice", params.minPrice);
  if (params.maxPrice) qs.set("maxPrice", params.maxPrice);
  if (params.inStock === "true") qs.set("inStock", "true");
  if (params.featured === "true") qs.set("featured", "true");
  if (params.sortBy && params.sortBy !== "relevance") qs.set("sortBy", params.sortBy);
  if (params.sortOrder && params.sortBy !== "relevance") qs.set("sortOrder", params.sortOrder);
  if (params.page && params.page !== "1") qs.set("page", params.page);
  if (params.limit && params.limit !== String(DEFAULT_PRODUCT_LIMIT)) qs.set("limit", params.limit);
  if (params.includeSubcategories === "true") qs.set("includeSubcategories", "true");

  return qs;
}

export function toApiProductParams(params: ProductListParams): Record<string, string> {
  const apiParams: Record<string, string> = {};

  if (params.search) apiParams.search = params.search;
  if (params.category) apiParams.category = params.category;
  if (params.platform) apiParams.platform = params.platform;
  if (params.minPrice) apiParams.minPrice = params.minPrice;
  if (params.maxPrice) apiParams.maxPrice = params.maxPrice;
  if (params.inStock === "true") apiParams.inStock = "true";
  if (params.featured === "true") apiParams.featured = "true";
  if (params.sortBy) apiParams.sortBy = params.sortBy;
  if (params.sortOrder) apiParams.sortOrder = params.sortOrder;
  if (params.page) apiParams.page = params.page;
  if (params.limit) apiParams.limit = params.limit;
  if (params.includeSubcategories === "true") apiParams.includeSubcategories = "true";

  return apiParams;
}
