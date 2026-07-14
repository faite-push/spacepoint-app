"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Check, ChevronLeft, ChevronRight, Loader2, SlidersHorizontal, X } from "lucide-react";

import { ProductCard } from "@/components/shop/product-card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { fetchProductListing } from "@/lib/shop-api";
import { buildProductListQuery, parseSortOptionKey, readProductListParams, SORT_OPTIONS, sortOptionKey, type ProductListParams, } from "@/lib/product-list-params";
import type { Product } from "@/types/shop";
import { Toggle } from "../ui/toggle";

type ProductListingProps = {
  categorySlug?: string;
  searchQueryKey?: "q" | "search";
  showIncludeSubcategories?: boolean;
  title?: string;
  subtitle?: string;
  emptyTitle?: string;
  emptyDescription?: string;
};

export function ProductListing({ categorySlug, searchQueryKey = "search", showIncludeSubcategories = false, title, subtitle, emptyTitle = "Nenhum produto encontrado", emptyDescription = "Tente ajustar os filtros ou usar outros termos de busca.", }: ProductListingProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [platforms, setPlatforms] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const params = useMemo(
    () =>
      readProductListParams(searchParams, {
        category: categorySlug,
        search: searchQueryKey === "q" ? searchParams.get("q") || undefined : undefined,
      }),
    [searchParams, categorySlug, searchQueryKey]
  );

  const currentSortKey = sortOptionKey(params.sortBy || "relevance", params.sortOrder || "desc");

  const updateParams = useCallback(
    (patch: Partial<ProductListParams>, resetPage = true) => {
      const next: ProductListParams = {
        ...params,
        ...patch,
        category: categorySlug || params.category,
        ...(resetPage ? { page: "1" } : {}),
      };

      const queryParams = categorySlug ? { ...next, category: undefined } : next;
      const qs = buildProductListQuery(queryParams, { searchKey: searchQueryKey });
      const suffix = qs.toString() ? `?${qs.toString()}` : "";
      router.push(`${pathname}${suffix}`, { scroll: false });
    },
    [params, categorySlug, pathname, router, searchQueryKey]
  );

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      try {
        const result = await fetchProductListing({
          ...params,
          category: categorySlug || params.category,
          search:
            searchQueryKey === "q"
              ? searchParams.get("q") || undefined
              : params.search,
        });

        if (cancelled) return;
        setProducts(result.products);
        setTotal(result.pagination.total);
        setTotalPages(result.pagination.totalPages);
        setPlatforms(result.facets?.platforms ?? []);
      } catch (error) {
        if (!cancelled) {
          console.error("Erro ao carregar produtos:", error);
          setProducts([]);
          setTotal(0);
          setTotalPages(1);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [params, categorySlug, searchParams, searchQueryKey]);

  const currentPage = Number(params.page || "1");

  return (
    <div className="space-y-6">
      {(title || subtitle) && (
        <div className="space-y-1">
          {title && <h2 className="text-xl font-bold text-white md:text-2xl">{title}</h2>}
          {subtitle && <p className="text-sm text-white/60">{subtitle}</p>}
        </div>
      )}

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <Select
            value={params.platform || "all"}
            onValueChange={(value) =>
              updateParams({ platform: value === "all" ? undefined : value })
            }
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Plataforma" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as plataformas</SelectItem>
              {platforms.map((platform) => (
                <SelectItem key={platform} value={platform}>
                  {platform}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2 border border-white/10 rounded-md px-2 py-1.5 w-full sm:w-auto">
            <Toggle
              pressed={params.inStock === "true"}
              onPressedChange={(pressed) =>
                updateParams({ inStock: pressed ? "true" : undefined })
              }
              variant="default"
              size="sm"
              className="h-6.5 w-6.5 rounded-sm shrink-0"
              aria-label="Apenas em estoque"
            >
              {params.inStock === "true" ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />}
            </Toggle>
            <Label htmlFor="in-stock-filter" className="text-sm text-white/80 cursor-pointer">
              Apenas em estoque
            </Label>
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center lg:justify-end">
          <Select
            value={currentSortKey}
            onValueChange={(value) => {
              const parsed = parseSortOptionKey(value);
              updateParams({ sortBy: parsed.sortBy, sortOrder: parsed.sortOrder });
            }}
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((option) => (
                <SelectItem
                  key={sortOptionKey(option.value, option.sortOrder)}
                  value={sortOptionKey(option.value, option.sortOrder)}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {showIncludeSubcategories && (
            <div className="flex items-center gap-2 rounded-md border border-white/10 px-3 py-2 w-full sm:w-auto">
              <Checkbox
                id="include-subcategories"
                checked={params.includeSubcategories === "true"}
                onCheckedChange={(checked) =>
                  updateParams({
                    includeSubcategories: checked === true ? "true" : undefined,
                  })
                }
              />
              <Label htmlFor="include-subcategories" className="text-sm text-white/80 cursor-pointer">
                Incluir subcategorias
              </Label>
            </div>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : products.length > 0 ? (
        <>
          <div className="grid grid-cols-2 gap-2 md:gap-4 lg:grid-cols-4 xl:grid-cols-5">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-4">
              <Button
                variant="outline"
                size="sm"
                className="border-white/10"
                disabled={currentPage <= 1}
                onClick={() => updateParams({ page: String(currentPage - 1) }, false)}
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </Button>
              <span className="text-sm text-white/60">
                Página {currentPage} de {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="border-white/10"
                disabled={currentPage >= totalPages}
                onClick={() => updateParams({ page: String(currentPage + 1) }, false)}
              >
                Próxima
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="rounded-md border border-dashed border-white/10 bg-white/[0.02] py-20 text-center">
          <h3 className="text-lg font-semibold text-white">{emptyTitle}</h3>
          <p className="mt-2 text-sm text-white/50 max-w-md mx-auto">{emptyDescription}</p>
        </div>
      )}
    </div>
  );
};