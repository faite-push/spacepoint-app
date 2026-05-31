"use client";

import { usePathname } from "next/navigation";
import { toast } from "sonner";
import type { PublicSiteConfig } from "@/lib/site-api";
import { resolveFooterConfig } from "@/lib/footer-config";
import { FooterContent } from "@/components/footer/footer-content";

export function SiteFooter({ config }: { config?: PublicSiteConfig | null }) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const footer = resolveFooterConfig(config);

  return (
    <footer className="mt-20">
      <FooterContent
        footer={footer}
        isHome={isHome}
        onNewsletterSubmit={() => {
          toast.success("Obrigado por se inscrever!");
        }}
      />
    </footer>
  );
}
