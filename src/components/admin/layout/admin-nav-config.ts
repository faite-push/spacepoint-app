import React from "react";
import { LayoutDashboard, FolderClosed, BadgeDollarSign, Tag, UserRoundCog, Star, UsersRound, Settings, Globe, Home, PanelBottom, FileText, SlidersHorizontal, Megaphone, MessageSquareQuote, Search, Package, Calendar as CalendarIcon, Wrench, Image as ImageIcon, CreditCard, type LucideIcon, Paintbrush, ReceiptText, ShoppingCart, } from "lucide-react";
import { PiGooglePhotosLogo } from "react-icons/pi";
import { IoChatbubblesOutline } from "react-icons/io5";
import { RiCustomerService2Fill } from "react-icons/ri";

export type AdminNavItem = {
  href: string;
  icon: React.ElementType;
  label: string;
  permission?: string;
};

export type AdminNavGroup = {
  id: string;
  icon: React.ElementType;
  label: string;
  permission?: string;
  children: AdminNavItem[];
};

export const adminMainNavItems: AdminNavItem[] = [
  { href: "/dashboard/admin", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/dashboard/admin/products", icon: FolderClosed, label: "Produtos", permission: "products:view" },
  { href: "/dashboard/admin/orders", icon: BadgeDollarSign, label: "Vendas", permission: "orders:view" },
  { href: "/dashboard/admin/coupon", icon: Tag, label: "Cupom", permission: "codes:view" },
  { href: "/dashboard/admin/gallery", icon: PiGooglePhotosLogo, label: "Galeria", permission: "settings:manage" },
  { href: "/dashboard/admin/clients", icon: UserRoundCog, label: "Clientes", permission: "users:view" },
  { href: "/dashboard/admin/reviews", icon: Star, label: "Avaliações", permission: "analytics:view" },
];

export const adminServiceNavItem: AdminNavItem = {
  href: "/dashboard/admin/chats",
  icon: RiCustomerService2Fill,
  label: "Space Chat",
  permission: "orders:view",
};

export const adminSitePagesGroup: AdminNavGroup = {
  id: "site-pages",
  icon: Globe,
  label: "Páginas do site",
  permission: "settings:manage",
  children: [
    { href: "/dashboard/admin/pages/home", icon: Home, label: "Página Inicial" },
    { href: "/dashboard/admin/pages/checkout", icon: ShoppingCart, label: "Checkout" },
    { href: "/dashboard/admin/pages/global", icon: Paintbrush, label: "Aparência" },
    { href: "/dashboard/admin/pages/institutional", icon: ReceiptText, label: "Páginas Institucionais" },
  ],
};

export const adminConfigNavItems: AdminNavItem[] = [
  { href: "/dashboard/admin/users", icon: UsersRound, label: "Equipe", permission: "users:view" },
  { href: "/dashboard/admin/gateways", icon: CreditCard, label: "Gateways", permission: "settings:manage" },
  { href: "/dashboard/admin/settings", icon: Settings, label: "Configurações", permission: "settings:manage" },
];

export function isAdminNavActive(pathname: string, href: string) {
  return href === "/dashboard/admin"
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
};

export function isAdminGroupActive(pathname: string, group: AdminNavGroup) {
  return (
    pathname.startsWith("/dashboard/admin/pages") ||
    pathname.startsWith("/dashboard/admin/banners") ||
    group.children.some((child) => isAdminNavActive(pathname, child.href))
  );
};
