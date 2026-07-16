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
      <div className="rounded-md border border-dashed border-white/10 bg-white/[0.02] px-4 py-16 text-center sm:py-24">
        <Search className="mx-auto mb-4 h-10 w-10 text-white/20 sm:h-12 sm:w-12" />
        <h1 className="text-xl font-bold text-white sm:text-2xl">Buscar produtos</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-white/50 sm:text-base">
          Digite um termo na barra de pesquisa para começar.
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full min-w-0 space-y-2 sm:space-y-6 -mt-16 sm:-mt-8 md:-mt-0">
      <div className="mb-4 flex min-w-0 flex-col gap-1 sm:mb-8 sm:gap-2">
        <h1 className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1 text-2xl font-bold text-muted-foreground sm:text-2xl md:text-4xl">
          <span className="shrink-0">Resultado da busca para</span>
          <span className="break-words text-white"> {query}</span>
        </h1>
      </div>

      <ProductListing
        searchQueryKey="q"
        emptyTitle="Poxa, não encontramos nada!"
        emptyDescription="Não encontramos nenhum resultado para sua pesquisa. Tente usar palavras-chave diferentes ou ajuste os filtros."
      />
    </div>
  );
}

export default function SearchPage() {
  return (
    <div className="relative w-full min-w-0 space-y-6 bg-transparent py-6 md:py-12 -mt-16 sm:-mt-24 md:-mt-32">
      <div className="pointer-events-none absolute top-0 right-[-10%] -z-10 h-[220px] w-[220px] rounded-full bg-primary/20 blur-[100px] sm:h-[400px] sm:w-[400px] sm:blur-[120px]" />
      <div className="pointer-events-none absolute bottom-0 left-[-10%] -z-10 h-[180px] w-[180px] rounded-full bg-primary/20 blur-[100px] sm:h-[350px] sm:w-[350px] sm:blur-[120px]" />

      <Suspense
        fallback={
          <div className="relative flex min-h-[40vh] items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary sm:h-12 sm:w-12" />
          </div>
        }
      >
        <SearchResults />
      </Suspense>
    </div>
  );
}
