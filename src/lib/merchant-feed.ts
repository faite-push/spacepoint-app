import { fetchProductListing } from "@/lib/shop-api";
import type { PublicSiteConfig } from "@/lib/site-api";
import type { Product, ProductVariant } from "@/types/shop";
import { getSiteUrl, toAbsolutePath, toAbsoluteUrl } from "@/lib/site-url";

const GOOGLE_PRODUCT_CATEGORY = "1279";

type FeedItem = {
  id: string;
  itemGroupId?: string;
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

function stripRichText(value: unknown) {
  if (typeof value === "string") return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  if (Array.isArray(value)) return value.map(stripRichText).join(" ").trim();
  if (value && typeof value === "object") {
    return Object.values(value as Record<string, unknown>).map(stripRichText).join(" ").trim();
  }
  return "";
}

function formatMerchantPrice(cents: number) {
  return `${(cents / 100).toFixed(2)} BRL`;
}

function getProductImages(product: Product, variant?: ProductVariant | null) {
  const rawImages = [
    variant?.imageUrl,
    product.imageUrl,
    ...(product.images || []),
  ].filter(Boolean) as string[];

  const unique = [...new Set(rawImages)];
  return unique
    .map((image) => toAbsoluteUrl(image))
    .filter((image): image is string => Boolean(image));
}

function getAvailability(stockQuantity: number) {
  return stockQuantity > 0 ? "in stock" : "out of stock";
}

function buildDescription(product: Product, variant?: ProductVariant | null) {
  const fromVariant = stripRichText(variant?.description);
  const fromProduct = stripRichText(product.description);
  const base = fromVariant || fromProduct;

  if (base) return base.slice(0, 5000);

  const label = variant ? `${product.name} — ${variant.name}` : product.name;
  return `Compre ${label} com entrega digital na Space Point.`;
}

function buildFeedItems(product: Product, siteUrl: string): FeedItem[] {
  const brand = product.platform?.trim() || "PlayStation";
  const productType = product.isDigital === false ? "Produto físico" : "Jogo digital";

  if (product.hasVariants && product.variants.length > 0) {
    return product.variants.map((variant) => {
      const images = getProductImages(product, variant);
      const title = `${product.name} — ${variant.name}`;
      const link = toAbsolutePath(`/product/${product.slug}`, siteUrl);
      const price = variant.price;
      const comparePrice =
        variant.comparePrice && variant.comparePrice > price ? variant.comparePrice : null;

      return {
        id: `${product.id}:${variant.id}`,
        itemGroupId: product.id,
        title,
        description: buildDescription(product, variant),
        link,
        imageLink: images[0] || toAbsolutePath("/placeholder.svg", siteUrl),
        additionalImageLinks: images.slice(1, 10),
        availability: getAvailability(variant.stockQuantity),
        price: formatMerchantPrice(comparePrice ?? price),
        salePrice: comparePrice ? formatMerchantPrice(price) : undefined,
        brand,
        condition: "new",
        productType,
      };
    });
  }

  const images = getProductImages(product);
  const price = product.price;
  const comparePrice =
    product.comparePrice && product.comparePrice > price ? product.comparePrice : null;

  return [
    {
      id: product.id,
      title: product.name,
      description: buildDescription(product),
      link: toAbsolutePath(`/product/${product.slug}`, siteUrl),
      imageLink: images[0] || toAbsolutePath("/placeholder.svg", siteUrl),
      additionalImageLinks: images.slice(1, 10),
      availability: getAvailability(product.stockQuantity ?? 0),
      price: formatMerchantPrice(comparePrice ?? price),
      salePrice: comparePrice ? formatMerchantPrice(price) : undefined,
      brand,
      condition: "new",
      productType,
    },
  ];
}

function renderFeedItem(item: FeedItem) {
  const lines = [
    "    <item>",
    `      <g:id>${escapeXml(item.id)}</g:id>`,
    item.itemGroupId ? `      <g:item_group_id>${escapeXml(item.itemGroupId)}</g:item_group_id>` : null,
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

  const items = products.flatMap((product) => buildFeedItems(product, siteUrl));

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
