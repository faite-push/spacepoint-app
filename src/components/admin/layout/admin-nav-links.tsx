"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { adminMainNavItems, adminSitePagesGroup, adminConfigNavItems, isAdminNavActive, isAdminGroupActive, type AdminNavItem, } from "./admin-nav-config";
import { ChevronDown, ChevronRight, Store } from "lucide-react";
import { usePermission } from "@/providers/PermissionProvider";
import { cn } from "@/lib/utils";

function NavLink({ item, pathname, nested = false, onNavigate, }: { item: AdminNavItem; pathname: string; nested?: boolean; onNavigate?: () => void; }) {
  const Icon = item.icon;
  const isActive = isAdminNavActive(pathname, item.href);

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm transition-colors",
        isActive
          ? "bg-white/10 text-white"
          : "text-white/40 hover:bg-white/5 hover:text-white",
        nested && "pl-6 py-2 text-[13px]"
      )}
    >
      <Icon className={cn("shrink-0", nested ? "h-4 w-4" : "h-5 w-5")} />
      <span className="truncate">{item.label}</span>
    </Link>
  );
};

function NavGroupMenu({ pathname, onNavigate, }: { pathname: string; onNavigate?: () => void; }) {
  const { hasPermission } = usePermission();
  const group = adminSitePagesGroup;

  const visibleChildren = group.children.filter(
    (child) => !child.permission || hasPermission(child.permission)
  );

  if (visibleChildren.length === 0) return null;

  const groupActive = isAdminGroupActive(pathname, group);
  const [open, setOpen] = useState(groupActive);
  const Icon = group.icon;

  useEffect(() => {
    if (groupActive) setOpen(true);
  }, [groupActive]);

  return (
    <div className="space-y-0.5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center gap-3 rounded-sm px-3 py-2.5 text-sm transition-colors",
          groupActive ? "bg-white/10 text-white" : "text-white/40 hover:bg-white/5 hover:text-white"
        )}
      >
        <Icon className="h-5 w-5 shrink-0" />
        <span className="flex-1 truncate text-left">{group.label}</span>
        {open ? (
          <ChevronDown className="h-4 w-4 shrink-0 opacity-60" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 opacity-60" />
        )}
      </button>

      {open && (
        <div className="space-y-0.5">
          {visibleChildren.map((child) => (
            <NavLink
              key={child.href}
              item={child}
              pathname={pathname}
              nested
              onNavigate={onNavigate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function AdminNavLinks({ collapsed = false, onNavigate, className, }: { collapsed?: boolean; onNavigate?: () => void; className?: string; }) {
  const pathname = usePathname();
  const { hasPermission } = usePermission();

  const filteredMainItems = adminMainNavItems.filter((item) => !item.permission || hasPermission(item.permission));
  const filteredConfigItems = adminConfigNavItems.filter((item) => !item.permission || hasPermission(item.permission));
  const showSitePages = !adminSitePagesGroup.permission || hasPermission(adminSitePagesGroup.permission);

  if (collapsed) {
    return (
      <nav className={cn("space-y-1", className)}>
        {filteredMainItems.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} onNavigate={onNavigate} />
        ))}
      </nav>
    );
  };

  return (
    <nav className={cn("space-y-1", className)}>
      {filteredMainItems.map((item) => (
        <NavLink key={item.href} item={item} pathname={pathname} onNavigate={onNavigate} />
      ))}

      {(filteredConfigItems.length > 0 || showSitePages) && (
        <>
          <p className="mb-1 mt-3 px-3 text-sm font-semibold text-white/80">Configurações</p>

          {showSitePages && (
            <NavGroupMenu pathname={pathname} onNavigate={onNavigate} />
          )}

          {filteredConfigItems.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} onNavigate={onNavigate} />
          ))}
        </>
      )}

      <div className="absolute inset-x-0 px-2 bottom-2 border-t border-white/5 pt-3">
        <Link
          href="/"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
        >
          <Store className="h-5 w-5 shrink-0" />
          <span>Ver Loja</span>
        </Link>
      </div>
    </nav>
  );
}
