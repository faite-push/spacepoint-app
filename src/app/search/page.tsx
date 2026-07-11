"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, Search } from "lucide-react";
import { ProductListing } from "@/components/shop/product-listing";

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  if (!query.trim()) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="rounded-md border border-dashed border-white/10 bg-white/[0.02] py-24 text-center">
          <Search className="mx-auto mb-4 h-12 w-12 text-white/20" />
          <h1 className="text-2xl font-bold text-white">Buscar produtos</h1>
          <p className="mt-2 text-white/50">Digite um termo na barra de pesquisa para começar.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="left-1/2 -translate-x-1/2 min-w-[1540px] space-y-6 py-6 md:py-12 relative">
      <div className="mb-8 flex flex-col gap-2">
        <h1 className="flex items-center text-4xl font-bold text-muted-foreground gap-2">
          Resultado da busca para <span className="text-white">{query}</span>
        </h1>
      </div>

      <ProductListing
        searchQueryKey="q"
        emptyTitle="Poxa, não encontramos nada!"
        emptyDescription="Não encontramos nenhum resultado para sua pesquisa. Tente usar palavras-chave diferentes ou ajuste os filtros."
      />
    </div>
  );
};

export default function SearchPage() {
  return (
    <main className="left-1/2 -translate-x-1/2 min-w-[1540px] space-y-6 py-6 md:py-12 -mt-42 relative bg-transparent">
      <div className="absolute top-0 right-[-10%] w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-primary/20 rounded-full blur-[120px] -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-[-10%] w-[250px] sm:w-[400px] h-[250px] sm:h-[400px] bg-primary/20 rounded-full blur-[120px] -z-10 pointer-events-none" />

      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        }
      >
        <SearchResults />
      </Suspense>
    </main>
  );
};