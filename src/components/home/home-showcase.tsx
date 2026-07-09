import { ShowcaseSectionCarousel } from "@/components/home/showcase-section-carousel";
import type { Product } from "@/types/shop";

export type HomeShowcaseSectionData = {
  id: string;
  title: string;
  subtitle: string | null;
  products: Product[];
};

function ShowcaseSectionBlock({ section }: { section: HomeShowcaseSectionData }) {
  if (!section.products.length) return null;

  return (
    <section className="w-[100vw] relative left-1/2 -translate-x-1/2 overflow-hidden max-w-[1580px] mx-auto px-4 sm:px-6 lg:px-[2rem] space-y-8">
      <div className="text-center">
        <div className="flex items-center justify-center gap-4 select-none">
          <div className="h-px flex-1 max-w-7xl bg-gradient-to-r from-transparent via-primary/70 to-primary/60" />
          <h2 className="text-2xl font-bold tracking-tight text-primary md:text-3xl font-chakra whitespace-nowrap">
            {section.title}
          </h2>
          <div className="h-px flex-1 max-w-7xl bg-gradient-to-l from-transparent via-primary/70 to-primary/60" />
        </div>
        {section.subtitle ? (
          <p className="text-sm text-white/80 md:text-base mt-4">{section.subtitle}</p>
        ) : null}
      </div>

      <ShowcaseSectionCarousel products={section.products} />
    </section>
  );
}

export function HomeShowcase({ sections }: { sections: HomeShowcaseSectionData[] }) {
  const visibleSections = sections.filter((section) => section.products.length > 0);
  if (!visibleSections.length) return null;

  return (
    <div className="mb-12 space-y-16">
      {visibleSections.map((section) => (
        <ShowcaseSectionBlock key={section.id} section={section} />
      ))}
    </div>
  );
}
