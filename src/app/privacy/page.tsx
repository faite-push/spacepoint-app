import type { Metadata } from "next";
import { InstitutionalPageView } from "@/components/institutional-page-view";
import { fetchInstitutionalPage } from "@/lib/site-api";
import { institutionalMetadata } from "@/lib/seo-utils";

export async function generateMetadata(): Promise<Metadata> {
  const page = await fetchInstitutionalPage("privacy");
  return institutionalMetadata(page, {
    title: "Política de Privacidade | Space Point",
  });
}

export default function PrivacyPage() {
  return <InstitutionalPageView slug="privacy" />;
}
