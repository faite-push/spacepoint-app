"use client";

import { useState } from "react";
import { createOrder, formatPrice } from "@/lib/shop-api";
import { useCartStore } from "@/store/cart-store";
import { Button } from "@/components/ui/button";

export default function CheckoutPage() {
  const { items, total, setQuantity, removeItem, clear } = useCartStore();
  const [status, setStatus] = useState<string>("");

  async function submitOrder() {
    setStatus("Criando pedido seguro...");
    try {
      const order = await createOrder(
        items.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
        }))
      );
      clear();
      setStatus(`Pedido ${order.id} criado. Aguarde o pagamento para entrega automática.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Erro ao criar pedido");
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <section className="space-y-4">
        <h1 className="text-4xl font-black">Checkout</h1>
        {items.map((item) => (
          <div
            key={item.cartKey}
            className="flex items-center justify-between rounded-2xl border border-border bg-card p-4"
          >
            <div>
              <h2 className="font-bold">{item.name}</h2>
              <p className="text-sm text-muted-foreground">
                {item.platform} • {formatPrice(item.price)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <input
                className="w-16 rounded-md border border-border bg-background p-2"
                type="number"
                min={1}
                max={10}
                value={item.quantity}
                onChange={(event) => setQuantity(item.cartKey, Number(event.target.value))}
              />
              <Button variant="outline" onClick={() => removeItem(item.cartKey)}>
                Remover
              </Button>
            </div>
          </div>
        ))}
      </section>
      <aside className="h-fit rounded-3xl border border-border bg-card p-6">
        <p className="text-sm text-muted-foreground">Total</p>
        <strong className="mt-2 block text-3xl">{formatPrice(total())}</strong>
        <Button className="mt-6 w-full" disabled={!items.length} onClick={submitOrder}>
          Criar pedido
        </Button>
        {status ? <p className="mt-4 text-sm text-muted-foreground">{status}</p> : null}
      </aside>
    </div>
  );
}
