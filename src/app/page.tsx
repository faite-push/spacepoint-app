import type { Metadata } from "next";
import { fetchShopHome, fetchSiteConfig } from "@/lib/site-api";

export async function generateMetadata(): Promise<Metadata> {
  const config = await fetchSiteConfig();
  const d = config?.metaDescription?.trim();
  return d ? { description: d } : {};
}

import { BannerSlider } from "@/components/shop/storefront/banner-slider";
import { HomeShowcase } from "@/components/home/home-showcase";

export default async function Home() {
  const [config, shop] = await Promise.all([fetchSiteConfig(), fetchShopHome()]);

  return (
    <div className="flex w-full flex-col gap-8">
      <div className="absolute bottom-0 left-0 right-0 top-0 bg-[radial-gradient(65%_50%_at_50%_50%,rgba(168,85,247,0.3)_0%,rgba(6,78,59,0)_100%)]"></div>

      {shop?.banners && shop.banners.length > 0 && (
        <BannerSlider banners={shop.banners} />
      )}

      <HomeShowcase config={config} products={shop?.featured ?? []} />
    </div>
  );
};