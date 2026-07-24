"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ptBR } from "date-fns/locale";
import { format } from "date-fns";

import { ChevronRight, ListPlus, ListMinus, ListRestart, MessageSquare, PackagePlus, PackageMinus, Package, ScrollText, Shield, Plug, Ticket, FolderTree, Settings, CreditCard, ImageIcon, Truck, Banknote, } from "lucide-react";
import { TbCactusFilled } from "react-icons/tb";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { DateRangeFilter } from "@/components/admin/dashboard/DateRangeFilter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getRangeForPreset } from "@/lib/date-range-presets";
import { Can } from "@/providers/PermissionProvider";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

import { cn } from "@/lib/utils";
import { auditLogsApi, type AdminAuditLog } from "@/lib/admin-api";
import { ScrollArea } from "@/components/ui/scroll-area";

const FALLBACK_ACTION_LABELS: Record<string, string> = {
  ORDER_REFUND: "Reembolso de pedido",
  ORDER_ITEM_DELIVERED: "Entrega manual",
  PRODUCT_CREATE: "Produto criado",
  PRODUCT_DELETE: "Produto excluído",
  PRODUCT_NAME_CHANGE: "Nome de produto",
  PRODUCT_PRICE_CHANGE: "Preço de produto",
  PRODUCT_UPDATE: "Produto atualizado",
  PRODUCT_PRICE_BULK_CHANGE: "Preço em massa",
  VARIANT_CREATE: "Variante criada",
  VARIANT_DELETE: "Variante excluída",
  VARIANT_NAME_CHANGE: "Nome de variante",
  VARIANT_PRICE_CHANGE: "Preço de variante",
  VARIANT_UPDATE: "Variante atualizada",
  CATEGORY_CREATE: "Categoria criada",
  CATEGORY_UPDATE: "Categoria atualizada",
  CATEGORY_DELETE: "Categoria excluída",
  COUPON_CREATE: "Cupom criado",
  COUPON_UPDATE: "Cupom atualizado",
  COUPON_DELETE: "Cupom excluído",
  ROLE_CREATE: "Cargo criado",
  ROLE_UPDATE: "Cargo atualizado",
  ROLE_DELETE: "Cargo excluído",
  TEAM_ROLE_ASSIGN: "Cargo da equipe",
  PLUGIN_UPDATE: "Plugin alterado",
  SETTINGS_UPDATE: "Configurações",
  GATEWAY_UPDATE: "Gateway atualizado",
  BANNER_CREATE: "Banner criado",
  BANNER_UPDATE: "Banner atualizado",
  BANNER_DELETE: "Banner excluído",
};

type Tone = "create" | "delete" | "update" | "neutral";

function actionTone(action: string): Tone {
  if (action.includes("DELETE") || action === "ORDER_REFUND") return "delete";
  if (action.includes("CREATE") || action === "ORDER_ITEM_DELIVERED") return "create";
  if (action.includes("CHANGE") || action.includes("UPDATE") || action.includes("ASSIGN")) {
    return "update";
  }
  return "neutral";
}

function ActionGlyph({ action }: { action: string }) {
  const tone = actionTone(action);
  const wrap = cn(
    "relative flex size-9 shrink-0 items-center justify-center rounded-md border-none",
    tone === "create" && "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
    tone === "delete" && "border-red-500/30 bg-red-500/10 text-red-400",
    tone === "update" && "border-amber-500/30 bg-amber-500/10 text-amber-400",
    tone === "neutral" && "border-white/10 bg-white/5 text-white/60"
  );

  const Icon =
    action.startsWith("PRODUCT")
      ? action.includes("CREATE")
        ? PackagePlus
        : action.includes("DELETE")
          ? PackageMinus
          : Package
      : action.startsWith("VARIANT")
        ? ListRestart
        : action.startsWith("CATEGORY")
          ? FolderTree
          : action.startsWith("COUPON")
            ? Ticket
            : action.startsWith("ROLE") || action === "TEAM_ROLE_ASSIGN"
              ? Shield
              : action === "PLUGIN_UPDATE"
                ? Plug
                : action === "SETTINGS_UPDATE"
                  ? Settings
                  : action === "GATEWAY_UPDATE"
                    ? CreditCard
                    : action.startsWith("BANNER")
                      ? ImageIcon
                      : action === "ORDER_ITEM_DELIVERED"
                        ? Truck
                        : action === "ORDER_REFUND"
                          ? Banknote
                          : actionTone(action) === "create"
                            ? ListPlus
                            : actionTone(action) === "delete"
                              ? ListMinus
                              : MessageSquare;

  return (
    <div className={wrap}>
      <Icon className="size-4" />
    </div>
  );
}

