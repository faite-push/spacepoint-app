import type { MetadataRoute } from "next";

import { buildSitemapEntries } from "@/lib/sitemap-data";
import { getSiteUrl } from "@/lib/site-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return buildSitemapEntries(getSiteUrl());
}
