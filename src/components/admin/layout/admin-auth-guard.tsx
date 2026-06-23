"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { AdminShell } from "@/components/admin/layout/admin-shell";
import { apiFetch } from "@/lib/api";
import { PermissionProvider } from "@/providers/PermissionProvider";

type AdminUser = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  isAdmin?: boolean;
  isSuperOwner?: boolean;
  permissions?: string[];
  role?: { id: string; name: string; isProtected?: boolean } | null;
};

export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function checkAdminAccess() {
      try {
        const data = await apiFetch<AdminUser>("/v2/api/request/me");
        const hasAdminAccess = Boolean(data.isAdmin || data.isSuperOwner || data.role);

        if (!hasAdminAccess) {
          router.replace("/");
          return;
        }

        if (!cancelled) setUser(data);
      } catch {
        router.replace("/login");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    checkAdminAccess();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <PermissionProvider
      userPermissions={user.permissions || []}
      isSuperOwner={user.isSuperOwner || false}
    >
      <AdminShell user={user}>{children}</AdminShell>
    </PermissionProvider>
  );
}
