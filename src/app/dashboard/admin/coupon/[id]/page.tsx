"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowLeft, Copy, DollarSign, Pencil, Search, Ticket, TrendingUp, } from "lucide-react";
import { PiCopySimpleLight } from "react-icons/pi";
import { toast } from "sonner";

import { DateRangeFilter } from "@/components/admin/dashboard/DateRangeFilter";
import { CouponModal } from "@/components/admin/coupons/coupon-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, } from "@/components/ui/table";
import { getRangeForPreset } from "@/lib/date-range-presets";
import { couponsApi, type Coupon } from "@/lib/coupons-api";
import { cn } from "@/lib/utils";

const PAYMENT_LABELS: Record<string, string> = {
  PIX: "PIX",
  CREDIT_CARD: "Cartão",
  CARD: "Cartão",
  BOLETO: "Boleto",
  PAYPAL: "PayPal",
  MERCADO_PAGO: "Mercado Pago",
  LITECOIN: "Litecoin",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendente",
  PAID: "Pago",
  APPROVED: "Aprovado",
  DELIVERED: "Entregue",
  CANCELLED: "Cancelado",
  REFUNDED: "Reembolsado",
  EXPIRED: "Expirado",
};

function formatCurrency(val: string | number | null | undefined) {
  if (val === null || val === undefined || val === "") return "—";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(val));
}

function formatCurrencyFromCents(cents: number) {
  return formatCurrency(cents / 100);
}

function DetailStatCard({ label, value, icon: Icon, loading, }: { label: string; value: string | number; icon: React.ComponentType<{ className?: string }>; loading?: boolean; }) {
  return (
    <div className="relative group select-none overflow-hidden rounded-md border border-white/3 bg-background/50 px-4 py-4 md:px-6 md:py-5 transition-all duration-300">
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-primary/5 blur-3xl transition-opacity group-hover:opacity-100 opacity-50" />
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white/5 text-white">
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex flex-col">
          {loading ? (
            <Skeleton className="h-7 w-20 bg-white/5" />
          ) : (
            <h3 className="text-lg md:text-xl font-medium text-white tracking-tight">{value}</h3>
          )}
          <p className="text-xs md:text-sm text-white/60">{label}</p>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5 border-b border-white/5 last:border-0">
      <span className="text-sm text-white/45">{label}</span>
      <span className="text-sm font-medium text-white text-right">{value}</span>
    </div>
  );
}