function formatMoney(value: unknown) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function Bold({ children }: { children: React.ReactNode }) {
  return <span className="font-semibold text-white">{children}</span>;
}

function actorName(log: AdminAuditLog) {
  return log.actor?.name || log.actor?.email || "Sistema";
}

function describeLog(log: AdminAuditLog): React.ReactNode {
  const meta = (log.metadata || {}) as Record<string, any>;
  const who = actorName(log);

  switch (log.action) {
    case "PRODUCT_PRICE_CHANGE":
      return (
        <>
          <Bold>{who}</Bold> alterou o preço do produto{" "}
          <Bold>{String(meta.productName || log.targetId)}</Bold> de{" "}
          <Bold>{formatMoney(meta.oldPrice)}</Bold> para{" "}
          <Bold>{formatMoney(meta.newPrice)}</Bold>
        </>
      );
    case "VARIANT_PRICE_CHANGE":
      return (
        <>
          <Bold>{who}</Bold> alterou o preço da variante{" "}
          <Bold>{String(meta.variantName || log.targetId)}</Bold>
          {meta.productName ? (
            <>
              {" "}
              do produto <Bold>{String(meta.productName)}</Bold>
            </>
          ) : null}{" "}
          de <Bold>{formatMoney(meta.oldPrice)}</Bold> para{" "}
          <Bold>{formatMoney(meta.newPrice)}</Bold>
        </>
      );
    case "PRODUCT_NAME_CHANGE":
      return (
        <>
          <Bold>{who}</Bold> alterou o nome do produto de{" "}
          <Bold>{String(meta.oldName)}</Bold> para <Bold>{String(meta.newName)}</Bold>
        </>
      );
    case "VARIANT_NAME_CHANGE":
      return (
        <>
          <Bold>{who}</Bold> alterou o nome da variante de{" "}
          <Bold>{String(meta.oldName)}</Bold> para <Bold>{String(meta.newName)}</Bold>
          {meta.productName ? (
            <>
              {" "}
              em <Bold>{String(meta.productName)}</Bold>
            </>
          ) : null}
        </>
      );
    case "PRODUCT_CREATE":
      return (
        <>
          <Bold>{who}</Bold> criou o produto <Bold>{String(meta.productName || log.targetId)}</Bold>
        </>
      );
    case "PRODUCT_DELETE":
      return (
        <>
          <Bold>{who}</Bold> excluiu o produto <Bold>{String(meta.productName || log.targetId)}</Bold>
        </>
      );
    case "PRODUCT_UPDATE":
      return (
        <>
          <Bold>{who}</Bold> atualizou o produto{" "}
          <Bold>{String(meta.productName || log.targetId)}</Bold>
          {Array.isArray(meta.changes) && meta.changes.length
            ? ` (${meta.changes.map((c: any) => c.field).join(", ")})`
            : ""}
        </>
      );
    case "PRODUCT_PRICE_BULK_CHANGE":
      return (
        <>
          <Bold>{who}</Bold> alterou preços em massa —{" "}
          <Bold>{String(meta.updatedProducts || 0)}</Bold> produto(s) e{" "}
          <Bold>{String(meta.updatedVariants || 0)}</Bold> variante(s)
        </>
      );
    case "VARIANT_CREATE":
      return (
        <>
          <Bold>{who}</Bold> criou a variante <Bold>{String(meta.variantName || log.targetId)}</Bold>
          {meta.productName ? (
            <>
              {" "}
              em <Bold>{String(meta.productName)}</Bold>
            </>
          ) : null}
        </>
      );
    case "VARIANT_DELETE":
      return (
        <>
          <Bold>{who}</Bold> excluiu a variante{" "}
          <Bold>{String(meta.variantName || log.targetId)}</Bold>
          {meta.productName ? (
            <>
              {" "}
              de <Bold>{String(meta.productName)}</Bold>
            </>
          ) : null}
        </>
      );
    case "VARIANT_UPDATE":
      return (
        <>
          <Bold>{who}</Bold> atualizou a variante{" "}
          <Bold>{String(meta.variantName || log.targetId)}</Bold>
        </>
      );
    case "CATEGORY_CREATE":
      return (
        <>
          <Bold>{who}</Bold> criou a categoria{" "}
          <Bold>{String(meta.categoryName || log.targetId)}</Bold>
        </>
      );
    case "CATEGORY_UPDATE":
      return (
        <>
          <Bold>{who}</Bold> atualizou a categoria{" "}
          <Bold>{String(meta.categoryName || meta.newName || log.targetId)}</Bold>
          {meta.oldName && meta.newName && meta.oldName !== meta.newName ? (
            <>
              {" "}
              (nome de <Bold>{String(meta.oldName)}</Bold> para{" "}
              <Bold>{String(meta.newName)}</Bold>)
            </>
          ) : null}
        </>
      );
    case "CATEGORY_DELETE":
      return (
        <>
          <Bold>{who}</Bold> excluiu a categoria{" "}
          <Bold>{String(meta.categoryName || log.targetId)}</Bold>
        </>
      );
    case "COUPON_CREATE":
      return (
        <>
          <Bold>{who}</Bold> criou o cupom <Bold>{String(meta.code || log.targetId)}</Bold>
        </>
      );
    case "COUPON_UPDATE":
      return (
        <>
          <Bold>{who}</Bold> atualizou o cupom <Bold>{String(meta.code || log.targetId)}</Bold>
        </>
      );
    case "COUPON_DELETE":
      return (
        <>
          <Bold>{who}</Bold> excluiu o cupom <Bold>{String(meta.code || log.targetId)}</Bold>
        </>
      );
    case "ROLE_CREATE":
      return (
        <>
          <Bold>{who}</Bold> criou o cargo <Bold>{String(meta.roleName || log.targetId)}</Bold>
        </>
      );
    case "ROLE_UPDATE":
      return (
        <>
          <Bold>{who}</Bold> atualizou o cargo{" "}
          <Bold>{String(meta.roleName || meta.newName || log.targetId)}</Bold>
        </>
      );
    case "ROLE_DELETE":
      return (
        <>
          <Bold>{who}</Bold> excluiu o cargo <Bold>{String(meta.roleName || log.targetId)}</Bold>
        </>
      );
    case "TEAM_ROLE_ASSIGN":
      return (
        <>
          <Bold>{who}</Bold> alterou o cargo de{" "}
          <Bold>{String(meta.userName || log.targetId)}</Bold> de{" "}
          <Bold>{String(meta.oldRoleName || "sem cargo")}</Bold> para{" "}
          <Bold>{String(meta.newRoleName || "sem cargo")}</Bold>
        </>
      );
    case "PLUGIN_UPDATE": {
      const plugins = Array.isArray(meta.plugins) ? meta.plugins : [];
      const first = plugins[0];
      if (first) {
        const state =
          first.oldEnabled !== first.newEnabled
            ? first.newEnabled
              ? "ativou"
              : "desativou"
            : "configurou";
        return (
          <>
            <Bold>{who}</Bold> {state} o plugin <Bold>{String(first.pluginId)}</Bold>
            {plugins.length > 1 ? ` (+${plugins.length - 1})` : ""}
          </>
        );
      }
      return (
        <>
          <Bold>{who}</Bold> alterou configurações de plugins
        </>
      );
    }
    case "SETTINGS_UPDATE":
      return (
        <>
          <Bold>{who}</Bold> atualizou configurações da loja
          {meta.section ? (
            <>
              {" "}
              em <Bold>{String(meta.section)}</Bold>
            </>
          ) : null}
        </>
      );
    case "GATEWAY_UPDATE":
      return (
        <>
          <Bold>{who}</Bold>{" "}
          {meta.toggled
            ? meta.newActive
              ? "ativou"
              : "desativou"
            : "atualizou"}{" "}
          o gateway <Bold>{String(meta.gatewayName || log.targetId)}</Bold>
        </>
      );
    case "BANNER_CREATE":
      return (
        <>
          <Bold>{who}</Bold> criou um <Bold>banner</Bold>
        </>
      );
    case "BANNER_UPDATE":
      return (
        <>
          <Bold>{who}</Bold> atualizou um <Bold>banner</Bold>
        </>
      );
    case "BANNER_DELETE":
      return (
        <>
          <Bold>{who}</Bold> excluiu um <Bold>banner</Bold>
        </>
      );
    case "ORDER_REFUND":
      return (
        <>
          <Bold>{who}</Bold> reembolsou o pedido <Bold>#{log.targetId}</Bold>
          {meta.amount != null ? (
            <>
              {" "}
              no valor de <Bold>{formatMoney((Number(meta.amount) || 0) / 100)}</Bold>
            </>
          ) : null}
        </>
      );
    case "ORDER_ITEM_DELIVERED":
      return (
        <>
          <Bold>{who}</Bold> entregou manualmente{" "}
          <Bold>{String(meta.productName || "um item")}</Bold>
          {meta.orderId ? (
            <>
              {" "}
              no pedido <Bold>#{String(meta.orderId)}</Bold>
            </>
          ) : null}
        </>
      );
    default:
      return (
        <>
          <Bold>{who}</Bold> executou <Bold>{log.action}</Bold>
          {log.targetId ? (
            <>
              {" "}
              em <Bold>{log.targetId}</Bold>
            </>
          ) : null}
        </>
      );
  }
}

