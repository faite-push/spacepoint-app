import type { Metadata, Viewport } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import { Chakra_Petch } from "next/font/google";

import "@/styles/globals.css";
import { SiteShell } from "@/components/site-shell";
import { AnalyticsVisit } from "@/components/shared/analytics-visit";
import { WishlistSync } from "@/components/shared/wishlist-sync";
import { CartSync } from "@/components/shared/cart-sync";
import { AuthProvider } from "@/context/auth-context";
import { SocketProvider } from "@/context/socket-context";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Providers } from "@/components/shared/providers";
import { fetchSiteConfig, fetchHomeReviews, fetchPageSeo, fetchFooterCategories } from "@/lib/site-api";
import { fetchStoreReviews } from "@/lib/store-reviews-api";
import { resolveGoogleSiteVerification } from "@/lib/google-site-verification";
import { getSiteUrl } from "@/lib/site-url";
import { JsonLd } from "@/components/seo/json-ld";
import { buildOrganizationJsonLd, buildWebsiteJsonLd } from "@/lib/json-ld";

const chakra = Chakra_Petch({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-chakra",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export async function generateMetadata(): Promise<Metadata> {
  const [config, homeSeo] = await Promise.all([
    fetchSiteConfig(),
    fetchPageSeo("home"),
  ]);
  const title =
    homeSeo?.metaTitle?.trim() ||
    config?.metaTitle?.trim() ||
    config?.storeName?.trim() ||
    "Space Point BR";
  const description =
    homeSeo?.metaDescription?.trim() ||
    config?.metaDescription?.trim() ||
    "Jogos digitais originais para PlayStation com entrega segura e instantânea.";
  const googleVerification = resolveGoogleSiteVerification(config?.pluginsConfig);

  return {
    metadataBase: new URL(getSiteUrl()),
    title,
    description,
    ...(googleVerification ? { verification: { google: googleVerification } } : {}),
    ...(homeSeo?.ogImageUrl ? { openGraph: { images: [homeSeo.ogImageUrl] } } : {}),
    ...(config?.faviconUrl?.trim()
      ? { icons: { icon: config.faviconUrl } }
      : {}),
  };
}

export default async function RootLayout({ children, }: Readonly<{ children: React.ReactNode; }>) {
  const [siteConfig, homeReviews, storeReviewsPayload, footerCategoryLinks] = await Promise.all([
    fetchSiteConfig(),
    fetchHomeReviews(),
    fetchStoreReviews(),
    fetchFooterCategories(),
  ]);
  const storeReviews = storeReviewsPayload.reviews;
  const storeReviewsSummary = storeReviewsPayload.summary;

  return (
    <html
      lang="pt-BR"
      className={`${GeistSans.variable} ${GeistMono.variable} ${chakra.variable} h-full antialiased dark`}
      suppressHydrationWarning
    >
      <body
        className={`${GeistSans.className} min-h-full w-full flex flex-col bg-background text-foreground`}
        suppressHydrationWarning
      >
        <JsonLd
          data={[
            buildOrganizationJsonLd(siteConfig),
            buildWebsiteJsonLd(siteConfig),
          ]}
        />
        <Providers>
          <AuthProvider>
            <SocketProvider>
              <TooltipProvider delay={200}>
                <AnalyticsVisit />
                <WishlistSync />
                <CartSync />
                <SiteShell
                  siteConfig={siteConfig}
                  homeReviews={homeReviews}
                  storeReviews={storeReviews}
                  storeReviewsSummary={storeReviewsSummary}
                  footerCategoryLinks={footerCategoryLinks}
                >
                  {children}
                </SiteShell>
              </TooltipProvider>
            </SocketProvider>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}