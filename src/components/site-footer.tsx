"use client";

import { usePathname } from "next/navigation";
import type { PublicSiteConfig, FooterLink } from "@/lib/site-api";
import { resolveFooterConfig } from "@/lib/footer-config";
import { FooterContent } from "@/components/footer/footer-content";

export function SiteFooter({
  config,
  showReviews,
  footerCategoryLinks = [],
}: {
  config?: PublicSiteConfig | null;
  showReviews?: boolean;
  footerCategoryLinks?: FooterLink[];
}) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const footer = resolveFooterConfig(config, footerCategoryLinks);

  return (
    <footer className="mt-20">
      <FooterContent footer={footer} isHome={showReviews ?? isHome} />
    </footer>
  );
}
