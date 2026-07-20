import React from "react";
import { LayoutDashboard, FolderClosed, BadgeDollarSign, Tag, UserRoundCog, Star, UsersRound, Settings, Home, ShoppingCart, Paintbrush, ReceiptText, CreditCard, Megaphone, Zap, Mail } from "lucide-react";
import { PiGooglePhotosLogo } from "react-icons/pi";
import { PiPuzzlePiece } from "react-icons/pi";
import { RiCustomerService2Fill } from "react-icons/ri";
import { RiFileList2Line } from "react-icons/ri";

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
  { href: "/dashboard/admin", icon: LayoutDashboard, label: "Dashboard", permission: "analytics:view" },
  { href: "/dashboard/admin/products", icon: FolderClosed, label: "Produtos", permission: "products:view" },
  { href: "/dashboard/admin/orders", icon: BadgeDollarSign, label: "Vendas", permission: "orders:view" },
  { href: "/dashboard/admin/coupon", icon: Tag, label: "Cupom", permission: "coupons:view" },
  { href: "/dashboard/admin/gallery", icon: PiGooglePhotosLogo, label: "Galeria", permission: "media:view" },
  { href: "/dashboard/admin/clients", icon: UserRoundCog, label: "Clientes", permission: "clients:view" },
  { href: "/dashboard/admin/reviews", icon: Star, label: "Avaliações", permission: "reviews:view" },
  { href: "/dashboard/admin/audit-log", icon: RiFileList2Line, label: "Registros de Auditoria", permission: "audit:view" },
];

export const adminServiceNavItem: AdminNavItem = {
  href: "/dashboard/admin/chats",
  icon: RiCustomerService2Fill,
  label: "Space Chat",
  permission: "chats:view",
};

export const adminMarketingGroup: AdminNavGroup = {
  id: "marketing",
  icon: Megaphone,
  label: "Marketing",
  permission: "marketing:view",
  children: [
    { href: "/dashboard/admin/marketing/automations", icon: Zap, label: "Automações", permission: "marketing:view" },
    { href: "/dashboard/admin/marketing/emails", icon: Mail, label: "Editor de E-mails", permission: "marketing:view" },
  ],
};

export const adminSitePagesGroup: AdminNavGroup = {
  id: "site-pages",
  icon: Settings,
  label: "Configurações",
  permission: "pages:manage",
  children: [
    { href: "/dashboard/admin/pages/home", icon: Home, label: "Página Inicial", permission: "pages:manage" },
    { href: "/dashboard/admin/pages/checkout", icon: ShoppingCart, label: "Checkout", permission: "pages:manage" },
    { href: "/dashboard/admin/pages/global", icon: Paintbrush, label: "Aparência", permission: "pages:manage" },
    { href: "/dashboard/admin/pages/institutional", icon: ReceiptText, label: "Páginas Institucionais", permission: "pages:manage" },
  ],
};

export const adminConfigNavItems: AdminNavItem[] = [
  { href: "/dashboard/admin/plugins", icon: PiPuzzlePiece, label: "Plugins", permission: "plugins:manage" },
  { href: "/dashboard/admin/team", icon: UsersRound, label: "Equipe", permission: "users:view" },
  { href: "/dashboard/admin/gateways", icon: CreditCard, label: "Gateways", permission: "gateways:manage" },
];

export function isAdminNavActive(pathname: string, href: string) {
  return href === "/dashboard/admin"
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);
}

export function isAdminGroupActive(pathname: string, group: AdminNavGroup) {
  if (group.id === "site-pages") {
    return (
      pathname.startsWith("/dashboard/admin/pages") ||
      pathname.startsWith("/dashboard/admin/banners") ||
      group.children.some((child) => isAdminNavActive(pathname, child.href))
    );
  }
  if (group.id === "marketing") {
    return (
      pathname.startsWith("/dashboard/admin/marketing") ||
      group.children.some((child) => isAdminNavActive(pathname, child.href))
    );
  }
  return group.children.some((child) => isAdminNavActive(pathname, child.href));
}
