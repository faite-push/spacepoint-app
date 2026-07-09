'use client';

import { usePathname } from 'next/navigation';

import { Can, usePermission } from '@/providers/PermissionProvider';
import { getAdminRoutePermission } from '@/lib/admin-page-permissions';

function AdminAccessDenied({ message }: { message: string }) {
  return (
    <div className="my-4 flex flex-col items-center justify-center rounded-xl border border-white/5 bg-[#111111] p-12 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
        <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H8m6-9l-3 3-3-3m0 0V5a2 2 0 012-2h4a2 2 0 012 2v2" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 11V9a3 3 0 016 0v2M5 11h14a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2z" />
        </svg>
      </div>
      <h3 className="mb-2 text-lg font-medium text-white">Acesso Negado</h3>
      <p className="max-w-sm text-sm text-zinc-400">{message}</p>
    </div>
  );
}

export function AdminRouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';
  const rule = getAdminRoutePermission(pathname);
  const { isSuperOwner } = usePermission();

  if (!rule) {
    if (pathname.startsWith('/dashboard/admin') && !isSuperOwner) {
      return (
        <AdminAccessDenied message="Esta área do painel requer permissões específicas. Contate o administrador se acredita que deveria ter acesso." />
      );
    }
    return <>{children}</>;
  }

  return (
    <Can
      I={rule.permission}
      message={`Você não tem permissão para acessar ${rule.label}. Solicite ao administrador a permissão "${rule.permission}".`}
    >
      {children}
    </Can>
  );
}
