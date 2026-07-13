import { fetchProductListing } from "@/lib/shop-api";
import type { PublicSiteConfig } from "@/lib/site-api";
import { stripRichText } from "@/lib/strip-rich-text";
import type { Product } from "@/types/shop";
import { getSiteUrl, toAbsolutePath, toAbsoluteUrl } from "@/lib/site-url";

const GOOGLE_PRODUCT_CATEGORY = "1279";

type FeedItem = {
  id: string;
  title: string;
  description: string;
  link: string;
  imageLink: string;
  additionalImageLinks: string[];
  availability: "in stock" | "out of stock";
  price: string;
  salePrice?: string;
  brand: string;
  condition: "new";
  productType?: string;
};

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function formatMerchantPrice(cents: number) {
  return `${(cents / 100).toFixed(2)} BRL`;
}

function getProductImages(product: Product) {
  const rawImages = [product.imageUrl, ...(product.images || [])].filter(Boolean) as string[];

  const unique = [...new Set(rawImages)];
  return unique
    .map((image) => toAbsoluteUrl(image))
    .filter((image): image is string => Boolean(image));
}

function getProductPriceCents(product: Product) {
  if (product.hasVariants && product.variants.length > 0) {
    return Math.min(...product.variants.map((variant) => variant.price));
  }
  return product.price;
}

function getProductComparePriceCents(product: Product, priceCents: number) {
  if (product.hasVariants && product.variants.length > 0) {
    const matches = product.variants.filter((variant) => variant.price === priceCents);
    const compare = matches
      .map((variant) => variant.comparePrice)
      .filter((value): value is number => typeof value === "number" && value > priceCents);
    if (compare.length) return Math.min(...compare);
    return null;
  }

  if (product.comparePrice && product.comparePrice > priceCents) {
    return product.comparePrice;
  }

  return null;
}

function getProductStock(product: Product) {
  if (product.hasVariants && product.variants.length > 0) {
    return product.variants.reduce((sum, variant) => sum + (variant.stockQuantity || 0), 0);
  }
  return product.stockQuantity ?? 0;
}

function getAvailability(stockQuantity: number) {
  return stockQuantity > 0 ? "in stock" : "out of stock";
}

function buildDescription(product: Product) {
  const base = stripRichText(product.description);
  if (base) return base.slice(0, 5000);
  return `Compre ${product.name} com entrega digital na Space Point.`;
}

function buildFeedItem(product: Product, siteUrl: string): FeedItem {
  const images = getProductImages(product);
  const price = getProductPriceCents(product);
  const comparePrice = getProductComparePriceCents(product, price);
  const brand = product.platform?.trim() || "PlayStation";
  const productType = product.isDigital === false ? "Produto físico" : "Jogo digital";

  return {
    id: product.id,
    title: product.name,
    description: buildDescription(product),
    link: toAbsolutePath(`/product/${product.slug}`, siteUrl),
    imageLink: images[0] || toAbsolutePath("/placeholder.svg", siteUrl),
    additionalImageLinks: images.slice(1, 10),
    availability: getAvailability(getProductStock(product)),
    price: formatMerchantPrice(comparePrice ?? price),
    salePrice: comparePrice ? formatMerchantPrice(price) : undefined,
    brand,
    condition: "new",
    productType,
  };
}

function renderFeedItem(item: FeedItem) {
  const lines = [
    "    <item>",
    `      <g:id>${escapeXml(item.id)}</g:id>`,
    `      <g:title>${escapeXml(item.title)}</g:title>`,
    `      <g:description>${escapeXml(item.description)}</g:description>`,
    `      <g:link>${escapeXml(item.link)}</g:link>`,
    `      <g:image_link>${escapeXml(item.imageLink)}</g:image_link>`,
    ...item.additionalImageLinks.map(
      (image) => `      <g:additional_image_link>${escapeXml(image)}</g:additional_image_link>`
    ),
    `      <g:availability>${item.availability}</g:availability>`,
    `      <g:price>${escapeXml(item.price)}</g:price>`,
    item.salePrice ? `      <g:sale_price>${escapeXml(item.salePrice)}</g:sale_price>` : null,
    `      <g:brand>${escapeXml(item.brand)}</g:brand>`,
    `      <g:condition>${item.condition}</g:condition>`,
    `      <g:identifier_exists>false</g:identifier_exists>`,
    `      <g:google_product_category>${GOOGLE_PRODUCT_CATEGORY}</g:google_product_category>`,
    item.productType ? `      <g:product_type>${escapeXml(item.productType)}</g:product_type>` : null,
    "    </item>",
  ];

  return lines.filter(Boolean).join("\n");
}

export async function fetchAllProductsForFeed() {
  const products: Product[] = [];
  let page = 1;

  while (page <= 100) {
    const result = await fetchProductListing({
      page: String(page),
      limit: "60",
      sortBy: "newest",
      sortOrder: "desc",
    });

    products.push(...result.products);

    if (page >= result.pagination.totalPages) break;
    page += 1;
  }

  return products;
}

export function buildGoogleMerchantFeedXml({
  products,
  config,
  siteUrl = getSiteUrl(),
}: {
  products: Product[];
  config?: PublicSiteConfig | null;
  siteUrl?: string;
}) {
  const storeName = config?.storeName?.trim() || "Space Point BR";
  const description =
    config?.metaDescription?.trim() ||
    "Jogos digitais originais para PlayStation com entrega segura e instantânea.";

  const items = products.map((product) => buildFeedItem(product, siteUrl));
  const itemXml = items.map(renderFeedItem).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>${escapeXml(storeName)}</title>
    <link>${escapeXml(siteUrl)}</link>
    <description>${escapeXml(description)}</description>
${itemXml}
  </channel>
</rss>
`;
}
