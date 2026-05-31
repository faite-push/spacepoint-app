import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { ProductCard } from "@/components/shop/product-card";
import { SubcategoryCarousel } from "@/components/shop/storefront/subcategory-carousel";
import type { Metadata } from "next";
import { fetchCategoryBySlug } from "@/lib/category-api";
import { fetchPageSeo } from "@/lib/site-api";
import { resolvePageMetadata } from "@/lib/seo-utils";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [category, pageSeo] = await Promise.all([
    fetchCategoryBySlug(slug),
    fetchPageSeo("category"),
  ]);
  if (!category) return { title: "Categoria não encontrada" };

  const entityMeta = category as { metaTitle?: string | null; metaDescription?: string | null };
  if (entityMeta.metaTitle || entityMeta.metaDescription) {
    return {
      title: entityMeta.metaTitle ?? `${category.name} | Space Point`,
      description:
        entityMeta.metaDescription ??
        `Compre jogos digitais na categoria ${category.name}.`,
    };
  }

  return resolvePageMetadata(pageSeo, { name: category.name }, {
    title: `${category.name} | Space Point`,
    description: `Compre jogos digitais na categoria ${category.name}.`,
  });
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = await fetchCategoryBySlug(slug);
  if (!category) notFound();

  return (
    <div className="mx-auto max-w-7xl space-y-8 py-6 md:py-12 -mt-22 relative">
      <div className="absolute top-0 right-[-10%] w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-primary/20 rounded-full blur-[120px] -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-[-10%] w-[250px] sm:w-[400px] h-[250px] sm:h-[400px] bg-primary/20 rounded-full blur-[120px] -z-10 pointer-events-none" />

      {category.parent && (
        <nav className="flex items-center gap-1 text-sm -mt-6 md:-mt-10 text-white/50">
          <Link href={`/category/${category.parent.slug}`} className="text-white/50 hover:text-white transition-colors">
            {category.parent.name}
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-white">{category.name}</span>
        </nav>
      )}

      {category.bannerUrl && (
        <div className="space-y-4">
          <div className="w-full overflow-hidden rounded-2xl border border-white/10">
            <Image
              src={category.bannerUrl}
              alt={category.name}
              width={2560}
              height={1080}
              className="h-auto w-full"
              sizes="100vw"
              priority
            />
          </div>
          <header className="space-y-1">
            <h1 className="text-3xl font-black text-white md:text-4xl">{category.name}</h1>
            <p className="text-sm text-white">
              {category.products.length} produto{category.products.length !== 1 ? "s" : ""}
              {category.subcategories.length > 0 &&
                ` · ${category.subcategories.length} subcategoria${category.subcategories.length !== 1 ? "s" : ""}`}
            </p>
          </header>
        </div>
      )}

      {!category.bannerUrl && (
        <header className="space-y-2 mb-4">
          <h1 className="text-3xl md:text-4xl font-black text-white">{category.name}</h1>
        </header>
      )}

      {category.subcategories.length > 0 && (
        <section className="space-y-4">
          <SubcategoryCarousel subcategories={category.subcategories} />
        </section>
      )}

      {category.products.length > 0 ? (
        <section className="space-y-4">
          {category.subcategories.length > 0 && (
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
              Produtos nesta categoria
            </h2>
          )}
          <div className="grid gap-2 md:gap-5 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {category.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      ) : (
        category.subcategories.length === 0 && (
          <div className="rounded-2xl border border-dashed border-white/10 bg-background/50 py-20 text-center">
            <p className="text-zinc-400">Nenhum produto nesta categoria no momento.</p>
            <Link href="/products" className="mt-4 inline-block text-sm text-[#a855f7] hover:underline">
              Ver todos os produtos
            </Link>
          </div>
        )
      )}
    </div>
  );
}