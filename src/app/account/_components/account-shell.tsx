"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { Loader2 } from "lucide-react";
import { BiSolidUser } from "react-icons/bi";
import { FaBasketShopping } from "react-icons/fa6";
import { BsBookmarkHeartFill } from "react-icons/bs";

import { useAuth } from "@/context/auth-context";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/account", label: "Minha Conta", icon: BiSolidUser, exact: true },
  { href: "/account/orders", label: "Meus Pedidos", icon: FaBasketShopping },
  { href: "/account/wishlist", label: "Lista de Desejos", icon: BsBookmarkHeartFill },
];

export function AccountShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  };

  if (!user) return null;

  return (
    <div className="mx-auto max-w-7xl -mt-15">
      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="max-h-[600px] space-y-2 rounded-md border border-white/5 bg-transparent">
          <div className="absolute top-10 left-[10%] w-[250px] sm:w-[400px] h-[250px] sm:h-[400px] bg-primary/20 rounded-full blur-[120px] -z-10 pointer-events-none" />

          <div className="p-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              {user.image ? (
                <Image
                  src={user.image}
                  alt={user.name || "Avatar"}
                  width={48}
                  height={48}
                  className="h-12 w-12 rounded-full object-cover select-none pointer-events-none border border-white/10"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20 text-primary">
                  <BiSolidUser className="h-6 w-6" />
                </div>
              )}
              <div className="min-w-0">
                <p className="font-bold text-white">{user.name || "Usuário"}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>
          </div>

          <nav className="p-2 space-y-1">
            {NAV.map((item) => {
              const active = item.exact
                ? pathname === item.href
                : pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-4 py-3 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary/15 text-primary"
                      : "text-zinc-400 hover:bg-white/5 hover:text-white"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main>{children}</main>
      </div>
    </div>
  );
}
