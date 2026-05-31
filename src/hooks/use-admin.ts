"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { API_URL } from "@/lib/api";

interface User {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  isAdmin: boolean;
  role: {
    id: string;
    name: string;
    isProtected: boolean;
  } | null;
}

async function fetchCurrentUser(): Promise<User | null> {
  const res = await fetch(`${API_URL}/api/auth/me`, {
    credentials: "include",
  });
  if (!res.ok) return null;
  return res.json();
}

export function useAdmin({ redirectTo = "/login" }: { redirectTo?: string } = {}) {
  const router = useRouter();
  
  const { data: user, isLoading } = useQuery({
    queryKey: ["current-user"],
    queryFn: fetchCurrentUser,
    retry: false,
  });

  useEffect(() => {
    if (!isLoading && !user) {
      router.push(redirectTo);
    }
    
    if (!isLoading && user && !user.isAdmin) {
      router.push("/");
    }
  }, [user, isLoading, router, redirectTo]);

  return { user, isLoading, isAdmin: user?.isAdmin ?? false };
}

export function usePermission(permissionKey: string) {
  const { data: user } = useQuery({
    queryKey: ["current-user"],
    queryFn: fetchCurrentUser,
    retry: false,
  });

  const { data: permission } = useQuery({
    queryKey: ["permission", permissionKey],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/admin/check-permission/${permissionKey}`, {
        credentials: "include",
      });
      if (!res.ok) return { hasPermission: false, isSuperOwner: false };
      return res.json();
    },
    enabled: !!user,
  });

  return {
    hasPermission: permission?.hasPermission ?? false,
    isSuperOwner: permission?.isSuperOwner ?? false,
  };
}
