import { fetchSiteConfig } from "@/lib/site-api";
import {
  buildGoogleMerchantFeedXml,
  fetchAllProductsForFeed,
} from "@/lib/merchant-feed";
import { getSiteUrl } from "@/lib/site-url";

export const revalidate = 3600;

export async function GET() {
  try {
    const [products, config] = await Promise.all([
      fetchAllProductsForFeed(),
      fetchSiteConfig().catch(() => null),
    ]);

    const xml = buildGoogleMerchantFeedXml({
      products,
      config,
      siteUrl: getSiteUrl(),
    });

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    console.error("[merchant-feed]", error);
    return new Response("Erro ao gerar feed do Google Merchant", { status: 500 });
  }
}
