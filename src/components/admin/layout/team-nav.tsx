"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePermission } from "@/providers/PermissionProvider";

type Tab = "users" | "roles";

function resolveTab(pathname: string): Tab {
  if (pathname.startsWith("/dashboard/admin/roles")) {
    return "roles";
  }
  return "users";
}

export function TeamNav() {
  const pathname = usePathname();
  const active = resolveTab(pathname);
  const { hasPermission } = usePermission();

  const tabs = [
    {
      id: "users" as const,
      label: "Usuários",
      href: "/dashboard/admin/team",
      icon: Users,
      permission: "users:view",
    },
    {
      id: "roles" as const,
      label: "Cargos",
      href: "/dashboard/admin/roles",
      icon: Shield,
      permission: "roles:view",
    },
  ].filter((tab) => hasPermission(tab.permission));

  if (tabs.length === 0) return null;

  return (
    <div className="flex items-center gap-3">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = active === tab.id;

        return (
          <Link
            key={tab.id}
            href={tab.href}
            className={cn(
              "relative flex justify-center rounded-md h-10 items-center gap-2 text-sm font-medium transition-colors",
              isActive ? "bg-white/5 rounded-md px-6 text-white hover:bg-white/5" : "bg-transparent rounded-md px-6 text-white hover:bg-white/5"
            )}
          >
            <Icon className={cn("h-4 w-4 shrink-0")} />
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
