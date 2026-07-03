'use client';

import { usePathname } from 'next/navigation';

import { Can } from '@/providers/PermissionProvider';
import { getAdminRoutePermission } from '@/lib/admin-page-permissions';

export function AdminRouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '';
  const rule = getAdminRoutePermission(pathname);

  if (!rule) {
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
