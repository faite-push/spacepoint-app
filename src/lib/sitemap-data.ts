import type { MetadataRoute } from "next";

import { fetchProducts } from "@/lib/shop-api";
import { fetchPublicCategories } from "@/lib/category-api";
import { toAbsolutePath } from "@/lib/site-url";

type PublicCategoryNode = {
  slug: string;
  subcategories?: PublicCategoryNode[];
};

function flattenCategorySlugs(nodes: PublicCategoryNode[]): string[] {
  const slugs: string[] = [];

  for (const node of nodes) {
    if (node.slug) slugs.push(node.slug);
    if (node.subcategories?.length) {
      slugs.push(...flattenCategorySlugs(node.subcategories));
    }
  }

  return slugs;
}

export async function buildSitemapEntries(baseUrl: string): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: toAbsolutePath("/", baseUrl), lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: toAbsolutePath("/about", baseUrl), lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: toAbsolutePath("/enterprise/terms", baseUrl), lastModified: now, changeFrequency: "yearly", priority: 0.4 },
    { url: toAbsolutePath("/enterprise/privacy", baseUrl), lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: toAbsolutePath("/enterprise/refunds", baseUrl), lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: toAbsolutePath("/enterprise/cookies", baseUrl), lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: toAbsolutePath("/trust/support", baseUrl), lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: toAbsolutePath("/trust/fale-conosco", baseUrl), lastModified: now, changeFrequency: "monthly", priority: 0.45 },
    { url: toAbsolutePath("/trust/como-comprar", baseUrl), lastModified: now, changeFrequency: "monthly", priority: 0.45 },
    { url: toAbsolutePath("/trust/como-funciona", baseUrl), lastModified: now, changeFrequency: "monthly", priority: 0.45 },
    { url: toAbsolutePath("/trust/envio-expresso", baseUrl), lastModified: now, changeFrequency: "monthly", priority: 0.45 },
  ];

  const [products, categories] = await Promise.all([
    fetchProducts().catch(() => []),
    fetchPublicCategories().catch(() => []),
  ]);

  const categoryEntries: MetadataRoute.Sitemap = flattenCategorySlugs(categories).map((slug) => ({
    url: toAbsolutePath(`/category/${slug}`, baseUrl),
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const productEntries: MetadataRoute.Sitemap = products.map((product) => ({
    url: toAbsolutePath(`/product/${product.slug}`, baseUrl),
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.9,
  }));

  return [...staticRoutes, ...categoryEntries, ...productEntries];
}
