"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Store, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "product" | "variants";

function resolveTab(pathname: string, productId: string): Tab {
  if (pathname.startsWith(`/dashboard/admin/products/${productId}/variants`)) {
    return "variants";
  }
  return "product";
}

export function ProductPackageNav({ productId }: { productId: string }) {
  const pathname = usePathname();
  const active = resolveTab(pathname, productId);

  const tabs = [
    {
      id: "product" as const,
      label: "Produto",
      href: `/dashboard/admin/products/${productId}/edit`,
      icon: Store,
    },
    {
      id: "variants" as const,
      label: "Variantes",
      href: `/dashboard/admin/products/${productId}/variants`,
      icon: ListChecks,
    },
  ];

  return (
    <div className="flex items-center gap-1">
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
                : "text-white/40 hover:bg-white/[0.03] hover:text-white/80"
            )}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {tab.label}
            {isActive && (
              <span
                className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full bg-primary"
                aria-hidden
              />
            )}
          </Link>
        );
      })}
    </div>
  );
}
