"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, Loader2, Package, ChevronRight, ChevronDown, Check, Filter, PlusCircle, MoreHorizontal, Copy, Layers, ArrowRightLeft, GitBranch, ClipboardCopy } from "lucide-react";
import { TbGridDots } from "react-icons/tb";
import { DragDropContext, Droppable, Draggable, DropResult, DraggableProvided, DraggableStateSnapshot, DragStart } from "@hello-pangea/dnd";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, } from "@/components/ui/dialog";
import { categoriesApi, productsApi, type AdminProduct, type Category } from "@/lib/admin-api";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, } from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Can } from "@/providers/PermissionProvider";

function PortalAware({ provided, snapshot, portalEl, children, }: {
  provided: DraggableProvided;
  snapshot: DraggableStateSnapshot;
  portalEl: HTMLElement | null;
  children: React.ReactNode;
}) {
  const element = (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      style={provided.draggableProps.style}
    >
      {children}
    </div>
  );

  if (snapshot.isDragging && portalEl) {
    return createPortal(element, portalEl);
  }
  return element;
};

function FilterCheckbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label
      className="flex items-center gap-3 cursor-pointer group py-1"
      onClick={(e) => { e.preventDefault(); onChange(!checked); }}
    >
      <div
        className={cn(
          "flex h-5 w-5 items-center justify-center rounded border transition-all shrink-0",
          checked
            ? "bg-[#9333EA] border-[#9333EA] text-white"
            : "bg-transparent border-white/20 text-transparent"
        )}
      >
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
      </div>
      <span className="text-sm font-medium text-white/80 group-hover:text-white transition-colors select-none">
        {label}
      </span>
    </label>
  );
};

