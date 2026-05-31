import type { Metadata } from "next";
import { InstitutionalPageView } from "@/components/institutional-page-view";
import { fetchInstitutionalPage } from "@/lib/site-api";
import { institutionalMetadata } from "@/lib/seo-utils";

export async function generateMetadata(): Promise<Metadata> {
  const page = await fetchInstitutionalPage("refunds");
  return institutionalMetadata(page, {
    title: "Política de Trocas e Devoluções | Space Point",
  });
}

export default function RefundsPage() {
  return <InstitutionalPageView slug="refunds" />;
}
