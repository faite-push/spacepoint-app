"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { SiteFooter } from "@/components/site-footer";
import { FooterReviews } from "@/components/home/footer-reviews";
import { PromoTopBar } from "@/components/storefront/promo-top-bar";
import { MaintenanceGate } from "@/components/storefront/maintenance-gate";
import { ConversionPopup } from "@/components/home/conversion-popup";
import type { PublicHomeReview, PublicSiteConfig } from "@/lib/site-api";

export function SiteShell({
  children,
  siteConfig,
  homeReviews = [],
}: {
  children: React.ReactNode;
  siteConfig?: PublicSiteConfig | null;
  homeReviews?: PublicHomeReview[];
}) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/dashboard/admin");
  const isMaintenance = pathname === "/maintenance";
  const hasTopBar =
    siteConfig?.topBarEnabled && Boolean(siteConfig.topBarText?.trim());

  if (isAdmin) {
    return <>{children}</>;
  }

  const showReviews = pathname === "/" && siteConfig?.homeReviewsEnabled !== false && homeReviews.length > 0;
  
  return (
    <MaintenanceGate config={siteConfig}>
      <ConversionPopup config={siteConfig} />
      <PromoTopBar config={siteConfig} />
      {!isMaintenance && <Navbar siteConfig={siteConfig} />}
      <main
        className={`mx-auto w-full max-w-7xl flex-1 px-4 ${
          isMaintenance ? "pt-12" : hasTopBar ? "pt-36" : "pt-32"
        }`}
      >
        {children}
      </main>

      {showReviews && (
        <div className="relative z-10 -mb-60">
          <div className="absolute top-0 right-[0%] w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-primary/20 rounded-full blur-[120px] -z-10 pointer-events-none" />
          <div className="absolute top-0 left-[0%] w-[250px] sm:w-[400px] h-[250px] sm:h-[400px] bg-primary/20 rounded-full blur-[120px] -z-10 pointer-events-none" />
          <div className="absolute top-0 left-[40%] w-[250px] sm:w-[400px] h-[250px] sm:h-[400px] bg-primary/20 rounded-full blur-[120px] -z-10 pointer-events-none" />

          <div className="mx-auto max-w-[1580px] px-4 md:px-8">
            <div className="rounded-3xl border-2 border-dashed border-white/20 bg-background p-6 sm:p-12">
              <FooterReviews config={siteConfig} reviews={homeReviews} />
            </div>
          </div>
        </div>
      )}

      {!isMaintenance && <SiteFooter config={siteConfig} showReviews={showReviews} />}
    </MaintenanceGate>
  );
}
