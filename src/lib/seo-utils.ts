import type { Metadata } from "next";
import type { PublicInstitutionalPage, PublicPageSeo } from "@/lib/site-api";

export function applySeoTemplate(
  template: string | null | undefined,
  vars: Record<string, string>
): string | undefined {
  if (!template?.trim()) return undefined;
  let out = template;
  for (const [key, value] of Object.entries(vars)) {
    out = out.replace(new RegExp(`\\{${key}\\}`, "g"), value);
  }
  return out.trim() || undefined;
}

export function resolvePageMetadata(
  pageSeo: PublicPageSeo | null,
  vars: Record<string, string>,
  fallbacks?: { title?: string; description?: string }
) {
  const title =
    applySeoTemplate(pageSeo?.metaTitle, vars) ?? fallbacks?.title;
  const description =
    applySeoTemplate(pageSeo?.metaDescription, vars) ?? fallbacks?.description;

  return {
    title,
    description,
    ...(pageSeo?.ogImageUrl ? { openGraph: { images: [pageSeo.ogImageUrl] } } : {}),
  };
}

export function institutionalMetadata(
  page: PublicInstitutionalPage | null,
  fallback: { title: string; description?: string }
): Metadata {
  if (!page) return { title: fallback.title, description: fallback.description };
  return {
    title: page.metaTitle?.trim() || fallback.title,
    description: page.metaDescription?.trim() || fallback.description,
  };
}
