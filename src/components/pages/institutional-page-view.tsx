import { notFound } from "next/navigation";
import { fetchInstitutionalPage } from "@/lib/site-api";
import { RichContent } from "@/components/shared/rich-content";

export async function InstitutionalPageView({ slug }: { slug: string }) {
  const page = await fetchInstitutionalPage(slug);
  if (!page) notFound();

  return (
    <article className="relative max-w-7xl">
      <div className="absolute top-0 right-[-10%] w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-primary/20 rounded-full blur-[120px] -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-[-10%] w-[250px] sm:w-[400px] h-[250px] sm:h-[400px] bg-primary/20 rounded-full blur-[120px] -z-10 pointer-events-none" />

      <h1 className="flex items-center justify-center text-4xl font-black text-white mb-4">{page.title}</h1>
      {page.content ? (
        <RichContent content={page.content} className="text-justify text-white/80" />
      ) : (
        <p className="text-white/50 italic text-sm">Conteúdo em breve.</p>
      )}
    </article>
  );
}