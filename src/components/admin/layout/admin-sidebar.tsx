"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { AdminNavFooter, AdminNavLinks } from "./admin-nav-links";

export function AdminSidebar() {
  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-50 hidden h-screen w-64 flex-col border-r border-white/5 bg-transparent backdrop-blur-lg lg:flex"
      )}
    >
      <div className="pointer-events-none absolute top-[-20%] right-[-30%] -z-10 h-[300px] w-[300px] rounded-full bg-white/10 blur-[120px] sm:h-[500px] sm:w-[500px]" />

      <div className="relative z-0 flex h-22 shrink-0 items-center justify-center px-4">
        <Link
          href="/"
          className="inline-flex shrink-0 items-center justify-center overflow-hidden opacity-85 transition-opacity duration-300 hover:opacity-60"
          aria-label="Space Point Admin"
        >
          <Image
            src="/logo-sidebar.png"
            alt="Space Point"
            width={140}
            height={44}
            className="mr-1 h-[210px] w-[210px] object-contain brightness-0 invert select-none pointer-events-none"
            priority
          />
        </Link>
      </div>

      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
          <AdminNavLinks />
        </div>
        <AdminNavFooter className="shrink-0 bg-transparent backdrop-blur-sm" />
      </div>
    </aside>
  );
}
