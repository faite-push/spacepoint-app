"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";

import { Search, CheckCircle, XCircle, Truck, Clock, ChevronLeft, ChevronRight, MoreVertical, Check, Filter, Loader2, ShoppingCart, DollarSign, Package, MessageSquare, Undo2, Send, Inbox, CreditCard, QrCode, ChevronDown, Zap, X } from "lucide-react";
import { TbCactusFilled } from "react-icons/tb";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getRangeForPreset } from "@/lib/date-range-presets";
import { format, isToday, isYesterday } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

import { formatCheckoutFieldLabel, getDeliveryOptionLabel, isExpressDelivery, stripExpressAdminNote, } from "@/lib/order-delivery";
import { OrderDeliveryCart } from "@/components/admin/orders/order-delivery-cart";
import { DateRangeFilter } from "@/components/admin/dashboard/DateRangeFilter";
import { ordersApi, chatApi, AdminOrder } from "@/lib/admin-api";
import { usePermission } from "@/providers/PermissionProvider";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { LuCheck, LuClock4 } from "react-icons/lu";
import { Toggle } from "@/components/ui/toggle";

const STATUS_FILTER_OPTIONS = [
  { value: "PENDING", label: "Pendente" },
  { value: "PAID", label: "Pago" },
  { value: "DELIVERED", label: "Entregue" },
  { value: "REFUNDED", label: "Reembolsado" },
  { value: "CANCELLED", label: "Cancelado" },
] as const;

const DEFAULT_STATUS_FILTERS = ["PAID", "DELIVERED"] as const;

function formatStatusFilterLabel(selected: string[]) {
  if (selected.length === 0) return "Todos os Status";
  if (selected.length === STATUS_FILTER_OPTIONS.length) return "Todos os Status";
  const labels = STATUS_FILTER_OPTIONS
    .filter((o) => selected.includes(o.value))
    .map((o) => o.label);
  if (labels.length <= 2) return labels.join(", ");
  return `${labels.length} status`;
}

function formatPaymentMethodLabel(method?: string) {
  const key = String(method || "PIX").toUpperCase();
  if (key === "PIX") return "Pix";
  if (key === "CARD" || key === "CREDIT_CARD") return "Cartão";
  return method || "Online";
}

function getPaymentMethodIcon(method?: string) {
  const key = String(method || "PIX").toUpperCase();
  if (key === "PIX") return QrCode;
  if (key === "CARD" || key === "CREDIT_CARD") return CreditCard;
  return DollarSign;
}

function getFulfillmentInfo(status: string) {
  switch (status.toUpperCase()) {
    case "DELIVERED":
      return { label: "Enviado", color: "text-amber-400", bg: "bg-amber-500/10", icon: Send };
    case "PAID":
      return { label: "Caixa de entrada", color: "text-sky-400", bg: "bg-sky-500/10", icon: Inbox };
    case "PENDING":
      return { label: "Aguardando", color: "text-yellow-400", bg: "bg-yellow-500/10", icon: Clock };
    case "REFUNDED":
      return { label: "Reembolsado", color: "text-orange-400", bg: "bg-orange-500/10", icon: Undo2 };
    case "CANCELLED":
      return { label: "Cancelado", color: "text-red-400", bg: "bg-red-500/10", icon: XCircle };
    default:
      return { label: status, color: "text-zinc-400", bg: "bg-zinc-500/10", icon: Clock };
  }
}

function formatGroupDateLabel(date: Date) {
  if (isToday(date)) return "Hoje";
  if (isYesterday(date)) return "Ontem";
  return format(date, "d, MMM yyyy", { locale: ptBR });
}

function groupOrdersByDate(orders: AdminOrder[]) {
  const groups = new Map<string, { label: string; orders: AdminOrder[] }>();

  for (const order of orders) {
    const date = new Date(order.createdAt);
    const key = format(date, "yyyy-MM-dd");
    const label = formatGroupDateLabel(date);

    if (!groups.has(key)) {
      groups.set(key, { label, orders: [] });
    }
    groups.get(key)!.orders.push(order);
  }

  return Array.from(groups.values());
}

