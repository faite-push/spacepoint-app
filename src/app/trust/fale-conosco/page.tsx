import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HelpCenterLayout } from "@/components/institutional/help-center-layout";
import { fetchInstitutionalPage } from "@/lib/site-api";
import { institutionalMetadata } from "@/lib/seo-utils";
import { TRUST_FALLBACK_META } from "@/lib/institutional-routes";
import { isHelpLayoutData } from "@/lib/institutional-layout";

const SLUG = "fale-conosco" as const;

export async function generateMetadata(): Promise<Metadata> {
  const page = await fetchInstitutionalPage(SLUG);
  return institutionalMetadata(page, TRUST_FALLBACK_META[SLUG]);
}

export default async function TrustFaleConoscoPage() {
  const page = await fetchInstitutionalPage(SLUG);
  if (!page || !isHelpLayoutData(page.layoutData)) notFound();

  return (
    <HelpCenterLayout
      title={page.title}
      layout={page.layoutData}
      content={page.content}
    />
  );
}
