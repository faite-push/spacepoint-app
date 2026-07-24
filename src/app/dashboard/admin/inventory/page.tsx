"use client";

import { Fragment, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { toast } from "sonner";

import { Search, Package, AlertTriangle, CheckCircle2, XCircle, ArrowLeft, Loader2, Save, Upload, Eye, Edit2, Layers, Check, ChevronRight, } from "lucide-react";
import { RiAlarmWarningFill } from "react-icons/ri";
import { TbListDetails, TbListCheck } from "react-icons/tb";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { inventoryApi, type DeliveryType, type InventoryStockStatus, type InventoryVariantItem, } from "@/lib/admin-api";
import { InventoryBulkUploadDialog } from "@/components/admin/inventory/inventory-bulk-upload-dialog";
import { InventoryCodesDialog } from "@/components/admin/inventory/inventory-codes-dialog";
import { Can } from "@/providers/PermissionProvider";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

const DELIVERY_LABELS: Record<DeliveryType, string> = {
  automatic_lines: "Linhas automáticas",
  mixed: "Misto",
  manual: "Manual",
  manual_chat: "Chat manual",
  file: "Arquivo",
  automatic_text: "Texto automático",
};

function getStockStatusMeta(status: InventoryStockStatus) {
  if (status === "out") {
    return {
      label: "Sem estoque",
      color: "text-red-500",
      bg: "bg-red-500/10 border-red-500/20",
      icon: XCircle,
    };
  }
  if (status === "low") {
    return {
      label: "Estoque baixo",
      color: "text-amber-500",
      bg: "bg-amber-500/10 border-amber-500/20",
      icon: AlertTriangle,
    };
  }
  return {
    label: "Em dia",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10 border-emerald-500/20",
    icon: CheckCircle2,
  };
}

function supportsBulkUpload(deliveryType: DeliveryType) {
  return deliveryType === "automatic_lines" || deliveryType === "mixed";
}

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | InventoryStockStatus>("all");
  const [deliveryFilter, setDeliveryFilter] = useState<DeliveryType | "all">("all");
  const [page, setPage] = useState(1);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState(0);

  const [uploadVariant, setUploadVariant] = useState<InventoryVariantItem | null>(null);
  const [codesVariant, setCodesVariant] = useState<InventoryVariantItem | null>(null);
  const [expandedProducts, setExpandedProducts] = useState<Record<string, boolean>>({});

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "inventory", search, statusFilter, deliveryFilter, page],
    queryFn: () =>
      inventoryApi.list({
        search: search || undefined,
        status: statusFilter,
        deliveryType: deliveryFilter,
        page,
        pageSize: 50,
      }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, stock }: { id: string; stock: number }) =>
      inventoryApi.updateManualStock(id, stock),
    onSuccess: () => {
      toast.success("Estoque atualizado");
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ["admin", "inventory"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "variants"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const items = data?.items ?? [];
  const summary = data?.summary;
  const pagination = data?.pagination;

  const grouped = useMemo(() => {
    const map = new Map<string, { productName: string; productId: string; items: InventoryVariantItem[] }>();
    for (const item of items) {
      const bucket = map.get(item.productId) || {
        productId: item.productId,
        productName: item.productName,
        items: [],
      };
      bucket.items.push(item);
      map.set(item.productId, bucket);
    }
    return Array.from(map.values());
  }, [items]);

  function handleRefresh() {
    queryClient.invalidateQueries({ queryKey: ["admin", "inventory"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "products"] });
    queryClient.invalidateQueries({ queryKey: ["admin", "variants"] });
  }

  function toggleProductExpanded(productId: string) {
    setExpandedProducts((prev) => ({ ...prev, [productId]: !prev[productId] }));
  }

  return (
    <div className="relative space-y-6 pb-10 animate-in fade-in duration-500 select-none">
      <div className="absolute top-0 right-[-5%] w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-white/3 rounded-full blur-[120px] z-0 pointer-events-none" />
      <div className="absolute top-0 left-[-5%] w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-white/3 rounded-full blur-[120px] z-0 pointer-events-none" />

      <div className="absolute bottom-0 right-[10%] w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-white/3 rounded-full blur-[120px] z-0 pointer-events-none" />
      <div className="absolute bottom-0 left-[10%] w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-white/3 rounded-full blur-[120px] z-0 pointer-events-none" />

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-row items-center gap-2">
          <Link href="/dashboard/admin/products" className="text-zinc-500 hover:text-white transition-colors">
            <Button variant="ghost" size="icon-lg">
              <ArrowLeft size={16} />
            </Button>
          </Link>
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold text-white">Gerenciador de estoque</h1>
            <p className="text-sm text-muted-foreground">
              Controle códigos, estoque disponível e alertas por variante de cada produto.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="flex items-center gap-3 relative group select-none overflow-hidden rounded-md border border-white/3 bg-background/50 px-4 py-4 md:px-6 md:py-5 transition-all duration-300">
          <div className="flex bg-white/5 rounded-md h-10 w-10 items-center justify-center text-white">
            <RiAlarmWarningFill className="w-5 h-5" />
          </div>
          <div>
            <p className="text-lg md:text-xl font-medium text-white tracking-tight">{summary?.lowStock ?? 0}</p>
            <h3 className="text-xs md:text-sm text-white/60">Estoque baixo</h3>
          </div>
        </div>
        <div className="flex items-center gap-3 relative group select-none overflow-hidden rounded-md border border-white/3 bg-background/50 px-4 py-4 md:px-6 md:py-5 transition-all duration-300">
          <div className="flex bg-white/5 rounded-md h-10 w-10 items-center justify-center text-white">
            <TbListDetails className="w-5 h-5" />
          </div>
          <div>
            <p className="text-lg md:text-xl font-medium text-white tracking-tight">{summary?.outOfStock ?? 0}</p>
            <h3 className="text-xs md:text-sm text-white/60">Sem estoque</h3>
          </div>
        </div>
        <div className="flex items-center gap-3 relative group select-none overflow-hidden rounded-md border border-white/3 bg-background/50 px-4 py-4 md:px-6 md:py-5 transition-all duration-300">
          <div className="flex bg-white/5 rounded-md h-10 w-10 items-center justify-center text-white">
            <TbListCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-lg md:text-xl font-medium text-white tracking-tight">{summary?.inStock ?? 0}</p>
            <h3 className="text-xs md:text-sm text-white/60">Em dia</h3>
          </div>
        </div>
        <div className="flex items-center gap-3 relative group select-none overflow-hidden rounded-md border border-white/3 bg-background/50 px-4 py-4 md:px-6 md:py-5 transition-all duration-300">
          <div className="flex bg-white/5 rounded-md h-10 w-10 items-center justify-center text-white">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-lg md:text-xl font-medium text-white tracking-tight">{summary?.totalVariants ?? 0}</p>
            <h3 className="text-xs md:text-sm text-white/60">Variantes</h3>
          </div>
        </div>
      </div>

      <div className="rounded-md border border-white/5 bg-transparent">
        <div className="flex flex-col lg:flex-row justify-between px-4 py-4 space-y-2">
          <div className="relative w-full lg:w-112">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input
              placeholder="Buscar produto, variante ou SKU..."
              className="pl-8"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>

          <div className="flex flex-row items-center gap-2">
            <Select
              value={statusFilter}
              onValueChange={(val: "all" | InventoryStockStatus) => {
                setStatusFilter(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[170px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="out">Sem estoque</SelectItem>
                <SelectItem value="low">Estoque baixo</SelectItem>
                <SelectItem value="ok">Em dia</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={deliveryFilter}
              onValueChange={(val: DeliveryType | "all") => {
                setDeliveryFilter(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[190px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os tipos</SelectItem>
                <SelectItem value="automatic_lines">Linhas automáticas</SelectItem>
                <SelectItem value="mixed">Misto</SelectItem>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="manual_chat">Chat manual</SelectItem>
                <SelectItem value="file">Arquivo</SelectItem>
                <SelectItem value="automatic_text">Texto automático</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Separator className="bg-white/5" />

        <Table className="w-full text-left border-collapse px-4 py-4">
          <TableHeader className="bg-card/2 sticky top-0 z-20">
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead className="text-sm font-medium text-muted-foreground pl-6 py-4">
                Variante
              </TableHead>
              <TableHead className="text-sm font-medium text-muted-foreground">
                Tipo
              </TableHead>
              <TableHead className="text-sm font-medium text-muted-foreground">
                Status
              </TableHead>
              <TableHead className="text-sm font-medium text-muted-foreground text-center">
                Disponível
              </TableHead>
              <TableHead className="text-sm font-medium text-muted-foreground text-center">
                Reservado
              </TableHead>
              <TableHead className="text-sm font-medium text-muted-foreground text-center">
                Entregue
              </TableHead>
              <TableHead className="text-right text-sm font-medium text-muted-foreground pr-6">
                Ações
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i} className="border-white/5 animate-pulse">
                  <TableCell colSpan={7} className="h-14 bg-white/[0.01]" />
                </TableRow>
              ))
            ) : grouped.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-40 text-center text-zinc-500 italic">
                  Nenhuma variante encontrada.
                </TableCell>
              </TableRow>
            ) : (
              grouped.map((group) => {
                const isExpanded = Boolean(expandedProducts[group.productId]);

                return (
                <Fragment key={group.productId}>
                  <TableRow className="border-white/5 cursor-pointer bg-white/[0.02] hover:bg-white/[0.04] transition-colors">
                    <TableCell colSpan={7} className="py-3 pl-4 pr-4 cursor-pointer">
                      <div className="flex items-center justify-between gap-3 cursor-pointer">
                        <button
                          type="button"
                          onClick={() => toggleProductExpanded(group.productId)}
                          className="flex min-w-0 flex-1 items-center gap-3 text-left"
                        >
                          <ChevronRight
                            className={cn(
                              "h-4 w-4 shrink-0 text-white/40 transition-transform duration-200",
                              isExpanded && "rotate-90 text-white/70"
                            )}
                          />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-white">
                              {group.productName}
                            </p>
                            <p className="mt-0.5 text-xs text-white/40">
                              {group.items.length} variante{group.items.length === 1 ? "" : "s"}
                            </p>
                          </div>
                        </button>

                        <Link
                          href={`/dashboard/admin/products/${group.productId}/variants`}
                          className="shrink-0 bg-primary p-2 py-1.5 rounded-sm text-xs font-medium text-black"
                          onClick={(e) => e.stopPropagation()}
                        >
                          Gerenciar variantes
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>

                  {isExpanded && group.items.map((variant) => {
                    const status = getStockStatusMeta(variant.stockStatus);
                    const isEditing = editingId === variant.id;
                    const isAutomatic = supportsBulkUpload(variant.deliveryType);

                    return (
                      <TableRow
                        key={variant.id}
                        className="border-white/5 hover:bg-white/[0.01] cursor-pointer transition-colors group"
                      >
                        <TableCell className="pl-12 py-4">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-white">{variant.name}</span>
                            <span className="bg-white/5 max-w-fit rounded py-1 px-2 mt-0.5 text-xs text-muted-foreground">
                              {variant.sku ? `SKU: ${variant.sku}` : `ID: #${variant.id}`}
                            </span>
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge variant="outline" className="text-xs bg-white/5 rounded lowercase border-none text-muted-foreground">
                            {DELIVERY_LABELS[variant.deliveryType]}
                          </Badge>
                        </TableCell>

                        <TableCell>
                          <div
                            className={cn(
                              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded border-none text-xs font-medium lowercase",
                              status.bg,
                              status.color
                            )}
                          >
                            {status.label}
                          </div>
                        </TableCell>

                        <TableCell className="text-center">
                          {isEditing && !isAutomatic ? (
                            <div className="flex items-center justify-center">
                              <Input
                                type="number"
                                min={0}
                                value={editValue}
                                onChange={(e) => setEditValue(parseInt(e.target.value, 10) || 0)}
                                className="h-9 w-15 border-none bg-transparent text-center"
                              />
                              <Button
                                size="icon"
                                className="h-9 w-9 bg-transparent text-white"
                                onClick={() => updateMutation.mutate({ id: variant.id, stock: editValue })}
                                disabled={updateMutation.isPending}
                              >
                                {updateMutation.isPending ? (
                                  <Loader2 size={14} className="animate-spin" />
                                ) : (
                                  <Check className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                if (!isAutomatic) {
                                  setEditingId(variant.id);
                                  setEditValue(variant.available);
                                }
                              }}
                              className={cn("text-sm font-medium text-white cursor-pointer")}
                            >
                              {variant.available}
                            </button>
                          )}
                        </TableCell>

                        <TableCell className="text-center">
                          <div className="flex items-center justify-center max-w-fit bg-amber-500/10 text-amber-500 rounded py-1 px-6 gap-1 text-sm font-medium">
                            {variant.reserved}
                          </div>
                        </TableCell>

                        <TableCell className="text-center">
                          <div className="flex items-center justify-center max-w-fit bg-blue-500/10 text-blue-500 rounded py-1 px-6 gap-1 text-sm font-medium">
                            {variant.delivered}
                          </div>
                        </TableCell>

                        <TableCell className="text-right pr-6">
                          <div className="flex items-center justify-end gap-1">
                            {isAutomatic ? (
                              <>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 gap-1 text-xs"
                                  onClick={() => setCodesVariant(variant)}
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                  Códigos
                                </Button>
                                <Can I="products:edit">
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 gap-1 text-xs text-purple-400 hover:text-purple-300"
                                    onClick={() => setUploadVariant(variant)}
                                  >
                                    <Upload className="h-3.5 w-3.5" />
                                    Adicionar
                                  </Button>
                                </Can>
                              </>
                            ) : (
                              <Can I="products:edit">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 gap-1 text-xs"
                                  onClick={() => {
                                    setEditingId(variant.id);
                                    setEditValue(variant.available);
                                  }}
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                  Editar
                                </Button>
                              </Can>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </Fragment>
              );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {pagination && pagination.totalPages > 1 ? (
        <div className="flex items-center justify-between gap-12">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="flex-1 max-w-md"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Anterior
          </Button>
          <span className="text-sm text-muted-foreground">
            Página {pagination.page} de {pagination.totalPages}
          </span>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="flex-1 max-w-md"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Próxima
          </Button>
        </div>
      ) : null}

      <InventoryBulkUploadDialog
        open={Boolean(uploadVariant)}
        onOpenChange={(open) => !open && setUploadVariant(null)}
        variant={uploadVariant}
        onSuccess={handleRefresh}
      />

      <InventoryCodesDialog
        open={Boolean(codesVariant)}
        onOpenChange={(open) => !open && setCodesVariant(null)}
        variant={codesVariant}
      />
    </div>
  );
};