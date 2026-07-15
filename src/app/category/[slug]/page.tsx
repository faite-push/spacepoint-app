import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeftIcon, Loader2 } from "lucide-react";
import type { Metadata } from "next";

import { SubcategoryCarousel } from "@/components/shop/storefront/subcategory-carousel";
import { CategoryProductListing } from "@/components/shop/category-product-listing";
import { fetchCategoryBySlug } from "@/lib/category-api";
import { fetchPageSeo } from "@/lib/site-api";
import { resolvePageMetadata } from "@/lib/seo-utils";
import { Button } from "@/components/ui/button";

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

  const entityMeta = category as {
    metaTitle?: string | null;
    metaDescription?: string | null;
  };
  if (entityMeta.metaTitle || entityMeta.metaDescription) {
    return {
      title: entityMeta.metaTitle ?? `${category.name} | Space Point`,
      description:
        entityMeta.metaDescription ??
        `Compre jogos digitais na categoria ${category.name}.`,
    };
  }

  return resolvePageMetadata(
    pageSeo,
    { name: category.name },
    {
      title: `${category.name} | Space Point`,
      description: `Compre jogos digitais na categoria ${category.name}.`,
    }
  );
}

function CategoryHeader({
  category,
}: {
  category: {
    name: string;
    parent: { slug: string } | null;
  };
}) {
  return (
    <header className="flex items-center gap-2 sm:gap-3 min-w-0">
      {category.parent && (
        <Link href={`/category/${category.parent.slug}`} className="shrink-0">
          <Button size="icon-lg" className="bg-white/3 hover:bg-white/10">
            <ArrowLeftIcon className="w-4 h-4" />
          </Button>
        </Link>
      )}
      <h1 className="text-xl font-black text-white sm:text-2xl md:text-3xl break-words min-w-0">
        {category.name}
      </h1>
    </header>
  );
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = await fetchCategoryBySlug(slug);
  if (!category) notFound();

  const hasSubcategories = category.subcategories.length > 0;
  const hasDirectProducts = (category.products?.length ?? 0) > 0;
  const isHubOnly = hasSubcategories && !hasDirectProducts;

  return (
    <div className="relative space-y-6 sm:space-y-8 py-6 md:py-12 -mt-32">
      <div className="absolute top-10 -right-24 h-[520px] w-[520px] bg-primary/25 rounded-full blur-[100px] z-0 pointer-events-none" />
      <div className="absolute -bottom-16 -left-24 h-[520px] w-[520px] bg-primary/25 rounded-full blur-[100px] z-0 pointer-events-none" />

      {category.bannerUrl ? (
        <div className="space-y-4">
          <CategoryHeader category={category} />
          <div className="w-full overflow-hidden rounded-xl sm:rounded-2xl border border-white/5">
            <Image
              src={category.bannerUrl}
              alt={category.name}
              width={2560}
              height={1080}
              className="object-cover select-none pointer-events-none h-auto w-full"
              sizes="(max-width: 1580px) 100vw, 1580px"
              priority
            />
          </div>
        </div>
      ) : (
        <CategoryHeader category={category} />
      )}

      {hasSubcategories && (
        <section className="space-y-3 sm:space-y-4 overflow-hidden">
          {!isHubOnly && (
            <h2 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-zinc-500">
              Subcategorias
            </h2>
          )}
          <SubcategoryCarousel subcategories={category.subcategories} />
        </section>
      )}

      {!isHubOnly && (
        <section className="space-y-4 border-t border-white/5 pt-6 sm:pt-8">
          {hasSubcategories && (
            <div className="space-y-1">
              <h2 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-zinc-500">
                Produtos nesta categoria
              </h2>
              <p className="text-sm text-white/50">
                Produtos ligados diretamente a esta categoria.
              </p>
            </div>
          )}

          <Suspense
            fallback={
              <div className="flex items-center justify-center py-16 sm:py-24">
                <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 animate-spin text-primary" />
              </div>
            }
          >
            <CategoryProductListing
              categorySlug={slug}
              showIncludeSubcategories={hasSubcategories}
            />
          </Suspense>
        </section>
      )}
    </div>
  );
}
