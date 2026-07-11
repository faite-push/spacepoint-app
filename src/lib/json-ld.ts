import type { PublicSiteConfig } from "@/lib/site-api";
import type { Product } from "@/types/shop";
import type { ProductReviewsSummary } from "@/lib/store-reviews-api";
import { getSiteUrl, toAbsolutePath, toAbsoluteUrl } from "@/lib/site-url";

export function buildOrganizationJsonLd(config: PublicSiteConfig | null) {
  const siteUrl = getSiteUrl();
  const storeName = config?.storeName?.trim() || "Space Point BR";

  const sameAs = [
    config?.socialInstagram,
    config?.socialFacebook,
    config?.socialTwitter,
    config?.socialYoutube,
    config?.socialLinkedin,
    ...(config?.socialLinks?.map((link) => link.url) || []),
  ].filter((url): url is string => Boolean(url?.trim()));

  const organization: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: storeName,
    url: siteUrl,
    logo: toAbsoluteUrl(config?.logoUrl || config?.faviconUrl, siteUrl),
    description:
      config?.metaDescription?.trim() ||
      "Jogos digitais originais para PlayStation com entrega segura e instantânea.",
  };

  if (sameAs.length) organization.sameAs = sameAs;

  if (config?.contactEmail || config?.contactPhone) {
    organization.contactPoint = {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: config?.contactEmail || undefined,
      telephone: config?.contactPhone || undefined,
      availableLanguage: ["Portuguese"],
    };
  }

  return organization;
}

export function buildWebsiteJsonLd(config: PublicSiteConfig | null) {
  const siteUrl = getSiteUrl();
  const storeName = config?.storeName?.trim() || "Space Point BR";

  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: storeName,
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

function getProductAvailability(product: Product) {
  if (product.hasVariants) {
    const inStock = product.variants.some((variant) => variant.stockQuantity > 0);
    return inStock
      ? "https://schema.org/InStock"
      : "https://schema.org/OutOfStock";
  }

  return (product.stockQuantity ?? 0) > 0
    ? "https://schema.org/InStock"
    : "https://schema.org/OutOfStock";
}

function getProductOfferPrice(product: Product) {
  if (product.hasVariants && product.variants.length > 0) {
    const prices = product.variants.map((variant) => variant.price);
    return Math.min(...prices) / 100;
  }
  return product.price / 100;
}

function stripRichText(value: unknown) {
  if (typeof value === "string") return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (Array.isArray(value)) return value.map(stripRichText).join(" ").trim();
  if (value && typeof value === "object") {
    return Object.values(value as Record<string, unknown>).map(stripRichText).join(" ").trim();
  }
  return "";
}

export function buildProductJsonLd(
  product: Product,
  reviewsSummary?: ProductReviewsSummary | null
) {
  const siteUrl = getSiteUrl();
  const images = [
    product.imageUrl,
    ...(product.images || []),
  ]
    .map((image) => toAbsoluteUrl(image, siteUrl))
    .filter((image): image is string => Boolean(image));

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description:
      stripRichText(product.description) ||
      `Compre ${product.name} com entrega digital na Space Point.`,
    image: images.length ? images : undefined,
    sku: product.hasVariants ? product.variants[0]?.sku || product.id : product.id,
    brand: {
      "@type": "Brand",
      name: product.platform || "PlayStation",
    },
    offers: {
      "@type": "Offer",
      url: toAbsolutePath(`/product/${product.slug}`, siteUrl),
      priceCurrency: "BRL",
      price: getProductOfferPrice(product).toFixed(2),
      availability: getProductAvailability(product),
      itemCondition: "https://schema.org/NewCondition",
    },
  };

  if (reviewsSummary && reviewsSummary.total > 0) {
    jsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: reviewsSummary.averageRating.toFixed(1),
      reviewCount: reviewsSummary.total,
      bestRating: "5",
      worstRating: "1",
    };
  }

  return jsonLd;
}
