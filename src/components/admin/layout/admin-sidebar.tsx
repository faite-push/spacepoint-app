"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { AdminNavLinks } from "./admin-nav-links";

export function AdminSidebar() {
  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-50 hidden h-screen w-64 flex-col border-r border-white/5 bg-[#111111] lg:flex"
      )}
    >
      <div className="flex h-20 items-center justify-between border-b border-white/5 px-4">
        <Link
          href="/dashboard/admin"
          className="mx-auto flex items-center gap-2 overflow-hidden"
          aria-label="Space Point Admin"
        >
          <Image
            src="/logo-sidebar.png"
            alt="Space Point"
            width={140}
            height={44}
            className="mr-2 h-auto w-auto object-contain"
            priority
          />
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto p-2 pb-4">
        <AdminNavLinks />
      </div>
    </aside>
  );
}
