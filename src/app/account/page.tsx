"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Package, Heart, Wallet, ArrowRight, Shield } from "lucide-react";

import { useAuth } from "@/context/auth-context";
import { fetchMyOrders, formatPrice } from "@/lib/shop-api";
import { useWishlistStore } from "@/store/wishlist-store";
import { Button } from "@/components/ui/button";

export default function AccountPage() {
  const { user } = useAuth();
  const wishlistCount = useWishlistStore((s) => s.items.length);
  const [ordersCount, setOrdersCount] = useState(0);
  const [paidCount, setPaidCount] = useState(0);

  useEffect(() => {
    fetchMyOrders()
      .then((orders) => {
        setOrdersCount(orders.length);
        setPaidCount(orders.filter((o) => o.status === "PAID" || o.status === "DELIVERED").length);
      })
      .catch(() => {
        setOrdersCount(0);
        setPaidCount(0);
      });
  }, []);

  if (!user) return null;

  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
    : null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight">Minha Conta</h1>
        <p className="text-zinc-500 mt-1">Gerencie seus pedidos, saldo e preferências.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
          <div className="flex items-center gap-3 text-zinc-500 mb-2">
            <Wallet className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Saldo</span>
          </div>
          <p className="text-2xl font-black text-white">{formatPrice(user.balance ?? 0)}</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
          <div className="flex items-center gap-3 text-zinc-500 mb-2">
            <Package className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Pedidos</span>
          </div>
          <p className="text-2xl font-black text-white">{ordersCount}</p>
          <p className="text-xs text-zinc-500 mt-1">{paidCount} concluídos</p>
        </div>
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-5">
          <div className="flex items-center gap-3 text-zinc-500 mb-2">
            <Heart className="h-4 w-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Desejos</span>
          </div>
          <p className="text-2xl font-black text-white">{wishlistCount}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Informações pessoais
        </h2>
        <dl className="grid gap-4 sm:grid-cols-2 text-sm">
          <div>
            <dt className="text-zinc-500 mb-1">Nome</dt>
            <dd className="text-white font-medium">{user.name || "—"}</dd>
          </div>
          <div>
            <dt className="text-zinc-500 mb-1">E-mail</dt>
            <dd className="text-white font-medium">{user.email || "—"}</dd>
          </div>
          <div>
            <dt className="text-zinc-500 mb-1">Login via</dt>
            <dd className="text-white font-medium capitalize">{user.provider}</dd>
          </div>
          {memberSince && (
            <div>
              <dt className="text-zinc-500 mb-1">Membro desde</dt>
              <dd className="text-white font-medium capitalize">{memberSince}</dd>
            </div>
          )}
        </dl>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button asChild variant="outline" className="rounded-xl border-white/10">
          <Link href="/account/orders">
            Ver meus pedidos <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
        <Button asChild variant="outline" className="rounded-xl border-white/10">
          <Link href="/account/wishlist">
            Lista de desejos <ArrowRight className="h-4 w-4 ml-2" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
