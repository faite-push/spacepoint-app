"use client";

import { usePathname } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { SiteFooter } from "@/components/layout/site-footer";
import { FooterReviews } from "@/components/home/footer-reviews";
import type { PublicSiteConfig } from "@/lib/site-api";

export function SiteShell({
  children,
  siteConfig,
}: {
  children: React.ReactNode;
  siteConfig?: PublicSiteConfig | null;
}) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/dashboard/admin");

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pt-32">
        {children}
      </main>

      {pathname === "/" && (
        <div className="relative z-10 -mb-60">
          <div className="mx-auto max-w-[1580px] px-4 md:px-10">
            <div className="rounded-3xl border-2 border-dashed border-white/20 bg-background p-12">
              <FooterReviews config={siteConfig} reviews={[]} />
            </div>
          </div>
        </div>
      )}

      <SiteFooter config={siteConfig} />
    </>
  );
}
