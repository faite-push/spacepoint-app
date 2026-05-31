"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { fetchProducts } from "@/lib/shop-api";
import { Product } from "@/types/shop";
import { ProductCard } from "@/components/shop/product-card";
import { Loader2, Search } from "lucide-react";

function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getResults = async () => {
      if (!query) {
        setProducts([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const results = await fetchProducts({ search: query });
        setProducts(results);
      } catch (error) {
        console.error("Error fetching search results:", error);
      } finally {
        setIsLoading(false);
      }
    };

    getResults();
  }, [query]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-8 flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Search className="h-8 w-8 text-primary" />
          Resultados para "{query}"
        </h1>
        <p className="text-white/60">
          Encontramos {products.length} {products.length === 1 ? "produto" : "produtos"} para sua busca.
        </p>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-white/40 text-lg animate-pulse">Buscando os melhores jogos...</p>
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="bg-white/5 p-6 rounded-full mb-6">
                <Search className="h-12 w-12 text-white/20" />
            </div>
          <h2 className="text-2xl font-bold text-white mb-2">Poxa, não encontramos nada!</h2>
          <p className="text-white/50 max-w-md">
            Não encontramos nenhum resultado para sua pesquisa. Tente usar palavras-chave diferentes ou verifique a ortografia.
          </p>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <main className="min-h-screen bg-[#0F0A1E]">
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      }>
        <SearchResults />
      </Suspense>
    </main>
  );
}
