"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "team" | "roles";

function resolveTab(pathname: string): Tab {
  if (pathname.startsWith("/dashboard/admin/roles")) {
    return "roles";
  }
  return "team";
}

export function TeamNav() {
  const pathname = usePathname();
  const active = resolveTab(pathname);

  const tabs = [
    {
      id: "team" as const,
      label: "Equipe",
      href: "/dashboard/admin/users",
      icon: Users,
    },
    {
      id: "roles" as const,
      label: "Cargos",
      href: "/dashboard/admin/roles",
      icon: Shield,
    },
  ];

  return (
    <div className="flex items-center gap-1 mb-6">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = active === tab.id;

        return (
          <Link
            key={tab.id}
            href={tab.href}
            className={cn(
              "relative flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm transition-colors",
              isActive
                ? "bg-white/[0.06] text-white"
                : "text-zinc-400 hover:bg-white/[0.03] hover:text-white/80"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {tab.label}
            {isActive && (
              <span
                className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-[#9333EA]"
                aria-hidden
              />
            )}
          </Link>
        );
      })}
    </div>
  );
}