function hasExpandableDetails(log: AdminAuditLog) {
  return Boolean(log.metadata && Object.keys(log.metadata).length > 0);
}

function AuditLogCard({ log }: { log: AdminAuditLog }) {
  const [open, setOpen] = useState(false);
  const expandable = hasExpandableDetails(log);

  return (
    <div className="rounded-md border border-white/5 bg-transparent transition-colors hover:bg-black/10">
      <button
        type="button"
        onClick={() => expandable && setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center gap-3 px-4 py-3.5 text-left",
          expandable ? "cursor-pointer" : "cursor-default"
        )}
      >
        <ActionGlyph action={log.action} />
        <Avatar className="mt-0.5 size-9 border border-white/10">
          <AvatarImage src={log.actor?.image || ""} alt={actorName(log)} />
          <AvatarFallback className="bg-white/5 text-xs font-semibold text-white/70">
            {actorName(log).slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1">
          <p className="text-sm leading-relaxed text-white/80">{describeLog(log)}</p>
          <p className="mt-1 text-xs text-white/40">
            {format(new Date(log.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
          </p>
        </div>

        {expandable ? (
          <ChevronRight
            className={cn(
              "mt-1 size-4 shrink-0 text-white/35 transition-transform",
              open && "rotate-90"
            )}
          />
        ) : (
          <span className="size-4 shrink-0" />
        )}
      </button>

      {expandable && open ? (
        <div className="space-y-2 border-t border-white/5 px-4 py-3 text-xs text-white/55">
          {log.ip ? (
            <p>
              IP: <span className="font-mono text-white/75">{log.ip}</span>
            </p>
          ) : null}
          {log.targetType || log.targetId ? (
            <p>
              Alvo:{" "}
              <span className="font-mono text-white/75">
                {log.targetType || "—"}
                {log.targetId ? ` / ${log.targetId}` : ""}
              </span>
            </p>
          ) : null}
          <pre className="overflow-x-auto rounded-lg bg-black/40 p-3 font-mono text-[11px] leading-relaxed text-white/70">
            {JSON.stringify(log.metadata, null, 2)}
          </pre>
        </div>
      ) : null}
    </div>
  );
}

export default function AdminAuditLogPage() {
  const [action, setAction] = useState<string>("all");
  const [actorUserId, setActorUserId] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [dateRange, setDateRange] = useState(getRangeForPreset("30d"));

  const { data, isLoading } = useQuery({
    queryKey: [
      "admin",
      "audit-logs",
      action,
      actorUserId,
      dateRange.from.toISOString(),
      dateRange.to.toISOString(),
      page,
    ],
    queryFn: () =>
      auditLogsApi.list({
        action: action === "all" ? undefined : action,
        actorUserId: actorUserId === "all" ? undefined : actorUserId,
        from: dateRange.from.toISOString(),
        to: dateRange.to.toISOString(),
        page,
      }),
  });

  const logs = data?.logs ?? [];
  const actors = data?.actors ?? [];
  const pagination = data?.pagination;
  const actionLabels = data?.actionLabels ?? FALLBACK_ACTION_LABELS;
  const actionOptions = useMemo(
    () => data?.actions ?? Object.keys(FALLBACK_ACTION_LABELS),
    [data?.actions]
  );

  return (
    <Can I="audit:view" message="Você não tem permissão para ver a auditoria.">
      <div className="relative space-y-6">
        <div className="absolute top-0 right-[-5%] w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-white/3 rounded-full blur-[120px] z-0 pointer-events-none" />
        <div className="absolute top-0 left-[-5%] w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-white/3 rounded-full blur-[120px] z-0 pointer-events-none" />

        <div className="flex flex-col pb-5 sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">Registro de auditoria</h1>
            <p className="text-muted-foreground">
              Histórico das ações feitas na dashboard.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            <div className="flex flex-row items-center gap-2 flex-1">
              <div className="w-full space-y-1.5">
                <Select
                  value={actorUserId}
                  onValueChange={(value) => {
                    setActorUserId(value);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Todos os usuários" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os usuários</SelectItem>
                    {actors.map((actor) => (
                      <SelectItem key={actor.id} value={actor.id}>
                        {actor.name || actor.email || actor.id}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full space-y-1.5">
                <Select
                  value={action}
                  onValueChange={(value) => {
                    setAction(value);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-full sm:w-[220px]">
                    <SelectValue placeholder="Todas as ações" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as ações</SelectItem>
                    {actionOptions.map((item) => (
                      <SelectItem key={item} value={item}>
                        {actionLabels[item] || FALLBACK_ACTION_LABELS[item] || item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="w-auto">
              <DateRangeFilter
                defaultPreset="30d"
                onRangeChange={(range) => {
                  setDateRange(range);
                  setPage(1);
                }}
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[72px] w-full rounded-xl" />
            ))
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/10 py-42 text-center">
              <TbCactusFilled className="mb-3 h-8 w-8 text-white fill-current" />
              <p className="text-sm text-muted-foreground">Nenhum registro encontrado.</p>
            </div>
          ) : (
            <div>
              <ScrollArea className="h-screen">
                <div className="flex flex-col gap-2">
                  {logs.map((log) => <AuditLogCard key={log.id} log={log} />)}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        {pagination && pagination.pages > 1 ? (
          <div className="flex items-center justify-between pt-2">
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
        ) : null}
      </div>
    </Can>
  );
}
