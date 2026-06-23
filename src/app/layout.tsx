import type { Metadata } from "next";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import { Chakra_Petch } from "next/font/google";
import "@/styles/globals.css";
import { SiteShell } from "@/components/site-shell";
import { AnalyticsVisit } from "@/components/shared/analytics-visit";
import { AuthProvider } from "@/context/auth-context";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Providers } from "@/components/shared/providers";
import { fetchSiteConfig, fetchHomeReviews, fetchPageSeo } from "@/lib/site-api";

const chakra = Chakra_Petch({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-chakra",
});

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
  return {
    title,
    description,
    ...(homeSeo?.ogImageUrl ? { openGraph: { images: [homeSeo.ogImageUrl] } } : {}),
    ...(config?.faviconUrl?.trim()
      ? { icons: { icon: config.faviconUrl } }
      : {}),
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [siteConfig, homeReviews] = await Promise.all([
    fetchSiteConfig(),
    fetchHomeReviews(),
  ]);

  return (
    <html
      lang="pt-BR"
      className={`${GeistSans.variable} ${GeistMono.variable} ${chakra.variable} h-full antialiased dark`}
      suppressHydrationWarning
    >
      <body
        className={`${GeistSans.className} min-h-full flex flex-col bg-background text-foreground`}
        suppressHydrationWarning
      >
        <Providers>
          <AuthProvider>
            <TooltipProvider delay={200}>
              <AnalyticsVisit />
              <SiteShell siteConfig={siteConfig} homeReviews={homeReviews}>
                {children}
              </SiteShell>
            </TooltipProvider>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}