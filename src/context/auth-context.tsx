"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { apiFetch, setCsrfToken, clearCsrfToken } from "@/lib/api";

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
      const data = await apiFetch<AuthUser & { csrfToken?: string }>("/v2/api/request/me");
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