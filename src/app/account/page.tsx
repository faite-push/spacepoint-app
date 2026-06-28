"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Wallet, ArrowRight, Shield } from "lucide-react";
import { FaBasketShopping } from "react-icons/fa6";
import { BsBookmarkHeartFill } from "react-icons/bs";

import { fetchMyOrders, formatPrice } from "@/lib/shop-api";
import { useWishlistStore } from "@/store/wishlist-store";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { BiSolidUser } from "react-icons/bi";

import { StatSkeleton } from "./_components/account-skeletons";

export default function AccountPage() {
  const { user } = useAuth();
  const wishlistCount = useWishlistStore((s) => s.items.length);
  const [ordersCount, setOrdersCount] = useState(0);
  const [paidCount, setPaidCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyOrders()
      .then((orders) => {
        setOrdersCount(orders.length);
        setPaidCount(orders.filter((o) => o.status === "PAID" || o.status === "DELIVERED").length);
      })
      .catch(() => {
        setOrdersCount(0);
        setPaidCount(0);
      })
      .finally(() => setLoading(false));
  }, []);

  if (!user) return null;

  const memberSince = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
    : null;

  return (
    <div className="relative space-y-4">
      <div className="absolute top-0 right-[-10%] w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-primary/20 rounded-full blur-[120px] -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-[-10%] w-[250px] sm:w-[400px] h-[250px] sm:h-[400px] bg-primary/20 rounded-full blur-[120px] -z-10 pointer-events-none" />

      <div>
        <h1 className="text-2xl font-bold text-white">Minha Conta</h1>
        <p className="text-muted-foreground">Gerencie seus pedidos, saldo e preferências.</p>
      </div>

      <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        {loading ? (
          <>
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
          </>
        ) : (
          <>
            <div className="relative group select-none rounded-md border border-white/5 bg-transparent p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center justify-center gap-3">
                  <div className="flex bg-white/5 rounded-md h-10 w-10 items-center justify-center text-white">
                    <Wallet className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-lg md:text-xl font-medium text-white tracking-tight">Saldo</span>
                    <p className="text-xs md:text-sm text-white/60">{formatPrice(user.balance ?? 0)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative group select-none rounded-md border border-white/5 bg-transparent p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center justify-center gap-3">
                  <div className="flex bg-white/5 rounded-md h-10 w-10 items-center justify-center text-white">
                    <FaBasketShopping className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-lg md:text-xl font-medium text-white tracking-tight">Pedidos</span>
                    <p className="text-xs md:text-sm text-white/60">{ordersCount} pedidos e {paidCount} concluídos</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative group select-none rounded-md border border-white/5 bg-transparent p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center justify-center gap-3">
                  <div className="flex bg-white/5 rounded-md h-10 w-10 items-center justify-center text-white">
                    <BsBookmarkHeartFill className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-lg md:text-xl font-medium text-white tracking-tight">Desejos</span>
                    <p className="text-xs md:text-sm text-white/60">{wishlistCount}</p>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="rounded-md border border-white/5 bg-transparent p-4 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <BiSolidUser className="h-5 w-5 text-primary" />
          Informações pessoais
        </h2>
        <dl className="grid gap-4 sm:grid-cols-2 text-sm">
          <div>
            <dt className="text-muted-foreground">Nome</dt>
            <dd className="text-white font-medium">{user.name || "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">E-mail</dt>
            <dd className="text-white font-medium">{user.email || "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Login via</dt>
            <dd className="text-white font-medium capitalize">{user.provider}</dd>
          </div>
          {memberSince && (
            <div>
              <dt className="text-muted-foreground">Membro desde</dt>
              <dd className="text-white font-medium capitalize">{memberSince}</dd>
            </div>
          )}
        </dl>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button asChild variant="link" size="lg">
          <Link href="/account/orders">
            <FaBasketShopping className="h-4 w-4" /> Ver meus pedidos
          </Link>
        </Button>
        <Button asChild variant="link" size="lg">
          <Link href="/account/wishlist">
            <BsBookmarkHeartFill className="h-4 w-4" /> Lista de desejos
          </Link>
        </Button>
      </div>
    </div>
  );
}
