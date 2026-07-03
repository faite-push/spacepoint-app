"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { SiteFooter } from "@/components/site-footer";
import { FooterReviews } from "@/components/home/footer-reviews";
import { StoreReviewsCarousel } from "@/components/home/store-reviews-carousel";
import { HomeNewsletter } from "@/components/home/home-newsletter";
import { PromoTopBar } from "@/components/storefront/promo-top-bar";
import { MaintenanceGate } from "@/components/storefront/maintenance-gate";
import { ConversionPopup } from "@/components/home/conversion-popup";
import { StorefrontPlugins } from "@/components/storefront/storefront-plugins";
import type { PublicHomeReview, PublicSiteConfig, FooterLink } from "@/lib/site-api";
import type { PublicStoreReview } from "@/lib/store-reviews-api";

function resolveReviewsSettings(config?: PublicSiteConfig | null) {
  const raw = config?.reviewsSettings;
  return {
    enabled: raw?.enabled !== false,
    showOnHomepage: raw?.showOnHomepage !== false,
    homeTitle: raw?.homeTitle?.trim() || "Depoimentos de clientes",
    homeSubtitle:
      raw?.homeSubtitle?.trim() || "Experiências reais de quem já confiou na nossa loja",
  };
}

export function SiteShell({
  children,
  siteConfig,
  homeReviews = [],
  storeReviews = [],
  footerCategoryLinks = [],
}: {
  children: React.ReactNode;
  siteConfig?: PublicSiteConfig | null;
  homeReviews?: PublicHomeReview[];
  storeReviews?: PublicStoreReview[];
  footerCategoryLinks?: FooterLink[];
}) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/dashboard/admin");
  const isMaintenance = pathname === "/maintenance";
  const hasTopBar =
    siteConfig?.topBarEnabled && Boolean(siteConfig.topBarText?.trim());

  if (isAdmin) {
    return <>{children}</>;
  }

  const reviewsSettings = resolveReviewsSettings(siteConfig);
  const showStoreReviews =
    pathname === "/" &&
    reviewsSettings.enabled &&
    reviewsSettings.showOnHomepage &&
    storeReviews.length > 0;
  const showGoogleReviews =
    pathname === "/" &&
    siteConfig?.homeReviewsEnabled !== false &&
    homeReviews.length > 0;
  const showFooterReviewsOverlap = showGoogleReviews;

  return (
    <MaintenanceGate config={siteConfig}>
      <StorefrontPlugins config={siteConfig?.pluginsConfig} />
      <ConversionPopup config={siteConfig} />
      <PromoTopBar config={siteConfig} />
      {!isMaintenance && <Navbar siteConfig={siteConfig} />}
      <main
        className={`mx-auto w-full max-w-7xl flex-1 px-4 ${isMaintenance ? "pt-12" : hasTopBar ? "pt-36" : "pt-32"
          }`}
      >
        {children}
      </main>

      {showStoreReviews && (
        <StoreReviewsCarousel
          reviews={storeReviews}
          title={reviewsSettings.homeTitle}
          subtitle={reviewsSettings.homeSubtitle}
        />
      )}

      {pathname === "/" && <HomeNewsletter config={siteConfig} />}

      {showGoogleReviews && (
        <div className="relative z-10 -mb-60">
          <div className="absolute bottom-0 left-0 right-0 top-0 bg-[radial-gradient(65%_50%_at_50%_50%,rgba(168,85,247,0.3)_0%,rgba(6,78,59,0)_100%)]" />

          <div className="mx-auto max-w-[1580px] px-4 md:px-8">
            <div className="rounded-3xl border-2 border-dashed border-white/20 bg-background p-6 sm:p-12">
              <FooterReviews config={siteConfig} reviews={homeReviews} />
            </div>
          </div>
        </div>
      )}

      {!isMaintenance && (
        <SiteFooter
          config={siteConfig}
          showReviews={showFooterReviewsOverlap}
          footerCategoryLinks={footerCategoryLinks}
        />
      )}
    </MaintenanceGate>
  );
}