export default function UnifiedInventoryPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [isDndReady, setIsDndReady] = useState(false);
  useEffect(() => { setIsDndReady(true); }, []);

  const [search, setSearch] = useState("");
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({});
  const [deleteProduct, setDeleteProduct] = useState<AdminProduct | null>(null);
  const [deleteCategory, setDeleteCategory] = useState<Category | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [transferProduct, setTransferProduct] = useState<AdminProduct | null>(null);
  const [transferCatId, setTransferCatId] = useState<string>("");
  const [convertProduct, setConvertProduct] = useState<AdminProduct | null>(null);
  const [convertTargetId, setConvertTargetId] = useState<string>("");
  const [convertSearch, setConvertSearch] = useState<string>("");

  const [fCatAtivo, setFCatAtivo] = useState(true);
  const [fCatDesativado, setFCatDesativado] = useState(true);
  const [fStockQtd, setFStockQtd] = useState("");
  const [fProdAtivo, setFProdAtivo] = useState(true);
  const [fProdDesativado, setFProdDesativado] = useState(true);
  const [fTypeSerie, setFTypeSerie] = useState(true);
  const [fTypeTexto, setFTypeTexto] = useState(true);
  const [fTypeManual, setFTypeManual] = useState(true);
  const [fTypeMisto, setFTypeMisto] = useState(true);
  const [fEstoqueOut, setFEstoqueOut] = useState(true);
  const [fEstoqueIn, setFEstoqueIn] = useState(true);

  const filterRef = useRef<HTMLDivElement>(null);

  const isFilterActive = useMemo(() => {
    return (
      !fCatAtivo || !fCatDesativado || fStockQtd !== "" ||
      !fProdAtivo || !fProdDesativado || !fTypeSerie ||
      !fTypeTexto || !fTypeManual || !fTypeMisto ||
      !fEstoqueOut || !fEstoqueIn
    );
  }, [
    fCatAtivo, fCatDesativado, fStockQtd, fProdAtivo, fProdDesativado,
    fTypeSerie, fTypeTexto, fTypeManual, fTypeMisto, fEstoqueOut, fEstoqueIn
  ]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilters(false);
      }
    };
    if (showFilters) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showFilters]);

  useEffect(() => {
    const saved = localStorage.getItem("sp_admin_inv_filters");
    if (!saved) return;
    try {
      const p = JSON.parse(saved);
      if (p.fCatAtivo !== undefined) setFCatAtivo(p.fCatAtivo);
      if (p.fCatDesativado !== undefined) setFCatDesativado(p.fCatDesativado);
      if (p.fStockQtd !== undefined) setFStockQtd(p.fStockQtd);
      if (p.fProdAtivo !== undefined) setFProdAtivo(p.fProdAtivo);
      if (p.fProdDesativado !== undefined) setFProdDesativado(p.fProdDesativado);
      if (p.fTypeSerie !== undefined) setFTypeSerie(p.fTypeSerie);
      if (p.fTypeTexto !== undefined) setFTypeTexto(p.fTypeTexto);
      if (p.fTypeManual !== undefined) setFTypeManual(p.fTypeManual);
      if (p.fTypeMisto !== undefined) setFTypeMisto(p.fTypeMisto);
      if (p.fEstoqueOut !== undefined) setFEstoqueOut(p.fEstoqueOut);
      if (p.fEstoqueIn !== undefined) setFEstoqueIn(p.fEstoqueIn);
    } catch { /* noop */ }
  }, []);

  useEffect(() => {
    if (!isDndReady) return;
    localStorage.setItem("sp_admin_inv_filters", JSON.stringify({
      fCatAtivo, fCatDesativado, fStockQtd, fProdAtivo, fProdDesativado,
      fTypeSerie, fTypeTexto, fTypeManual, fTypeMisto, fEstoqueOut, fEstoqueIn,
    }));
  }, [fCatAtivo, fCatDesativado, fStockQtd, fProdAtivo, fProdDesativado,
    fTypeSerie, fTypeTexto, fTypeManual, fTypeMisto, fEstoqueOut, fEstoqueIn, isDndReady]);

  const { data: catData, isLoading: catLoading } = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: () => categoriesApi.list(),
  });

  const { data: prodData, isLoading: prodLoading } = useQuery({
    queryKey: ["admin", "products"],
    queryFn: () => productsApi.list({}),
  });

  const reorderCatMutation = useMutation({
    mutationFn: (items: { id: string; sortOrder: number }[]) => categoriesApi.reorder(items),
    onSuccess: (_data, variables) => {
      const count = variables.length;
      toast.success(
        count === 1 ? "Posição da categoria atualizada" : "Ordem das categorias atualizada"
      );
    },
    onError: () => toast.error("Falha ao reordenar categorias"),
  });

  const reorderProdMutation = useMutation({
    mutationFn: (items: { id: string; sortOrder: number }[]) => productsApi.reorder(items),
    onSuccess: (_data, variables) => {
      const count = variables.length;
      toast.success(
        count === 1 ? "Posição do produto atualizada" : "Ordem dos produtos atualizada"
      );
    },
    onError: () => toast.error("Falha ao reordenar produtos"),
  });

  const deleteCatMutation = useMutation({
    mutationFn: (id: string) => categoriesApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      toast.success("Categoria excluída");
      setDeleteCategory(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteProdMutation = useMutation({
    mutationFn: (id: string) => productsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      toast.success("Produto excluído");
      setDeleteProduct(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const duplicateProdMutation = useMutation({
    mutationFn: async (p: AdminProduct) => {
      const { name, price, comparePrice, imageUrl, gallery, isVisible, categoryId,
        description, stockQuantity, minPurchaseQuantity, maxPurchaseQuantity,
        onePurchasePerUser, deliveryType, digitalLines, digitalFileUrl,
        manualDeliveryNote, postPurchaseInstructions } = p;
      return productsApi.create({
        name: `${name} (cópia)`,
        price, comparePrice, imageUrl, gallery, isVisible, categoryId,
        description, stockQuantity, minPurchaseQuantity, maxPurchaseQuantity,
        onePurchasePerUser, deliveryType, digitalLines, digitalFileUrl,
        manualDeliveryNote, postPurchaseInstructions,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      toast.success("Produto duplicado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const transferProdMutation = useMutation({
    mutationFn: ({ id, categoryId }: { id: string; categoryId: string | null }) =>
      productsApi.update(id, { categoryId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      toast.success("Produto transferido");
      setTransferProduct(null);
      setTransferCatId("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const convertToVariantMutation = useMutation({
    mutationFn: ({ sourceId, targetProductId }: { sourceId: string; targetProductId: string }) =>
      productsApi.convertToVariant(sourceId, targetProductId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "variants", data.targetProductId] });
      toast.success("Pacote convertido em variante");
      setConvertProduct(null);
      setConvertTargetId("");
      router.push(`/dashboard/admin/products/${data.targetProductId}/variants`);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const allCategories = useMemo(
    () => [...(catData?.categories ?? [])].sort((a, b) => a.sortOrder - b.sortOrder),
    [catData]
  );

  const allProducts = useMemo(
    () => [...(prodData?.products ?? [])].sort((a, b) => a.sortOrder - b.sortOrder),
    [prodData]
  );

  const [liveCategories, setLiveCategories] = useState<Category[]>([]);
  const [liveProducts, setLiveProducts] = useState<AdminProduct[]>([]);

  useEffect(() => { setLiveCategories(allCategories); }, [allCategories]);
  useEffect(() => { setLiveProducts(allProducts); }, [allProducts]);

  const filteredProducts = useMemo(() => {
    return liveProducts.filter((p) => {
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (p.isVisible && !fProdAtivo) return false;
      if (!p.isVisible && !fProdDesativado) return false;
      const stock = p.stockQuantity ?? 0;
      if (stock > 0 && !fEstoqueIn) return false;
      if (stock <= 0 && !fEstoqueOut) return false;
      if (fStockQtd !== "" && !isNaN(Number(fStockQtd)) && stock !== Number(fStockQtd)) return false;
      if (p.deliveryType === "automatic_lines" && !fTypeSerie) return false;
      if (p.deliveryType === "file" && !fTypeTexto) return false;
      if (p.deliveryType === "manual_chat" && !fTypeManual) return false;
      if (p.deliveryType === "mixed" && !fTypeMisto) return false;
      return true;
    });
  }, [liveProducts, search, fProdAtivo, fProdDesativado, fEstoqueIn, fEstoqueOut,
    fStockQtd, fTypeSerie, fTypeTexto, fTypeManual, fTypeMisto]);

  const filteredTopCategories = useMemo(() => {
    return liveCategories
      .filter((c) => !c.parentId)
      .filter((c) => {
        if (c.isActive && !fCatAtivo) return false;
        if (!c.isActive && !fCatDesativado) return false;
        return true;
      })
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }, [liveCategories, fCatAtivo, fCatDesativado]);

  const onBeforeDragStart = (start: DragStart) => {
    // We removed the auto-collapse logic from here because it was causing 
    // "Invariant failed: Cannot find droppable entry" errors by unmounting 
    // components exactly when the drag engine was initializing.
  };

  const onDragEnd = (result: DropResult) => {
    const { source, destination, type } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    if (type === "CATEGORY") {
      const items = Array.from(filteredTopCategories);
      const [removed] = items.splice(source.index, 1);
      items.splice(destination.index, 0, removed);
      const reordered = items.map((c, i) => ({ ...c, sortOrder: i }));

      setLiveCategories((prev) =>
        reordered.map((r) => {
          const found = prev.find((c) => c.id === r.id);
          return found ? { ...found, sortOrder: r.sortOrder } : r;
        })
      );
      reorderCatMutation.mutate(reordered.map((c) => ({ id: c.id, sortOrder: c.sortOrder })));
      return;
    }

    if (type === "SUBCATEGORY") {
      const parentId = source.droppableId.replace("subcats-", "");
      const parent = liveCategories.find((c) => c.id === parentId);
      if (!parent) return;

      const subs = [...(parent.subcategories ?? [])].sort((a, b) => a.sortOrder - b.sortOrder);
      const [removed] = subs.splice(source.index, 1);
      subs.splice(destination.index, 0, removed);
      const reordered = subs.map((s, i) => ({ ...s, sortOrder: i }));

      setLiveCategories((prev) =>
        prev.map((c) =>
          c.id === parentId ? { ...c, subcategories: reordered } : c
        )
      );
      reorderCatMutation.mutate(reordered.map((s) => ({ id: s.id, sortOrder: s.sortOrder })));
      return;
    }

    if (type === "PRODUCT" && source.droppableId === destination.droppableId) {
      const catId = source.droppableId === "uncategorized"
        ? null
        : source.droppableId.replace("prod-", "");

      const catProds = [...liveProducts]
        .filter((p) => p.categoryId === catId)
        .sort((a, b) => a.sortOrder - b.sortOrder);

      const [removed] = catProds.splice(source.index, 1);
      catProds.splice(destination.index, 0, removed);
      const payload = catProds.map((p, i) => ({ id: p.id, sortOrder: i }));

      setLiveProducts((prev) =>
        prev.map((p) => {
          const m = payload.find((x) => x.id === p.id);
          return m ? { ...p, sortOrder: m.sortOrder } : p;
        })
      );
      reorderProdMutation.mutate(payload);
    }
  };

  const toggleCat = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedCats((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const CategoryHeader = ({ cat, indent = 0, dragHandleProps, isDragging, onDelete, }: {
    cat: Category;
    indent?: number;
    dragHandleProps: DraggableProvided["dragHandleProps"];
    isDragging: boolean;
    onDelete: (c: Category) => void;
  }) => {
    const isExpanded = search ? true : !!expandedCats[cat.id];
    const directProds = filteredProducts.filter((p) => p.categoryId === cat.id);
    const subcatCount = (cat.subcategories ?? []).length;
    const productCount = cat._count?.products ?? directProds.length;
    const hasChildren = subcatCount > 0;
    const canDelete = productCount === 0 && !hasChildren;
    const totalCount = directProds.length + (cat.subcategories ?? []).reduce(
      (acc, s) => acc + (s._count?.products ?? 0), 0
    );

    return (
      <div
        className={cn(
          "flex items-center justify-between gap-4 px-4 py-3 cursor-pointer transition-colors",
          isDragging
            ? "bg-[#1a1a1a]"
            : isExpanded
              ? "bg-transparent hover:bg-white/[0.02]"
              : "bg-transparent"
        )}
        style={{ paddingLeft: `${indent * 32 + 16}px` }}
        onClick={(e) => toggleCat(cat.id, e)}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div
            {...dragHandleProps}
            className="text-white/60 shrink-0 cursor-grab active:cursor-grabbing opacity-50 hover:opacity-100 sm:flex p-1"
            onClick={(e) => e.stopPropagation()}
          >
            <TbGridDots className="h-5 w-5" />
          </div>
          <div className="flex items-center gap-2 min-w-0">
            {indent > 0 && (
              <Badge variant="secondary" className="bg-primary/10 text-primary text-[10px] uppercase border-transparent shrink-0">
                sub
              </Badge>
            )}
            <span className="font-medium text-sm text-zinc-100 tracking-widest truncate">
              {cat.name}
            </span>
            <span className="text-xs font-mono text-zinc-600 font-bold shrink-0">
              ({totalCount})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Can I="products:edit">
            <Button
              variant="ghost" size="icon"
              className="cursor-pointer h-8 w-8 text-zinc-400 hover:text-white"
              onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/admin/categories/${cat.id}/edit`); }}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </Can>
          <Can I="products:create">
            <Button
              className="flex justify-center rounded-lg cursor-pointer h-8 w-8 text-white"
              onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/admin/products/new?categoryId=${cat.id}`); }}
            >
              <Plus className="text-white h-5 w-5" />
            </Button>
          </Can>
          <Can I="products:delete">
            <DropdownMenu>
              <DropdownMenuTrigger
                className="inline-flex items-center justify-center cursor-pointer h-8 w-8 rounded-md text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-[#141414] border-white/10" onClick={(e) => e.stopPropagation()}>
                <DropdownMenuItem
                  variant="destructive"
                  disabled={!canDelete}
                  className="cursor-pointer gap-3 py-2"
                  onClick={() => canDelete && onDelete(cat)}
                >
                  <Trash2 className="h-4 w-4" />
                  Excluir categoria
                </DropdownMenuItem>
                {!canDelete && (
                  <p className="px-2 py-1.5 text-[11px] text-zinc-500">
                    Remova produtos e subcategorias antes de excluir.
                  </p>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </Can>
          <div className="cursor-pointer w-8 h-8 flex items-center justify-center text-zinc-500">
            {isExpanded ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </div>
        </div>
      </div>
    );
  };

  const ProductRow = ({
    p,
    indent = 0,
    index,
  }: {
    p: AdminProduct;
    indent?: number;
    index: number;
  }) => {
    const variantCount = p._count?.variants ?? 0;

    return (
      <Draggable draggableId={`prod-${p.id}`} index={index}>
        {(provided, snapshot) => (
          <PortalAware provided={provided} snapshot={snapshot} portalEl={portalEl}>
            <div className="flex flex-col">
              <div
                {...provided.dragHandleProps}
                className={cn(
                  "group flex items-center justify-between gap-4 py-3 transition-colors",
                  snapshot.isDragging
                    ? "bg-[#111] rounded-lg border border-white/10"
                    : "bg-transparent hover:bg-white/[0.02]"
                )}
                style={{ paddingLeft: `${indent * 32 + 16}px`, paddingRight: "16px" }}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="text-zinc-600 shrink-0 opacity-50 hover:opacity-100 hidden sm:flex p-1 cursor-grab active:cursor-grabbing">
                    <TbGridDots className="h-4 w-4" />
                  </div>
                  <div className="flex items-center justify-center shrink-0 w-10 h-10 rounded border border-white/10 bg-white/5 overflow-hidden">
                    {p.imageUrl
                      ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                      : <Package className="h-4 w-4 text-zinc-500" />}
                  </div>
                  <div className="min-w-0 flex-1 flex flex-col gap-0.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/dashboard/admin/products/${p.id}/edit`);
                      }}
                      className="font-semibold text-sm text-zinc-100 truncate text-left hover:text-[#a855f7] transition-colors cursor-pointer"
                    >
                      {p.name}
                    </button>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="secondary" className="bg-[#FFC107]/10 text-[#FFBA00] hover:bg-[#FFC107]/10 border-transparent text-[10px] uppercase font-bold tracking-wider">
                        {p.deliveryType === "automatic_lines" ? "Linhas"
                          : p.deliveryType === "file" ? "Arquivo"
                            : p.deliveryType === "manual_chat" ? "Manual"
                              : "Misto"}
                      </Badge>
                      <span className={cn("text-[11px] uppercase tracking-wider font-bold", p.isVisible ? "text-emerald-500" : "text-zinc-500")}>
                        {p.isVisible ? "ON" : "OFF"}
                      </span>
                      {variantCount > 0 && (
                        <Badge variant="secondary" className="bg-[#9333EA]/10 text-[#a855f7] border-transparent text-[10px] uppercase font-bold">
                          {variantCount} var.
                        </Badge>
                      )}
                      {variantCount === 0 && (p.stockQuantity ?? 0) <= 0 && (
                        <Badge variant="secondary" className="bg-red-500/10 text-red-400 border-transparent text-[10px] uppercase font-bold">
                          Sem estoque
                        </Badge>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/admin/products/${p.id}/variants`); }}
                        className="flex items-center gap-1 text-[10px] font-semibold text-zinc-500 hover:text-[#a855f7] transition-colors cursor-pointer"
                      >
                        <Layers className="h-3 w-3" />
                        Ver Variantes ({variantCount})
                      </button>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                  <span className="text-sm font-medium text-zinc-300 w-10 text-right hidden sm:block">{p.stockQuantity}</span>
                  <span className="text-sm font-semibold text-white w-20 text-right hidden sm:block">R$ {Number(p.price).toFixed(2)}</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="inline-flex items-center justify-center cursor-pointer h-8 w-8 rounded-md text-zinc-400 hover:text-white hover:bg-white/5 transition-colors" onClick={(e) => e.stopPropagation()}>
                      <MoreHorizontal className="h-4 w-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-68 bg-[#141414] border-white/10">
                      <Can I="products:edit">
                        <DropdownMenuItem className="cursor-pointer gap-3 py-2" onClick={() => router.push(`/dashboard/admin/products/${p.id}/edit`)}>
                          <Pencil className="h-4 w-4" /> Editar
                        </DropdownMenuItem>
                      </Can>
                      <Can I="products:create">
                        <DropdownMenuItem className="cursor-pointer gap-3 py-2" onClick={() => duplicateProdMutation.mutate(p)}>
                          <Copy className="h-4 w-4" /> Duplicar
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer gap-3 py-2" onClick={() => { setTransferProduct(p); setTransferCatId(p.categoryId ?? ""); }}>
                          <ArrowRightLeft className="h-4 w-4" /> Transferir para outra categoria
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="cursor-pointer gap-3 py-2"
                          onClick={() => {
                            setConvertProduct(p);
                            setConvertTargetId("");
                          }}
                        >
                          <GitBranch className="h-4 w-4" /> Mover para variação
                        </DropdownMenuItem>
                      </Can>
                      <DropdownMenuItem className="cursor-pointer gap-3 py-2" onClick={() => { navigator.clipboard.writeText(p.id); toast.success("ID copiado!"); }}>
                        <ClipboardCopy className="h-4 w-4" /> Copiar ID
                      </DropdownMenuItem>
                      <Can I="products:delete">
                        <DropdownMenuSeparator className="bg-white/10" />
                        <DropdownMenuItem className="cursor-pointer gap-3 py-2" onClick={() => setDeleteProduct(p)}>
                          <Trash2 className="h-4 w-4" /> Deletar
                        </DropdownMenuItem>
                      </Can>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

            </div>
          </PortalAware>
        )}
      </Draggable>
    );
  };

  const CategorySection = ({
    cat,
    index,
    indent = 0,
    type,
  }: {
    cat: Category;
    index: number;
    indent?: number;
    type: "CATEGORY" | "SUBCATEGORY";
  }) => {
    const isExpanded = search ? true : !!expandedCats[cat.id];
    const subcats = (cat.subcategories ?? []).sort((a, b) => a.sortOrder - b.sortOrder);
    const directProds = filteredProducts.filter((p) => p.categoryId === cat.id).sort((a, b) => a.sortOrder - b.sortOrder);

    return (
      <Draggable draggableId={`cat-${cat.id}`} index={index}>
        {(provided, snapshot) => (
          <PortalAware provided={provided} snapshot={snapshot} portalEl={portalEl}>
            <div
              className={cn(
                "flex flex-col overflow-hidden transition-all duration-200",
                isExpanded
                  ? indent > 0
                    ? "rounded-lg border border-primary/15 bg-primary/3"
                    : "rounded-lg border border-white/5 bg-[#111]"
                  : "rounded-lg border border-white/5 bg-[#111]",
                snapshot.isDragging && "rounded-lg ring-1 ring-white/20 shadow-2xl opacity-90"
              )}
            >
              <CategoryHeader
                cat={cat}
                indent={indent}
                dragHandleProps={provided.dragHandleProps}
                isDragging={snapshot.isDragging}
                onDelete={setDeleteCategory}
              />

              {isExpanded && (
                <>
                  {subcats.length > 0 && (
                    <Droppable droppableId={`subcats-${cat.id}`} type="SUBCATEGORY" isDropDisabled={snapshot.isDragging}>
                      {(dropProvided) => (
                        <div ref={dropProvided.innerRef} {...dropProvided.droppableProps} className="px-3 pb-2 space-y-1.5">
                          {subcats.map((sub, i) => (
                            <CategorySection key={sub.id} cat={sub} index={i} indent={indent + 1} type="SUBCATEGORY" />
                          ))}
                          {dropProvided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  )}

                  <Droppable droppableId={`prod-${cat.id}`} type="PRODUCT" isDropDisabled={snapshot.isDragging}>
                    {(dropProvided) => (
                      <div ref={dropProvided.innerRef} {...dropProvided.droppableProps} className="min-h-[2px]">
                        {directProds.map((p, i) => (
                          <ProductRow key={p.id} p={p} index={i} indent={indent + 1} />
                        ))}
                        {dropProvided.placeholder}
                        {subcats.length === 0 && directProds.length === 0 && (
                          <div
                            className="py-3 text-xs text-zinc-600 italic"
                            style={{ paddingLeft: `${(indent + 1) * 32 + 16}px` }}
                          >
                            Nenhum produto nesta categoria.
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                </>
              )}
            </div>
          </PortalAware>
        )}
      </Draggable>
    );
  };

  const allCatsFlat = useMemo(
    () => liveCategories.flatMap((c) => [c, ...(c.subcategories ?? [])]),
    [liveCategories]
  );

  const uncategorized = filteredProducts.filter((p) => !p.categoryId).sort((a, b) => a.sortOrder - b.sortOrder);

  const [portalEl, setPortalEl] = useState<HTMLElement | null>(null);

  const isLoading = catLoading || prodLoading;

  if (!isDndReady) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white lg:text-2xl">Categorias</h1>
          <p className="text-muted-foreground">Gerencie os produtos e categorias da loja</p>
        </div>
        <Can I="products:create">
          <Button asChild variant="default" className="px-4 py-5 gap-2 shrink-0">
            <Link href="/dashboard/admin/categories/new">
              <PlusCircle className="h-4 w-4" />
              Criar Categoria
            </Link>
          </Button>
        </Can>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            placeholder="Pesquisar por produto ou categoria"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full rounded-lg border border-white/10 bg-[#0A0A0A] pl-10 pr-4 text-sm text-white placeholder:text-zinc-600 focus:border-[#9333EA]/60 focus:outline-none focus:ring-none transition-all duration-300"
          />
        </div>

        <div className="relative" ref={filterRef}>
          <button
            className={cn(
              "inline-flex items-center gap-2 h-10 px-4 rounded-lg cursor-pointer border transition-all text-sm font-medium",
              isFilterActive
                ? "border-[#9333EA]/50 bg-[#9333EA]/10 text-[#A855F7] hover:bg-[#9333EA]/10"
                : "border-white/10 bg-[#0A0A0A] text-zinc-300 hover:bg-white/5"
            )}
            onClick={() => setShowFilters((v) => !v)}
          >
            <div className="relative">
              <Filter className="w-4 h-4" />
              {isFilterActive && (
                <span className="absolute -top-1 -right-1 flex h-2 w-2 rounded-full bg-[#9333EA] ring-[2px] ring-black" />
              )}
            </div>
            Filtros
          </button>

          {showFilters && (
            <div className="absolute right-0 sm:left-0 sm:right-auto top-full mt-2 w-80 sm:w-96 rounded-xl border border-white/10 bg-[#121212] shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-2 bg-[#1A1A1A] p-3 border-b border-white/5 text-xs text-zinc-400 font-medium">
                <span className="text-xl">⚠️</span> Os filtros são salvos automaticamente
              </div>
              <div className="p-4 space-y-5">
                <div>
                  <h4 className="text-zinc-500 font-semibold text-xs uppercase tracking-wider mb-2">Categoria</h4>
                  <div className="space-y-1">
                    <FilterCheckbox checked={fCatAtivo} onChange={setFCatAtivo} label="Ativo" />
                    <FilterCheckbox checked={fCatDesativado} onChange={setFCatDesativado} label="Desativado" />
                  </div>
                </div>
                <div className="h-px bg-white/5" />
                <div>
                  <h4 className="text-zinc-500 font-semibold text-xs uppercase tracking-wider mb-2">Quantidade em Estoque</h4>
                  <div className="flex items-center gap-2">
                    <div className="flex h-9 items-center rounded-md border border-white/10 bg-[#1A1A1A] px-3 text-sm text-white w-24 shrink-0">Igual a</div>
                    <input
                      type="number" placeholder="Qtd" value={fStockQtd}
                      onChange={(e) => setFStockQtd(e.target.value)}
                      className="flex-1 h-9 rounded-md border border-white/10 bg-[#1A1A1A] px-3 text-sm text-white focus:outline-none focus:border-white/30"
                    />
                  </div>
                </div>
                <div className="h-px bg-white/5" />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-zinc-500 font-semibold text-xs uppercase tracking-wider mb-2">Produto — Status</h4>
                    <div className="space-y-1">
                      <FilterCheckbox checked={fProdAtivo} onChange={setFProdAtivo} label="Ativo" />
                      <FilterCheckbox checked={fProdDesativado} onChange={setFProdDesativado} label="Desativado" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-zinc-500 font-semibold text-xs uppercase tracking-wider mb-2">Produto — Estoque</h4>
                    <div className="space-y-1">
                      <FilterCheckbox checked={fEstoqueOut} onChange={setFEstoqueOut} label="Esgotado" />
                      <FilterCheckbox checked={fEstoqueIn} onChange={setFEstoqueIn} label="Não esgotado" />
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="text-zinc-500 font-semibold text-xs uppercase tracking-wider mb-2">Produto — Tipo</h4>
                  <div className="grid grid-cols-2 gap-y-1">
                    <FilterCheckbox checked={fTypeSerie} onChange={setFTypeSerie} label="Série (Linhas)" />
                    <FilterCheckbox checked={fTypeTexto} onChange={setFTypeTexto} label="Texto (Arquivo)" />
                    <FilterCheckbox checked={fTypeManual} onChange={setFTypeManual} label="Manual" />
                    <FilterCheckbox checked={fTypeMisto} onChange={setFTypeMisto} label="Variante (Misto)" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd} onBeforeDragStart={onBeforeDragStart}>
        <div
          className="relative bg-transparent"
          style={{ overflow: "clip" }}
        >
          <div
            ref={(el) => { if (el && !portalEl) setPortalEl(el); }}
            className="absolute inset-0 pointer-events-none"
            style={{ zIndex: 9999 }}
          />
          {isLoading ? (
            <div className="flex h-60 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
            </div>
          ) : (
            <Droppable droppableId="categories-root" type="CATEGORY">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className="flex flex-col space-y-2 min-h-[60px]">
                  {filteredTopCategories.map((cat, index) => (
                    <CategorySection key={cat.id} cat={cat} index={index} type="CATEGORY" />
                  ))}
                  {provided.placeholder}

                  {filteredTopCategories.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <Package className="h-12 w-12 text-white/5 mb-4" />
                      <h3 className="text-lg font-medium text-white mb-2">Inventário Vazio</h3>
                      <p className="text-sm text-zinc-500">Nenhum item bate com os filtros atuais.</p>
                    </div>
                  )}
                </div>
              )}
            </Droppable>
          )}
        </div>
      </DragDropContext>

      <Dialog open={!!deleteCategory} onOpenChange={() => setDeleteCategory(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir categoria</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir <strong>{deleteCategory?.name}</strong>? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleteCategory(null)}>Cancelar</Button>
            <Button
              variant="destructive"
              disabled={deleteCatMutation.isPending}
              onClick={() => deleteCategory && deleteCatMutation.mutate(deleteCategory.id)}
            >
              {deleteCatMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteProduct} onOpenChange={() => setDeleteProduct(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir produto</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir <strong>{deleteProduct?.name}</strong>? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost"
              onClick={() => setDeleteProduct(null)}>Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={deleteProdMutation.isPending}
              onClick={() => deleteProduct && deleteProdMutation.mutate(deleteProduct.id)}
            >
              {deleteProdMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Excluir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!convertProduct} onOpenChange={() => { setConvertProduct(null); setConvertTargetId(""); setConvertSearch(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mover para variação</DialogTitle>
            <DialogDescription>
              O pacote <strong>{convertProduct?.name}</strong> será convertido em variante de outro pacote.
              Os dados serão copiados e o pacote original será removido.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-3">
            <Input
              placeholder="Buscar pacote de destino..."
              value={convertSearch}
              onChange={(e) => setConvertSearch(e.target.value)}
              className="bg-[#111] border-white/10"
            />
            <Select value={convertTargetId} onValueChange={setConvertTargetId}>
              <SelectTrigger className="w-full bg-[#111] border-white/10">
                <SelectValue placeholder="Selecionar pacote de destino..." />
              </SelectTrigger>
              <SelectContent className="bg-[#141414] border-white/10 max-h-64">
                {allProducts
                  .filter((prod) => prod.id !== convertProduct?.id)
                  .filter((prod) =>
                    !convertSearch.trim() ||
                    prod.name.toLowerCase().includes(convertSearch.toLowerCase())
                  )
                  .map((prod) => (
                    <SelectItem key={prod.id} value={prod.id}>
                      {prod.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setConvertProduct(null); setConvertTargetId(""); setConvertSearch(""); }}>
              Cancelar
            </Button>
            <Button
              disabled={!convertTargetId || convertToVariantMutation.isPending}
              onClick={() =>
                convertProduct &&
                convertTargetId &&
                convertToVariantMutation.mutate({
                  sourceId: convertProduct.id,
                  targetProductId: convertTargetId,
                })
              }
            >
              {convertToVariantMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Converter"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!transferProduct} onOpenChange={() => { setTransferProduct(null); setTransferCatId(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transferir produto</DialogTitle>
            <DialogDescription>
              Mova <strong>{transferProduct?.name}</strong> para outra categoria.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Select value={transferCatId} onValueChange={setTransferCatId}>
              <SelectTrigger className="w-full bg-[#111] border-white/10">
                <SelectValue placeholder="Selecionar categoria..." />
              </SelectTrigger>
              <SelectContent className="bg-[#141414] border-white/10">
                <SelectItem value="__none__">Sem categoria</SelectItem>
                {allCatsFlat.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.parentId ? `↳ ${c.name}` : c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setTransferProduct(null); setTransferCatId(""); }}>Cancelar</Button>
            <Button
              disabled={transferProdMutation.isPending}
              onClick={() => transferProduct && transferProdMutation.mutate({
                id: transferProduct.id,
                categoryId: transferCatId === "__none__" ? null : transferCatId || null,
              })}
            >
              {transferProdMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Transferir"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}