"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FileText, Search, ScrollText, User, Eye, EyeOff } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { Can } from "@/providers/PermissionProvider";
import { DateRangeFilter } from "@/components/admin/dashboard/DateRangeFilter";
import { getRangeForPreset } from "@/lib/date-range-presets";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { auditLogsApi, type AdminAuditLog } from "@/lib/admin-api";

const ACTION_LABELS: Record<string, string> = {
  ORDER_REFUND: "Reembolso de pedido",
  PRODUCT_PRICE_CHANGE: "Preço alterado (produto)",
  VARIANT_PRICE_CHANGE: "Preço alterado (variante)",
  PRODUCT_PRICE_BULK_CHANGE: "Preço alterado em massa",
  ORDER_ITEM_DELIVERED: "Entrega manual",
};

function formatMoney(value: unknown) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function summarizeLog(log: AdminAuditLog) {
  const meta = (log.metadata || {}) as Record<string, unknown>;

  switch (log.action) {
    case "ORDER_REFUND":
      return `Pedido #${log.targetId} — ${formatMoney((Number(meta.amount) || 0) / 100)}`;
    case "PRODUCT_PRICE_CHANGE":
      return `${meta.productName || log.targetId}: ${formatMoney(meta.oldPrice)} → ${formatMoney(meta.newPrice)}`;
    case "VARIANT_PRICE_CHANGE":
      return `${meta.productName || ""} / ${meta.variantName || log.targetId}: ${formatMoney(meta.oldPrice)} → ${formatMoney(meta.newPrice)}`;
    case "PRODUCT_PRICE_BULK_CHANGE":
      return `${meta.updatedProducts || 0} produto(s), ${meta.updatedVariants || 0} variante(s)`;
    case "ORDER_ITEM_DELIVERED":
      return `${meta.productName || "Item"} — ${meta.quantityDelivered || 1}x (pedido #${meta.orderId || "—"})`;
    default:
      return log.targetId ? `${log.targetType || "alvo"}: ${log.targetId}` : "—";
  }
}

