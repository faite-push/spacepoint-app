import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { HelpCenterLayout } from "@/components/institutional/help-center-layout";
import { DocumentPageLayout } from "@/components/institutional/document-page-layout";
import { RichContent } from "@/components/shared/rich-content";
import { fetchInstitutionalPage } from "@/lib/site-api";
import { institutionalMetadata } from "@/lib/seo-utils";
import { INSTITUTIONAL_PUBLIC_PATH } from "@/lib/institutional-routes";
import { isDocumentLayoutData, isHelpLayoutData } from "@/lib/institutional-layout";

/** Slugs reservados por outras rotas do app — não tratar como página institucional. */
const RESERVED_SLUGS = new Set([
  "account",
  "api",
  "cart",
  "category",
  "checkout",
  "dashboard",
  "login",
  "maintenance",
  "product",
  "products",
  "search",
  "wishlist",
  "enterprise",
  "trust",
  "about",
  "privacy",
  "refunds",
  "_next",
  "cdn",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
]);

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (RESERVED_SLUGS.has(slug)) return { title: "Página não encontrada" };
  const page = await fetchInstitutionalPage(slug);
  return institutionalMetadata(page, {
    title: `${slug} | Space Point`,
    description: "Informações da loja.",
  });
}

export default async function InstitutionalSlugPage({ params }: Props) {
  const { slug } = await params;
  if (!slug || RESERVED_SLUGS.has(slug)) notFound();

  const canonical = INSTITUTIONAL_PUBLIC_PATH[slug];
  if (canonical && canonical !== `/${slug}`) {
    redirect(canonical);
  }

  const page = await fetchInstitutionalPage(slug);
  if (!page) notFound();

  if (page.layoutType === "help" && isHelpLayoutData(page.layoutData)) {
    return (
      <HelpCenterLayout
        title={page.title}
        layout={page.layoutData}
        content={page.content}
      />
    );
  }

  if (page.layoutType === "document" && isDocumentLayoutData(page.layoutData)) {
    return (
      <DocumentPageLayout
        title={page.title}
        layout={page.layoutData}
        content={page.content}
      />
    );
  }

  return (
    <article className="mx-auto max-w-3xl py-8">
      <h1 className="mb-8 text-3xl font-black tracking-tight text-white">{page.title}</h1>
      {page.content ? (
        <RichContent content={page.content} className="text-white/80" />
      ) : (
        <p className="text-sm italic text-white/50">Conteúdo em breve.</p>
      )}
    </article>
  );
}
