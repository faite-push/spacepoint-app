"use client";

import { useEffect, useState, use, Suspense } from "react";
import Image from "next/image";
import Link from "next/link";

import { Clock, Undo2, XCircle, ArrowRight, Star } from "lucide-react";
import { FaBasketShopping } from "react-icons/fa6";

import { Tooltip, TooltipContent, TooltipTrigger, } from "@/components/ui/tooltip"
import { Separator, } from "@/components/ui/separator"
import { Button } from "@/components/ui/button";

import { OrderDetailsSkeleton } from "../../_components/account-skeletons";
import { OrderChat } from "../_components/order-chat";

import { fetchOrder, formatPrice } from "@/lib/shop-api";
import { canAccessOrderChat, canReviewOrder, getOrderPaymentUrl, isOrderAwaitingPayment, isOrderRefunded, } from "@/lib/order-account-utils";
import type { Order } from "@/types/shop";
import { OrderStatusBadge } from "../../_components/order-status-badge";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function OrderDetailsPage(props: PageProps) {
  const params = use(props.params);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrder(params.id)
      .then((res) => setOrder(res.order))
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return <OrderDetailsSkeleton />;
  };

  if (!order) {
    return (
      <div className="rounded-md border-2 border-dashed border-white/5 bg-black/10 p-12 text-center">
        <FaBasketShopping className="text-muted-foreground h-12 w-12 mx-auto mb-2" />
        <h2 className="text-lg font-bold text-white">Pedido não encontrado</h2>
        <p className="text-sm text-muted-foreground mb-4">Verifique se o código do pedido está correto.</p>
        <Button asChild variant="default" size="lg" className="px-6 py-4">
          <Link href="/account/orders">
            Voltar para pedidos
          </Link>
        </Button>
      </div>
    );
  };

  const isApproved = order.status === "PAID" || order.status === "DELIVERED";
  const awaitingPayment = isOrderAwaitingPayment(order.status);
  const refunded = isOrderRefunded(order.status);
  const cancelled = order.status.toUpperCase() === "CANCELLED";
  const showChat = canAccessOrderChat(order.status);
  const pendingReview = canReviewOrder(order);
  const statusDate = order.paidAt || order.updatedAt || order.createdAt;

  return (
    <div className="relative space-y-8 animate-in fade-in duration-500">
      <div className="absolute top-0 right-[-10%] w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-primary/20 rounded-full blur-[120px] -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-[-10%] w-[250px] sm:w-[400px] h-[250px] sm:h-[400px] bg-primary/20 rounded-full blur-[120px] -z-10 pointer-events-none" />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2 text-muted-foreground">
            <Link href="/account/orders">← Voltar para pedidos</Link>
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">Pedido #{order.id.slice(0, 8)}</h1>
            <OrderStatusBadge status={order.status} />
          </div>
        </div>
      </div>

      {awaitingPayment && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-amber-500/10 rounded-md p-4 gap-4">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-100">Pagamento pendente</p>
              <p className="text-sm text-amber-100/80">
                Este pedido ainda não foi pago. Retome o pagamento para concluir sua compra.
              </p>
            </div>
          </div>
          <Button asChild className="shrink-0 gap-2">
            <Link href={getOrderPaymentUrl(order)}>
              Continuar pagamento
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      )}

      {refunded && (
        <div className="flex items-center bg-orange-500/10 rounded-md p-4 gap-4">
          <Undo2 className="h-5 w-5 shrink-0 text-orange-400 mt-0.5" />
          <div>
            <p className="font-semibold text-orange-100">Pedido reembolsado</p>
            <p className="text-sm text-orange-100/80">
              O valor deste pedido foi estornado. Se tiver dúvidas, entre em contato com o suporte.
            </p>
          </div>
        </div>
      )}

      {cancelled && (
        <div className="flex items-center bg-red-500/10 rounded-md p-4 gap-4">
          <XCircle className="h-6 w-6 shrink-0 text-red-500" />
          <div>
            <p className="font-semibold text-red-500">Pedido cancelado</p>
            <p className="text-sm text-red-100/80">
              Este pedido foi cancelado ou expirou antes da confirmação do pagamento.
            </p>
          </div>
        </div>
      )}

      {pendingReview && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-yellow-500/10 rounded-md p-4 gap-4">
          <div className="flex items-center gap-3">
            <Star className="h-5 w-5 shrink-0 text-yellow-400" />
            <div>
              <p className="font-semibold text-yellow-100">Como foi sua compra?</p>
              <p className="text-sm text-yellow-100/80">
                Sua avaliação ajuda outros clientes e melhora nosso atendimento.
              </p>
            </div>
          </div>
          <Button asChild className="shrink-0 gap-2">
            <Link href={`/account/orders/${order.id}?review=1`}>
              Avaliar pedido
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          {showChat ? (
            <div className="space-y-3">
              <Suspense fallback={null}>
                <OrderChat orderId={order.id} />
              </Suspense>
            </div>
          ) : awaitingPayment ? (
            <div className="rounded-md border border-white/5 bg-black/10 px-8 py-24 text-center">
              <Clock className="h-10 w-10 text-amber-400 mx-auto mb-3" />
              <h2 className="text-lg font-bold text-white mb-2">Chat disponível após o pagamento</h2>
              <p className="text-sm text-muted-foreground">
                Assim que o pagamento for confirmado, você poderá acompanhar a entrega por aqui.
              </p>
            </div>
          ) : (
            <div className="rounded-md border border-white/5 bg-black/10 px-8 py-24 text-center">
              <FaBasketShopping className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <h2 className="text-lg font-bold text-white mb-2">Sem atendimento ativo</h2>
              <p className="text-sm text-muted-foreground">
                Este pedido não possui chat de entrega disponível no momento.
              </p>
            </div>
          )}
        </div>

        <div className="relative">
          <div className="rounded-md border border-white/5 bg-transparent backdrop-blur-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5">
              <div className="flex items-center justify-center">
                {isApproved ? (
                  <span className="text-xl font-bold">Pagamento aprovado!</span>
                ) : awaitingPayment ? (
                  <span className="text-xl font-bold">Aguardando pagamento</span>
                ) : refunded ? (
                  <span className="text-xl font-bold">Pedido reembolsado</span>
                ) : cancelled ? (
                  <span className="text-xl font-bold">Pedido cancelado</span>
                ) : (
                  <span className="font-bold uppercase tracking-wider">{order.status}</span>
                )}
              </div>
              <p className="flex items-center justify-center text-xs text-muted-foreground">
                {new Date(statusDate).toLocaleDateString("pt-BR")} - {new Date(statusDate).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            <div className="px-6 py-4 space-y-2">
              {order.checkoutData && Object.entries(order.checkoutData).length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-1 gap-2">
                  {Object.entries(order.checkoutData).map(([key, value]) => (
                    <div key={key} className="space-y-2">
                      <label className="text-sm font-medium text-white capitalize">{key}</label>
                      <div className="rounded-md bg-background/10 backdrop-blur-xl border border-white/5 px-4 py-3 text-sm text-zinc-300 font-medium">
                        {value}
                      </div>
                    </div>
                  ))}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white">Nº do pedido</label>
                    <div className="rounded-md bg-background/10 backdrop-blur-xl border border-white/5 px-4 py-3 text-sm font-mono text-zinc-300">
                      {order.id}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="text-start">
                  <p className="text-xs text-muted-foreground font-medium">Pago com</p>
                  <p className="font-bold text-white">{order.paymentMethod || "Pix"}</p>
                </div>

                <div className="text-center">
                  <p className="text-xs text-muted-foreground font-medium">Desconto</p>
                  <p className="font-bold text-white capitalize">{formatPrice(order.discount || 0)}</p>
                </div>
                {order.couponCode && (
                  <div className="">
                    <p className="text-xs text-muted-foreground font-medium">Cupom</p>
                    <p className="font-bold text-emerald-400 uppercase">{order.couponCode}</p>
                  </div>
                )}
                <div className="text-right">
                  <p className="text-xs text-muted-foreground font-medium">Valor total</p>
                  <p className="font-bold text-white">{formatPrice(order.total)}</p>
                </div>
              </div>
            </div>

            <Separator className="bg-white/5" />

            <div className="px-6 py-4 space-y-2">
              <h2 className="flex items-center justify-center text-xl font-bold">Itens do pedido</h2>

              <div className="space-y-3">
                {order.items.map((item) => {
                  const image = item.product.imageUrl || item.product.images?.[0];
                  return (
                    <div
                      key={item.id}
                      className="group relative flex items-center border border-white/5 gap-2 rounded-sm p-2"
                    >
                      <div className="relative h-16 w-16 border border-white/5 rounded-sm shrink-0 overflow-hidden">
                        {image ? (
                          <Image src={image} alt={item.product.name} fill className="object-cover select-none pointer-events-none" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-white/5 text-zinc-500">
                            <FaBasketShopping className="h-6 w-6" />
                          </div>
                        )}
                      </div>

                      <div className="absolute  -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-black">
                        {item.quantity}
                      </div>

                      <div className="flex-1 min-w-0">
                        <Tooltip>
                          <TooltipTrigger render={
                            <h3 className="font-medium text-sm text-white line-clamp-1 cursor-pointer">
                              {item.product.name}
                              {item.variantName ? ` — ${item.variantName}` : ""}
                            </h3>
                          }>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{item.product.name}</p>
                          </TooltipContent>
                        </Tooltip>
                        <p className="text-sm font-bold text-muted-foreground">{formatPrice(item.unitPrice)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}