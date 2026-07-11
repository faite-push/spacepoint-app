"use client";

import type { PublicSiteConfig } from "@/lib/site-api";
import { resolveFooterConfig } from "@/lib/footer-config";
import { NewsletterSubscribeForm } from "@/components/shared/newsletter-subscribe-form";

type HomeNewsletterProps = {
  config?: PublicSiteConfig | null;
};

export function HomeNewsletter({ config }: HomeNewsletterProps) {
  const footer = resolveFooterConfig(config);

  if (!footer.newsletterEnabled) return null;

  return (
    <section className="mx-auto w-full max-w-[1540px] px-4 mt-24 md:px-3">
      <div className="relative rounded-md px-6 sm:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-xl font-bold text-white md:text-2xl">Fique por dentro das novidades</h2>
          <p className="text-sm text-muted-foreground">
            Receba ofertas e lançamentos diretamente no seu e-mail.
          </p>
        </div>

        <NewsletterSubscribeForm
          source="home"
          placeholder={footer.newsletterPlaceholder}
          buttonLabel={footer.newsletterButtonLabel}
        />
      </div>
    </section>
  );
}
