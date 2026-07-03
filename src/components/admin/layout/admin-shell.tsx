"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AdminSidebar } from "./admin-sidebar";
import { AdminHeader } from "./admin-header";
import { AdminMobileNav } from "./admin-mobile-nav";

type AdminShellProps = {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
    avatar?: string | null;
    isAdmin?: boolean;
    role?: { id: string; name: string; isProtected?: boolean } | null;
  };
  children: React.ReactNode;
};

export function AdminShell({ user, children }: AdminShellProps) {
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  return (
    <div className="flex min-h-screen w-full overflow-x-hidden bg-[#0a0a0a]">
      <AdminSidebar />
      <AdminMobileNav open={mobileNavOpen} onOpenChange={setMobileNavOpen} />

      <div className="flex min-w-0 w-full flex-1 flex-col lg:ml-64">
        <AdminHeader user={user} onOpenMenu={() => setMobileNavOpen(true)} />
        <main className="min-w-0 w-full flex-1 px-3 py-4 pb-6 sm:px-4 lg:px-6 lg:py-6 lg:pb-8">
          {children}
        </main>
      </div>
    </div>
  );
}
