import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeftIcon, ChevronRight } from "lucide-react";

import { ProductCard } from "@/components/shop/product-card";
import { SubcategoryCarousel } from "@/components/shop/storefront/subcategory-carousel";
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

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = await fetchCategoryBySlug(slug);
  if (!category) notFound();

  return (
    <div className="mx-auto max-w-[1540px] space-y-6 py-6 md:py-12 -mt-32 relative">
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
          <div className="grid gap-2 md:gap-4 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {category.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      ) : (
        category.subcategories.length === 0 && (
          <div className="rounded-md border border border-white/5 bg-transparent backdrop-blur-lg py-32 text-center">
            <p className="text-zinc-400">Nenhum produto nesta categoria no momento.</p>
            <Link href="/" className="mt-4 inline-block text-sm text-[#a855f7] hover:underline">
              Ver todos os produtos
            </Link>
          </div>
        )
      )}
    </div>
  );
};