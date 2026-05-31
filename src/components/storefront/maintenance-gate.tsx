"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import type { PublicSiteConfig } from "@/lib/site-api";

export function MaintenanceGate({
  config,
  children,
}: {
  config?: PublicSiteConfig | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isAdmin = pathname?.startsWith("/dashboard/admin");
  const isMaintenancePage = pathname === "/maintenance";
  const enabled = config?.maintenanceModeEnabled && !isAdmin;

  useEffect(() => {
    if (enabled && !isMaintenancePage) {
      router.replace("/maintenance");
    }
    if (!enabled && isMaintenancePage) {
      router.replace("/");
    }
  }, [enabled, isMaintenancePage, router]);

  if (enabled && !isMaintenancePage) {
    return null;
  }

  return <>{children}</>;
}

export function MaintenancePageContent({ config }: { config?: PublicSiteConfig | null }) {
  const title = config?.maintenanceTitle?.trim() || "Voltamos em breve";
  const message =
    config?.maintenanceMessage?.trim() ||
    "Estamos realizando melhorias na loja. Tente novamente em alguns minutos.";

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      {config?.maintenanceImageUrl && (
        <div className="relative mb-8 h-32 w-48">
          <Image
            src={config.maintenanceImageUrl}
            alt=""
            fill
            className="object-contain"
            unoptimized
          />
        </div>
      )}
      <h1 className="text-3xl font-bold text-white mb-4">{title}</h1>
      <p className="max-w-md text-white/60 leading-relaxed">{message}</p>
      <Link
        href="/"
        className="mt-8 rounded-lg bg-[#9333EA] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#7c3aed]"
      >
        Tentar novamente
      </Link>
    </div>
  );
}
