import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DocumentPageLayout } from "@/components/institutional/document-page-layout";
import { fetchInstitutionalPage } from "@/lib/site-api";
import { institutionalMetadata } from "@/lib/seo-utils";
import { ENTERPRISE_FALLBACK_META } from "@/lib/institutional-routes";
import { isDocumentLayoutData } from "@/lib/institutional-layout";

export async function generateMetadata(): Promise<Metadata> {
  const page = await fetchInstitutionalPage("privacy");
  return institutionalMetadata(page, ENTERPRISE_FALLBACK_META.privacy);
}

export default async function PrivacyPage() {
  const page = await fetchInstitutionalPage("privacy");
  if (!page || !isDocumentLayoutData(page.layoutData)) notFound();

  return (
    <DocumentPageLayout
      title={page.title}
      layout={page.layoutData}
      content={page.content}
    />
  );
}
