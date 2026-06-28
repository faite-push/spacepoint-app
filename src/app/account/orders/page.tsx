"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { FaBasketShopping } from "react-icons/fa6";

import { OrderStatusBadge } from "../_components/order-status-badge";
import { Button } from "@/components/ui/button";

import { fetchMyOrders, formatPrice } from "@/lib/shop-api";
import type { Order } from "@/types/shop";

import { OrderSkeleton } from "../_components/account-skeletons";
import { ScrollArea } from "@/components/ui/scroll-area";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyOrders()
      .then((allOrders) => {
        const paidOrders = allOrders.filter((order) =>
          ["PAID", "DELIVERED"].includes(order.status.toUpperCase())
        );
        setOrders(paidOrders);
      })
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="relative space-y-4">
      <div className="absolute top-0 right-[-10%] w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-primary/20 rounded-full blur-[120px] -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-[-10%] w-[250px] sm:w-[400px] h-[250px] sm:h-[400px] bg-primary/20 rounded-full blur-[120px] -z-10 pointer-events-none" />

      <div>
        <h1 className="text-2xl font-bold text-white">Meus Pedidos</h1>
        <p className="text-muted-foreground">Acompanhe suas compras e acesse detalhes.</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          <OrderSkeleton />
          <OrderSkeleton />
          <OrderSkeleton />
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-md border-2 border-dashed border-white/5 bg-black/10 p-12 text-center">
          <FaBasketShopping className="text-muted-foreground h-12 w-12 mx-auto mb-2" />
          <h2 className="text-lg font-bold text-white">Nenhum pedido confirmado</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Seus pedidos pagos ou entregues aparecerão aqui.
          </p>
          <Button asChild variant="default" size="lg" className="px-6 py-4">
            <Link href="/">Ir para a loja</Link>
          </Button>
        </div>
      ) : (
        <ScrollArea className="h-[500px] pr-4 scrollbar-thin">
          <div className="space-y-3">
            {orders.map((order) => {
              const totalItems = order.items.reduce((acc, item) => acc + item.quantity, 0);
              return (
                <article
                  key={order.id}
                  className="rounded-md border border-white/5 bg-black/10 hover:bg-white/[0.02] transition-colors p-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 flex-1">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">ID do Pedido</p>
                      <p className="text-sm font-mono text-white/90">#{order.id.slice(0, 8)}</p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Status</p>
                      <OrderStatusBadge status={order.status} />
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Data</p>
                      <p className="text-sm text-white/90">{formatDate(order.createdAt)}</p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Pagamento</p>
                      <p className="text-sm text-white/90 font-medium capitalize">
                        {order.paymentMethod || "Pix"}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Itens</p>
                      <p className="text-sm text-white/90">
                        {totalItems} {totalItems === 1 ? "item" : "itens"}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Cupom</p>
                      <p className="text-sm text-white/90 lowercase">
                        {order.couponCode || "Nenhum cupom"}
                      </p>
                    </div>

                    <div className="space-y-1 flex flex-col">
                      <p className="text-xs font-medium text-muted-foreground">Total</p>
                      <span className="text-sm font-medium text-white">
                        {formatPrice(order.total)}
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0">
                    <Button
                      asChild
                      size="sm"
                      variant="default"
                      className="rounded-md py-4 px-5 w-full md:w-auto"
                    >
                      <Link href={`/account/orders/${order.id}`}>Ver detalhes</Link>
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}