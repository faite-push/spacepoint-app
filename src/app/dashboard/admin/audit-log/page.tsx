"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FileText, Search, ScrollText } from "lucide-react";

import { Can } from "@/providers/PermissionProvider";
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
  const [selectedLog, setSelectedLog] = useState<AdminAuditLog | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "audit-logs", action, targetId, page],
    queryFn: () =>
      auditLogsApi.list({
        action: action === "all" ? undefined : action,
        targetId: targetId || undefined,
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

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Select
            value={action}
            onValueChange={(value) => {
              setAction(value);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full sm:w-[260px]">
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

          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={targetId}
              onChange={(e) => {
                setTargetId(e.target.value);
                setPage(1);
              }}
              placeholder="Buscar por ID do alvo (pedido, produto...)"
              className="pl-9"
            />
          </div>
        </div>

        <div className="rounded-md border border-white/10 bg-black/20">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>Resumo</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead className="w-[90px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={5}>
                      <Skeleton className="h-8 w-full" />
                    </TableCell>
                  </TableRow>
                ))
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                    <ScrollText className="mx-auto mb-2 h-8 w-8 opacity-40" />
                    Nenhum registro encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {format(new Date(log.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="font-medium text-white">
                      {ACTION_LABELS[log.action] || log.action}
                    </TableCell>
                    <TableCell className="max-w-[320px] truncate text-muted-foreground">
                      {summarizeLog(log)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {log.actor?.name || log.actor?.email || "Sistema"}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedLog(log)}
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

      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-2xl">
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
            <pre className="max-h-[420px] overflow-auto rounded-md border border-white/10 bg-black/40 p-4 text-xs text-zinc-300">
              {JSON.stringify(
                {
                  id: selectedLog.id,
                  action: selectedLog.action,
                  targetType: selectedLog.targetType,
                  targetId: selectedLog.targetId,
                  actor: selectedLog.actor,
                  ip: selectedLog.ip,
                  metadata: selectedLog.metadata,
                },
                null,
                2
              )}
            </pre>
          )}
        </DialogContent>
      </Dialog>
    </Can>
  );
}
