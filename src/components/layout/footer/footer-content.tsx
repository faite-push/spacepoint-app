"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { FaFacebookF, FaInstagram, FaTwitter, FaLinkedinIn } from "react-icons/fa";
import Noise from "@/components/ui/noise";
import type { ResolvedFooterConfig } from "@/lib/footer-config";

function LinkColumn({ title, items }: { title: string; items: ResolvedFooterConfig["categoryLinks"] }) {
  if (!items.length) return null;
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold">{title}</h4>
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={`${item.href}-${item.label}`}>
            <Link
              href={item.href}
              className="group inline-flex items-center gap-2 text-sm text-white/90 transition-colors hover:text-white"
            >
              <span>{item.label}</span>
              {item.badge && (
                <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-medium ring-1 ring-white/30">
                  {item.badge}
                </span>
              )}
              {item.external && (
                <ArrowUpRight className="h-3.5 w-3.5 opacity-70 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export function FooterContent({ footer, isHome = false, compact = false, onNewsletterSubmit, }: { footer: ResolvedFooterConfig; isHome?: boolean; compact?: boolean; onNewsletterSubmit?: (email: string) => void; }) {
  const paddingTop = isHome ? footer.paddingTopHome : footer.paddingTopDefault;
  const socials = [
    { href: footer.socialFacebook, icon: FaFacebookF, label: "Facebook" },
    { href: footer.socialInstagram, icon: FaInstagram, label: "Instagram" },
    { href: footer.socialTwitter, icon: FaTwitter, label: "Twitter" },
    { href: footer.socialLinkedin, icon: FaLinkedinIn, label: "LinkedIn" },
  ].filter((s) => s.href);

  return (
    <div
      className={`relative overflow-hidden text-white ${compact ? "rounded-xl" : "rounded-t-4xl"}`}
      style={{ backgroundColor: footer.backgroundColor }}
    >
      <div
        className={`mx-auto max-w-7xl px-4 pb-8 md:px-10 ${compact ? "pt-6" : ""}`}
        style={compact ? undefined : { paddingTop }}
      >
        {footer.showNoise && (
          <div className="absolute inset-0 z-0 mix-blend-overlay pointer-events-none">
            <Noise
              patternSize={100}
              patternScaleX={0.9}
              patternScaleY={0.9}
              patternRefreshInterval={2}
              patternAlpha={20}
            />
          </div>
        )}

        <div className="relative z-10 grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:gap-10">
          <div className="space-y-2 max-w-xl">
            <h3 className="text-base font-semibold">{footer.aboutTitle}</h3>
            <p className="text-sm leading-relaxed text-white/90">{footer.aboutText}</p>
          </div>

          {footer.newsletterEnabled && (
            <div className="lg:justify-self-end w-full lg:max-w-md">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  onNewsletterSubmit?.(String(fd.get("email") ?? ""));
                }}
                className="flex items-center gap-2 rounded-full bg-white/10 p-1.5 ring-1 ring-white/20"
              >
                <input
                  name="email"
                  type="email"
                  placeholder={footer.newsletterPlaceholder}
                  className="flex-1 bg-transparent px-4 py-2 text-sm text-white placeholder:text-white/60 focus:outline-none min-w-0"
                  required
                />
                <button
                  type="submit"
                  className="shrink-0 rounded-full bg-white/95 px-4 py-2 text-sm font-semibold transition-colors hover:bg-white sm:px-5"
                  style={{ color: footer.buttonTextColor }}
                >
                  {footer.newsletterButtonLabel}
                </button>
              </form>
            </div>
          )}
        </div>

        <div className="relative z-10 mt-8 grid gap-8 sm:grid-cols-2 lg:mt-12 lg:grid-cols-[1fr_1fr_1fr_1fr] lg:gap-10">
          <div className="flex items-start">
            <Link href={footer.logoHref} className="block">
              <Image
                src={footer.logoUrl}
                alt={footer.logoAlt}
                width={180}
                height={70}
                className="h-auto w-auto max-h-16 object-contain sm:max-h-20 pointer-events-none select-none"
                unoptimized={footer.logoUrl.startsWith("http")}
              />
            </Link>
          </div>

          <LinkColumn title={footer.categoryColumnTitle} items={footer.categoryLinks} />
          <LinkColumn title={footer.supportColumnTitle} items={footer.supportLinks} />
          <div className="hidden lg:block" />
        </div>

        <div className="relative z-10 mt-8 h-px w-full bg-white/15 lg:mt-12" />

        <div className="relative z-10 mt-4 flex flex-col items-start justify-between gap-4 lg:mt-6 lg:flex-row lg:items-center lg:gap-6">
          <p className="text-xs text-white/80 leading-relaxed">{footer.copyright}</p>

          {footer.legalLinks.length > 0 && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 lg:gap-x-6">
              {footer.legalLinks.map((item) => (
                <Link
                  key={`${item.href}-${item.label}`}
                  href={item.href}
                  className="text-xs text-white/85 transition-colors hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          )}

          {socials.length > 0 && (
            <div className="flex items-center gap-3">
              {socials.map(({ href, icon: Icon, label }) => (
                <Link
                  key={label}
                  href={href!}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20"
                >
                  <Icon className="h-4 w-4" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
