"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

import { adminMainNavItems, adminSitePagesGroup, adminMarketingGroup, adminConfigNavItems, adminServiceNavItem, isAdminNavActive, isAdminGroupActive, type AdminNavItem, type AdminNavGroup, } from "./admin-nav-config";
import { ChevronDown, ChevronRight, Store } from "lucide-react";
import { IoArrowRedoOutline } from "react-icons/io5";
import { usePermission } from "@/providers/PermissionProvider";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { chatApi } from "@/lib/admin-api";
import { useSocket } from "@/context/socket-context";

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

function NavGroupMenu({ group, pathname, onNavigate, }: { group: AdminNavGroup; pathname: string; onNavigate?: () => void; }) {
  const { hasPermission } = usePermission();

  const visibleChildren = group.children.filter(
    (child) => !child.permission || hasPermission(child.permission)
  );

  if (visibleChildren.length === 0) return null;
  if (group.permission && !hasPermission(group.permission)) return null;

  const groupActive = isAdminGroupActive(pathname, group);
  const [open, setOpen] = useState(groupActive);
  const Icon = group.icon;

  useEffect(() => {
    if (groupActive) setOpen(true);
  }, [groupActive]);

  return (
    <div className="space-y-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full cursor-pointer items-center gap-3 rounded-sm px-3 py-2.5 text-sm transition-colors",
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
        <div className="space-y-0.5 mt-0.5">
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

function ServiceLink({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  const { hasPermission } = usePermission();
  const { isConnected } = useSocket();
  const item = adminServiceNavItem;
  const Icon = item.icon;
  const isActive = isAdminNavActive(pathname, item.href);

  const { data } = useQuery({
    queryKey: ["admin", "unread-chats-count"],
    queryFn: async () => {
      const res = await chatApi.list({ status: "OPEN" });
      const unreadCount = res.chats.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
      return unreadCount;
    },
    refetchInterval: isConnected ? false : 10000,
    enabled: hasPermission(item.permission || ""),
  });

  if (item.permission && !hasPermission(item.permission)) return null;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm transition-colors relative",
        isActive
          ? "bg-white/10 text-white"
          : "text-zinc-400 hover:bg-white/5 hover:text-white"
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span className="flex-1 font-medium">{item.label}</span>
      {data !== undefined && data > 0 && (
        <span className="flex h-5 min-w-5 px-1 items-center justify-center rounded-full bg-[#ff493f] text-xs font-medium text-white">
          {data > 99 ? "99+" : data}
        </span>
      )}
    </Link>
  );
}

export function AdminNavLinks({ collapsed = false, onNavigate, className, }: { collapsed?: boolean; onNavigate?: () => void; className?: string; }) {
  const pathname = usePathname();
  const { hasPermission } = usePermission();

  const filteredMainItems = adminMainNavItems.filter((item) => !item.permission || hasPermission(item.permission));
  const filteredConfigItems = adminConfigNavItems.filter((item) => !item.permission || hasPermission(item.permission));
  const showSitePages = !adminSitePagesGroup.permission || hasPermission(adminSitePagesGroup.permission);
  const showMarketing = !adminMarketingGroup.permission || hasPermission(adminMarketingGroup.permission);

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

          {filteredConfigItems.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} onNavigate={onNavigate} />
          ))}

          {showMarketing && (
            <>
              <NavGroupMenu group={adminMarketingGroup} pathname={pathname} onNavigate={onNavigate} />
            </>
          )}

          {showSitePages && (
            <NavGroupMenu group={adminSitePagesGroup} pathname={pathname} onNavigate={onNavigate} />
          )}
        </>
      )}

      <div className="absolute inset-x-0 px-2 bottom-2 border-t border-white/5 pt-3 space-y-1">
        <ServiceLink pathname={pathname} onNavigate={onNavigate} />

        <Link
          href="/"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-sm px-3 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:bg-white/5 hover:text-white"
        >
          <IoArrowRedoOutline className="h-5 w-5 shrink-0" />
          <span>Ver Loja</span>
        </Link>
      </div>
    </nav>
  );
}
