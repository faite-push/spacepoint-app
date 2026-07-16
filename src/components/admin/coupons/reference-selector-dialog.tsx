"use client";

import { useState, useMemo, useEffect } from "react";
import { Search, Check, ChevronDown, ChevronUp, Trash2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import {
  categoriesApi,
  productsApi,
  type Category,
  type AdminProduct,
} from "@/lib/admin-api";
import { cn, decodeHtmlEntities } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export interface Reference {
  type: "PRODUCT" | "CATEGORY" | "VARIANT";
  referenceId: string;
  label: string;
}

interface ReferenceSelectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialReferences: Reference[];
  onConfirm: (references: Reference[]) => void;
}

function buildDescendantMap(categories: Category[]) {
  const childrenByParent = new Map<string, string[]>();
  for (const cat of categories) {
    if (!cat.parentId) continue;
    const list = childrenByParent.get(cat.parentId) || [];
    list.push(cat.id);
    childrenByParent.set(cat.parentId, list);
  }

  const cache = new Map<string, Set<string>>();

  function collect(id: string): Set<string> {
    const hit = cache.get(id);
    if (hit) return hit;

    const ids = new Set<string>([id]);
    const children = childrenByParent.get(id) || [];
    for (const childId of children) {
      for (const nested of collect(childId)) ids.add(nested);
    }
    cache.set(id, ids);
    return ids;
  }

  for (const cat of categories) collect(cat.id);
  return cache;
}

function deliveryLabel(type: string | null | undefined) {
  switch (type) {
    case "automatic_lines":
      return "linhas";
    case "file":
      return "arquivo";
    case "manual":
      return "manual";
    case "manual_chat":
      return "manual chat";
    case "automatic_text":
      return "texto";
    default:
      return "misto";
  }
}