export default function OrdersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statuses, setStatuses] = useState<string[]>([...DEFAULT_STATUS_FILTERS]);
  const [dateRange, setDateRange] = useState(getRangeForPreset("30d"));
  const [page, setPage] = useState(1);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isStatusOpen, setIsStatusOpen] = useState(false);

  const statusKey = statuses.slice().sort().join(",");
  const isAllStatuses =
    statuses.length === 0 || statuses.length === STATUS_FILTER_OPTIONS.length;

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "orders", search, statusKey, dateRange.from.toISOString(), dateRange.to.toISOString(), page],
    queryFn: () => ordersApi.list({
      search,
      status: isAllStatuses ? undefined : statuses,
      from: dateRange.from.toISOString(),
      to: dateRange.to.toISOString(),
      page,
    }),
  });

  const toggleStatus = (value: string) => {
    setStatuses((prev) => {
      if (prev.includes(value)) return prev.filter((s) => s !== value);
      return [...prev, value];
    });
    setPage(1);
  };

  const selectAllStatuses = () => {
    setStatuses([]);
    setPage(1);
  };

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => ordersApi.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
      toast.success("Status do pedido atualizado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateNotesMutation = useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string }) => ordersApi.updateNotes(id, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
      toast.success("Notas atualizadas");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const formatBRL = (cents: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(cents / 100);
  };

  const getStatusInfo = (status: string) => {
    switch (status.toUpperCase()) {
      case "PAID":
        return { label: "Aprovado", color: "bg-blue-500/15 text-blue-400 border-blue-500/20", icon: CheckCircle };
      case "PENDING":
        return { label: "Pendente", color: "bg-amber-500/15 text-amber-400 border-amber-500/20", icon: Clock };
      case "REFUNDED":
        return { label: "Reembolsado", color: "bg-orange-500/15 text-orange-400 border-orange-500/20", icon: Undo2 };
      case "CANCELLED":
        return { label: "Cancelado", color: "bg-red-500/15 text-red-400 border-red-500/20", icon: XCircle };
      default:
        return { label: status, color: "hidden", icon: Clock };
    }
  };

  const groupedOrders = useMemo(
    () => groupOrdersByDate(data?.orders ?? []),
    [data?.orders]
  );

  const StatsCard = ({ title, value, icon: Icon, trend, loading }: any) => (
    <div className="relative group select-none overflow-hidden rounded-md border border-white/3 bg-background/50 px-4 py-4 md:px-6 md:py-5 transition-all duration-300">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          {loading ? (
            <div className="h-8 w-24 animate-pulse rounded bg-white/5" />
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex bg-white/5 rounded-md h-10 w-10 items-center justify-center text-white">
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex flex-col">
                <h3 className="text-lg md:text-xl font-medium text-white tracking-tight">{value}</h3>
                <p className="text-xs md:text-sm text-white/60">{title}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative space-y-8 animate-in fade-in duration-700">
      <div className="absolute top-0 right-[-5%] w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-white/3 rounded-full blur-[120px] z-0 pointer-events-none" />
      <div className="absolute top-0 left-[-5%] w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-white/3 rounded-full blur-[120px] z-0 pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Vendas</h1>
            <p className="text-muted-foreground">Gerencie e monitore todos os pedidos da sua loja</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-2xl bg-white/5" />)
          ) : (
            <>
              <StatsCard
                title="Faturamento Bruto"
                value={formatBRL(data?.summary.totalRevenue || 0)}
                icon={DollarSign}
              />
              <StatsCard
                title="Total de Pedidos"
                value={data?.summary.totalOrders || 0}
                icon={ShoppingCart}
              />
              <StatsCard
                title="Valor Médio"
                value={formatBRL(data?.summary.avgTicket || 0)}
                icon={Package}
              />
              <StatsCard
                title="Taxas de Aprovação"
                value={`${data?.summary.paidPct || 0}%`}
                icon={CheckCircle}
              />
            </>
          )}
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 group w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-white transition-colors" />
            <Input
              placeholder="Buscar por ID, cliente ou e-mail..."
              className="pl-11"
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3">
              <DateRangeFilter defaultPreset="30d" onRangeChange={setDateRange} />
            </div>

            <div className="relative">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsStatusOpen(!isStatusOpen)}
                className={cn(
                  "h-10 px-4 rounded-md w-full md:w-auto gap-2 border-white/10 bg-transparent transition-all",
                  !isAllStatuses && "border-primary/50 bg-primary/5"
                )}
              >
                <Filter className={cn("h-4 w-4", !isAllStatuses ? "text-primary" : "text-zinc-500")} />
                <span className="font-medium whitespace-nowrap max-w-[160px] truncate">
                  {formatStatusFilterLabel(statuses)}
                </span>
                <ChevronDown className={cn("h-3 w-3 ml-auto transition-transform duration-200 opacity-50", isStatusOpen && "rotate-180")} />
              </Button>

              {isStatusOpen && (
                <>
                  <div
                    className="fixed inset-0 z-[100] cursor-default"
                    onClick={() => setIsStatusOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 w-[220px] space-y-1 bg-card border border-white/5 rounded-md p-1.5 z-[101] animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                    <div
                      className={cn(
                        "flex items-center gap-3 cursor-pointer py-1.5 px-2.5 rounded-sm transition-all duration-200",
                        isAllStatuses ? "bg-primary/20 text-primary" : "text-zinc-500 hover:text-zinc-200 hover:bg-white/5"
                      )}
                      onClick={selectAllStatuses}
                    >
                      <span className="flex-1 text-sm font-medium">Todos os Status</span>
                      {isAllStatuses && (
                        <div className="flex h-5 w-5 items-center justify-center rounded bg-primary/20">
                          <Check className="h-4 w-4 text-primary" />
                        </div>
                      )}
                    </div>

                    {STATUS_FILTER_OPTIONS.map((opt) => {
                      const isActive = !isAllStatuses && statuses.includes(opt.value);

                      return (
                        <div
                          key={opt.value}
                          className={cn(
                            "flex items-center gap-3 cursor-pointer py-1.5 px-2.5 rounded-sm transition-all duration-200 group relative",
                            isActive ? "bg-primary/20 text-primary" : "text-zinc-500 hover:text-zinc-200 hover:bg-white/5"
                          )}
                          onClick={() => toggleStatus(opt.value)}
                        >
                          <span className="flex-1 text-sm font-medium">{opt.label}</span>
                          {isActive && (
                            <div className="flex h-5 w-5 items-center justify-center rounded bg-primary/20">
                              <Check className="h-4 w-4 text-primary" />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-white/5 overflow-hidden bg-background/30">
          {isLoading ? (
            <div className="divide-y divide-white/5">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="p-4">
                  <Skeleton className="h-20 w-full bg-white/5" />
                </div>
              ))}
            </div>
          ) : data?.orders.length === 0 ? (
            <div className="flex h-[400px] flex-col items-center justify-center gap-2 text-muted-foreground">
              <TbCactusFilled className="h-8 w-8" />
              <p>Nenhum pedido encontrado</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5 select-none">
              {groupedOrders.map((group) => (
                <section key={group.label}>
                  <div className="sticky top-0 rounded-md z-10 m-1 bg-black/20 px-4 py-2.5 backdrop-blur-sm">
                    <p className="text-sm text-muted-foreground">{group.label}</p>
                  </div>

                  <div className="divide-y divide-white/[0.04]">
                    {group.orders.map((order) => {
                      const statusInfo = getStatusInfo(order.status);
                      const fulfillment = getFulfillmentInfo(order.status);
                      const FulfillmentIcon = fulfillment.icon;
                      const PaymentIcon = getPaymentMethodIcon(order.paymentMethod);

                      return (
                        <div
                          key={order.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => setSelectedOrderId(order.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") setSelectedOrderId(order.id);
                          }}
                          className="group relative grid cursor-pointer border-t border-white/5 grid-cols-1 gap-4 px-4 py-4 transition-colors hover:bg-white/[0.02] lg:grid-cols-12 lg:items-center"
                        >
                          <div className="space-y-2 lg:col-span-3">
                            <div className="flex items-center gap-2 text-sm text-white/80">
                              <Badge
                                variant="outline"
                                className={cn(
                                  "w-fit gap-1.5 rounded border-none px-2.5 py-1 text-xs font-medium lowercase",
                                  statusInfo.color
                                )}
                              >
                                {statusInfo.label}
                              </Badge>

                              {(() => {
                                const statusBadgeMap: Partial<Record<AdminOrder["status"], { label: string; color: string; icon: React.ReactNode }>> = {
                                  DELIVERED: { label: "Produto entregue", color: "bg-blue-500", icon: <LuCheck className="h-3 w-3 text-[#1a1a1a]" /> },
                                  PENDING: { label: "Pedido pendente", color: "bg-[#fcb64c]", icon: <LuClock4 className="h-3 w-3 text-[#1a1a1a]" /> },
                                  PAID: { label: "Entrega pendente", color: "bg-[#fcb64c]", icon: <LuClock4 className="h-3 w-3 text-[#1a1a1a]" /> },
                                  PROCESSING: { label: "Pedido em processamento", color: "bg-yellow-500", icon: <Clock className="h-3 w-3 text-[#1a1a1a]" /> },
                                };
                                const badge = statusBadgeMap[order.status];
                                if (!badge) return null;
                                return (
                                  <Tooltip>
                                    <TooltipTrigger
                                      render={<div className={cn("rounded-full border-2 border-black p-1 text-white font-bold", badge.color)}>{badge.icon}</div>}
                                    />
                                    <TooltipContent>
                                      <p>{badge.label}</p>
                                    </TooltipContent>
                                  </Tooltip>
                                );
                              })()}

                              <span>{formatPaymentMethodLabel(order.paymentMethod)}</span>
                            </div>

                            <p className="text-xs text-white/35">
                              ID: {order.id}
                            </p>
                          </div>

                          <div className="min-w-0 space-y-1 lg:col-span-4">
                            <p className="truncate text-sm font-medium text-white">
                              {order.customerEmail}
                            </p>
                            <p className="line-clamp-2 text-xs text-white/45">
                              {order.itemsPreview || `${order.itemsCount} item(ns)`}
                            </p>
                          </div>

                          <div className="lg:col-span-2">
                            <p className="mb-1 text-xs text-white/40">Entrega</p>
                            <div
                              className={cn(
                                "inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs font-medium",
                                fulfillment.bg,
                                fulfillment.color
                              )}
                            >
                              <FulfillmentIcon className="h-3.5 w-3.5" />
                              {fulfillment.label}
                            </div>
                          </div>

                          <div className="flex items-center justify-between lg:col-span-3 lg:flex-col lg:items-end">
                            <p className="text-lg font-medium text-white">
                              {formatBRL(order.total)}
                            </p>

                            <div className="flex flex-col items-center gap-1">
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(order.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>

        {data?.pagination && data.pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 md:gap-36">
            <Button
              variant="outline"
              size="lg"
              className="flex-1 disabled:opacity-30"
              onClick={() => setPage((p: number) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Anterior
            </Button>

            <div className="flex flex-col items-center justify-center gap-1">
              <p className="text-sm text-white/60">
                Mostrando <span className="text-white/80">{data.orders.length}</span> de <span className="text-white/80">{data.pagination.total}</span> pedidos
              </p>

              <div className="flex items-center gap-1">
                {Array.from({ length: data.pagination.totalPages }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-1.5 rounded-full transition-all duration-300",
                      page === i + 1 ? "w-6 bg-primary" : "w-1.5 bg-white/10"
                    )}
                  />
                ))}
              </div>
            </div>

            <Button
              variant="outline"
              size="lg"
              className="flex-1 disabled:opacity-30"
              onClick={() => setPage((p: number) => Math.min(data.pagination.totalPages, p + 1))}
              disabled={page === data.pagination.totalPages}
            >
              Próximo
            </Button>
          </div>
        )}
      </div>

      <OrderDetailDialog
        id={selectedOrderId}
        onClose={() => setSelectedOrderId(null)}
        formatBRL={formatBRL}
        updateStatus={updateStatusMutation.mutate}
        updateNotes={updateNotesMutation.mutate}
      />
    </div>
  );
}

function OrderDetailDialog({ id, onClose, formatBRL, updateStatus, updateNotes }: any) {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermission();
  const canRefund = hasPermission("orders:refund");

  const { data: order, isLoading } = useQuery({
    queryKey: ["admin", "orders", "detail", id],
    queryFn: () => ordersApi.getOne(id!),
    enabled: !!id,
  });

  const [refundOpen, setRefundOpen] = useState(false);
  const [refundReason, setRefundReason] = useState("");
  const [skipGateway, setSkipGateway] = useState(false);

  const refundMutation = useMutation({
    mutationFn: (payload: { reason?: string; skipGateway?: boolean }) =>
      ordersApi.refund(id!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "orders"] });
      setRefundOpen(false);
      setRefundReason("");
      setSkipGateway(false);
      toast.success("Pedido reembolsado com sucesso");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const canUseChat = !!order && (order.status === "PAID" || order.status === "DELIVERED");

  const { data: chat, isLoading: chatLoading } = useQuery({
    queryKey: ["chat", "by-order", id],
    queryFn: () => chatApi.getByOrder(id!),
    enabled: !!id && canUseChat,
  });

  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (order?.adminNotes !== undefined) {
      setNotes(stripExpressAdminNote(order.adminNotes));
    }
  }, [order?.adminNotes, id]);

  const express = order ? isExpressDelivery(order) : false;
  const checkoutEntries = order?.checkoutData
    ? Object.entries(order.checkoutData).filter(([, v]) => v != null && String(v).trim() !== "")
    : [];

  const statusInfo = order ? (() => {
    switch (order.status.toUpperCase()) {
      case "PAID": return { label: "Aprovado", color: "text-green-400", bg: "bg-green-400/10", icon: <div className={cn("w-1.5 h-1.5 rounded-full", "bg-green-400 animate-pulse")}></div> };
      case "PENDING": return { label: "Pendente", color: "text-yellow-400", bg: "bg-yellow-400/10", icon: <div className={cn("w-1.5 h-1.5 rounded-full", "bg-yellow-400 animate-pulse")}></div> };
      case "DELIVERED": return { label: "Entregue", color: "text-purple-400", bg: "bg-purple-400/10", icon: <div className={cn("w-1.5 h-1.5 rounded-full", "bg-purple-400 animate-pulse")}></div> };
      case "REFUNDED": return { label: "Reembolsado", color: "text-orange-400", bg: "bg-orange-400/10", icon: <div className={cn("w-1.5 h-1.5 rounded-full", "bg-orange-400 animate-pulse")}></div> };
      case "CANCELLED": return { label: "Cancelado", color: "text-red-400", bg: "bg-red-400/10", icon: <div className={cn("w-1.5 h-1.5 rounded-full", "bg-red-400 animate-pulse")}></div> };
      default: return { label: order.status, color: "text-zinc-400", bg: "bg-zinc-400/10", icon: <div className={cn("w-1.5 h-1.5 rounded-full", "bg-zinc-400 animate-pulse")}></div> };
    }
  })() : null;

  return (
    <Dialog open={!!id} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent
        className={cn(
          "flex h-[100dvh] w-full max-w-none flex-col",
          "h-[80dvh] md:max-w-2xl",
          "md:h-[80dvh] h-[100dvh] [&>button]:right-5 [&>button]:top-5 [&>button]:z-20 md:[&>button]:right-4 md:[&>button]:top-4"
        )}
      >
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : order && (
          <>
            <DialogHeader className="space-y-1">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <DialogTitle className="text-xl font-bold text-white sm:text-2xl">
                    Pedido #{order.id.slice(-6).toUpperCase()}
                  </DialogTitle>
                  <Badge className={cn("flex items-center gap-1 rounded px-2 py-1 text-xs lowercase font-medium", statusInfo?.bg, statusInfo?.color)}>
                    {statusInfo?.icon}
                    {statusInfo?.label}
                  </Badge>
                </div>
              </div>

              <DialogDescription>
                Criado em {format(new Date(order.createdAt), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
              </DialogDescription>
            </DialogHeader>

            {chat && (
              <Button asChild variant="outline" size="lg" className="px-6 gap-2 border-white/10">
                <Link href={`/dashboard/admin/chats/chat/${chat.id}`}>
                  Abrir chat
                </Link>
              </Button>
            )}

            {express && (
              <div className="flex items-center gap-2 rounded-md bg-amber-500/10 px-3 py-2.5 text-amber-200">
                <Zap className="h-4 w-4 shrink-0 text-amber-400" />
                <p className="text-sm">
                  <span className="font-semibold text-amber-500">Entrega expressa</span>
                  {' — '}priorize o atendimento e a entrega deste pedido.
                </p>
              </div>
            )}

            <ScrollArea className="scrollbar-thin pr-3">
              <div className="space-y-4">
                <section>
                  <h4 className="text-sm font-medium text-white mb-1">Informações do Cliente</h4>

                  <div className="select-none flex items-center gap-4 bg-card p-4 rounded-md border border-white/5">
                    <Avatar className="object-cover select-none pointer-events-none h-12 w-12 border border-primary/20">
                      <AvatarImage src={order.customerImage} />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">
                        {order.customerName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-bold text-white leading-tight">{order.customerName}</p>
                      <p className="text-sm text-white/40">{order.customerEmail}</p>
                    </div>
                  </div>
                </section>

                {checkoutEntries.length > 0 && (
                  <section>
                    <h4 className="text-sm font-medium text-white mb-1">Dados do Checkout</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {checkoutEntries.map(([key, value]) => (
                        <div key={key} className="bg-card p-3 rounded-md border border-white/5">
                          <p className="text-xs font-medium text-muted-foreground">{formatCheckoutFieldLabel(key)}</p>
                          <p className="text-sm text-white/90 font-medium break-all">{String(value)}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                )}

                <section className="space-y-4">
                  <h4 className="text-sm font-medium text-white mb-1">Itens do Pedido ( {order.items?.length || 0}x )</h4>
                  <div className="select-none flex-col items-center space-y-4 gap-4 bg-card p-4 rounded-md border border-white/5">
                    {order.items?.map((item: any) => (
                      <div key={item.id} className="flex gap-4 group">
                        <div className="h-14 w-14 rounded-md bg-white/5 border border-white/5 overflow-hidden flex-shrink-0">
                          {item.product.imageUrl ? (
                            <img src={item.product.imageUrl} alt={item.product.name} className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center text-zinc-700">
                              <Package className="h-6 w-6" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 flex flex-col justify-center">
                          <p className="text-sm font-bold text-white/80 transition-colors line-clamp-1">{item.product.name}</p>
                          {item.variantName && <p className="text-xs text-white/60">{item.variantName}</p>}
                          <p className="text-xs text-white/60 mt-1">{item.quantity}x {formatBRL(item.unitPrice)}</p>
                        </div>
                        <div className="flex flex-col items-end justify-center">
                          <p className="text-sm font-bold text-white">{formatBRL(item.unitPrice * item.quantity)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-white/80">Subtotal</span>
                      <span className="text-white font-medium">{formatBRL(order.subtotal ?? order.total)}</span>
                    </div>
                    {order.discount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-white/80">Desconto</span>
                        <span className="text-white font-medium">
                          {formatBRL(order.discount ?? 0)}
                        </span>
                      </div>
                    )}
                    {(order.deliveryFee ?? 0) > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-white/80">Método de Entrega</span>
                        <span className={cn(
                          "font-medium",
                          express ? "text-amber-400" : "text-white"
                        )}>
                          {getDeliveryOptionLabel(order)}
                        </span>
                      </div>
                    )}
                    {(order.discount ?? 0) > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-white/80">Cupom</span>
                        <span className="text-white font-medium">{order.couponCode ? <span className="font-bold uppercase">{order.couponCode}</span> : "Nenhum cupom aplicado"}</span>
                      </div>
                    )}
                    {(order.deliveryFee ?? 0) > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-white/80">Taxa de entrega</span>
                        <span className="text-amber-400 font-medium">{formatBRL(order.deliveryFee)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-white/80">Valor Total</span>
                      <span className="text-white font-medium">{formatBRL(order.total)}</span>
                    </div>
                    {order.payments && order.payments.length > 0 && (
                      <div className="rounded-md border border-white/5 p-3 mt-3 space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">Pagamentos</p>
                        {order.payments.map((payment) => (
                          <div key={payment.id} className="flex items-center justify-between text-sm">
                            <span className="text-white/70">
                              {payment.provider}
                              {payment.externalId ? ` · ${payment.externalId.slice(0, 12)}…` : ""}
                            </span>
                            <Badge className="text-xs">
                              {payment.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </section>

                <Separator className="bg-white/5" />

                {(order.status === "PAID" || order.status === "DELIVERED") && (
                  <section>
                    <h4 className="text-sm font-medium text-white mb-2">Conteúdo Entregue</h4>
                    {chatLoading ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      </div>
                    ) : chat ? (
                      <OrderDeliveryCart
                        chatId={chat.id}
                        orderId={chat.orderId}
                        items={chat.order?.items ?? []}
                        onDelivered={() => {
                          queryClient.invalidateQueries({ queryKey: ["admin", "orders", "detail", id] });
                          queryClient.invalidateQueries({ queryKey: ["chat", "by-order", id] });
                        }}
                      />
                    ) : (
                      <div className="text-center py-4 bg-card border border-white/5 rounded-md text-white/40 text-sm">
                        Chat ainda não disponível para este pedido.
                      </div>
                    )}
                  </section>
                )}

                <section>
                  <h4 className="text-sm font-medium text-white mb-1">Linha do Tempo</h4>
                  <div className="space-y-2 relative ml-2">
                    <div className="flex-col pl-6">
                      <div className="absolute left-[-4px] top-4 h-2 w-2 rounded-full bg-primary" />
                      <p className="text-sm font-medium text-white/90">Pedido Criado</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(order.createdAt), "dd/MM/yyyy HH:mm")}</p>
                    </div>

                    {order.paidAt && (
                      <div className="relative pl-6">
                        <div className="absolute left-[-4px] top-4 h-2 w-2 rounded-full bg-emerald-500" />
                        <p className="text-sm font-medium text-white/90">Pagamento Confirmado</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(order.paidAt), "dd/MM/yyyy HH:mm")}</p>
                      </div>
                    )}

                    {order.status === "DELIVERED" && (
                      <div className="relative pl-6">
                        <div className="absolute left-[-4px] top-4 h-2 w-2 rounded-full bg-blue-500" />
                        <p className="text-sm font-medium text-white/90">Marcar como Entregue</p>
                        <p className="text-xs text-muted-foreground">Concluído manualmente</p>
                      </div>
                    )}

                    {order.status === "REFUNDED" && (
                      <div className="relative pl-6">
                        <div className="absolute left-[-4px] top-4 h-2 w-2 rounded-full bg-orange-500" />
                        <p className="text-sm font-medium text-white/90">Pedido Reembolsado</p>
                        <p className="text-xs text-muted-foreground">Estorno processado pelo admin</p>
                      </div>
                    )}
                  </div>
                </section>

                <section className="mb-2">
                  <h4 className="text-sm font-medium text-white mb-1">Notas Administrativas</h4>
                  <div className="space-y-3">
                    <Textarea
                      placeholder="Adicione observações internas sobre este pedido..."
                      value={notes}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNotes(e.target.value)}
                    />
                    <Button
                      className="w-full"
                      size="lg"
                      variant="outline"
                      onClick={() => {
                        const base = notes.trim();
                        const payload = express
                          ? (base
                            ? `[ENTREGA EXPRESSA] Priorizar atendimento e entrega deste pedido.\n\n${base}`
                            : '[ENTREGA EXPRESSA] Priorizar atendimento e entrega deste pedido.')
                          : base;
                        updateNotes({ id: order.id, notes: payload });
                      }}
                      disabled={notes === stripExpressAdminNote(order.adminNotes)}
                    >
                      Salvar Observações
                    </Button>
                  </div>
                </section>
              </div>
            </ScrollArea>

            <DialogFooter className="flex flex-row">
              {order.status !== "PAID" && order.status !== "DELIVERED" && order.status !== "REFUNDED" && (
                <Button
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white gap-2"
                  size="lg"
                  onClick={() => updateStatus({ id: order.id, status: "PAID" })}
                >
                  Aprovar Pagamento
                </Button>
              )}

              {canRefund && (order.status === "PAID" || order.status === "DELIVERED") && (
                <Button
                  className="flex-1 bg-orange-600 hover:bg-orange-500 text-white gap-2"
                  size="lg"
                  onClick={() => setRefundOpen(true)}
                >
                  <Undo2 className="h-4 w-4" />
                  Reembolsar
                </Button>
              )}

              {order.status !== "CANCELLED" && order.status !== "REFUNDED" && order.status !== "PAID" && order.status !== "DELIVERED" && (
                <Button
                  className="flex-1 bg-destructive hover:bg-destructive/70 text-white"
                  size="lg"
                  onClick={() => updateStatus({ id: order.id, status: "CANCELLED" })}
                >
                  Cancelar Pedido
                </Button>
              )}
            </DialogFooter>

            <Dialog open={refundOpen} onOpenChange={setRefundOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Reembolsar pedido</DialogTitle>
                  <DialogDescription>O estorno será solicitado no gateway (quando suportado), o estoque será revertido e o cliente será notificado por e-mail.</DialogDescription>
                </DialogHeader>

                <div className="space-y-2 py-2">
                  <div className="flex justify-between items-center rounded-md border border-white/5 bg-transparent p-3">
                    <p className="text-white text-sm font-medium">Valor do pedido</p>
                    <p className="text-lg font-medium text-white">{formatBRL(order.total)}</p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Motivo (opcional)</label>
                    <Textarea
                      placeholder="Ex.: solicitação do cliente, produto indisponível..."
                      value={refundReason}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRefundReason(e.target.value)}
                      rows={3}
                    />
                  </div>

                  <label className="flex items-center gap-3 cursor-pointer">
                    <Toggle
                      pressed={skipGateway}
                      onPressedChange={(v: boolean) => setSkipGateway(v === true)}
                      size="sm"
                      className="h-8 w-8 shrink-0 p-0 data-[state=on]:bg-primary data-[state=on]:text-black"
                    >
                      {skipGateway ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                    </Toggle>
                    <span className="text-sm text-white/70 leading-snug">
                      Apenas registrar reembolso (sem estorno automático no gateway). Use se o estorno já foi feito manualmente.
                    </span>
                  </label>
                </div>

                <DialogFooter className="flex flex-row">
                  <Button variant="ghost" size="lg" className="flex-1" onClick={() => setRefundOpen(false)} disabled={refundMutation.isPending}>
                    Voltar
                  </Button>
                  <Button
                  size="lg"
                    className="flex-1 bg-orange-600 hover:bg-orange-500"
                    disabled={refundMutation.isPending}
                    onClick={() => refundMutation.mutate({
                      reason: refundReason.trim() || undefined,
                      skipGateway,
                    })}
                  >
                    {refundMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Processando...
                      </>
                    ) : (
                      "Confirmar reembolso"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};