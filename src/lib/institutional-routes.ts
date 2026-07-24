/** Slugs institucionais expostos em /enterprise/[slug] */
export const ENTERPRISE_PAGE_SLUGS = ["terms", "privacy", "cookies", "refunds"] as const;

export type EnterprisePageSlug = (typeof ENTERPRISE_PAGE_SLUGS)[number];

/** Slugs institucionais expostos em /trust/[slug] (1:1 com o banco) */
export const TRUST_PAGE_SLUGS = [
  "support",
  "fale-conosco",
  "como-comprar",
  "como-funciona",
  "envio-expresso",
] as const;

export type TrustPageSlug = (typeof TRUST_PAGE_SLUGS)[number];

/** URL pública por slug institucional (admin + links) */
export const INSTITUTIONAL_PUBLIC_PATH: Record<string, string> = {
  about: "/about",
  terms: "/enterprise/terms",
  privacy: "/enterprise/privacy",
  cookies: "/enterprise/cookies",
  refunds: "/enterprise/refunds",
  support: "/trust/support",
  "fale-conosco": "/trust/fale-conosco",
  "como-comprar": "/trust/como-comprar",
  "como-funciona": "/trust/como-funciona",
  "envio-expresso": "/trust/envio-expresso",
};

export const ENTERPRISE_FALLBACK_META: Record<
  EnterprisePageSlug,
  { title: string; description: string }
> = {
  terms: {
    title: "Termos e Condições | Space Point",
    description: "Termos de uso e condições de compra.",
  },
  privacy: {
    title: "Política de Privacidade | Space Point",
    description: "Como tratamos seus dados pessoais.",
  },
  cookies: {
    title: "Política de Cookies | Space Point",
    description: "Como utilizamos cookies neste site.",
  },
  refunds: {
    title: "Trocas e Devoluções | Space Point",
    description: "Política de trocas e reembolsos.",
  },
};

export const TRUST_FALLBACK_META: Record<
  TrustPageSlug,
  { title: string; description: string }
> = {
  support: {
    title: "Central de Ajuda | Space Point",
    description: "Como comprar, receber e obter suporte.",
  },
  "fale-conosco": {
    title: "Fale Conosco | Space Point",
    description: "Entre em contato com a equipe Space Point.",
  },
  "como-comprar": {
    title: "Como comprar | Space Point",
    description: "Passo a passo para comprar na loja.",
  },
  "como-funciona": {
    title: "Como funciona | Space Point",
    description: "Entenda como funciona a entrega digital.",
  },
  "envio-expresso": {
    title: "Envio Expresso | Space Point",
    description: "Entrega digital rápida após a confirmação do pagamento.",
  },
};

export function isEnterprisePageSlug(slug: string): slug is EnterprisePageSlug {
  return (ENTERPRISE_PAGE_SLUGS as readonly string[]).includes(slug);
}

export function isTrustPageSlug(slug: string): slug is TrustPageSlug {
  return (TRUST_PAGE_SLUGS as readonly string[]).includes(slug);
}

/** @deprecated use isTrustPageSlug — mantido para compatibilidade */
export function resolveTrustPageSlug(routeSlug: string): string | null {
  return isTrustPageSlug(routeSlug) ? routeSlug : null;
}
