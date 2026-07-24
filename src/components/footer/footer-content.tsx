"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import * as Fa from "react-icons/fa";
import Noise from "@/components/ui/noise";
import type { ResolvedFooterConfig } from "@/lib/footer-config";
import type { FooterLink } from "@/lib/site-api";
import { NewsletterSubscribeForm } from "@/components/shared/newsletter-subscribe-form";

function LinkColumn({
  title,
  items,
}: {
  title: string;
  items: FooterLink[];
}) {
  if (!items.length) return null;
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-white">{title}</h4>
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li key={`${item.href}-${item.label}-${index}`}>
            <Link
              href={item.href}
              className="group inline-flex items-center gap-2 text-sm text-white/90 transition-colors hover:text-white"
            >
              <span>{item.label}</span>
              {item.badge ? (
                <span className="rounded-full bg-teal-400/90 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-black">
                  {item.badge}
                </span>
              ) : null}
              {item.external ? (
                <ArrowUpRight className="h-3.5 w-3.5 opacity-80 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function FooterContent({
  footer,
  isHome = false,
  compact = false,
}: {
  footer: ResolvedFooterConfig;
  isHome?: boolean;
  compact?: boolean;
}) {
  const paddingTop = isHome ? footer.paddingTopHome : footer.paddingTopDefault;
  const socials = (footer.socialLinks || [])
    .map((link) => {
      // @ts-ignore
      const Icon = Fa[link.platform] || Fa.FaGlobe;
      return { href: link.url, icon: Icon, label: link.platform };
    })
    .filter((s) => s.href);

  return (
    <div
      className={`relative overflow-hidden text-white ${compact ? "rounded-xl" : "rounded-t-4xl"}`}
      style={{ backgroundColor: footer.backgroundColor }}
    >
      <div
        className={`mx-auto max-w-7xl px-4 pb-8 md:px-10 ${compact ? "pt-6" : ""}`}
        style={compact ? undefined : { paddingTop }}
      >
        {footer.showNoise ? (
          <div className="pointer-events-none absolute inset-0 z-0 mix-blend-overlay">
            <Noise
              patternSize={100}
              patternScaleX={0.9}
              patternScaleY={0.9}
              patternRefreshInterval={2}
              patternAlpha={20}
            />
          </div>
        ) : null}

        {/* Sobre + Newsletter */}
        <div className="relative z-10 grid gap-8 border-b border-white/15 pb-8 lg:grid-cols-[1.2fr_1fr] lg:gap-10">
          <div className="max-w-xl space-y-2">
            <h3 className="text-base font-semibold">{footer.aboutTitle}</h3>
            <p className="text-sm leading-relaxed text-white/90">{footer.aboutText}</p>
          </div>

          {footer.newsletterEnabled ? (
            <div className="w-full lg:max-w-md lg:justify-self-end">
              <NewsletterSubscribeForm
                source="footer"
                placeholder={footer.newsletterPlaceholder}
                buttonLabel={footer.newsletterButtonLabel}
                layout="inline"
                buttonClassName="shrink-0 rounded-full bg-white/95 px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-white disabled:opacity-60"
                buttonStyle={{ color: footer.buttonTextColor }}
              />
            </div>
          ) : null}
        </div>

        {/* Logo + 4 colunas de links */}
        <div className="relative z-10 mt-8 grid gap-8 sm:grid-cols-2 lg:mt-10 lg:grid-cols-5 lg:gap-8">
          <div className="flex items-start sm:col-span-2 lg:col-span-1">
            <Link href={footer.logoHref} className="block">
              <Image
                src={footer.logoUrl}
                alt={footer.logoAlt}
                width={200}
                height={80}
                className="h-auto w-auto max-h-20 object-contain brightness-0 invert-0"
                unoptimized={footer.logoUrl.startsWith("http")}
              />
            </Link>
          </div>

          <LinkColumn title={footer.marketplaceColumnTitle} items={footer.marketplaceLinks} />
          <LinkColumn title={footer.categoryColumnTitle} items={footer.categoryLinks} />
          <LinkColumn title={footer.supportColumnTitle} items={footer.supportLinks} />
          <LinkColumn title={footer.companyColumnTitle} items={footer.companyLinks} />
        </div>

        <div className="relative z-10 mt-8 h-px w-full bg-white/15 lg:mt-10" />

        {/* Barra inferior */}
        <div className="relative z-10 mt-5 flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center lg:gap-6">
          <p className="max-w-md text-xs leading-relaxed text-white/80">{footer.copyright}</p>

          {footer.bottomLinks.length > 0 ? (
            <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 lg:flex-1 lg:justify-center">
              {footer.bottomLinks.map((item, index) => (
                <Link
                  key={`${item.href}-${item.label}-${index}`}
                  href={item.href}
                  className="text-xs text-white/85 transition-colors hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          ) : null}

          {socials.length > 0 ? (
            <div className="flex items-center gap-2.5">
              {socials.map(({ href, icon: Icon, label }) => (
                <Link
                  key={label}
                  href={href!}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/15 transition-colors hover:bg-white/25"
                >
                  <Icon className="h-4 w-4" />
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
