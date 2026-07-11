import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeftIcon, Loader2 } from "lucide-react";

import { SubcategoryCarousel } from "@/components/shop/storefront/subcategory-carousel";
import { CategoryProductListing } from "@/components/shop/category-product-listing";
import type { Metadata } from "next";
import { fetchCategoryBySlug } from "@/lib/category-api";
import { fetchPageSeo } from "@/lib/site-api";
import { resolvePageMetadata } from "@/lib/seo-utils";
import { Button } from "@/components/ui/button";

export async function generateMetadata({ params, }: { params: Promise<{ slug: string }>; }): Promise<Metadata> {
  const { slug } = await params;
  const [category, pageSeo] = await Promise.all([fetchCategoryBySlug(slug), fetchPageSeo("category"),]);
  if (!category) return { title: "Categoria não encontrada" };

  const entityMeta = category as { metaTitle?: string | null; metaDescription?: string | null };
  if (entityMeta.metaTitle || entityMeta.metaDescription) {
    return {
      title: entityMeta.metaTitle ?? `${category.name} | Space Point`,
      description:
        entityMeta.metaDescription ??
        `Compre jogos digitais na categoria ${category.name}.`,
    };
  };

  return resolvePageMetadata(pageSeo, { name: category.name }, {
    title: `${category.name} | Space Point`,
    description: `Compre jogos digitais na categoria ${category.name}.`,
  });
};

export default async function CategoryPage({ params, }: { params: Promise<{ slug: string }>; }) {
  const { slug } = await params;
  const category = await fetchCategoryBySlug(slug);
  if (!category) notFound();

  const hasSubcategories = category.subcategories.length > 0;

  return (
    <div className="left-1/2 -translate-x-1/2 min-w-[1540px] space-y-6 py-6 md:py-12 -mt-32 relative">
      <div className="absolute top-0 right-[-10%] w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-primary/20 rounded-full blur-[120px] -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-[-10%] w-[250px] sm:w-[400px] h-[250px] sm:h-[400px] bg-primary/20 rounded-full blur-[120px] -z-10 pointer-events-none" />

      {category.bannerUrl && (
        <div className="space-y-4">
          <header className="flex items-center gap-2">
            <div>
              {category.parent && (
                <Link href={`/category/${category.parent.slug}`}>
                  <Button size="icon-lg" className="bg-white/3 hover:bg-white/10">
                    <ArrowLeftIcon className="w-4 h-4" />
                  </Button>
                </Link>
              )}
            </div>
            <div className="flex flex-col">
              <h1 className="text-2xl font-black text-white md:text-3xl">{category.name}</h1>
            </div>
          </header>

          <div className="w-full overflow-hidden rounded-2xl border border-white/5">
            <Image
              src={category.bannerUrl}
              alt={category.name}
              width={2560}
              height={1080}
              className="object-cover select-none pointer-events-none h-auto w-full"
              sizes="100vw"
              priority
            />
          </div>
        </div>
      )}

      {!category.bannerUrl && (
        <header className="flex items-center gap-2">
          <div>
            {category.parent && (
              <Link href={`/category/${category.parent.slug}`}>
                <Button size="icon-lg" className="bg-white/3 hover:bg-white/10">
                  <ArrowLeftIcon className="w-4 h-4" />
                </Button>
              </Link>
            )}
          </div>
          <div className="flex flex-col">
            <h1 className="text-2xl font-black text-white md:text-3xl">{category.name}</h1>
          </div>
        </header>
      )}

      {hasSubcategories && (
        <section className="space-y-4">
          <SubcategoryCarousel subcategories={category.subcategories} />
        </section>
      )}

      <section className="space-y-4">
        {hasSubcategories && (
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-500">
            Produtos nesta categoria
          </h2>
        )}

        <Suspense
          fallback={
            <div className="flex items-center justify-center py-24">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
          }
        >
          <CategoryProductListing
            categorySlug={slug}
            showIncludeSubcategories={hasSubcategories}
          />
        </Suspense>
      </section>
    </div>
  );
};