export default function AdminAuditLogPage() {
  const [action, setAction] = useState<string>("all");
  const [targetId, setTargetId] = useState("");
  const [page, setPage] = useState(1);
  const [dateRange, setDateRange] = useState(getRangeForPreset("30d"));
  const [selectedLog, setSelectedLog] = useState<AdminAuditLog | null>(null);
  const [showAllData, setShowAllData] = useState(false);
  const [visibleFields, setVisibleFields] = useState<Record<string, boolean>>({});

  const isVisible = (key: string) => showAllData ? visibleFields[key] !== false : !!visibleFields[key];

  const handleToggleField = (key: string) => {
    setVisibleFields(prev => {
      const current = showAllData ? prev[key] !== false : !!prev[key];
      return { ...prev, [key]: !current };
    });
  };

  const handleToggleAll = () => {
    setShowAllData(!showAllData);
    setVisibleFields({});
  };

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "audit-logs", action, targetId, dateRange.from.toISOString(), dateRange.to.toISOString(), page],
    queryFn: () =>
      auditLogsApi.list({
        action: action === "all" ? undefined : action,
        targetId: targetId || undefined,
        from: dateRange.from.toISOString(),
        to: dateRange.to.toISOString(),
        page,
      }),
  });

  const logs = data?.logs ?? [];
  const pagination = data?.pagination;
  const actionOptions = useMemo(() => data?.actions ?? Object.keys(ACTION_LABELS), [data?.actions]);

  return (
    <Can I="audit:view" message="Você não tem permissão para ver a auditoria.">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Auditoria</h1>
          <p className="text-sm text-muted-foreground">
            Trilha de ações sensíveis: reembolsos, alterações de preço e entregas manuais.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 group w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-white transition-colors" />
            <Input
              value={targetId}
              onChange={(e) => {
                setTargetId(e.target.value);
                setPage(1);
              }}
              placeholder="Buscar por ID do alvo (pedido, produto...)"
              className="pl-11"
            />
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <DateRangeFilter defaultPreset="30d" onRangeChange={setDateRange} />
            </div>

            <Select
              value={action}
              onValueChange={(value) => {
                setAction(value);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full md:w-[260px]">
                <SelectValue placeholder="Filtrar por ação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as ações</SelectItem>
                {actionOptions.map((item) => (
                  <SelectItem key={item} value={item}>
                    {ACTION_LABELS[item] || item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-md border border-white/10 bg-black/20">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Admin</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead className="w-[90px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={4}>
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                    <ScrollText className="mx-auto mb-2 h-8 w-8 opacity-40" />
                    Nenhum registro encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 border border-white/10">
                          <AvatarImage src={log.actor?.image || ""} alt={log.actor?.name || ""} />
                          <AvatarFallback className="bg-white/5">
                            <User className="h-5 w-5 text-muted-foreground" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-medium text-white text-sm leading-tight">
                            {log.actor?.name || log.actor?.email || "Sistema"}
                          </span>
                          <span className="text-xs text-white/50 mt-0.5">
                            {log.actor?.role?.name || "Administrador"}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {format(new Date(log.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="font-medium text-white">
                      {ACTION_LABELS[log.action] || log.action}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedLog(log);
                          setShowAllData(false);
                          setVisibleFields({});
                        }}
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {pagination && pagination.pages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Página {pagination.page} de {pagination.pages} ({pagination.total} registros)
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= pagination.pages}
                onClick={() => setPage((p) => p + 1)}
              >
                Próxima
              </Button>
            </div>
          </div>
        )}
      </div>

      <Dialog open={!!selectedLog} onOpenChange={(open) => {
        if (!open) {
          setSelectedLog(null);
          setShowAllData(false);
          setVisibleFields({});
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedLog ? ACTION_LABELS[selectedLog.action] || selectedLog.action : "Detalhes"}
            </DialogTitle>
            <DialogDescription>
              {selectedLog
                ? format(new Date(selectedLog.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                : ""}
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="rounded-md border border-white/10 bg-black/40 p-4">
                <h4 className="text-sm font-medium text-white mb-2">Resumo da Ação</h4>
                <p className="text-sm text-muted-foreground">{summarizeLog(selectedLog)}</p>
              </div>

              <div className="rounded-md border border-white/10 bg-black/40 p-4 space-y-4">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <h4 className="text-sm font-medium text-white">Informações Detalhadas</h4>
                  <Button variant="outline" size="sm" onClick={handleToggleAll} className="gap-2">
                    {showAllData ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    {showAllData ? "Ocultar" : "Mostrar"}
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {[
                    { key: "id", label: "ID do Registro", value: selectedLog.id },
                    { key: "action", label: "Ação (Nome Bruto)", value: selectedLog.action },
                    { key: "targetType", label: "Tipo de Alvo", value: selectedLog.targetType || "—" },
                    { key: "targetId", label: "ID do Alvo", value: selectedLog.targetId || "—" },
                    { key: "ip", label: "Endereço IP", value: selectedLog.ip || "—" },
                    { key: "actorId", label: "ID do Admin", value: selectedLog.actor?.id || "—" },
                    { key: "actorName", label: "Nome do Admin", value: selectedLog.actor?.name || "—" },
                    { key: "actorEmail", label: "E-mail do Admin", value: selectedLog.actor?.email || "—" },
                  ].map((field) => {
                    const vis = isVisible(field.key);
                    return (
                      <div key={field.key} className="flex flex-col gap-1">
                        <span className="text-muted-foreground">{field.label}</span>
                        <span 
                          className="text-white font-mono cursor-pointer hover:text-blue-400 transition-colors break-all" 
                          onClick={() => handleToggleField(field.key)}
                        >
                          {vis ? field.value : "••••••••••••••••••••••••"}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                  <div className="mt-4 pt-4 border-t border-white/10">
                    <span className="text-muted-foreground block mb-3">Metadados Adicionais</span>
                    <div className="space-y-3">
                      {Object.entries(selectedLog.metadata).map(([key, value]) => {
                        const mKey = `meta_${key}`;
                        const vis = isVisible(mKey);
                        return (
                          <div key={key} className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2">
                            <span className="text-zinc-400 min-w-[140px] font-medium">{key}:</span>
                            <span 
                              className="text-white font-mono cursor-pointer hover:text-blue-400 transition-colors break-all" 
                              onClick={() => handleToggleField(mKey)}
                            >
                              {vis ? JSON.stringify(value) : "••••••••••••••••••••••••"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Can>
  );
}
