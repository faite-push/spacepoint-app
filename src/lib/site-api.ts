const API_URL = process.env.NEXT_PUBLIC_API_URL;

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

export type PublicSiteConfig = {
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
  homeShowcaseEnabled: boolean | null;
  homeShowcaseTitle: string | null;
  homeShowcaseSubtitle: string | null;
  popupEnabled: boolean | null;
  popupTitle: string | null;
  popupDescription: string | null;
  popupImageUrl: string | null;
  popupCtaLabel: string | null;
  popupCtaLink: string | null;
  popupTrigger: "entry" | "exit" | "delay" | null;
  popupDelay: number | null;
  checkoutSettings?: import("@/lib/admin-api").CheckoutSettings | null;
};

export type PublicHomeReview = {
  id: string;
  name: string;
  avatarUrl: string | null;
  rating: number;
  comment: string;
  dateLabel: string | null;
  sortOrder: number;
};

export type PublicPageSeo = {
  pageKey: string;
  metaTitle: string | null;
  metaDescription: string | null;
  ogImageUrl: string | null;
};

export type PublicInstitutionalPage = {
  id: string;
  slug: string;
  title: string;
  content: any;
  metaTitle: string | null;
  metaDescription: string | null;
};

export type ShopCaseRow = {
  id: string;
  name: string;
  slug: string;
  price: number;
  image: string | null;
  description: string | null;
};

export type ShopCategoryRow = {
  id: string;
  name: string;
  sortOrder?: number;
  cases: ShopCaseRow[];
};

import type { Product } from "@/types/shop";

export type ShopBannerRow = {
  id: string;
  imageUrl: string;
  linkUrl: string | null;
  sortOrder: number;
};

export type ShopHomePayload = {
  categories?: ShopCategoryRow[];
  uncategorized?: ShopCaseRow[];
  featured?: Product[];
  banners?: ShopBannerRow[];
};

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

export async function fetchSiteConfig(): Promise<PublicSiteConfig | null> {
  try {
    const isClient = typeof window !== "undefined";
    const r = await fetchWithTimeout(`${API_URL}/v2/api/site-config`, {
      ...(isClient ? {} : { next: { revalidate: 60 } }),
      headers: isClient ? { "ngrok-skip-browser-warning": "true" } : undefined,
    });
    if (!r.ok) return null;
    return r.json();
  } catch {
    return null;
  }
}

export async function fetchHomeReviews(): Promise<PublicHomeReview[]> {
  try {
    const r = await fetchWithTimeout(`${API_URL}/v2/api/home-reviews`, {
      next: { revalidate: 60 },
    });
    if (!r.ok) return [];
    const data = await r.json();
    return data.reviews ?? [];
  } catch {
    return [];
  }
}

export async function fetchPageSeo(pageKey: string): Promise<PublicPageSeo | null> {
  try {
    const r = await fetchWithTimeout(`${API_URL}/v2/api/page-seo/${pageKey}`, {
      next: { revalidate: 60 },
    });
    if (!r.ok) return null;
    return r.json();
  } catch {
    return null;
  }
}

export async function fetchInstitutionalPage(
  slug: string
): Promise<PublicInstitutionalPage | null> {
  try {
    const r = await fetchWithTimeout(`${API_URL}/v2/api/pages/${slug}`, {
      next: { revalidate: 60 },
    });
    if (!r.ok) return null;
    return r.json();
  } catch {
    return null;
  }
}

export async function fetchShopHome(): Promise<ShopHomePayload> {
  try {
    const r = await fetchWithTimeout(`${API_URL}/v2/api/shop/home`, {
      next: { revalidate: 30 },
    });
    if (!r.ok) return { categories: [], uncategorized: [] };
    return r.json();
  } catch {
    return { categories: [], uncategorized: [] };
  }
}

export { API_URL };
