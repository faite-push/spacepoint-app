import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DocumentPageLayout } from "@/components/institutional/document-page-layout";
import { fetchInstitutionalPage } from "@/lib/site-api";
import { institutionalMetadata } from "@/lib/seo-utils";
import { isDocumentLayoutData } from "@/lib/institutional-layout";

export async function generateMetadata(): Promise<Metadata> {
  const page = await fetchInstitutionalPage("about");
  return institutionalMetadata(page, {
    title: "Quem somos | Space Point",
    description: "Conheça a Space Point.",
  });
}

export default async function AboutPage() {
  const page = await fetchInstitutionalPage("about");
  if (!page || !isDocumentLayoutData(page.layoutData)) notFound();

  return (
    <DocumentPageLayout
      title={page.title}
      layout={page.layoutData}
      content={page.content}
    />
  );
}
