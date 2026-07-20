"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

import Link from "next/link";
import { Copy, Info, Link2, Mail, MousePointerClick, Percent, Settings, ShoppingBag, Trash2, TrendingUp, Wallet, XCircle, } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { PiCurrencyCircleDollar } from "react-icons/pi";

import { AbandonedCartDetailDialog } from "@/components/admin/marketing/abandoned-cart-detail-dialog";
import { UnpaidOrderDetailDialog } from "@/components/admin/marketing/unpaid-order-detail-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DateRangeFilter } from "@/components/admin/dashboard/DateRangeFilter";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { marketingAutomationsApi, type MarketingAbandonedCart, type MarketingMetricType, type MarketingUnpaidOrder, } from "@/lib/admin-api";
import { AUTOMATIONS_SETTINGS } from "@/lib/marketing-email-routes";
import { getRangeForPreset } from "@/lib/date-range-presets";
import { Can } from "@/providers/PermissionProvider";
import { formatPrice } from "@/lib/shop-api";
import { cn } from "@/lib/utils";
import { LuCheck, LuX } from "react-icons/lu";

const ALL_METRIC_TYPES: MarketingMetricType[] = [
  "carts",
  "abandoned_products",
  "cancelled_orders",
];

const METRIC_TYPE_LABELS: Record<MarketingMetricType, string> = {
  carts: "Carrinhos abandonados",
  abandoned_products: "Produtos abandonados",
  cancelled_orders: "Pedidos cancelados",
};

function MetricCard({ label, value, description, icon: Icon, loading, className, }: { label: string; value: string | number; description?: string; icon: React.ComponentType<{ className?: string }>; loading?: boolean; className?: string; }) {
  return (
    <div className={cn("relative overflow-hidden select-none rounded-md border border-white/3 bg-background/20 px-4 py-4 md:px-5 md:py-5", className)}>
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-primary/5 blur-3xl" />
      {loading ? (
        <Skeleton className="h-10 w-28 bg-white/5" />
      ) : (
        <div className="flex w-full items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white/5 text-white">
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <p className="truncate text-lg font-medium tracking-wide text-white md:text-xl">{value}</p>
            <p className="text-xs text-white/60 md:text-sm">{label}</p>
          </div>

          <div className="flex items-center absolute right-4 top-1/2 -translate-y-1/2">
            <Tooltip>
              <TooltipTrigger render={
                <Button variant="ghost" size="icon" className="h-8 w-8 text-white/45 hover:text-white">
                  <Info className="h-5 w-5" />
                </Button>
              }>
              </TooltipTrigger>
              <TooltipContent>
                <p>{description}</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      )}
    </div>
  );
};

function QuickActions({ recoveryUrl, whatsappUrl, onArchive, canArchive, }: { recoveryUrl: string | null; whatsappUrl: string | null; onArchive: () => void; canArchive?: boolean; }) {
  return (
    <div className="flex shrink-0 items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
      {recoveryUrl && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-white/45 hover:text-white"
          title="Copiar link"
          onClick={() => {
            void navigator.clipboard.writeText(recoveryUrl);
            toast.success("Link copiado");
          }}
        >
          <Copy className="h-4 w-4" />
        </Button>
      )}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-white/45 hover:text-white"
        title="WhatsApp"
        disabled={!whatsappUrl}
        onClick={() => {
          if (!whatsappUrl) {
            toast.error("Sem telefone válido");
            return;
          }
          window.open(whatsappUrl, "_blank", "noopener,noreferrer");
        }}
      >
        <FaWhatsapp className="h-4 w-4" />
      </Button>
      {recoveryUrl && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-white/45 hover:text-white"
          title="Abrir link"
          onClick={() => window.open(recoveryUrl, "_blank", "noopener,noreferrer")}
        >
          <Link2 className="h-4 w-4" />
        </Button>
      )}
      {canArchive && (
        <Can I="marketing:manage">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-white/45 hover:text-red-400"
            title="Remover da listagem"
            onClick={onArchive}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </Can>
      )}
    </div>
  );
};

