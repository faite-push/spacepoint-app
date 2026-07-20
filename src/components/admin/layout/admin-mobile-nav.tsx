"use client";

import Image from "next/image";
import Link from "next/link";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { AdminNavFooter, AdminNavLinks } from "./admin-nav-links";

export function AdminMobileNav({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const close = () => onOpenChange(false);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="flex h-full w-[min(100vw-2rem,20rem)] flex-col border-white/10 bg-[#111111] p-0 text-white sm:max-w-xs"
      >
        <SheetTitle className="sr-only">Menu administrativo</SheetTitle>

        <div className="mx-auto flex h-16 shrink-0 items-center px-4">
          <Link href="/dashboard/admin" onClick={close} className="mt-8 flex items-center">
            <Image
              src="/logo-sidebar.png"
              alt="Space Point"
              width={120}
              height={36}
              className="mx-auto h-42 w-auto object-contain brightness-0 invert opacity-70 transition-opacity duration-300 select-none pointer-events-none hover:opacity-60"
              priority
            />
          </Link>
        </div>

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">
            <AdminNavLinks onNavigate={close} />
          </div>
          <AdminNavFooter onNavigate={close} className="shrink-0 bg-[#111111]" />
        </div>
      </SheetContent>
    </Sheet>
  );
}
