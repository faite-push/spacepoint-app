import { fetchSiteConfig } from "@/lib/site-api";
import { buildGoogleMerchantFeedXml, fetchAllProductsForFeed } from "@/lib/merchant-feed";
import { getSiteUrl } from "@/lib/site-url";

export const revalidate = 3600;

function isGoogleMerchantEnabled(
  pluginsConfig?: Record<string, { enabled?: boolean }> | null
) {
  return pluginsConfig?.["google-merchant"]?.enabled === true;
}

export async function GET() {
  try {
    const config = await fetchSiteConfig().catch(() => null);

    if (!isGoogleMerchantEnabled(config?.pluginsConfig)) {
      return new Response("Google Merchant não está ativo", {
        status: 404,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      });
    }

    const products = await fetchAllProductsForFeed();

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
