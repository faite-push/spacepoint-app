"use client";

import { useState, useMemo } from "react";
import { Search, CheckCircle, XCircle, Truck, Clock, ChevronLeft, ChevronRight, Eye, MoreVertical, Check, Filter, Loader2, ShoppingCart, DollarSign, TrendingUp, Package, ExternalLink, MessageSquare, Save, Dot, ChevronDown } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { subDays, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

import { ordersApi, AdminOrder } from "@/lib/admin-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { TbCactusFilled } from "react-icons/tb";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { DateRangeFilter } from "@/components/admin/dashboard/DateRangeFilter";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const STATUS_OPTIONS = [
  { value: "ALL", label: "Todos os Status" },
  { value: "PENDING", label: "Pendente" },
  { value: "PAID", label: "Pago" },
  { value: "DELIVERED", label: "Entregue" },
  { value: "CANCELLED", label: "Cancelado" },
];

export default function OrdersPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [dateRange, setDateRange] = useState({ from: subDays(new Date(), 30), to: new Date(), });
  const [page, setPage] = useState(1);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [isStatusOpen, setIsStatusOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "orders", search, status, dateRange.from.toISOString(), dateRange.to.toISOString(), page],
    queryFn: () => ordersApi.list({
      search,
      status: status === "ALL" ? undefined : status,
      from: dateRange.from.toISOString(),
      to: dateRange.to.toISOString(),
      page,
    }),
  });

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
        return { label: "Pago", color: "bg-green-500/10 text-green-500", icon: CheckCircle };
      case "PENDING":
        return { label: "Pendente", color: "bg-yellow-500/10 text-yellow-500", icon: Clock };
      case "DELIVERED":
        return { label: "Entregue", color: "bg-purple-500/10 text-purple-500", icon: Truck };
      case "CANCELLED":
        return { label: "Cancelado", color: "bg-red-500/10 text-red-500", icon: XCircle };
      default:
        return { label: status, color: "bg-zinc-500/10 text-zinc-500", icon: Clock };
    }
  };

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
              <DateRangeFilter onRangeChange={setDateRange} />
            </div>

            <div className="relative">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsStatusOpen(!isStatusOpen)}
                className={cn(
                  "h-10 px-4 rounded-md w-full md:w-auto gap-2 border-white/10 bg-transparent transition-all",
                  status !== "ALL" && "border-primary/50 bg-primary/5"
                )}
              >
                <Filter className={cn("h-4 w-4", status !== "ALL" ? "text-primary" : "text-zinc-500")} />
                <span className="font-medium whitespace-nowrap">
                  {STATUS_OPTIONS.find(o => o.value === status)?.label || "Status"}
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
                    {STATUS_OPTIONS.map((opt) => {
                      const info = opt.value !== "ALL" ? getStatusInfo(opt.value) : null;
                      const Icon = info?.icon || Filter;
                      const isActive = status === opt.value;
                      
                      return (
                        <div
                          key={opt.value}
                          className={cn(
                            "flex items-center gap-3 cursor-pointer py-1.5 px-2.5 rounded-sm transition-all duration-200 group relative",
                            isActive ? "bg-primary/20 text-primary" : "text-zinc-500 hover:text-zinc-200 hover:bg-white/5"
                          )}
                          onClick={() => {
                            setStatus(opt.value);
                            setIsStatusOpen(false);
                            setPage(1);
                          }}
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

        <div className="max-h-[580px] rounded-lg border border-white/5 overflow-y-auto select-none bg-background/30">
          <Table className="w-full text-left border-collapse">
            <TableHeader className="bg-card/2 sticky top-0 z-20">
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="p-4 pl-6 text-sm font-medium text-white/50">Pedido</TableHead>
                <TableHead className="p-4 text-sm font-medium text-white/50">Cliente</TableHead>
                <TableHead className="p-4 text-sm font-medium text-white/50">Total</TableHead>
                <TableHead className="p-4 text-sm font-medium text-white/50">Método</TableHead>
                <TableHead className="p-4 text-sm font-medium text-white/50">Status</TableHead>
                <TableHead className="p-4 text-sm font-medium text-white/50">Data</TableHead>
                <TableHead className="p-4 text-sm font-medium text-white/50 text-right pr-6">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i} className="border-white/5">
                    <TableCell className="pl-6"><Skeleton className="h-6 w-24 bg-white/5" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16 bg-white/5" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-32 bg-white/5" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-32 bg-white/5" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20 bg-white/5" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16 bg-white/5" /></TableCell>
                    <TableCell className="pr-6"><div className="flex justify-end"><Skeleton className="h-8 w-8 bg-white/5" /></div></TableCell>
                  </TableRow>
                ))
              ) : data?.orders.length === 0 ? (
                <TableRow className="bg-background/30 hover:bg-background/30 cursor-pointer transition-colors group select-none">
                  <TableCell colSpan={7} className="h-[400px] text-center">
                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <TbCactusFilled className="h-8 w-8" />
                      <p>Nenhum pedido encontrado</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                data?.orders.map((order: AdminOrder) => {
                  const statusInfo = getStatusInfo(order.status);
                  const StatusIcon = statusInfo.icon;
                  return (
                    <TableRow key={order.id} className="border-white/5 bg-background hover:bg-white/[0.02] cursor-pointer transition-colors group select-none" onClick={() => setSelectedOrderId(order.id)}>
                      <TableCell className="p-4 pl-6">
                        <span className="bg-blue-500/10 py-1 px-2 rounded text-blue-500 text-xs font-medium">{order.id}</span>
                      </TableCell>
                      <TableCell className="p-4">
                        <div>
                          <p className="text-sm font-medium text-white/80">{order.customerName}</p>
                          <p className="text-xs text-white/40">{order.customerEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell className="p-4">
                        <div className="flex flex-row gap-0.5">
                          <span className="text-sm font-medium text-white/90">{formatBRL(order.total)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="p-4">
                        <div className="flex flex-row gap-0.5">
                          <span className="bg-emerald-500/10 py-1 px-2 rounded text-emerald-500 text-xs lowercase font-medium">{order.paymentMethod}</span>
                        </div>
                      </TableCell>
                      <TableCell className="p-4">
                        <Badge
                          variant="outline"
                          className={cn("gap-1.5 px-2 py-1 rounded text-xs lowercase font-medium border-none", statusInfo.color)}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {statusInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="p-4">
                        <div className="flex flex-row">
                          <span className="text-sm text-zinc-300">{format(new Date(order.createdAt), "dd/MM/yyyy", { locale: ptBR })}</span>
                          <span className="text-sm text-zinc-300"> - {format(new Date(order.createdAt), "HH:mm")}</span>
                        </div>
                      </TableCell>
                      <TableCell className="p-4 text-right pr-6" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10 text-zinc-500 hover:text-white">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-[#0D0D0D] border-white/10 text-white min-w-[200px]">
                            <DropdownMenuItem className="gap-2 cursor-pointer focus:bg-white/5" onClick={() => setSelectedOrderId(order.id)}>
                              <Eye className="h-4 w-4" /> Ver Detalhes
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-white/5" />
                            <DropdownMenuItem
                              className="gap-2 cursor-pointer text-green-400 focus:bg-green-400/10 focus:text-green-400"
                              onClick={() => updateStatusMutation.mutate({ id: order.id, status: "PAID" })}
                            >
                              <CheckCircle className="h-4 w-4" /> Marcar como Pago
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="gap-2 cursor-pointer text-purple-400 focus:bg-purple-400/10 focus:text-purple-400"
                              onClick={() => updateStatusMutation.mutate({ id: order.id, status: "DELIVERED" })}
                            >
                              <Truck className="h-4 w-4" /> Marcar como Entregue
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="gap-2 cursor-pointer text-red-500 focus:bg-red-500/10 focus:text-red-500"
                              onClick={() => updateStatusMutation.mutate({ id: order.id, status: "CANCELLED" })}
                            >
                              <XCircle className="h-4 w-4" /> Cancelar Pedido
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {data?.pagination && data.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-white/60">
              Mostrando <span className="text-white/80">{data.orders.length}</span> de <span className="text-white/80">{data.pagination.total}</span> pedidos
            </p>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="disabled:opacity-30"
                onClick={() => setPage((p: number) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
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
              <Button
                variant="outline"
                size="icon"
                className="disabled:opacity-30"
                onClick={() => setPage((p: number) => Math.min(data.pagination.totalPages, p + 1))}
                disabled={page === data.pagination.totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <OrderDrawer
        id={selectedOrderId}
        onClose={() => setSelectedOrderId(null)}
        formatBRL={formatBRL}
        updateStatus={updateStatusMutation.mutate}
        updateNotes={updateNotesMutation.mutate}
      />
    </div>
  );
}

function OrderDrawer({ id, onClose, formatBRL, updateStatus, updateNotes }: any) {
  const { data: order, isLoading } = useQuery({
    queryKey: ["admin", "orders", "detail", id],
    queryFn: () => ordersApi.getOne(id!),
    enabled: !!id,
  });

  const [notes, setNotes] = useState("");

  useMemo(() => {
    if (order?.adminNotes) setNotes(order.adminNotes);
  }, [order?.adminNotes]);

  const statusInfo = order ? (() => {
    switch (order.status.toUpperCase()) {
      case "PAID": return { label: "Aprovado", color: "text-green-400", bg: "bg-green-400/10", icon: <div className={cn("w-1.5 h-1.5 rounded-full", "bg-green-400 animate-ping")}></div> };
      case "PENDING": return { label: "Pendente", color: "text-yellow-400", bg: "bg-yellow-400/10", icon: <div className={cn("w-1.5 h-1.5 rounded-full", "bg-yellow-400 animate-ping")}></div> };
      case "DELIVERED": return { label: "Entregue", color: "text-purple-400", bg: "bg-purple-400/10", icon: <div className={cn("w-1.5 h-1.5 rounded-full", "bg-purple-400 animate-ping")}></div> };
      case "CANCELLED": return { label: "Cancelado", color: "text-red-400", bg: "bg-red-400/10", icon: <div className={cn("w-1.5 h-1.5 rounded-full", "bg-red-400 animate-ping")}></div> };
      default: return { label: order.status, color: "text-zinc-400", bg: "bg-zinc-400/10", icon: <div className={cn("w-1.5 h-1.5 rounded-full", "bg-zinc-400 animate-ping")}></div> };
    }
  })() : null;

  return (
    <Sheet open={!!id} onOpenChange={(open: boolean) => !open && onClose()}>
      <SheetContent className="w-full sm:min-w-[600px]">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : order && (
          <>
            <SheetHeader>
              <div className="flex items-center justify-start gap-2 mt-2">
                <SheetTitle className="text-2xl font-bold text-white flex items-center gap-2">
                  Pedido #{order.id.slice(-6).toUpperCase()}
                </SheetTitle>
                <Badge className={cn("px-2 py-1 gap-1 rounded text-xs lowercase font-bold", statusInfo?.bg, statusInfo?.color)}>
                  {statusInfo?.icon}
                  {statusInfo?.label}
                </Badge>
              </div>

              <SheetDescription className="">
                Criado em {format(new Date(order.createdAt), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
              </SheetDescription>
            </SheetHeader>

            <ScrollArea className="flex-1 px-6">
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

                {order.checkoutData && Object.entries(order.checkoutData).length > 0 && (
                  <section>
                    <h4 className="text-sm font-medium text-white mb-1">Dados do Checkout</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {Object.entries(order.checkoutData).map(([key, value]) => (
                        <div key={key} className="bg-card p-3 rounded-md border border-white/5">
                          <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">{key}</p>
                          <p className="text-sm text-white/90 font-medium">{String(value)}</p>
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
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500">Subtotal</span>
                      <span className="text-white">{formatBRL(order.total)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500">Desconto</span>
                      <span className="text-white">{formatBRL(order.discount)}</span>
                    </div>
                     <div className="flex justify-between text-sm font-bold">
                      <span className="text-white">Total</span>
                      <span className="text-primary text-lg">{formatBRL(order.total)}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6 pt-2">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground mr-2">Pagamento</span>
                      <span className="text-xs text-white bg-white/5 px-2 py-1 rounded border border-white/5 font-medium uppercase tracking-wider">{order.paymentMethod || "Não informado"}</span>
                    </div>
                    {order.couponCode && (
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground mr-2">Cupom</span>
                        <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20 font-bold uppercase tracking-wider">{order.couponCode}</span>
                      </div>
                    )}
                  </div>
                </section>

                <Separator className="bg-white/5" />

                {(order.status === "PAID" || order.status === "DELIVERED") && (
                  <section>
                    <h4 className="text-sm font-medium text-white mb-1">Conteúdo Entregue</h4>
                    <div className="space-y-2">
                      {order.items?.flatMap((it: any) => it.codes).map((c: any, i: number) => (
                        <div key={i} className="bg-card border border-white/5 p-3 rounded-md flex items-center justify-between group">
                          <code className="text-xs text-primary font-mono select-all">{c.code}</code>
                          <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                      {order.items?.every((it: any) => it.codes.length === 0) && (
                        <div className="text-center py-4 bg-card border border-white/5 rounded-md text-white/40 text-sm">
                          Nenhum código gerado para este pedido.
                        </div>
                      )}
                    </div>
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
                  </div>
                </section>

                <section>
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
                      onClick={() => updateNotes({ id: order.id, notes })}
                      disabled={notes === order.adminNotes}
                    >
                      Salvar Observações
                    </Button>
                  </div>
                </section>
              </div>
            </ScrollArea>

            <div className="flex gap-3 py-4 px-6">
              {order.status !== "PAID" && order.status !== "DELIVERED" && (
                <Button
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white gap-2"
                  size="lg"
                  onClick={() => updateStatus({ id: order.id, status: "PAID" })}
                >
                  Aprovar Pagamento
                </Button>
              )}

              {order.status === "PAID" && (
                <Button
                  className="flex-2 bg-primary hover:bg-primary/90 text-white gap-2"
                  size="lg"
                  variant="outline"
                  onClick={() => updateStatus({ id: order.id, status: "DELIVERED" })}
                >
                  Marcar como Entregue
                </Button>
              )}

              {order.status !== "CANCELLED" && (
                <Button
                  className="flex-1 bg-destructive hover:bg-destructive/70 text-white"
                  size="lg"
                  onClick={() => updateStatus({ id: order.id, status: "CANCELLED" })}
                >
                  Cancelar Pedido
                </Button>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};