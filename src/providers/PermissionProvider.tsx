"use client";

import React, { createContext, useContext, ReactNode } from "react";

interface PermissionContextType {
  permissions: string[];
  isSuperOwner: boolean;
  hasPermission: (key: string) => boolean;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export function PermissionProvider({ 
  children, 
  userPermissions, 
  isSuperOwner 
}: { 
  children: ReactNode; 
  userPermissions: string[]; 
  isSuperOwner: boolean;
}) {
  const hasPermission = (key: string) => {
    if (isSuperOwner) return true;
    if (userPermissions.includes("system:admin")) return true;
    return userPermissions.includes(key);
  };

  return (
    <PermissionContext.Provider value={{ permissions: userPermissions, isSuperOwner, hasPermission }}>
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermission() {
  const context = useContext(PermissionContext);
  if (context === undefined) {
    throw new Error("usePermission must be used within a PermissionProvider");
  }
  return context;
}

/**
 * Componente utilitário para renderização condicional baseada em permissão.
 */
export function Can({ 
  I, 
  children, 
  fallback = null,
  message
}: { 
  I: string; 
  children: ReactNode; 
  fallback?: ReactNode;
  message?: string;
}) {
  const { hasPermission } = usePermission();
  
  if (hasPermission(I)) return <>{children}</>;

  if (message) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-xl border border-white/5 bg-[#111111] my-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 mb-4">
          <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H8m6-9l-3 3-3-3m0 0V5a2 2 0 012-2h4a2 2 0 012 2v2" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 11V9a3 3 0 016 0v2M5 11h14a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-white mb-2">Acesso Negado</h3>
        <p className="text-sm text-zinc-400 max-w-sm">{message}</p>
      </div>
    );
  }

  return <>{fallback}</>;
}
