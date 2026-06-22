import { ProductCard } from "@/components/shop/product-card";
import type { PublicSiteConfig } from "@/lib/site-api";
import type { Product } from "@/types/shop";

export function HomeShowcase({ config, products }: { config: PublicSiteConfig | null; products: Product[]; }) {
  if (!config?.homeShowcaseEnabled || products.length === 0) {
    return null;
  }

  const title = config.homeShowcaseTitle?.trim() || "Produtos em Destaque";
  const subtitle = config.homeShowcaseSubtitle?.trim();

  return (
    <section className="w-[100vw] relative left-1/2 -translate-x-1/2 overflow-hidden max-w-[1580px] mx-auto px-4 sm:px-6 lg:px-[2rem] space-y-8 mb-24">
      <div className="text-center sm:text-center">
        <h2 className="text-2xl font-bold tracking-tight text-primary md:text-3xl font-chakra">
          {title}
        </h2>
        {subtitle ? (
          <p className="text-sm text-white/80 md:text-base">{subtitle}</p>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-5">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
};