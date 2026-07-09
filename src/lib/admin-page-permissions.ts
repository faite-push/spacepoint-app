export type AdminRoutePermissionRule = {
  prefix: string;
  permission: string;
  label: string;
};

/** Ordem importa: rotas mais específicas primeiro (ordenado por comprimento no helper). */
export const ADMIN_ROUTE_PERMISSIONS: AdminRoutePermissionRule[] = [
  { prefix: '/dashboard/admin/products', permission: 'products:view', label: 'Produtos' },
  { prefix: '/dashboard/admin/categories', permission: 'products:view', label: 'Categorias' },
  { prefix: '/dashboard/admin/inventory', permission: 'products:view', label: 'Inventário' },
  { prefix: '/dashboard/admin/orders', permission: 'orders:view', label: 'Vendas' },
  { prefix: '/dashboard/admin/coupon', permission: 'coupons:view', label: 'Cupons' },
  { prefix: '/dashboard/admin/gallery', permission: 'media:view', label: 'Galeria' },
  { prefix: '/dashboard/admin/clients', permission: 'clients:view', label: 'Clientes' },
  { prefix: '/dashboard/admin/reviews', permission: 'reviews:view', label: 'Avaliações' },
  { prefix: '/dashboard/admin/chats', permission: 'chats:view', label: 'Space Chat' },
  { prefix: '/dashboard/admin/team', permission: 'users:view', label: 'Equipe' },
  { prefix: '/dashboard/admin/roles', permission: 'roles:view', label: 'Cargos' },
  { prefix: '/dashboard/admin/gateways', permission: 'gateways:manage', label: 'Gateways' },
  { prefix: '/dashboard/admin/plugins', permission: 'plugins:manage', label: 'Plugins' },
  { prefix: '/dashboard/admin/pages', permission: 'pages:manage', label: 'Páginas do site' },
  { prefix: '/dashboard/admin/banners', permission: 'pages:manage', label: 'Banners' },
  { prefix: '/dashboard/admin/settings', permission: 'pages:manage', label: 'Configurações' },
];

export function getAdminRoutePermission(pathname: string): AdminRoutePermissionRule | null {
  if (pathname === '/dashboard/admin') {
    return { prefix: pathname, permission: 'analytics:view', label: 'Dashboard' };
  }

  const rules = [...ADMIN_ROUTE_PERMISSIONS].sort(
    (a, b) => b.prefix.length - a.prefix.length
  );

  for (const rule of rules) {
    if (pathname === rule.prefix || pathname.startsWith(`${rule.prefix}/`)) {
      return rule;
    }
  }

  return null;
}