export default function MarketingAutomationsPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("metrics");
  const [dateRange, setDateRange] = useState(getRangeForPreset("7d"));
  const [metricTypes, setMetricTypes] = useState<MarketingMetricType[]>([...ALL_METRIC_TYPES]);
  const [cartSearch, setCartSearch] = useState("");
  const [orderSearch, setOrderSearch] = useState("");
  const [cartPage, setCartPage] = useState(1);
  const [orderPage, setOrderPage] = useState(1);
  const [selectedCart, setSelectedCart] = useState<MarketingAbandonedCart | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<MarketingUnpaidOrder | null>(null);

  const rangeParams = useMemo(
    () => ({
      from: dateRange.from.toISOString(),
      to: dateRange.to.toISOString(),
    }),
    [dateRange]
  );

  const metricTypesKey = metricTypes.slice().sort().join(",");

  const toggleMetricType = (type: MarketingMetricType) => {
    setMetricTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const metricsQuery = useQuery({
    queryKey: ["admin", "marketing", "metrics", metricTypesKey, rangeParams.from, rangeParams.to],
    queryFn: () =>
      marketingAutomationsApi.metrics({
        ...rangeParams,
        metricTypes,
      }),
    enabled: tab === "metrics" && metricTypes.length > 0,
  });

  const cartsQuery = useQuery({
    queryKey: ["admin", "marketing", "carts", rangeParams.from, rangeParams.to, cartSearch, cartPage],
    queryFn: () =>
      marketingAutomationsApi.listCarts({
        ...rangeParams,
        search: cartSearch || undefined,
        page: cartPage,
        pageSize: 20,
      }),
    enabled: tab === "carts",
  });

  const ordersQuery = useQuery({
    queryKey: ["admin", "marketing", "orders", rangeParams.from, rangeParams.to, orderSearch, orderPage],
    queryFn: () =>
      marketingAutomationsApi.listOrders({
        ...rangeParams,
        search: orderSearch || undefined,
        page: orderPage,
        pageSize: 20,
      }),
    enabled: tab === "orders",
  });

  const archiveCartMutation = useMutation({
    mutationFn: (id: string) => marketingAutomationsApi.archiveCart(id),
    onSuccess: () => {
      toast.success("Carrinho removido da listagem");
      queryClient.invalidateQueries({ queryKey: ["admin", "marketing", "carts"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const archiveOrderMutation = useMutation({
    mutationFn: (id: string) => marketingAutomationsApi.archiveOrder(id),
    onSuccess: () => {
      toast.success("Pedido removido da listagem");
      queryClient.invalidateQueries({ queryKey: ["admin", "marketing", "orders"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const metrics = metricsQuery.data;

  return (
    <div className="relative flex flex-col gap-4 animate-in fade-in duration-500">
      <div className="absolute top-10 right-[-5%] w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-white/3 rounded-full blur-[120px] z-0 pointer-events-none" />
      <div className="absolute top-0 left-[-5%] w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-white/3 rounded-full blur-[120px] z-0 pointer-events-none" />
      <div className="absolute top-10 left-[35%] w-[250px] sm:w-[500px] h-[250px] sm:h-[500px] bg-white/3 rounded-full blur-[120px] z-0 pointer-events-none" />

      <div className="relative z-10 flex flex-col">
        <h1 className="text-2xl font-bold text-white">Automações</h1>
        <p className="max-w-2xl text-muted-foreground">
          Valide se as réguas de recuperação estão trazendo receita de volta ou se o conteúdo precisa de ajustes
          para converter carrinhos e pedidos abandonados.
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="relative z-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <TabsList className="h-auto w-full flex-wrap sm:w-auto bg-transparent p-0">
            <TabsTrigger value="metrics" className="flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-md cursor-pointer transition-all duration-200">Métricas de Uso</TabsTrigger>
            <TabsTrigger value="carts" className="flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-md cursor-pointer transition-all duration-200">Listagem de Carrinhos</TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-md cursor-pointer transition-all duration-200">Listagem de Pedidos</TabsTrigger>
          </TabsList>
          <Button type="button" variant="outline" className="px-5 py-5" asChild>
            <Link href={AUTOMATIONS_SETTINGS}>
              <Settings className="h-4 w-4" />
              Configurações
            </Link>
          </Button>
        </div>

        <TabsContent value="metrics" className="space-y-3 rounded-md border border-white/5 h-142">
          <div className="flex flex-wrap gap-2 pb-2 p-4">
            {ALL_METRIC_TYPES.map((type) => {
              const active = metricTypes.includes(type);
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => toggleMetricType(type)}
                  aria-pressed={active}
                  className={cn(
                    "flex items-center cursor-pointer rounded-full px-3 py-2 gap-2 text-sm transition-colors",
                    active
                      ? "bg-primary/10 text-primary"
                      : "bg-transparent text-white/45 hover:border-white/20 hover:text-white/70"
                  )}
                >
                  {active ? <LuCheck className="w-4 h-4 text-primary" /> : <LuX className="w-4 h-4 text-white/45" />} {METRIC_TYPE_LABELS[type]}
                </button>
              );
            })}

            <div className="ml-auto">
              <DateRangeFilter defaultPreset="7d" onRangeChange={setDateRange} />
            </div>
          </div>

          {!metricTypes.length ? (
            <div className="flex flex-col items-center justify-center gap-2 px-4 py-42 text-center text-sm text-white/40">
              <ShoppingBag className="h-8 w-8" />
              Nenhum filtro ativo. Ative ao menos uma opção para ver as métricas.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-2 px-4">
                <MetricCard
                  label={`${metrics?.recoveredOrders} Pedidos recuperados`}
                  description="Pedidos pagos atribuídos ao clique no e-mail de recuperação"
                  value={
                    metrics
                      ? `${formatPrice(metrics.recoveredRevenueCents)}`
                      : "—"
                  }
                  icon={TrendingUp}
                  loading={metricsQuery.isLoading}
                />
                <MetricCard
                  label={`${metrics?.unfinishedOrders} Pedidos não finalizados`}
                  description="Vendas perdidas de pedidos não finalizados"
                  value={metrics ? `${formatPrice(metrics.lostRevenueCents)}` : "—"}
                  icon={XCircle}
                  loading={metricsQuery.isLoading}
                />
              </div>

              <div className="flex flex-col gap-2 p-4">
                <div className="flex flex-col">
                  <h1 className="text-xl font-medium text-white">Sobre os disparos das mensagens</h1>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-4">
                  <MetricCard
                    label="E-mails disparados"
                    description="Número total de envios"
                    value={metrics?.emailsSent ?? 0}
                    icon={Mail}
                    loading={metricsQuery.isLoading}
                  />
                  <MetricCard
                    label="Abertura de e-mails"
                    description="Porcentagem dos e-mails abertos (pixel)"
                    value={`${metrics?.openRate ?? 0}%`}
                    icon={Mail}
                    loading={metricsQuery.isLoading}
                  />
                  <MetricCard
                    className="col-span-1"
                    label="Cliques de e-mails"
                    description="Porcentagem dos e-mails com clique rastreado"
                    value={`${metrics?.clickRate ?? 0}%`}
                    icon={MousePointerClick}
                    loading={metricsQuery.isLoading}
                  />
                  <MetricCard
                    className="col-span-1"
                    label="Taxa de conversão"
                    description="Cliques no e-mail que viraram compra paga"
                    value={`${metrics?.conversionRate ?? 0}%`}
                    icon={Percent}
                    loading={metricsQuery.isLoading}
                  />
                  <MetricCard
                    className="col-span-2"
                    label="Ticket médio"
                    description="Média por venda paga atribuída ao e-mail"
                    value={formatPrice(metrics?.averageTicketCents ?? 0)}
                    icon={PiCurrencyCircleDollar}
                    loading={metricsQuery.isLoading}
                  />
                  <MetricCard
                    className="col-span-2"
                    label="Receita recuperada"
                    description="Soma dos pedidos pagos atribuídos ao e-mail"
                    value={formatPrice(metrics?.recoveredRevenueCents ?? 0)}
                    icon={Wallet}
                    loading={metricsQuery.isLoading}
                  />
                </div>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="carts" className="rounded-md border border-white/5 h-142">
          <div className="p-4">
            <Input
              placeholder="Buscar por nome, e-mail ou telefone..."
              value={cartSearch}
              onChange={(e) => {
                setCartSearch(e.target.value);
                setCartPage(1);
              }}
              className="max-w-md border-white/5 bg-background"
            />
          </div>

          <div className="overflow-hidden">
            {cartsQuery.isLoading ? (
              <div className="space-y-2 p-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full bg-white/5" />
                ))}
              </div>
            ) : !cartsQuery.data?.carts.length ? (
              <div className="flex flex-col items-center justify-center gap-2 px-4 py-42 text-center text-white/40">
                <ShoppingBag className="h-8 w-8" />
                <p className="text-sm">Nenhum carrinho abandonado no período</p>
                <p className="max-w-sm text-xs text-white/30">
                  Só entram carrinhos após o tempo de inatividade configurado (padrão 20 min), sem atividade no site.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-white/5">
                {cartsQuery.data.carts.map((cart) => (
                  <li key={cart.id}>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedCart(cart)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelectedCart(cart);
                        }
                      }}
                      className="flex flex-wrap select-none items-center justify-between cursor-pointer gap-3 px-3 py-3 text-left transition-colors hover:bg-white/[0.03] sm:px-4"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-medium",
                            cart.isVisitor ? "bg-white/5 text-white/40" : "bg-primary/15 text-primary"
                          )}
                        >
                          {(cart.customerName || "?").charAt(0).toUpperCase()}
                        </div>

                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-white">
                            {cart.customerName || (cart.isVisitor ? "Cliente visitante" : cart.email || "Sem identificação")}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <p className="text-sm text-muted-foreground">
                          {formatPrice(cart.subtotalCents)}
                        </p>
                      </div>

                      <div className="flex items-center justify-end gap-2">
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(cart.lastActivityAt), "dd/MM HH:mm", { locale: ptBR })}
                        </p>
                      </div>

                      <div className="flex items-center justify-end gap-2">
                        <QuickActions
                          recoveryUrl={cart.recoveryUrl}
                          whatsappUrl={cart.whatsappUrl}
                          canArchive
                          onArchive={() => archiveCartMutation.mutate(cart.id)}
                        />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {(cartsQuery.data?.totalPages || 0) > 1 && (
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-white/10"
                disabled={cartPage <= 1}
                onClick={() => setCartPage((p) => p - 1)}
              >
                Anterior
              </Button>
              <span className="text-xs text-white/40">
                {cartPage} / {cartsQuery.data?.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="border-white/10"
                disabled={cartPage >= (cartsQuery.data?.totalPages || 1)}
                onClick={() => setCartPage((p) => p + 1)}
              >
                Próxima
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="orders" className="rounded-md border border-white/5 h-142">
          <div className="p-4">
            <Input
              placeholder="Buscar por nome, e-mail, telefone ou ID..."
              value={orderSearch}
              onChange={(e) => {
                setOrderSearch(e.target.value);
                setOrderPage(1);
              }}
              className="max-w-md border-white/5 bg-background"
            />
          </div>

          <div className="overflow-hidden">
            {ordersQuery.isLoading ? (
              <div className="space-y-2 p-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full bg-white/5" />
                ))}
              </div>
            ) : !ordersQuery.data?.orders.length ? (
              <div className="flex flex-col items-center gap-2 px-4 py-42 text-center text-white/40">
                <ShoppingBag className="h-8 w-8" />
                <p className="text-sm">Nenhum pedido de recuperação no período</p>
                <p className="max-w-sm text-xs text-white/30">
                  Aparecem pedidos gerados no checkout com pagamento pendente, expirado ou recusado.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-white/5">
                {ordersQuery.data.orders.map((order) => (
                  <li key={order.id}>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedOrder(order)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelectedOrder(order);
                        }
                      }}
                      className="flex flex-wrap select-none items-center justify-between cursor-pointer gap-3 px-3 py-3 text-left transition-colors hover:bg-white/[0.03] sm:px-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-sm font-medium text-amber-400">
                          {order.customerName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-white">
                            {order.customerName || order.email || "Sem identificação"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <p className="bg-amber-500/10 text-xs text-amber-500 px-4 py-1 rounded lowercase">
                          {order.paymentMethod || "Pagamento"}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(order.createdAt), "dd/MM HH:mm", { locale: ptBR })}
                        </p>
                      </div>

                      <QuickActions
                        recoveryUrl={order.recoveryUrl}
                        whatsappUrl={order.whatsappUrl}
                        canArchive
                        onArchive={() => archiveOrderMutation.mutate(order.id)}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {(ordersQuery.data?.totalPages || 0) > 1 && (
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-white/10"
                disabled={orderPage <= 1}
                onClick={() => setOrderPage((p) => p - 1)}
              >
                Anterior
              </Button>
              <span className="text-xs text-white/40">
                {orderPage} / {ordersQuery.data?.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="border-white/10"
                disabled={orderPage >= (ordersQuery.data?.totalPages || 1)}
                onClick={() => setOrderPage((p) => p + 1)}
              >
                Próxima
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <AbandonedCartDetailDialog
        cart={selectedCart}
        open={!!selectedCart}
        onOpenChange={(open) => !open && setSelectedCart(null)}
      />

      <UnpaidOrderDetailDialog
        order={selectedOrder}
        open={!!selectedOrder}
        onOpenChange={(open) => !open && setSelectedOrder(null)}
      />
    </div>
  );
};