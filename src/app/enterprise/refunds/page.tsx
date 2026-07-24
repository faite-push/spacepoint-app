import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DocumentPageLayout } from "@/components/institutional/document-page-layout";
import { fetchInstitutionalPage } from "@/lib/site-api";
import { institutionalMetadata } from "@/lib/seo-utils";
import { ENTERPRISE_FALLBACK_META } from "@/lib/institutional-routes";
import { isDocumentLayoutData } from "@/lib/institutional-layout";

const SLUG = "refunds" as const;

export async function generateMetadata(): Promise<Metadata> {
  const page = await fetchInstitutionalPage(SLUG);
  return institutionalMetadata(page, ENTERPRISE_FALLBACK_META[SLUG]);
}

export default async function EnterpriseRefundsPage() {
  const page = await fetchInstitutionalPage(SLUG);
  if (!page || !isDocumentLayoutData(page.layoutData)) notFound();

  return (
    <DocumentPageLayout
      title={page.title}
      layout={page.layoutData}
      content={page.content}
    />
  );
}
