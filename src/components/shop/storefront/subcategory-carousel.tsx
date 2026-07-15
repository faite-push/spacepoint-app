import Image from "next/image";
import Link from "next/link";
import type { PublicSubcategory } from "@/lib/category-api";

type SubcategoryGridProps = {
  subcategories: PublicSubcategory[];
};

function subcategoryVisual(sub: PublicSubcategory): string | null {
  return sub.imageUrl || sub.bannerUrl;
}

export function SubcategoryCarousel({ subcategories }: SubcategoryGridProps) {
  if (!subcategories.length) return null;

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
      {subcategories.map((sub) => {
        const visual = subcategoryVisual(sub);

        return (
          <Link
            key={sub.id}
            href={`/category/${sub.slug}`}
            className="group block overflow-hidden rounded-2xl border border-white/[0.08] transition-all duration-300 hover:border-white/15"
          >
            <div className="relative aspect-[412/175] w-full min-h-[120px] overflow-hidden bg-primary/20 sm:min-h-[132px] md:aspect-[412/190] md:min-h-[148px]">
              {visual ? (
                <Image
                  src={visual}
                  alt={sub.name}
                  fill
                  className="object-cover select-none pointer-events-none object-center transition-transform duration-500 ease-out group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-[#1a0a2e]/20 via-primary/80 to-[#0f172a]/20">
                  <div
                    className="pointer-events-none absolute inset-0 opacity-40"
                    style={{
                      background:
                        "radial-gradient(ellipse 70% 80% at 50% 50%, rgba(147,51,234,0.45), transparent 70%)",
                    }}
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6">
                    <h3 className="text-center text-lg font-black uppercase leading-[1.1] tracking-tight sm:text-xl">
                      <span className="bg-gradient-to-b from-white via-white to-primary-200 bg-clip-text text-transparent drop-shadow-[0_2px_16px_rgba(0,0,0,0.9)]">
                        {sub.name}
                      </span>
                    </h3>
                  </div>
                </div>
              )}

              {visual && typeof sub.productCount === "number" && (
                <div className="absolute bottom-3 left-3 rounded-full bg-black/55 px-3 py-1 text-[11px] font-medium text-white/90 backdrop-blur-sm">
                  {sub.productCount} {sub.productCount === 1 ? "produto" : "produtos"}
                </div>
              )}

              <div
                className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-black/10 opacity-80 transition-opacity group-hover:opacity-60"
                aria-hidden
              />
            </div>
          </Link>
        );
      })}
    </div>
  );
}
