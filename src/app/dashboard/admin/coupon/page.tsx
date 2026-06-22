"use client";

import { useState } from "react";
import { Plus, Search, Filter, MoreHorizontal, Copy, Edit, Trash2, RotateCcw, Eye, Ticket, Calendar as CalendarIcon, ChevronDown, ArrowUpDown, ExternalLink, ToggleLeft, ToggleRight, PlusCircle, MoreVertical, Pencil } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PiCopySimpleLight } from "react-icons/pi";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel, DropdownMenuGroup } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { couponsApi, Coupon } from "@/lib/coupons-api";
import { CouponStatsCards } from "@/components/admin/coupons/coupon-stats-cards";
import { CouponModal } from "@/components/admin/coupons/coupon-modal";
import { DateRangeFilter } from "@/components/admin/dashboard/DateRangeFilter";
import { subDays, format } from "date-fns";

export default function CouponsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState({
    from: subDays(new Date(), 7),
    to: new Date(),
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);

  const { data: couponsData, isLoading: isLoadingCoupons } = useQuery({
    queryKey: ["admin", "coupons", search],
    queryFn: () => couponsApi.list(search),
  });

  const { data: statsData, isLoading: isLoadingStats } = useQuery({
    queryKey: ["admin", "coupons", "stats", dateRange.from.toISOString(), dateRange.to.toISOString()],
    queryFn: () => couponsApi.stats(dateRange),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => couponsApi.remove(id),
    onSuccess: () => {
      toast.success("Cupom excluído");
      queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string, isActive: boolean }) =>
      couponsApi.update(id, { isActive }),
    onSuccess: () => {
      toast.success("Status atualizado");
      queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: string) => couponsApi.duplicate(id),
    onSuccess: () => {
      toast.success("Cupom duplicado");
      queryClient.invalidateQueries({ queryKey: ["admin", "coupons"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const handleEdit = (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedCoupon(null);
    setIsModalOpen(true);
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Código copiado!", {
      icon: <Copy className="h-4 w-4" />
    });
  };

  const getStatusBadge = (coupon: Coupon) => {
    const isExpired = coupon.endDate && new Date(coupon.endDate) < new Date();
    if (isExpired) return <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">Expirado</Badge>;
    if (!coupon.isActive) return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">Inativo</Badge>;
    return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Ativo</Badge>;
  };

  const formatCurrency = (val: string | number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(val));
  };

  const getProgressValue = (coupon: Coupon) => {
    if (!coupon.maxUses) return 0;
    return (coupon.usedCount / coupon.maxUses) * 100;
  };

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500">
      <div className="absolute top-0 right-[-5%] w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-white/3 rounded-full blur-[120px] z-0 pointer-events-none" />
      <div className="absolute top-0 left-[-5%] w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-white/3 rounded-full blur-[120px] z-0 pointer-events-none" />
      <div className="absolute top-0 left-[35%] w-[250px] sm:w-[500px] h-[250px] sm:h-[500px] bg-white/3 rounded-full blur-[120px] z-0 pointer-events-none" />

      <div className="absolute bottom-0 right-[-5%] w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-white/3 rounded-full blur-[120px] z-0 pointer-events-none" />
      <div className="absolute bottom-0 left-[-5%] w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-white/3 rounded-full blur-[120px] z-0 pointer-events-none" />
      <div className="absolute bottom-0 left-[35%] w-[250px] sm:w-[500px] h-[250px] sm:h-[500px] bg-white/3 rounded-full blur-[120px] z-0 pointer-events-none" />

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Cupons</h1>
          <p className="text-muted-foreground">Crie e gerencie cupons de desconto para sua loja.</p>
        </div>

        <div className="flex items-center gap-3">
          <DateRangeFilter onRangeChange={(range) => setDateRange(range)} />

          <Button variant="default" size="lg" onClick={handleCreate} className="px-6 py-5 gap-2 shrink-0">
            <PlusCircle className="h-4 w-4" />
            Criar Cupom
          </Button>
        </div>
      </div>

      <CouponStatsCards stats={statsData} loading={isLoadingStats} />

      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500 group-focus-within:text-white transition-colors" />
            <Input
              placeholder="Pesquisar cupom pelo código..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="hidden md:flex rounded-lg border border-white/5 overflow-hidden select-none">
          <Table>
            <TableHeader className="bg-card/2">
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-white/50 font-medium text-sm pl-6">Código</TableHead>
                <TableHead className="text-white/50 font-medium text-sm">Desconto</TableHead>
                <TableHead className="text-white/50 font-medium text-sm">Uso</TableHead>
                <TableHead className="text-white/50 font-medium text-sm">Expiração</TableHead>
                <TableHead className="text-white/50 font-medium text-sm">Status</TableHead>
                <TableHead className="text-white/50 font-medium text-sm text-right pr-6"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingCoupons ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-white/5">
                    <TableCell className="pl-6"><Skeleton className="h-6 w-24 bg-white/5" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16 bg-white/5" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-32 bg-white/5" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20 bg-white/5" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16 bg-white/5" /></TableCell>
                    <TableCell className="pr-6"><div className="flex justify-end"><Skeleton className="h-8 w-8 bg-white/5" /></div></TableCell>
                  </TableRow>
                ))
              ) : couponsData?.coupons.length === 0 ? (
                <></>
              ) : (
                couponsData?.coupons.map((coupon) => (
                  <TableRow key={coupon.id} className="border-white/5 bg-background hover:bg-black/5 cursor-pointer transition-colors group select-none">
                    <TableCell className="pl-6">
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <code className="text-sm font-bold text-white uppercase font-medium">{coupon.code}</code>
                          <Button
                            onClick={() => copyToClipboard(coupon.code)}
                            variant="ghost"
                            size="icon-sm"
                            className="cursor-pointer"
                          >
                            <PiCopySimpleLight className="h-3 w-3" />
                          </Button>
                        </div>
                        {coupon.description && <span className="text-[10px] text-zinc-600 truncate max-w-[150px]">{coupon.description}</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-white">
                          {coupon.type === "PERCENTAGE" ? `${coupon.value}%` : formatCurrency(coupon.value)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="w-80">
                      <div className="flex flex-col gap-1.5 ">
                        <Progress value={getProgressValue(coupon)} className="h-2 bg-white/5" />
                        <div className="flex items-center justify-between text-xs font-medium">
                          <span className="text-white/70">{coupon.usedCount}/{coupon.maxUses || "∞"}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs text-white/70">
                        {coupon.endDate ? format(new Date(coupon.endDate), "dd/MM/yyyy") : "Sem expiração"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(coupon)}
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger className={cn(buttonVariants({ variant: "ghost" }), "h-8 w-8 p-0 hover:bg-white/10")}>
                          <MoreVertical className="h-4 w-4 text-zinc-400" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-md text-white min-w-[220px] p-1">
                          <DropdownMenuGroup className="cursor-pointer">
                            <DropdownMenuItem className="rounded-sm text-sm p-2 gap-2 cursor-pointer focus:bg-white/5" onClick={() => handleEdit(coupon)}>
                              <Pencil className="h-4 w-4" />
                              Editar Dados
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="rounded-sm text-sm p-2 gap-2 cursor-pointer"
                              onClick={() => {
                                if (confirm("Tem certeza que deseja excluir este cupom?")) {
                                  deleteMutation.mutate(coupon.id);
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuGroup>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-col md:hidden gap-4">
          {isLoadingCoupons ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-lg border border-white/5 bg-background p-4 space-y-4">
                <div className="flex justify-between items-start">
                  <Skeleton className="h-6 w-24 bg-white/5" />
                  <Skeleton className="h-8 w-8 bg-white/5 rounded-full" />
                </div>
                <Skeleton className="h-4 w-full bg-white/5" />
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-20 bg-white/5" />
                  <Skeleton className="h-4 w-20 bg-white/5" />
                </div>
              </div>
            ))
          ) : couponsData?.coupons.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <Ticket className="h-12 w-12 text-zinc-700 mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">Nenhum cupom encontrado</h3>
              <p className="text-zinc-500 max-w-xs">Tente ajustar sua pesquisa ou crie um novo cupom.</p>
            </div>
          ) : (
            couponsData?.coupons.map((coupon) => (
              <div
                key={coupon.id}
                className="rounded-lg border border-white/5 bg-card p-4 space-y-4 hover:bg-white/[0.02] transition-colors group relative"
                onClick={() => handleEdit(coupon)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-bold text-white uppercase">{coupon.code}</code>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyToClipboard(coupon.code);
                        }}
                        variant="ghost"
                        size="icon-sm"
                        className="h-6 w-6"
                      >
                        <PiCopySimpleLight className="h-3 w-3" />
                      </Button>
                    </div>
                    {coupon.description && (
                      <span className="text-xs text-zinc-500 line-clamp-1">{coupon.description}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(coupon)}
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        asChild
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-white/10">
                          <MoreVertical className="h-4 w-4 text-zinc-400" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-[#0D0D0D] border-white/10 text-white min-w-[200px]">
                        <DropdownMenuGroup>
                          <DropdownMenuLabel className="text-[10px] uppercase font-bold text-zinc-600">Ações</DropdownMenuLabel>
                          <DropdownMenuItem className="gap-2 cursor-pointer focus:bg-white/5" onClick={() => handleEdit(coupon)}>
                            <Edit className="h-3.5 w-3.5" />
                            Editar Dados
                          </DropdownMenuItem>
                          <DropdownMenuItem className="gap-2 cursor-pointer focus:bg-white/5" onClick={() => duplicateMutation.mutate(coupon.id)}>
                            <Copy className="h-3.5 w-3.5" />
                            Duplicar Cupom
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="gap-2 cursor-pointer focus:bg-white/5"
                            onClick={() => toggleMutation.mutate({ id: coupon.id, isActive: !coupon.isActive })}
                          >
                            {coupon.isActive ? <ToggleLeft className="h-3.5 w-3.5" /> : <ToggleRight className="h-3.5 w-3.5" />}
                            {coupon.isActive ? "Desativar" : "Ativar"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-white/5" />
                          <DropdownMenuItem
                            className="gap-2 cursor-pointer text-red-500 focus:bg-red-500/10 focus:text-red-500"
                            onClick={() => {
                              if (confirm("Tem certeza que deseja excluir este cupom?")) {
                                deleteMutation.mutate(coupon.id);
                              }
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuGroup>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 py-3 border-y border-white/5">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] uppercase font-bold text-zinc-600">Desconto</span>
                    <span className="text-sm font-medium text-white">
                      {coupon.type === "PERCENTAGE" ? `${coupon.value}%` : formatCurrency(coupon.value)}
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[10px] uppercase font-bold text-zinc-600">Expiração</span>
                    <span className="text-sm font-medium text-white">
                      {coupon.endDate ? format(new Date(coupon.endDate), "dd/MM/yyyy") : "Sem expiração"}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[10px] uppercase font-bold text-zinc-600">
                    <span>Uso do Cupom</span>
                    <span className="text-white/70">{coupon.usedCount}/{coupon.maxUses || "∞"}</span>
                  </div>
                  <Progress value={getProgressValue(coupon)} className="h-1.5 bg-white/5" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <CouponModal open={isModalOpen} onOpenChange={(v) => { setIsModalOpen(v); if (!v) setSelectedCoupon(null); }} coupon={selectedCoupon} />
    </div>
  );
};