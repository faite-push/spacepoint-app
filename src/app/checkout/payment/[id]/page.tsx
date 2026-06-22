"use client";

import { useEffect, useState, use } from "react";
import Image from "next/image";
import Link from "next/link";

import { useQuery } from "@tanstack/react-query";
import { QRCodeSVG } from "qrcode.react";
import confetti from "canvas-confetti";
import { toast } from "sonner";

import { CheckCircle2, Copy, Clock, AlertCircle, Loader2, ChevronLeft, ExternalLink, ShieldCheck, Zap, ArrowRight } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import { fetchOrder, formatPrice } from "@/lib/shop-api";

interface PageProps {
  params: Promise<{ id: string }>;
};

export default function PaymentPage({ params }: PageProps) {
  const { id } = use(params);
  const [copied, setCopied] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["order", id],
    queryFn: () => fetchOrder(id),
    refetchInterval: (query) => {
      const status = query.state.data?.order?.status;
      return (status === "PAID" || status === "DELIVERED" || status === "CANCELLED") ? false : 3000;
    }
  });

  useEffect(() => {
    if (data?.order?.status === "PAID" || data?.order?.status === "DELIVERED") {
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#A855F7", "#D8B4FE", "#FFFFFF"]
      });
    }
  }, [data?.order?.status]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Código copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="pb-24 lg:pb-12 -mt-32 py-6 md:py-12 relative">
        <div className="absolute top-0 right-[-10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-7 w-32 rounded-sm" />
              <Skeleton className="h-7 w-40 rounded-full" />
            </div>
          </header>

          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <section className="space-y-6">
              <div className="bg-white/[0.01] border border-primary/5 rounded-xl p-8 sm:p-10 text-center space-y-6">
                <div className="space-y-3 flex flex-col items-center">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-12 w-48" />
                </div>

                <div className="space-y-8 flex flex-col items-center">
                  <Skeleton className="h-[232px] w-[232px] rounded-3xl" />
                  <div className="space-y-4 w-full">
                    <Skeleton className="h-4 w-60 mx-auto" />
                    <Skeleton className="h-16 w-full rounded-2xl" />
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-center gap-6">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>

              <div className="bg-white/[0.01] border border-white/5 rounded-xl p-6 flex items-start gap-4">
                <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            </section>

            <aside className="space-y-6">
              <div className="bg-white/[0.01] border border-primary/5 rounded-xl p-8 sm:p-10 space-y-8">
                <Skeleton className="h-7 w-48" />

                <div className="space-y-6">
                  {[1, 2].map((i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-16 w-16 rounded-2xl shrink-0" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))}
                </div>

                <div className="space-y-3 pt-4 border-t border-white/5">
                  <div className="flex justify-between">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <div className="flex justify-between">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-7 w-28" />
                  </div>
                </div>

                <Skeleton className="h-12 w-full rounded-md" />
              </div>

              <div className="p-8 flex flex-col items-center bg-white/[0.01] border border-primary/5 rounded-xl space-y-4">
                <Skeleton className="h-3 w-48" />
                <Skeleton className="h-12 w-56 rounded-xl" />
              </div>
            </aside>
          </div>
        </div>
      </div>
    );
  };

  if (error || !data) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-6 bg-[#050505] p-6 text-center">
        <div className="h-20 w-20 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <AlertCircle className="h-10 w-10 text-red-500" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white">Pedido não encontrado</h1>
          <p className="text-zinc-500 max-w-xs">Não conseguimos localizar as informações deste pagamento.</p>
        </div>
        <Button asChild variant="outline" className="rounded-2xl border-white/10">
          <Link href="/">Voltar para a loja</Link>
        </Button>
      </div>
    );
  };

  const { order, paymentData } = data;
  const isPaid = order.status === "PAID" || order.status === "DELIVERED";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-24 lg:pb-12 -mt-32 py-6 md:py-12 relative">
      <div className="absolute top-0 right-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-[-10%] w-[400px] h-[400px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

      <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href="/account/orders"
          className="group flex items-center gap-2 text-zinc-500 hover:text-white transition-colors w-fit"
        >
          <ChevronLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Meus Pedidos</span>
        </Link>

        <div className="flex items-center gap-3">
          <Badge variant="outline" className="rounded-sm bg-white/5 border-none text-zinc-400 py-1 px-3">
            ID: {order.id}
          </Badge>
          {isPaid ? (
            <Badge className="bg-emerald-500/10 text-emerald-500 border-none rounded-full py-1 px-3">
              <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Pago
            </Badge>
          ) : (
            <Badge className="bg-amber-500/10 text-amber-500 border-none rounded-sm py-1 px-3">
              <Clock className="h-3.5 w-3.5 mr-1.5 animate-pulse" /> Aguardando Pagamento
            </Badge>
          )}
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-4">
        <section className="min-w-[100px] lg:max-w-3xl space-y-6">
          <div className="bg-white/[0.01] border border-primary/5 rounded-md px-6 py-8 text-center relative overflow-hidden">
            {isPaid ? (
              <div className="flex w-full md:min-w-3xl flex-col items-center justify-center py-10 animate-in fade-in zoom-in duration-500">
                <div className="relative mb-4 md:mb-8">
                  <div className="absolute inset-0 bg-emerald-500 blur-3xl opacity-20 animate-pulse" />
                  <div className="relative h-12 w-12 md:h-18 md:w-18 rounded-full bg-emerald-500/70 flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.5)]">
                    <CheckCircle2 className="h-8 w-8 md:h-12 md:w-12 text-white" />
                  </div>
                </div>

                <h2 className="text-xl md:text-3xl font-bold text-white mb-2">Pagamento Aprovado!</h2>
                <p className="text-muted-foreground text-sm mb-10 text-center max-w-[300px]">
                  Sua compra foi processada com sucesso. Seus produtos já estão disponíveis.
                </p>

                <Button
                  asChild
                  variant="default"
                  size="lg"
                  className="border-none rounded-md px-10 h-12"
                >
                  <Link href="/account/orders">
                    Acessar Meus Produtos <ArrowRight className="h-5 w-5 ml-2" />
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-center">
                  <h2 className="text-2xl font-bold text-white">Pagamento via PIX</h2>
                  <p className="text-sm text-muted-foreground">
                    Escaneie o QR Code ou copie o código PIX para realizar o pagamento.
                  </p>
                </div>

                {paymentData?.type === "PIX" && (
                  <div className="space-y-4">
                    <div className="relative mx-auto w-fit p-4 bg-white rounded-md">
                      <QRCodeSVG
                        value={paymentData.copyPaste}
                        size={230}
                        level="H"
                        includeMargin={false}
                      />
                    </div>

                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-1">Valor a pagar</p>
                      <div className="text-3xl font-bold text-white">{formatPrice(order.total)}</div>
                    </div>

                    <div className="relative group/copy">
                      <button
                        type="button"
                        onClick={() => copyToClipboard(paymentData.copyPaste)}
                        className="relative w-full bg-white/1 border border-primary/5 rounded-md px-4 py-2 pr-16 transition-all text-left"
                      >
                        <p className="text-xs text-muted-foreground font-medium mb-2">Pix Copia e Cola</p>
                        <p className="text-sm truncate mr-4 font-mono break-all text-gray-300">
                          {paymentData.copyPaste}
                        </p>
                        <div className="absolute right-5 top-1/2 -translate-y-1/2 bg-white/2 p-3 rounded-md text-white/80">
                          <Copy className="h-5 w-5" />
                        </div>
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-center gap-6 text-sm font-medium text-zinc-600">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4" /> Seguro
                  </span>
                  <span className="h-1 w-1 rounded-full bg-zinc-800" />
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" /> Expira em 30 min
                  </span>
                </div>
              </div>
            )}
          </div>

          {!isPaid && (
            <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-md p-6 flex items-start gap-4">
              <div className="h-10 w-10 shrink-0 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                <Zap className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-emerald-500">Aprovação Automática</h4>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Não é necessário enviar comprovante. O sistema identificará seu pagamento em poucos segundos após a confirmação do banco.
                </p>
              </div>
            </div>
          )}
        </section>

        <aside className="w-full lg:w-[450px] space-y-6">
          <div className="bg-white/[0.01] border border-primary/5 rounded-md rounded-md px-6 py-4 space-y-4">
            <h3 className="text-xl font-bold text-white tracking-tight">Resumo da Compra</h3>

            <div className="space-y-4">
              <ScrollArea className="max-h-74 overflow-y-scroll pr-1">
                <div className="space-y-2">
                  {order.items.map((item: any) => (
                    <div key={item.id} className="group flex  items-center gap-4 p-3 transition-all bg-white/[0.02] hover:bg-white/[0.02] rounded-lg border border-white/5">
                      <div className="relative aspect-square h-14 w-14 shrink-0 overflow-hidden rounded-md bg-white/5 border border-white/5">
                        {item.product.imageUrl && (
                          <Image
                            src={item.product.imageUrl}
                            alt={item.product.name}
                            fill
                            className="object-cover select-none pointer-events-none"
                          />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <Tooltip>
                          <TooltipTrigger
                            render={
                              <h4 className="text-sm cursor-pointer font-bold text-white/90 line-clamp-1" >
                                {item.product.name}
                              </h4>
                            }
                          >
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{item.product.name}</p>
                          </TooltipContent>
                        </Tooltip>
                        <p className="text-xs text-zinc-500 font-medium">
                          Qtd: {item.quantity} • {item.variantName || "Produto"}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-sm font-bold text-white">
                          {formatPrice(item.unitPrice * item.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-sm font-medium">
                <span className="text-white/40">Subtotal</span>
                <span className="text-white font-bold">{formatPrice(order.total)}</span>
              </div>
              <div className="flex justify-between text-sm font-medium">
                <span className="text-lg font-bold text-white/60">Valor Total</span>
                <span className="text-lg font-bold text-white tracking-tight">{formatPrice(order.total)}</span>
              </div>
            </div>

            <Button
              variant="ghost"
              size="lg"
              asChild
              className="w-full"
            >
              <Link href={`/product/${order.items[0]?.product.slug}`}>
                Continuar comprando
              </Link>
            </Button>
          </div>
        </aside>
      </div>
    </div>
  );
};