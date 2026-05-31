import { API_URL } from "@/lib/api";
import type { Product } from "@/types/shop";

export type PublicSubcategory = {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  bannerUrl: string | null;
  productCount: number;
};

export type PublicCategoryPage = {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  bannerUrl: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  parent: { id: string; name: string; slug: string } | null;
  subcategories: PublicSubcategory[];
  products: Product[];
};

export async function fetchCategoryBySlug(
  slug: string
): Promise<PublicCategoryPage | null> {
  try {
    const res = await fetch(
      `${API_URL}/v2/api/categories/${encodeURIComponent(slug)}`,
      { next: { revalidate: 30 } }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { category: PublicCategoryPage };
    return data.category;
  } catch {
    return null;
  }
}
