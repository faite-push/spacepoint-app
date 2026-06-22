"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Copy, ExternalLink, Loader2, Package, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

import { fetchMyOrders, formatPrice } from "@/lib/shop-api";
import type { Order } from "@/types/shop";
import { OrderStatusBadge } from "../_components/order-status-badge";
import { Button } from "@/components/ui/button";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function copyCode(code: string) {
  navigator.clipboard.writeText(code);
  toast.success("Código copiado!");
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyOrders()
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight">Meus Pedidos</h1>
        <p className="text-zinc-500 mt-1">Acompanhe compras e acesse seus códigos digitais.</p>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] p-12 text-center">
          <Package className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-white mb-2">Nenhum pedido ainda</h2>
          <p className="text-sm text-zinc-500 mb-6">Suas compras aparecerão aqui após o checkout.</p>
          <Button asChild className="rounded-xl">
            <Link href="/">
              <ShoppingBag className="h-4 w-4 mr-2" />
              Ir para a loja
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <article
              key={order.id}
              className="rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 border-b border-white/5">
                <div className="space-y-1">
                  <p className="text-xs text-zinc-500 font-mono">#{order.id.slice(0, 12)}…</p>
                  <p className="text-sm text-zinc-400">{formatDate(order.createdAt)}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <OrderStatusBadge status={order.status} />
                  <span className="text-lg font-black text-white">{formatPrice(order.total)}</span>
                  {order.status === "PENDING" && (
                    <Button asChild size="sm" className="rounded-lg">
                      <Link href={`/checkout/payment/${order.id}`}>
                        Pagar <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
                      </Link>
                    </Button>
                  )}
                </div>
              </div>

              <div className="p-5 space-y-4">
                {order.items.map((item) => {
                  const image = item.product.imageUrl || item.product.images?.[0];
                  return (
                    <div key={item.id} className="flex gap-4">
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-white/5 border border-white/5">
                        {image && (
                          <Image src={image} alt={item.product.name} fill className="object-cover" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/product/${item.product.slug}`}
                          className="font-bold text-white hover:text-primary transition-colors line-clamp-1"
                        >
                          {item.product.name}
                          {item.variantName ? ` — ${item.variantName}` : ""}
                        </Link>
                        <p className="text-xs text-zinc-500 mt-0.5">
                          Qtd: {item.quantity} • {formatPrice(item.unitPrice)} cada
                        </p>

                        {item.codes.length > 0 && (
                          <div className="mt-3 space-y-2">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">
                              Seus códigos
                            </p>
                            {item.codes.map((c) => (
                              <div
                                key={c.code}
                                className="flex items-center gap-2 rounded-lg bg-black/40 border border-white/5 px-3 py-2"
                              >
                                <code className="flex-1 text-xs font-mono text-zinc-300 break-all">
                                  {c.code}
                                </code>
                                <button
                                  type="button"
                                  onClick={() => copyCode(c.code)}
                                  className="shrink-0 p-1.5 rounded-md hover:bg-white/10 text-zinc-400 hover:text-white"
                                >
                                  <Copy className="h-4 w-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-white">
                          {formatPrice(item.unitPrice * item.quantity)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
