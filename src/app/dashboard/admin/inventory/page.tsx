"use client";

import { Fragment, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import {
  Search,
  Package,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Loader2,
  Save,
  Upload,
  Eye,
  Edit2,
  Layers,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  inventoryApi,
  type DeliveryType,
  type InventoryStockStatus,
  type InventoryVariantItem,
} from "@/lib/admin-api";
import { InventoryBulkUploadDialog } from "@/components/admin/inventory/inventory-bulk-upload-dialog";
import { InventoryCodesDialog } from "@/components/admin/inventory/inventory-codes-dialog";
import { Can } from "@/providers/PermissionProvider";
import { cn } from "@/lib/utils";

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

  return (
    <div className="space-y-6 pb-10 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/dashboard/admin" className="text-zinc-500 hover:text-white transition-colors">
              <ArrowLeft size={16} />
            </Link>
            <h1 className="text-2xl font-bold text-white tracking-tight">Inventário por Variante</h1>
          </div>
          <p className="text-sm text-zinc-500">
            Controle códigos, estoque disponível e alertas por variante de cada produto.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-white/5 bg-[#0A0A0A] p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <AlertTriangle className="text-amber-500" size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Estoque baixo</p>
            <p className="text-xl font-black text-white">{summary?.lowStock ?? 0}</p>
          </div>
        </div>
        <div className="rounded-2xl border border-white/5 bg-[#0A0A0A] p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <XCircle className="text-red-500" size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Sem estoque</p>
            <p className="text-xl font-black text-white">{summary?.outOfStock ?? 0}</p>
          </div>
        </div>
        <div className="rounded-2xl border border-white/5 bg-[#0A0A0A] p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <CheckCircle2 className="text-emerald-500" size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Em dia</p>
            <p className="text-xl font-black text-white">{summary?.inStock ?? 0}</p>
          </div>
        </div>
        <div className="rounded-2xl border border-white/5 bg-[#0A0A0A] p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
            <Layers className="text-purple-400" size={24} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Variantes</p>
            <p className="text-xl font-black text-white">{summary?.totalVariants ?? 0}</p>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-white/5 bg-[#0A0A0A] p-4 md:p-6 space-y-6">
        <div className="flex flex-col lg:flex-row gap-4 justify-between">
          <div className="relative w-full lg:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input
              placeholder="Buscar produto, variante ou SKU..."
              className="bg-[#0D0D0D] border-white/5 pl-10 h-11"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={statusFilter}
              onValueChange={(val: "all" | InventoryStockStatus) => {
                setStatusFilter(val);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[170px] bg-[#0D0D0D] border-white/10 h-11">
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
              <SelectTrigger className="w-[190px] bg-[#0D0D0D] border-white/10 h-11">
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

        <div className="rounded-2xl border border-white/5 overflow-hidden">
          <Table>
            <TableHeader className="bg-white/[0.02]">
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-zinc-600 pl-6 py-4">
                  Variante
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-zinc-600">
                  Tipo
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-zinc-600">
                  Status
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-zinc-600 text-center">
                  Disponível
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-zinc-600 text-center">
                  Reservado
                </TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest text-zinc-600 text-center">
                  Entregue
                </TableHead>
                <TableHead className="text-right text-[10px] font-black uppercase tracking-widest text-zinc-600 pr-6">
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
                grouped.map((group) => (
                  <Fragment key={group.productId}>
                    <TableRow className="border-white/5 bg-white/[0.02]">
                      <TableCell colSpan={7} className="py-3 pl-6">
                        <div className="flex items-center gap-3">
                          <Package className="h-4 w-4 text-purple-400" />
                          <span className="text-sm font-bold text-white">{group.productName}</span>
                          <Badge variant="outline" className="text-[10px] border-white/10 text-zinc-500">
                            {group.items.length} variante(s)
                          </Badge>
                          <Link
                            href={`/dashboard/admin/products/${group.productId}/variants`}
                            className="text-[10px] text-purple-400 hover:text-purple-300 uppercase font-bold tracking-wider"
                          >
                            Gerenciar variantes
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                    {group.items.map((variant) => {
                      const status = getStockStatusMeta(variant.stockStatus);
                      const StatusIcon = status.icon;
                      const isEditing = editingId === variant.id;
                      const isAutomatic = supportsBulkUpload(variant.deliveryType);

                      return (
                        <TableRow
                          key={variant.id}
                          className="border-white/5 hover:bg-white/[0.01] transition-colors group"
                        >
                          <TableCell className="pl-10 py-4">
                            <div className="flex flex-col">
                              <span className="text-sm font-semibold text-white">{variant.name}</span>
                              <span className="text-[10px] text-zinc-600 uppercase font-bold tracking-tighter">
                                {variant.sku ? `SKU: ${variant.sku}` : `ID: #${variant.id}`}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px] bg-white/5 border-white/10 text-zinc-400">
                              {DELIVERY_LABELS[variant.deliveryType]}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div
                              className={cn(
                                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider",
                                status.bg,
                                status.color
                              )}
                            >
                              <StatusIcon size={12} />
                              {status.label}
                            </div>
                          </TableCell>
                          <TableCell className="text-center">
                            {isEditing && !isAutomatic ? (
                              <div className="flex items-center justify-center gap-2">
                                <Input
                                  type="number"
                                  min={0}
                                  value={editValue}
                                  onChange={(e) => setEditValue(parseInt(e.target.value, 10) || 0)}
                                  className="h-9 w-20 bg-[#0D0D0D] border-purple-500/50 text-white font-bold text-center"
                                />
                                <Button
                                  size="icon"
                                  className="h-9 w-9 bg-emerald-500 hover:bg-emerald-600 text-white"
                                  onClick={() => updateMutation.mutate({ id: variant.id, stock: editValue })}
                                  disabled={updateMutation.isPending}
                                >
                                  {updateMutation.isPending ? (
                                    <Loader2 size={14} className="animate-spin" />
                                  ) : (
                                    <Save size={14} />
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
                                className={cn(
                                  "text-sm font-black text-white",
                                  !isAutomatic && "hover:text-purple-400 transition-colors"
                                )}
                              >
                                {variant.available}
                                {!isAutomatic ? (
                                  <Edit2
                                    size={10}
                                    className="inline ml-1 text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                  />
                                ) : null}
                              </button>
                            )}
                          </TableCell>
                          <TableCell className="text-center text-sm text-amber-400 font-semibold">
                            {variant.reserved}
                          </TableCell>
                          <TableCell className="text-center text-sm text-blue-400 font-semibold">
                            {variant.delivered}
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
                                  <Can permission="products:edit">
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
                                <Can permission="products:edit">
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
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {pagination && pagination.totalPages > 1 ? (
          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Anterior
            </Button>
            <span className="text-xs text-muted-foreground">
              Página {pagination.page} de {pagination.totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              disabled={page >= pagination.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Próxima
            </Button>
          </div>
        ) : null}
      </div>

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
}
