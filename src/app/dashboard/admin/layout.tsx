import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { AdminShell } from "@/components/admin/layout/admin-shell";
import { PermissionProvider } from "@/providers/PermissionProvider";

async function checkAdminAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  
  if (!token) {
    return null;
  }

  try {
    const res = await fetch(`http://localhost:5000/v2/api/request/me`, {
      headers: { Cookie: `access_token=${token}` },
      cache: "no-store",
    });

    if (!res.ok) return null;

    const user = await res.json();
    const hasAdminAccess = user.isAdmin || user.isSuperOwner || !!user.role;
    return hasAdminAccess ? user : null;
  } catch {
    return null;
  }
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await checkAdminAuth();

  if (!user) {
    redirect("/login");
  }

  return (
    <PermissionProvider 
      userPermissions={user.permissions || []} 
      isSuperOwner={user.isSuperOwner || false}
    >
      <AdminShell user={user}>{children}</AdminShell>
    </PermissionProvider>
  );
};