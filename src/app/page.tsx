import type { Metadata } from "next";
import { fetchShopHome, fetchSiteConfig } from "@/lib/site-api";

export async function generateMetadata(): Promise<Metadata> {
  const config = await fetchSiteConfig();
  const d = config?.metaDescription?.trim();
  return d ? { description: d } : {};
}

import { BannerSlider } from "@/components/shop/storefront/banner-slider";

export default async function Home() {
  const [config, shop] = await Promise.all([fetchSiteConfig(), fetchShopHome()]);

  return (
    <div className="flex w-full flex-col gap-8">
      {shop?.banners && shop.banners.length > 0 && (
        <BannerSlider banners={shop.banners} />
      )}
    </div>
  );
}