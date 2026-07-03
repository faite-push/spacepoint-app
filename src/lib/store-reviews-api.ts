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
  product?: {
    id: string;
    name: string;
    imageUrl: string | null;
    price: number;
    slug: string;
  } | null;
};

export async function fetchStoreReviews(): Promise<PublicStoreReview[]> {
  try {
    const r = await fetch(`${API_URL}/v2/api/store-reviews`, {
      next: { revalidate: 60 },
      headers: getApiHeaders(),
    });
    if (!r.ok) return [];
    const data = await r.json();
    return data.reviews ?? [];
  } catch {
    return [];
  }
}
