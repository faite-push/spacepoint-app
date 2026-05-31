import type { Metadata } from "next";
import { InstitutionalPageView } from "@/components/institutional-page-view";
import { fetchInstitutionalPage } from "@/lib/site-api";
import { institutionalMetadata } from "@/lib/seo-utils";

export async function generateMetadata(): Promise<Metadata> {
  const page = await fetchInstitutionalPage("about");
  return institutionalMetadata(page, {
    title: "Quem somos | Space Point",
    description: "Conheça a Space Point.",
  });
}

export default function AboutPage() {
  return <InstitutionalPageView slug="about" />;
}