export function ReferenceSelectorDialog({
  open,
  onOpenChange,
  initialReferences,
  onConfirm,
}: ReferenceSelectorDialogProps) {
  const [search, setSearch] = useState("");
  const [selectedRefs, setSelectedRefs] = useState<Reference[]>(initialReferences);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (open) {
      setSelectedRefs(initialReferences);
      setSearch("");
    }
  }, [open, initialReferences]);

  const { data: catData, isLoading: loadingCats } = useQuery({
    queryKey: ["admin", "categories", "flat"],
    queryFn: () => categoriesApi.listFlat(),
    enabled: open,
  });

  const { data: prodData, isLoading: loadingProducts } = useQuery({
    queryKey: ["admin", "products", "all-for-references"],
    queryFn: () => productsApi.listAll(),
    enabled: open,
    staleTime: 60_000,
  });

  const categories = catData?.categories || [];
  const products = prodData?.products || [];
  const loading = loadingCats || loadingProducts;

  const descendantMap = useMemo(() => buildDescendantMap(categories), [categories]);

  const productsByCategory = useMemo(() => {
    const map = new Map<string, AdminProduct[]>();
    for (const product of products) {
      const key = product.categoryId || "__uncategorized__";
      const list = map.get(key) || [];
      list.push(product);
      map.set(key, list);
    }
    return map;
  }, [products]);

  const getCategoryProducts = (categoryId: string) => {
    const ids = descendantMap.get(categoryId) || new Set([categoryId]);
    const list: AdminProduct[] = [];
    for (const id of ids) {
      const items = productsByCategory.get(id);
      if (items?.length) list.push(...items);
    }
    return list;
  };

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const isSelected = (type: string, id: string) => {
    return selectedRefs.some((r) => r.type === type && r.referenceId === id);
  };

  const toggleSelection = (
    type: "PRODUCT" | "CATEGORY" | "VARIANT",
    id: string,
    label: string
  ) => {
    if (isSelected(type, id)) {
      setSelectedRefs((prev) =>
        prev.filter((r) => !(r.type === type && r.referenceId === id))
      );
      return;
    }

    setSelectedRefs((prev) => {
      let next = [...prev, { type, referenceId: id, label }];

      if (type === "PRODUCT") {
        const product = products.find((p) => p.id === id);
        if (product?.categoryId) {
          const relatedCategoryIds = new Set<string>([product.categoryId]);
          for (const [parentId, descendants] of descendantMap) {
            if (descendants.has(product.categoryId)) relatedCategoryIds.add(parentId);
          }
          next = next.filter(
            (r) => !(r.type === "CATEGORY" && relatedCategoryIds.has(r.referenceId))
          );
        }
      }

      if (type === "CATEGORY") {
        const relatedProductIds = new Set(
          getCategoryProducts(id).map((p) => p.id)
        );
        next = next.filter(
          (r) => !(r.type === "PRODUCT" && relatedProductIds.has(r.referenceId))
        );
      }

      return next;
    });
  };

  const counts = useMemo(() => {
    return {
      categories: selectedRefs.filter((r) => r.type === "CATEGORY").length,
      products: selectedRefs.filter((r) => r.type === "PRODUCT").length,
      variants: selectedRefs.filter((r) => r.type === "VARIANT").length,
    };
  }, [selectedRefs]);

  const clearType = (type: "PRODUCT" | "CATEGORY" | "VARIANT") => {
    setSelectedRefs((prev) => prev.filter((r) => r.type !== type));
  };

  const searchLower = search.trim().toLowerCase();

  const visibleCategories = useMemo(() => {
    if (!searchLower) return categories;

    return categories.filter((category) => {
      if (category.name.toLowerCase().includes(searchLower)) return true;
      return getCategoryProducts(category.id).some((p) =>
        decodeHtmlEntities(p.name).toLowerCase().includes(searchLower)
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- getCategoryProducts depends on maps already in deps via categories/products
  }, [categories, searchLower, productsByCategory, descendantMap]);

  useEffect(() => {
    if (!searchLower) return;
    setExpandedItems((prev) => {
      const next = { ...prev };
      for (const category of visibleCategories) {
        const hasMatchingProduct = getCategoryProducts(category.id).some((p) =>
          decodeHtmlEntities(p.name).toLowerCase().includes(searchLower)
        );
        if (hasMatchingProduct) next[category.id] = true;
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchLower, visibleCategories]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Selecionar referências</DialogTitle>
          <DialogDescription>
            Selecione as referências que deseja associar.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2">
          <div
            className={cn(
              "flex items-center select-none gap-2 px-3 py-1 rounded-sm border border-white/5 text-sm transition-colors",
              counts.categories > 0 ? "bg-card text-card-foreground" : "text-zinc-500"
            )}
          >
            <span>Categorias</span>
            <span className="font-bold">{counts.categories}</span>
            {counts.categories > 0 && (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      className="text-zinc-500 hover:text-red"
                      size="icon-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearType("CATEGORY");
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  }
                />
                <TooltipContent>
                  <p>Remover todas as categorias</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>

          <div
            className={cn(
              "flex items-center select-none gap-2 px-3 py-1 rounded-sm border border-white/5 text-sm transition-colors",
              counts.products > 0 ? "bg-card text-card-foreground" : "text-zinc-500"
            )}
          >
            <span>Produtos</span>
            <span className="font-bold">{counts.products}</span>
            {counts.products > 0 && (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      className="text-zinc-500 hover:text-red"
                      size="icon-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearType("PRODUCT");
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  }
                />
                <TooltipContent>
                  <p>Remover todos os produtos</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>

        <div className="relative mb-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="Pesquisar..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <ScrollArea className="h-[400px]">
          <div className="space-y-1 pb-6">
            {loading ? (
              <p className="px-2 py-8 text-center text-sm text-muted-foreground">
                Carregando categorias e produtos...
              </p>
            ) : visibleCategories.length === 0 ? (
              <p className="px-2 py-8 text-center text-sm text-muted-foreground">
                Nenhuma categoria encontrada.
              </p>
            ) : (
              visibleCategories.map((category) => {
                const catProducts = getCategoryProducts(category.id).filter((product) => {
                  if (!searchLower) return true;
                  if (category.name.toLowerCase().includes(searchLower)) return true;
                  return decodeHtmlEntities(product.name)
                    .toLowerCase()
                    .includes(searchLower);
                });
                const isExpanded = expandedItems[category.id];
                const isCatSelected = isSelected("CATEGORY", category.id);
                const productCount = getCategoryProducts(category.id).length;

                return (
                  <div key={category.id} className="space-y-1">
                    <div className="group flex select-none items-center gap-3 p-2 rounded-md hover:bg-white/5 transition-colors">
                      <Toggle
                        size="sm"
                        pressed={isCatSelected}
                        onPressedChange={() =>
                          toggleSelection(
                            "CATEGORY",
                            category.id,
                            decodeHtmlEntities(category.name)
                          )
                        }
                      >
                        {isCatSelected ? (
                          <Check className="h-4 w-4" />
                        ) : (
                          <X className="h-4 w-4" />
                        )}
                      </Toggle>

                      <div
                        className="flex-1 flex items-center gap-2 cursor-pointer min-w-0"
                        onClick={() => toggleExpand(category.id)}
                      >
                        <span className="text-sm font-medium text-white truncate">
                          {decodeHtmlEntities(category.name)}
                        </span>
                        <span className="shrink-0 text-[10px] text-white/35">
                          {productCount}
                        </span>
                      </div>

                      <div
                        className="cursor-pointer mr-2"
                        onClick={() => toggleExpand(category.id)}
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4 opacity-50" />
                        )}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="ml-8 pl-2 space-y-1 py-1 border-l border-white/5">
                        {catProducts.length === 0 ? (
                          <p className="px-2 py-2 text-xs text-muted-foreground">
                            Nenhum produto nesta categoria.
                          </p>
                        ) : (
                          catProducts.map((product) => {
                            const productName = decodeHtmlEntities(product.name);
                            const isProdSelected = isSelected("PRODUCT", product.id);
                            return (
                              <div
                                key={product.id}
                                className="group flex items-center gap-3 p-2 rounded-md hover:bg-white/5 transition-colors"
                              >
                                <Toggle
                                  size="sm"
                                  pressed={isProdSelected}
                                  onPressedChange={() =>
                                    toggleSelection("PRODUCT", product.id, productName)
                                  }
                                >
                                  {isProdSelected ? (
                                    <Check className="h-4 w-4" />
                                  ) : (
                                    <X className="h-4 w-4" />
                                  )}
                                </Toggle>

                                <div className="flex-1 flex flex-col min-w-0">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="text-xs text-white line-clamp-1">
                                      {productName}
                                    </span>
                                    <span className="shrink-0 bg-emerald-500/10 text-emerald-500 text-[10px] px-1.5 py-0.5 rounded">
                                      {product.isVisible ? "on" : "off"}
                                    </span>
                                    <Badge
                                      variant="secondary"
                                      className="shrink-0 bg-white/5 rounded text-zinc-400 text-[10px] px-1.5 py-0.5 font-medium"
                                    >
                                      {deliveryLabel(product.deliveryType)}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
          <div className="flex w-full gap-3">
            <Button
              size="lg"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              size="lg"
              onClick={() => {
                onConfirm(selectedRefs);
                onOpenChange(false);
              }}
              className="flex-1"
            >
              Confirmar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
