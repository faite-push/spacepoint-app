"use client";

import Image from "next/image";
import Link from "next/link";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { AdminNavLinks } from "./admin-nav-links";

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
        className="w-[min(100vw-2rem,20rem)] border-white/10 bg-[#111111] p-0 text-white sm:max-w-xs"
      >
        <SheetTitle className="sr-only">Menu administrativo</SheetTitle>

        <div className="flex h-16 items-center mx-auto px-4">
          <Link href="/dashboard/admin" onClick={close} className="flex items-center mt-8">
            <Image
              src="/logo-sidebar.png"
              alt="Space Point"
              width={120}
              height={36}
              className="h-42 mx-auto w-auto object-contain select-none pointer-events-none invert brightness-0 opacity-70 hover:opacity-60 transition-opacity duration-300"
              priority
            />
          </Link>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain p-3 pb-8">
          <AdminNavLinks onNavigate={close} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
