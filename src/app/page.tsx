import type { Metadata } from "next";
import { fetchFamousClients, fetchShopHome, fetchSiteConfig } from "@/lib/site-api";

export async function generateMetadata(): Promise<Metadata> {
  const config = await fetchSiteConfig();
  const d = config?.metaDescription?.trim();
  return d ? { description: d } : {};
}

import { BannerSlider } from "@/components/shop/storefront/banner-slider";
import { FamousClientsSection } from "@/components/home/famous-clients-section";
import { HomeShowcase } from "@/components/home/home-showcase";
import { Separator } from "@/components/ui/separator";

export default async function Home() {
  const [shop, config, famousClients] = await Promise.all([
    fetchShopHome(),
    fetchSiteConfig(),
    fetchFamousClients(),
  ]);

  return (
    <div className="flex w-full flex-col gap-8 relative">
      <div className="absolute top-0 right-[-10%] w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-primary/20 rounded-full blur-[120px] -z-10 pointer-events-none" />
      <div className="absolute top-0 left-[-10%] w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-primary/20 rounded-full blur-[120px] -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-[-10%] w-[250px] sm:w-[400px] h-[250px] sm:h-[400px] bg-primary/20 rounded-full blur-[120px] -z-10 pointer-events-none" />
      <div className="absolute bottom-0 right-[-10%] w-[250px] sm:w-[400px] h-[250px] sm:h-[400px] bg-primary/20 rounded-full blur-[120px] -z-10 pointer-events-none" />

      {shop?.banners && shop.banners.length > 0 && (
        <BannerSlider banners={shop.banners} />
      )}

      <FamousClientsSection
        clients={famousClients}
        enabled={config?.homeFamousEnabled ?? true}
        titlePrimary={config?.homeFamousTitlePrimary}
        titleSecondary={config?.homeFamousTitleSecondary}
      />

      <HomeShowcase sections={shop?.sections ?? []} />
    </div>
  );
};
