import type { MetadataRoute } from "next";

import { fetchSiteConfig } from "@/lib/site-api";
import { getSiteUrl } from "@/lib/site-url";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const baseUrl = getSiteUrl();
  const config = await fetchSiteConfig().catch(() => null);
  const merchantEnabled = config?.pluginsConfig?.["google-merchant"]?.enabled === true;

  const sitemap = [`${baseUrl}/sitemap.xml`];
  if (merchantEnabled) {
    sitemap.push(`${baseUrl}/merchant-feed.xml`);
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard/",
          "/account/",
          "/checkout/",
          "/login",
          "/api/",
        ],
      },
    ],
    sitemap,
    host: baseUrl,
  };
}