export default function CouponDetailPage() {
  const params = useParams();
  const router = useRouter();
  const couponId = String(params?.id || "");

  const [dateRange, setDateRange] = useState(getRangeForPreset("today"));
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [
      "admin",
      "coupons",
      couponId,
      dateRange.from.toISOString(),
      dateRange.to.toISOString(),
      search,
      status,
      page,
    ],
    queryFn: () =>
      couponsApi.get(couponId, {
        from: dateRange.from,
        to: dateRange.to,
        search: search || undefined,
        status,
        page,
        limit: 20,
      }),
    enabled: Boolean(couponId),
  });

  const coupon = data?.coupon;
  const stats = data?.stats;
  const sales = data?.sales ?? [];
  const pagination = data?.pagination;

  const progress = useMemo(() => {
    if (!coupon?.maxUses) return 0;
    return Math.min(100, (coupon.usedCount / coupon.maxUses) * 100);
  }, [coupon]);

  const availableUses = coupon?.maxUses != null ? Math.max(0, coupon.maxUses - coupon.usedCount) : null;

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Código copiado!", {
      icon: <Copy className="h-4 w-4" />,
    });
  };

  const getStatusBadge = (c: Coupon) => {
    const isExpired = c.endDate && new Date(c.endDate) < new Date();
    if (isExpired) {
      return (
        <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-none lowercase">
          Expirado
        </Badge>
      );
    }
    if (!c.isActive) {
      return (
        <Badge variant="outline" className="bg-red-500/10 text-red-500 border-none lowercase">
          Inativo
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-none lowercase">
        Ativo
      </Badge>
    );
  };

  if (error) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4">
        <Ticket className="h-10 w-10 text-white/20" />
        <p className="text-white font-medium">Cupom não encontrado</p>
        <Button variant="outline" onClick={() => router.push("/dashboard/admin/coupon")}>
          Voltar para cupons
        </Button>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col gap-4 animate-in fade-in duration-500">
      <div className="absolute top-0 right-[-5%] w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-white/3 rounded-full blur-[120px] z-0 pointer-events-none" />
      <div className="absolute top-0 left-[-5%] w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-white/3 rounded-full blur-[120px] z-0 pointer-events-none" />
      <div className="absolute top-0 left-[35%] w-[250px] sm:w-[500px] h-[250px] sm:h-[500px] bg-white/3 rounded-full blur-[120px] z-0 pointer-events-none" />

      <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex flex-row gap-2">
          <Button
            variant="ghost"
            size="lg"
            className="mt-3 -ml-2 gap-1.5 text-white/60 hover:text-white"
            asChild
          >
            <Link href="/dashboard/admin/coupon">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold text-white">Cupom</h1>
            <p className="text-muted-foreground">
              Visualize todas as informações e estatísticas deste cupom de desconto
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <DateRangeFilter
            defaultPreset="today"
            onRangeChange={(range) => {
              setDateRange(range);
              setPage(1);
            }}
          />
          <Button
            variant="default"
            size="lg"
            className="gap-2 shrink-0 px-6 py-5"
            disabled={!coupon}
            onClick={() => setIsModalOpen(true)}
          >
            <Pencil className="h-4 w-4" />
            Editar
          </Button>
        </div>
      </div>

      <div className="relative z-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <DetailStatCard
          label="Cupom Usos"
          value={stats?.totalUses ?? 0}
          icon={Ticket}
          loading={isLoading}
        />
        <DetailStatCard
          label="Valor Convertido"
          value={formatCurrency(stats?.totalConverted ?? 0)}
          icon={TrendingUp}
          loading={isLoading}
        />
        <DetailStatCard
          label="Valor Descontado"
          value={formatCurrency(stats?.totalDiscounted ?? 0)}
          icon={DollarSign}
          loading={isLoading}
        />
      </div>

      <div className="relative z-10 rounded-md border border-white/5 bg-background/50 p-5 md:p-6 space-y-5">
        {isLoading || !coupon ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-40 bg-white/5" />
            <Skeleton className="h-3 w-full bg-white/5" />
            <Skeleton className="h-4 w-64 bg-white/5" />
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <code className="text-xl font-bold text-white">{coupon.code}</code>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="cursor-pointer"
                  onClick={() => copyToClipboard(coupon.code)}
                >
                  <PiCopySimpleLight className="h-4 w-4" />
                </Button>
              </div>
              {coupon.description ? (
                <p className="text-sm text-white/45 max-w-xl truncate">{coupon.description}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-white/80">Progresso de Uso</span>
                <span className="tabular-nums text-white/50">{progress.toFixed(1)}%</span>
              </div>
              <Progress value={progress} className="h-2.5 bg-white/5" />
              <div className="flex items-center justify-between text-xs text-white/45">
                <span>{coupon.usedCount} usados</span>
                <span>
                  {availableUses == null ? "∞ disponíveis" : `${availableUses} disponíveis`}
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="relative z-10 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {[
          {
            title: "Desconto",
            rows: [
              {
                label: "Tipo",
                value:
                  coupon?.type === "PERCENTAGE"
                    ? "Porcentagem"
                    : coupon?.type === "FIXED"
                      ? "Valor Fixo"
                      : "—",
              },
              {
                label: "Porcentagem",
                value:
                  coupon?.type === "PERCENTAGE" ? `${coupon.value}%` : "—",
              },
              {
                label: "Valor Fixo",
                value:
                  coupon?.type === "FIXED" ? formatCurrency(coupon.value) : "—",
              },
            ],
          },
          {
            title: "Limites",
            rows: [
              { label: "Valor Mínimo", value: formatCurrency(coupon?.minOrderValue) },
              { label: "Valor Máximo", value: formatCurrency(coupon?.maxOrderValue) },
              { label: "Desconto Máximo", value: formatCurrency(coupon?.maxDiscount) },
            ],
          },
          {
            title: "Datas",
            rows: [
              {
                label: "Início",
                value: coupon?.startDate
                  ? format(new Date(coupon.startDate), "dd MMM yyyy HH:mm", { locale: ptBR })
                  : "Não especificado",
              },
              {
                label: "Fim",
                value: coupon?.endDate
                  ? format(new Date(coupon.endDate), "dd MMM yyyy HH:mm", { locale: ptBR })
                  : "Não especificado",
              },
              {
                label: "Criação",
                value: coupon?.createdAt
                  ? format(new Date(coupon.createdAt), "dd MMM yyyy HH:mm", { locale: ptBR })
                  : "—",
              },
            ],
          },
        ].map((section) => (
          <div
            key={section.title}
            className="rounded-md border border-white/5 bg-background/50 p-5"
          >
            <h3 className="mb-3 text-sm font-semibold text-white">{section.title}</h3>
            {isLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-5 w-full bg-white/5" />
                <Skeleton className="h-5 w-full bg-white/5" />
                <Skeleton className="h-5 w-3/4 bg-white/5" />
              </div>
            ) : (
              section.rows.map((row) => (
                <InfoRow key={row.label} label={row.label} value={row.value} />
              ))
            )}
          </div>
        ))}
      </div>

      <div className="relative z-10 space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-white transition-colors" />
            <Input
              placeholder="Pesquisar"
              className="pl-10"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <Select
            value={status}
            onValueChange={(value) => {
              setStatus(value);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-full md:w-[160px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="PENDING">Pendente</SelectItem>
              <SelectItem value="PAID">Pago</SelectItem>
              <SelectItem value="DELIVERED">Entregue</SelectItem>
              <SelectItem value="CANCELLED">Cancelado</SelectItem>
              <SelectItem value="REFUNDED">Reembolsado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-lg border border-white/5 overflow-hidden">
          <Table>
            <TableHeader className="bg-card/2">
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="pl-6 text-white/50 font-medium text-sm">Pedido</TableHead>
                <TableHead className="text-white/50 font-medium text-sm">Cliente</TableHead>
                <TableHead className="text-white/50 font-medium text-sm">Status</TableHead>
                <TableHead className="text-white/50 font-medium text-sm">Desconto</TableHead>
                <TableHead className="text-white/50 font-medium text-sm">Total</TableHead>
                <TableHead className="pr-6 text-white/50 font-medium text-sm text-right">Data</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i} className="border-white/5">
                    <TableCell colSpan={6} className="pl-6">
                      <Skeleton className="h-6 w-full bg-white/5" />
                    </TableCell>
                  </TableRow>
                ))
              ) : sales.length === 0 ? (
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableCell colSpan={6} className="py-14 text-center text-muted-foreground">
                    Não foi possível encontrar nenhuma venda.
                  </TableCell>
                </TableRow>
              ) : (
                sales.map((sale) => (
                  <TableRow key={sale.id} className="border-white/5 bg-background hover:bg-black/5">
                    <TableCell className="pl-6">
                      <Link
                        href={`/dashboard/admin/orders?search=${sale.order?.id || ""}`}
                        className="font-mono text-sm text-white hover:text-primary"
                      >
                        #{sale.order?.id?.slice(0, 8) || "—"}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm text-white">
                          {sale.user?.name || "Cliente"}
                        </span>
                        <span className="text-xs text-white/40">{sale.user?.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-white/10 text-white/70">
                        {STATUS_LABELS[sale.order?.status || ""] || sale.order?.status || "—"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-emerald-400">
                      -{formatCurrency(sale.discount)}
                    </TableCell>
                    <TableCell className="text-sm text-white">
                      {sale.order ? formatCurrencyFromCents(sale.order.total) : "—"}
                    </TableCell>
                    <TableCell className="pr-6 text-right text-xs text-white/50">
                      {format(new Date(sale.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {pagination && pagination.pages > 1 ? (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Página {pagination.page} de {pagination.pages}
            </p>
            <div className="flex gap-2">
              {Array.from({ length: pagination.pages }).map((_, i) => {
                const pageNum = i + 1;
                return (
                  <Button
                    key={pageNum}
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-8 w-8 p-0",
                      page === pageNum && "border-primary/40 bg-primary/10 text-primary"
                    )}
                    onClick={() => setPage(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
          </div>
        ) : pagination ? (
          <div className="flex justify-end">
            <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-primary/40 bg-primary/10 text-primary">
              1
            </Button>
          </div>
        ) : null}
      </div>

      <CouponModal
        open={isModalOpen}
        onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) refetch();
        }}
        coupon={coupon ?? null}
      />
    </div>
  );
}
