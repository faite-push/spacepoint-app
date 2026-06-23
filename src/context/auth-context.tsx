"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { setCsrfToken, clearCsrfToken, API_URL, getApiHeaders } from "@/lib/api";
import { apiFetch } from "@/lib/api";

export interface AuthUser {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  provider: string;
  balance: number;
  isAdmin: boolean;
  createdAt: string;
}

interface AuthContextType {
  user: AuthUser | null;
  setUser: React.Dispatch<React.SetStateAction<AuthUser | null>>;
  loading: boolean;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]       = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/v2/api/request/me`, {
        credentials: "include",
        headers: getApiHeaders({ "Content-Type": "application/json" }),
      });

      if (res.status === 401) {
        setUser(null);
        clearCsrfToken();
        return;
      }

      if (!res.ok) {
        setUser(null);
        clearCsrfToken();
        return;
      }

      const data = (await res.json()) as AuthUser & { csrfToken?: string };
      const { csrfToken, ...user } = data;
      if (csrfToken) setCsrfToken(csrfToken);
      setUser(user);
    } catch {
      setUser(null);
      clearCsrfToken();
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiFetch("/logout");
    } catch {
    } finally {
      clearCsrfToken();
      setUser(null);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  return (
    <AuthContext.Provider value={{ user, setUser, loading, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return ctx;
};