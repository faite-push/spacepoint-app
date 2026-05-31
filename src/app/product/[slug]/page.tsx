import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchProduct, fetchProducts } from "@/lib/shop-api";
import { fetchPageSeo } from "@/lib/site-api";
import { resolvePageMetadata } from "@/lib/seo-utils";
import { ProductDetail } from "@/components/shop/product-detail";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [product, pageSeo] = await Promise.all([
    fetchProduct(slug).catch(() => null),
    fetchPageSeo("product"),
  ]);
  if (!product) return { title: "Produto não encontrado" };

  const p = product as { metaTitle?: string | null; metaDescription?: string | null };
  if (p.metaTitle || p.metaDescription) {
    return {
      title: p.metaTitle ?? `${product.name} | Space Point`,
      description: p.metaDescription ?? `Compre ${product.name} na Space Point.`,
    };
  }

  return resolvePageMetadata(pageSeo, { name: product.name }, {
    title: `${product.name} | Space Point`,
    description: `Compre ${product.name} com entrega digital instantânea.`,
  });
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await fetchProduct(slug).catch(() => null);
  if (!product) notFound();

  const allProducts = await fetchProducts().catch(() => []);
  const relatedProducts = allProducts
    .filter((p) => p.slug !== slug)
    .slice(0, 4);

  return <ProductDetail product={product} relatedProducts={relatedProducts} />;
}