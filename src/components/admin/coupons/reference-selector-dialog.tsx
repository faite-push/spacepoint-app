"use client";

import { useState, useMemo, useEffect } from "react";
import { Search, Check, ChevronDown, ChevronUp, Trash2, X, Box, Tag, Layers, Package, Folder } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Toggle } from "@/components/ui/toggle";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { categoriesApi, productsApi, variantsApi, Category, AdminProduct, ProductVariant } from "@/lib/admin-api";
import { cn } from "@/lib/utils";
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

export function ReferenceSelectorDialog({ open, onOpenChange, initialReferences, onConfirm, }: ReferenceSelectorDialogProps) {
  const [search, setSearch] = useState("");
  const [selectedRefs, setSelectedRefs] = useState<Reference[]>(initialReferences);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (open) {
      setSelectedRefs(initialReferences);
    }
  }, [open, initialReferences]);

  const { data: catData } = useQuery({
    queryKey: ["admin", "categories", "flat"],
    queryFn: () => categoriesApi.listFlat(),
    enabled: open,
  });

  const { data: prodData } = useQuery({
    queryKey: ["admin", "products", "all"],
    queryFn: () => productsApi.list({ page: 1 }),
    enabled: open,
  });

  const categories = catData?.categories || [];
  const products = prodData?.products || [];

  const toggleExpand = (id: string) => {
    setExpandedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const isSelected = (type: string, id: string) => {
    return selectedRefs.some((r) => r.type === type && r.referenceId === id);
  };

  const toggleSelection = (type: "PRODUCT" | "CATEGORY" | "VARIANT", id: string, label: string) => {
    if (isSelected(type, id)) {
      setSelectedRefs((prev) => prev.filter((r) => !(r.type === type && r.referenceId === id)));
    } else {
      setSelectedRefs((prev) => [...prev, { type, referenceId: id, label }]);
    }
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

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Selecionar referências</DialogTitle>
          <DialogDescription>Selecione as referências que deseja associar.</DialogDescription>
        </DialogHeader>

        <div className="flex gap-2">
          <div className={cn(
            "flex items-center select-none gap-2 px-3 py-1 rounded-sm border border-white/5 text-sm transition-colors cursor-pointer",
            counts.categories > 0 ? "bg-card text-card-foreground" : "text-zinc-500"
          )}>
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
                      onClick={(e) => { e.stopPropagation(); clearType("CATEGORY"); }}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  }
                >
                </TooltipTrigger>
                <TooltipContent>
                  <p>Remover todas as categorias</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>

          <div className={cn(
            "flex items-center select-none gap-2 px-3 py-1 rounded-sm border border-white/5 text-sm transition-colors cursor-pointer",
            counts.products > 0 ? "bg-card text-card-foreground" : "text-zinc-500"
          )}>
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
                      onClick={(e) => { e.stopPropagation(); clearType("PRODUCT"); }}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  }
                >
                </TooltipTrigger>
                <TooltipContent>
                  <p>Remover todos os produtos</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>

          <div className={cn(
            "flex hidden items-center select-none gap-2 px-3 py-1.5 rounded-sm border border-white/5 text-sm transition-colors cursor-pointer",
            counts.variants > 0 ? "bg-card text-card-foreground" : "text-zinc-500"
          )}>
            <span>Variantes</span>
            <span className="font-bold">{counts.variants}</span>
            {counts.variants > 0 && (
              <button onClick={(e) => { e.stopPropagation(); clearType("VARIANT"); }}>
                <Trash2 className="h-3 w-3 text-zinc-500 hover:text-white" />
              </button>
            )}
          </div>
        </div>

        <div className="relative mb-4">
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
            {filteredCategories.map((category) => {
              const catProducts = products.filter(p => p.categoryId === category.id);
              const isExpanded = expandedItems[category.id];
              const isCatSelected = isSelected("CATEGORY", category.id);

              return (
                <div key={category.id} className="space-y-1">
                  <div className="group flex select-none items-center gap-3 p-2 rounded-md hover:bg-white/5 transition-colors">
                    <Toggle
                      size="sm"
                      pressed={isCatSelected}
                      onPressedChange={() => toggleSelection("CATEGORY", category.id, category.name)}
                    >
                      {isCatSelected ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                    </Toggle>

                    <div className="flex-1 flex items-center gap-2 cursor-pointer" onClick={() => toggleExpand(category.id)}>
                      <span className="text-sm font-medium text-white">{category.name}</span>
                    </div>

                    <div className="cursor-pointer mr-2" onClick={() => toggleExpand(category.id)}>
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4 opacity-50 transition-transform duration-200 group-data-[state=open]:rotate-180" />}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="ml-8 pl-2 space-y-1 py-1">
                      {catProducts.map((product) => {
                        const isProdSelected = isSelected("PRODUCT", product.id);
                        return (
                          <div key={product.id} className="group flex items-center gap-3 p-2 rounded-md hover:bg-white/5 transition-colors">
                            <Toggle
                              size="sm"
                              pressed={isProdSelected}
                              onPressedChange={() => toggleSelection("PRODUCT", product.id, product.name)}
                            >
                              {isProdSelected ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                            </Toggle>

                            <div className="flex-1 flex flex-col">
                              <div className="flex items-center gap-4">
                                <span className="text-xs text-white line-clamp-1">{product.name}</span>
                                <span className="bg-emerald-500/10 text-emerald-500 text-xs px-2 py-0.5 rounded">{product.isVisible ? "on" : "off"}</span>
                                <Badge variant="secondary" className="bg-white/5 rounded text-zinc-400 text-xs px-2 py-0.5 font-medium">
                                  {product.deliveryType === "automatic_lines" ? "linhas"
                                    : product.deliveryType === "file" ? "arquivo"
                                      : product.deliveryType === "manual" ? "manual"
                                        : product.deliveryType === "manual_chat" ? "manual chat"
                                          : product.deliveryType === "automatic_text" ? "texto"
                                            : "misto"}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
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
