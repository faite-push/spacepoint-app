"use client";

import { toast } from "sonner";
import type { PublicSiteConfig } from "@/lib/site-api";
import { resolveFooterConfig } from "@/lib/footer-config";
import { AnimateSvg } from "../arrow-component/ribbon";

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

        <form onSubmit={(e) => { e.preventDefault(); toast.success("Obrigado por se inscrever!"); }} className="mx-auto mt-6 flex max-w-xl flex-col gap-3 sm:flex-row sm:items-center">
          <input
            name="email"
            type="email"
            placeholder={footer.newsletterPlaceholder}
            className="flex-1 md:h-12 rounded-md border border-white/10 bg-transparent px-5 py-4 text-sm text-white placeholder:text-white/50 focus:border-primary/40 focus:outline-none transition-all duration-300"
            required
          />
          <button
            type="submit"
            className="h-12 shrink-0 rounded-md bg-primary px-6 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
          >
            {footer.newsletterButtonLabel}
          </button>
        </form>
      </div>
    </section>
  );
}
