"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { RiSearch2Fill } from "react-icons/ri";
import { X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useDebounce } from "@/hooks/use-debounce";
import { fetchProductListing, formatPrice } from "@/lib/shop-api";
import { Product } from "@/types/shop";
import Link from "next/link";

interface SearchInputProps {
  mobile?: boolean;
}

export function SearchInput({ mobile }: SearchInputProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchResults = async () => {
      if (debouncedQuery.length < 2) {
        setResults([]);
        setTotalResults(0);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const data = await fetchProductListing({ search: debouncedQuery, limit: "5" });
        setResults(data.products);
        setTotalResults(data.pagination.total);
        setIsOpen(true);
      } catch (error) {
        console.error("Error fetching search results:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResults();
  }, [debouncedQuery]);

  useEffect(() => {
    if (mobile) return;

    const handleKey = (e: KeyboardEvent) => {
      if ((e.key === "p" || e.key === "P") && !isFocused) {
        const target = e.target as HTMLElement | null;
        const isEditable =
          target &&
          (target.tagName === "INPUT" ||
            target.tagName === "TEXTAREA" ||
            target.isContentEditable);
        if (isEditable) return;
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        e.preventDefault();
        inputRef.current?.focus();
      }

      if (e.key === "Escape" && isFocused) {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [mobile, isFocused]);

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setTotalResults(0);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const handleSearchAll = () => {
    const term = query.trim();
    if (term.length < 2) return;
    setIsOpen(false);
    router.push(`/search?q=${encodeURIComponent(term)}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearchAll();
    }
  };

  const handleSelectProduct = (slug: string) => {
    setIsOpen(false);
    setQuery("");
    router.push(`/product/${slug}`);
  };

  if (mobile) {
    return (
      <div className="relative w-full" ref={containerRef}>
        <div className="relative">
          <RiSearch2Fill className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/70" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onFocus={() => {
              setIsFocused(true);
              if (query.length >= 2) setIsOpen(true);
            }}
            onBlur={() => setIsFocused(false)}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Pesquisar jogo..."
            className="h-12 w-full border rounded-full bg-white/20 border-black/5 focus:bg-black/3 pl-12 pr-12 text-base text-white placeholder:font-medium placeholder:text-white/50 focus:outline-none focus:ring-0 focus:shadow-md focus:border-black/10 transition-all duration-300"
          />
          {isLoading ? (
            <Loader2 className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-white/50" />
          ) : query ? (
            <button
              onClick={handleClear}
              className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/50 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>

        {isOpen && (debouncedQuery.length >= 2) && (
          <div className="absolute left-0 right-0 top-full z-[60] mt-2 overflow-hidden rounded-2xl rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in fade-in slide-in-from-top-2 duration-200">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : results.length > 0 ? (
              <div className="py-2">
                {results.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => handleSelectProduct(product.slug)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/5"
                  >
                    <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-white/10">
                      <Image
                        src={product.imageUrl || product.images[0] || "/placeholder.png"}
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex flex-1 flex-col overflow-hidden">
                      <span className="truncate text-sm font-medium text-white">{product.name}</span>
                      <span className="text-xs text-white/50">{product.platform}</span>
                    </div>
                    <div className="text-sm font-bold text-primary">
                      {formatPrice(product.price)}
                    </div>
                  </button>
                ))}
                {totalResults > results.length && (
                  <button
                    onClick={handleSearchAll}
                    className="w-full border-t border-white/10 px-4 py-3 text-left text-sm font-semibold text-primary hover:bg-white/5"
                  >
                    Ver todos os {totalResults} resultados
                  </button>
                )}
              </div>
            ) : (
              <div className="p-8 text-center text-white/50">
                Nenhum resultado encontrado para "{debouncedQuery}"
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative mx-auto max-w-2xl w-full" ref={containerRef}>
      <RiSearch2Fill className={`absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 transition-all duration-300 ${isFocused ? 'text-white' : 'text-white/70'}`} />
      <input
        ref={inputRef}
        type="text"
        value={query}
        onFocus={() => {
          setIsFocused(true);
          if (query.length >= 2) setIsOpen(true);
        }}
        onBlur={() => setIsFocused(false)}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onKeyDown={handleKeyDown}
        placeholder="Pesquisar jogo..."
        className={`h-11 w-full rounded-full bg-white/10 border text-base text-white placeholder:font-medium placeholder:text-white/50 focus:outline-none focus:ring-0 transition-all duration-300 pl-12 pr-28 ${
          isFocused ? 'focus:border-background/10 focus:bg-white/15' : 'border-black/5 hover:border-black/10'
        }`}
      />

      <div className="absolute select-none right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
        {isLoading && <Loader2 className="h-4 w-4 animate-spin text-white/50" />}
        {query && (
          <button
            onClick={handleClear}
            className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-white/10 text-white/50 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <kbd
          aria-label={isFocused ? (query ? "Pressione Enter para buscar" : "Pressione ESC para fechar") : "Atalho de teclado: P"}
          className={`pointer-events-none flex h-7 items-center justify-center rounded-full px-3 font-semibold transition-all duration-300 min-w-[70px] text-sm ${
            isFocused 
              ? 'bg-white/10 text-white/90' 
              : 'bg-white/10 text-white/90'
          }`}
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={isFocused ? (query ? "enter" : "esc") : "p"}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              className="flex items-center"
            >
              {isFocused ? (query ? <span className="flex items-center gap-1.5 font-bold">esc</span> : "esc") : "P"}
            </motion.span>
          </AnimatePresence>
        </kbd>
      </div>

      {isOpen && (debouncedQuery.length >= 2) && (
        <div className="absolute left-0 right-0 top-full z-[60] mt-2 px-2 overflow-hidden rounded-xl bg-black/40 backdrop-blur-xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in fade-in slide-in-from-top-2 duration-200">
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : results.length > 0 ? (
            <div className="py-2">
              {results.map((product) => (
                <Link
                  key={product.id}
                  href={`/product/${product.slug}`}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-4 px-3 py-2 rounded-lg text-left transition-all hover:bg-white/5 group"
                >
                  <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-sm bg-white/5">
                    <Image
                      src={product.imageUrl || product.images[0] || "/placeholder.png"}
                      alt={product.name}
                      fill
                      className="object-cover transition-transform scale-110 duration-500 select-none pointer-events-none"
                    />
                  </div>
                  <div className="flex flex-1 flex-col overflow-hidden">
                    <span className="truncate text-sm font-medium text-white/80 group-hover:text-white transition-colors">
                      {product.name}
                    </span>
                    <span className="text-xs text-white/40">Mídia {product.platform}</span>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <div className="text-sm font-semibold text-white">
                      {formatPrice(product.price)}
                    </div>
                    {product.stockQuantity !== undefined && product.stockQuantity > 0 ? (
                      <div className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 font-bold uppercase">Em estoque</div>
                    ) : (
                      <div className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-500 font-bold uppercase">Esgotado</div>
                    )}
                  </div>
                </Link>
              ))}
              {totalResults > results.length && (
                <button
                  onClick={handleSearchAll}
                  className="w-full border-t border-white/10 px-4 py-3 text-left text-sm font-semibold text-primary hover:bg-white/5"
                >
                  Ver todos os {totalResults} resultados
                </button>
              )}
            </div>
          ) : (
            <div className="p-12 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center">
                <RiSearch2Fill className="h-6 w-6 text-white/20" />
              </div>
              <p className="text-sm text-white/50">Nenhum resultado encontrado para</p>
              <p className="text-sm font-bold text-white mt-1 italic">"{debouncedQuery}"</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};