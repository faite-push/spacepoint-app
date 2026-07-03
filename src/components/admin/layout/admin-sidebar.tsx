"use client";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { AdminNavLinks } from "./admin-nav-links";

export function AdminSidebar() {
  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-50 hidden h-screen w-64 flex-col border-r border-white/5 bg-transparent backdrop-blur-lg lg:flex"
      )}
    >
      <div className="absolute top-[-20%] right-[-30%] w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-white/10 rounded-full blur-[120px] -z-10 pointer-events-none" />
    
      <div className="relative z-0 flex h-22 shrink-0 items-center justify-center px-4">
        <Link
          href="/"
          className="inline-flex shrink-0 items-center justify-center overflow-hidden opacity-70 hover:opacity-60 transition-opacity duration-300"
          aria-label="Space Point Admin"
        >
          <Image
            src="/logo-sidebar.png"
            alt="Space Point"
            width={140}
            height={44}
            className="mr-1 h-[210px] w-[210px] object-contain select-none pointer-events-none invert brightness-0"
            priority
          />
        </Link>
      </div>

      <div className="relative z-10 flex-1 overflow-y-auto p-2 pb-4">
        <AdminNavLinks />
      </div>
    </aside>
  );
}
