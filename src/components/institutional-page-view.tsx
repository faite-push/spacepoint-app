import { notFound } from "next/navigation";
import { fetchInstitutionalPage } from "@/lib/site-api";
import { RichContent } from "@/components/shared/rich-content";

export async function InstitutionalPageView({ slug }: { slug: string }) {
  const page = await fetchInstitutionalPage(slug);
  if (!page) notFound();

  return (
    <article className="mx-auto max-w-3xl py-8">
      <h1 className="text-3xl font-black text-white tracking-tight mb-8">{page.title}</h1>
      {page.content ? (
        <RichContent content={page.content} className="text-white/80" />
      ) : (
        <p className="text-white/50 italic text-sm">Conteúdo em breve.</p>
      )}
    </article>
  );
}
