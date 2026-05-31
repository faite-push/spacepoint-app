"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ShoppingCart, Search, X, User, LayoutDashboard, Package, Heart, Settings, LogOut, ChevronDown, } from "lucide-react";
import { FaUser } from "react-icons/fa";
import { FaBasketShopping } from "react-icons/fa6";
import { BsBoxFill } from "react-icons/bs";
import { HiMenuAlt2 } from "react-icons/hi";
import { useCartStore } from "@/store/cart-store";
import { RiSearch2Fill } from "react-icons/ri";
import { useAuth } from "@/context/auth-context";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, } from "@/components/ui/dropdown-menu";
import { NavbarCategoriesDesktop, NavbarCategoriesMobile } from "./navbar-categories";
import { SearchInput } from "./search-input";

export function Navbar() {
  const count = useCartStore((state) => state.items.reduce((sum, item) => sum + item.quantity, 0));
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const firstName = user?.name?.trim().split(/\s+/)[0] ?? "Usuário";

  return (
    <header className="sticky top-0 z-50 w-full bg-[#A855F7]">
      <div className="mx-auto flex h-16 md:h-20 max-w-7xl items-center justify-between px-4">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex h-10 w-10 top-12 items-center justify-center rounded-lg text-white hover:bg-white/10 md:hidden"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <HiMenuAlt2 className="h-8 w-8 text-white/80" />}
        </button>

        <Link href="/" className="absolute left-1/2 top-1 -translate-x-1/2 md:static md:left-auto md:translate-x-0">
          <Image
            src="/logo.png"
            alt="Space Point"
            width={160}
            height={50}
            className="h-18 w-auto object-contain md:h-20"
            priority
          />
        </Link>

        <div className="hidden flex-1 px-8 md:block">
          <SearchInput />
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <Link
            href={user ? "/account" : "/login"}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#ffffff05] md:hidden overflow-hidden border-1 border-white/10"
          >
            {user?.image ? (
              <Image src={user.image} alt="Avatar" width={40} height={40} className="object-cover" />
            ) : (
              <User className="h-5 w-5" />
            )}
          </Link>

          <Link
            href="/checkout"
            className="relative flex h-10 w-10 items-center justify-center rounded-full bg-[#ffffff05] border-1 border-dashed border-white/30 text-white transition-all duration-300 md:border-white/30 group active:scale-95 md:hover:bg-primary"
          >
            <FaBasketShopping className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-bold text-[#A855F7]">
                {count}
              </span>
            )}
          </Link>

          {user ? (
            <DropdownMenu open={userMenuOpen} onOpenChange={setUserMenuOpen}>
              <DropdownMenuTrigger className="hidden md:flex h-10 items-center cursor-pointer gap-2 rounded-full border border-white/10 bg-white/5 px-2 pr-4 text-sm text-white transition-all duration-300 active:scale-95 hover:bg-white/20">
                {user.image ? (
                  <Image
                    src={user.image}
                    alt={user.name || "Avatar"}
                    width={28}
                    height={28}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20">
                    <User className="h-4 w-4" />
                  </div>
                )}
                <span className="max-w-[100px] truncate">{firstName}</span>
                <ChevronDown
                  className={`h-4 w-4 opacity-70 transition-transform duration-300 ${userMenuOpen ? "rotate-180" : "rotate-0"
                    }`}
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64 p-2">
                <DropdownMenuItem render={<Link href="/account" className="flex cursor-pointer items-center py-2" />}>
                  <User className="mr-2 ml-2 h-4 w-4" />
                  Minha Conta
                </DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/account/orders" className="flex cursor-pointer items-center py-2" />}>
                  <Package className="mr-2 ml-2 h-4 w-4" />
                  Meus Pedidos
                </DropdownMenuItem>
                <DropdownMenuItem render={<Link href="/account/wishlist" className="flex cursor-pointer items-center py-2" />}>
                  <Heart className="mr-2 ml-2 h-4 w-4" />
                  Lista de Desejos
                </DropdownMenuItem>
                {user.isAdmin && (
                  <>
                    <DropdownMenuSeparator className="mx-2" />
                    <DropdownMenuItem render={<Link href="/dashboard/admin" className="flex cursor-pointer items-center py-2" />}>
                      <LayoutDashboard className="text-primary mr-2 ml-2 h-4 w-4" />
                      <span className="text-primary font-medium">Dashboard Admin</span>
                    </DropdownMenuItem>
                  </>
                )}
                <DropdownMenuSeparator className="mx-2" />
                <DropdownMenuItem
                  onClick={() => logout()}
                  className="cursor-pointer py-2"
                >
                  <LogOut className="mr-2 ml-2 h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link
              href="/login"
              className="hidden md:flex h-10 items-center gap-2 rounded-full border border-white/10 bg-white/10 px-8 text-sm text-white transition-all duration-300 hover:bg-white/20"
            >
              <span>Entrar</span>
            </Link>
          )}
        </div>
      </div>

      <div className="px-4 pb-3 pt-4 md:hidden">
        <SearchInput mobile />
      </div>

      <NavbarCategoriesDesktop />

      {mobileMenuOpen && (
        <div className="bg-primary md:hidden">
          <div className="mx-auto max-w-7xl px-4 py-3">
            <NavbarCategoriesMobile />
          </div>
        </div>
      )}
    </header>
  );
};