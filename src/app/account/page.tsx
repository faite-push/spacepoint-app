"use client";

import { useEffect, useState } from "react";
import { fetchMyOrders, formatPrice } from "@/lib/shop-api";
import { useAuth } from "@/context/auth-context";
import type { Order } from "@/types/shop";

export default function AccountPage() {
  const { user, loading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    if (user) fetchMyOrders().then(setOrders).catch(() => setOrders([]));
  }, [user]);

  if (loading) return <p>Carregando...</p>;
  if (!user) return <p>Faça login para ver sua conta.</p>;

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-border bg-card p-8">
        <h1 className="text-4xl font-black">Minha conta</h1>
        <p className="mt-2 text-muted-foreground">{user.email}</p>
        <p className="mt-4 text-sm">Saldo: <strong>{formatPrice(user.balance ?? 0)}</strong></p>
      </section>
      <section className="space-y-4">
        <h2 className="text-2xl font-bold">Pedidos e códigos digitais</h2>
        {orders.map((order) => (
          <article key={order.id} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex justify-between gap-4">
              <strong>Pedido {order.id}</strong>
              <span>{order.status} • {formatPrice(order.total)}</span>
            </div>
            <div className="mt-4 space-y-3">
              {order.items.map((item) => (
                <div key={item.id} className="rounded-xl bg-background p-3">
                  <p className="font-semibold">
                    {item.product.name}
                    {item.variantName ? ` — ${item.variantName}` : ""}
                  </p>
                  {item.codes.map((code) => <code key={code.code} className="mt-2 block rounded bg-muted p-2">{code.code}</code>)}
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
