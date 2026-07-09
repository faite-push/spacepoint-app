import type { FooterLink, PublicSiteConfig } from "@/lib/site-api";

export const FOOTER_DEFAULTS = {
  aboutTitle: "Sobre a loja",
  aboutText:
    "A Space Point BR LTDA é uma empresa brasileira especializada na venda de jogos digitais para consoles PlayStation, oferecendo uma experiência prática, segura e acessível para gamers de todo o país.",
  copyrightBase: "SPACE POINT BR LTDA – CNPJ: 52.527.026/0001-95",
  newsletterPlaceholder: "Seu e-mail",
  newsletterButtonLabel: "Inscrever",
  newsletterEnabled: true,
  logoUrl: "/logo.png",
  logoHref: "/",
  logoAlt: "Space Point",
  backgroundColor: "#A855F7",
  buttonTextColor: "#A855F7",
  showNoise: true,
  paddingTopHome: 192,
  paddingTopDefault: 48,
  categoryColumnTitle: "Categorias",
  supportColumnTitle: "Suporte",
  categoryLinks: [ ] as FooterLink[],
  supportLinks: [
    { label: "Fale Conosco", href: "/support" },
    { label: "Como comprar", href: "/support", external: true },
    { label: "Como funciona", href: "/support", external: true },
  ] as FooterLink[],
  legalLinks: [
    { label: "Quem somos", href: "/about" },
    { label: "Política de Privacidade", href: "/privacy" },
    { label: "Política de Trocas e Devoluções", href: "/refunds" },
  ] as FooterLink[],
  trustSeals: [
    {
      id: "reclame-aqui",
      title: "Reclame Aqui",
      subtitle: "Empresa verificada",
      href: "https://www.reclameaqui.com.br/",
    },
    {
      id: "ssl",
      title: "Site Seguro",
      subtitle: "Conexão SSL criptografada",
    },
    {
      id: "pagamento",
      title: "Pagamento Seguro",
      subtitle: "Dados protegidos",
    },
    {
      id: "digital",
      title: "Entrega Digital",
      subtitle: "Rápida e automática",
    },
  ],
};

export type FooterTrustSeal = {
  id: string;
  title: string;
  subtitle?: string;
  href?: string;
};

export type ResolvedFooterConfig = {
  aboutTitle: string;
  aboutText: string;
  newsletterEnabled: boolean;
  newsletterPlaceholder: string;
  newsletterButtonLabel: string;
  logoUrl: string;
  logoHref: string;
  logoAlt: string;
  backgroundColor: string;
  buttonTextColor: string;
  showNoise: boolean;
  paddingTopHome: number;
  paddingTopDefault: number;
  categoryColumnTitle: string;
  supportColumnTitle: string;
  categoryLinks: FooterLink[];
  supportLinks: FooterLink[];
  legalLinks: FooterLink[];
  copyright: string;
  socialFacebook: string | null;
  socialInstagram: string | null;
  socialTwitter: string | null;
  socialLinkedin: string | null;
  socialYoutube: string | null;
  socialLinks: { platform: string; url: string }[];
  trustSeals: FooterTrustSeal[];
};

function parseLinks(raw: FooterLink[] | null | undefined, fallback: FooterLink[]): FooterLink[] {
  return Array.isArray(raw) && raw.length > 0 ? raw : fallback;
}

export function resolveFooterConfig(
  config?: PublicSiteConfig | null,
  footerCategoryLinks?: FooterLink[]
): ResolvedFooterConfig {
  const year = new Date().getFullYear();
  const copyrightRaw = config?.footerCopyright?.trim();
  const copyright = copyrightRaw
    ? copyrightRaw.includes("{year}")
      ? copyrightRaw.replace(/\{year\}/g, String(year))
      : copyrightRaw
    : `${FOOTER_DEFAULTS.copyrightBase} © Todos os direitos reservados, ${year}.`;

  return {
    aboutTitle: config?.footerAboutTitle?.trim() || FOOTER_DEFAULTS.aboutTitle,
    aboutText: config?.footerAboutText?.trim() || FOOTER_DEFAULTS.aboutText,
    newsletterEnabled: config?.footerNewsletterEnabled ?? FOOTER_DEFAULTS.newsletterEnabled,
    newsletterPlaceholder:
      config?.footerNewsletterPlaceholder?.trim() || FOOTER_DEFAULTS.newsletterPlaceholder,
    newsletterButtonLabel:
      config?.footerNewsletterButtonLabel?.trim() || FOOTER_DEFAULTS.newsletterButtonLabel,
    logoUrl:
      config?.footerLogoUrl?.trim() ||
      config?.logoUrl?.trim() ||
      FOOTER_DEFAULTS.logoUrl,
    logoHref: config?.footerLogoHref?.trim() || FOOTER_DEFAULTS.logoHref,
    logoAlt:
      config?.footerLogoAlt?.trim() ||
      config?.storeName?.trim() ||
      FOOTER_DEFAULTS.logoAlt,
    backgroundColor:
      config?.footerBackgroundColor?.trim() ||
      config?.primaryColor?.trim() ||
      FOOTER_DEFAULTS.backgroundColor,
    buttonTextColor:
      config?.footerButtonTextColor?.trim() ||
      config?.footerBackgroundColor?.trim() ||
      config?.primaryColor?.trim() ||
      FOOTER_DEFAULTS.buttonTextColor,
    showNoise: config?.footerShowNoise ?? FOOTER_DEFAULTS.showNoise,
    paddingTopHome: config?.footerPaddingTopHome ?? FOOTER_DEFAULTS.paddingTopHome,
    paddingTopDefault: config?.footerPaddingTopDefault ?? FOOTER_DEFAULTS.paddingTopDefault,
    categoryColumnTitle:
      config?.footerCategoryColumnTitle?.trim() || FOOTER_DEFAULTS.categoryColumnTitle,
    supportColumnTitle:
      config?.footerSupportColumnTitle?.trim() || FOOTER_DEFAULTS.supportColumnTitle,
    categoryLinks: parseLinks(
      footerCategoryLinks?.length ? footerCategoryLinks : config?.footerCategoryLinks,
      FOOTER_DEFAULTS.categoryLinks
    ),
    supportLinks: parseLinks(config?.footerSupportLinks, FOOTER_DEFAULTS.supportLinks),
    legalLinks: parseLinks(config?.footerLegalLinks, FOOTER_DEFAULTS.legalLinks),
    copyright,
    socialFacebook: config?.socialFacebook?.trim() || null,
    socialInstagram: config?.socialInstagram?.trim() || null,
    socialTwitter: config?.socialTwitter?.trim() || null,
    socialLinkedin: config?.socialLinkedin?.trim() || null,
    socialYoutube: config?.socialYoutube?.trim() || null,
    socialLinks: config?.socialLinks?.length
      ? config.socialLinks
      : ([
          { platform: "FaFacebook", url: config?.socialFacebook },
          { platform: "FaInstagram", url: config?.socialInstagram },
          { platform: "FaTwitter", url: config?.socialTwitter },
          { platform: "FaLinkedin", url: config?.socialLinkedin },
          { platform: "FaYoutube", url: config?.socialYoutube },
        ].filter((l) => l.url?.trim()) as { platform: string; url: string }[]),
    trustSeals: FOOTER_DEFAULTS.trustSeals,
  };
}
