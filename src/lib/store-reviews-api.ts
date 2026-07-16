import { getApiHeaders } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export type PublicStoreReview = {
  id: string;
  name: string;
  avatarUrl: string | null;
  rating: number;
  comment: string;
  tags: string[];
  sellerResponse?: string | null;
  dateLabel: string;
  variantName?: string | null;
  product?: {
    id: string;
    name: string;
    imageUrl: string | null;
    price: number;
    slug: string;
  } | null;
};

export type ProductReviewsSummary = {
  averageRating: number;
  total: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
};

export type ProductReviewsResponse = {
  reviews: PublicStoreReview[];
  summary: ProductReviewsSummary;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type StoreReviewsHomePayload = {
  reviews: PublicStoreReview[];
  summary: ProductReviewsSummary;
};

const EMPTY_SUMMARY: ProductReviewsSummary = {
  averageRating: 0,
  total: 0,
  distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
};

function summarizeFromReviews(reviews: PublicStoreReview[]): ProductReviewsSummary {
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as ProductReviewsSummary["distribution"];
  let sum = 0;
  for (const review of reviews) {
    const rating = Math.min(5, Math.max(1, Number(review.rating) || 0)) as 1 | 2 | 3 | 4 | 5;
    sum += rating;
    distribution[rating] += 1;
  }
  const total = reviews.length;
  return {
    averageRating: total ? Math.round((sum / total) * 100) / 100 : 0,
    total,
    distribution,
  };
}

export async function fetchStoreReviews(): Promise<StoreReviewsHomePayload> {
  const empty: StoreReviewsHomePayload = { reviews: [], summary: EMPTY_SUMMARY };
  try {
    const r = await fetch(`${API_URL}/v2/api/store-reviews`, {
      next: { revalidate: 60 },
      headers: getApiHeaders(),
    });
    if (!r.ok) return empty;
    const data = await r.json();
    const reviews = (data.reviews ?? []) as PublicStoreReview[];
    const summary = (data.summary as ProductReviewsSummary | undefined) ?? summarizeFromReviews(reviews);
    return { reviews, summary };
  } catch {
    return empty;
  }
}

async function requestProductReviews(
  productSlug: string,
  options?: { page?: number; limit?: number },
  init?: RequestInit
): Promise<ProductReviewsResponse> {
  const empty: ProductReviewsResponse = {
    reviews: [],
    summary: {
      averageRating: 0,
      total: 0,
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    },
    pagination: { page: 1, limit: 10, total: 0, totalPages: 1 },
  };

  try {
    const qs = new URLSearchParams({
      productSlug,
      page: String(options?.page ?? 1),
      limit: String(options?.limit ?? 10),
    });
    const r = await fetch(`${API_URL}/v2/api/store-reviews?${qs}`, {
      headers: getApiHeaders(),
      ...init,
    });
    if (!r.ok) return empty;
    const data = await r.json();
    return {
      reviews: data.reviews ?? [],
      summary: data.summary ?? empty.summary,
      pagination: data.pagination ?? empty.pagination,
    };
  } catch {
    return empty;
  }
}

export async function fetchProductReviews(
  productSlug: string,
  options?: { page?: number; limit?: number }
): Promise<ProductReviewsResponse> {
  return requestProductReviews(productSlug, options, { next: { revalidate: 60 } });
}

export async function fetchProductReviewsClient(
  productSlug: string,
  options?: { page?: number; limit?: number }
): Promise<ProductReviewsResponse> {
  return requestProductReviews(productSlug, options);
}
