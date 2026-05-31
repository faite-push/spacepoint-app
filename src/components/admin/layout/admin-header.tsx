"use client";

import { Menu, User, Calendar, Clock, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface AdminHeaderProps {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
    avatar?: string | null;
    isAdmin?: boolean;
    role?: { id: string; name: string; isProtected?: boolean } | null;
  };
  onOpenMenu?: () => void;
}

function formatTime(d: Date) {
  return d.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function formatDate(d: Date) {
  return d.toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

export function AdminHeader({ user, onOpenMenu }: AdminHeaderProps) {
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);
  const [now, setNow] = useState<Date | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!profileOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [profileOpen]);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const roleLabel = user.role?.name
    ? user.role.name
    : user.isAdmin
      ? "Administrador"
      : "Membro";

  const avatarSrc = user.image || user.avatar || null;
  const initials = user.name
    ?.trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center justify-between gap-3 border-b border-white/5 bg-background/95 px-4 backdrop-blur-md lg:h-20 lg:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button
          type="button"
          onClick={onOpenMenu}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 text-white transition-colors hover:bg-white/5 lg:hidden"
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <Link href="/dashboard/admin" className="flex shrink-0 items-center mx-auto lg:hidden">
          <Image
            src="/logo-sidebar.png"
            alt="Space Point"
            width={100}
            height={28}
            className="h-42 w-auto object-contain"
            priority
          />
        </Link>
      </div>

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <div
          className="hidden items-center gap-3 rounded-lg px-3 py-2 text-sm md:flex"
          aria-label="Data e hora atuais"
        >
          <div className="flex items-center gap-1.5 text-zinc-300">
            <Calendar className="h-3.5 w-3.5 text-white" />
            <span className="font-medium capitalize text-white/80">
              {now ? formatDate(now) : "—"}
            </span>
          </div>
          <span className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-1.5 text-zinc-300">
            <Clock className="h-3.5 w-3.5 text-white" />
            <span className="font-mono font-medium tabular-nums text-white/80">
              {now ? formatTime(now) : "--:--:--"}
            </span>
          </div>
        </div>

        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 rounded-lg px-1.5 py-1 transition-colors hover:bg-white/5 sm:px-2 sm:py-1.5"
            aria-expanded={profileOpen}
            aria-haspopup="menu"
          >
            {avatarSrc ? (
              <Image
                src={avatarSrc}
                alt={user.name}
                width={32}
                height={32}
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#9333EA] text-xs font-bold text-white">
                {initials || <User className="h-4 w-4" />}
              </div>
            )}
            <div className="hidden text-left md:block">
              <p className="max-w-[160px] truncate text-xs font-semibold text-white">
                {user.name}
              </p>
              <div className="flex items-center gap-1">
                <ShieldCheck className="h-3 w-3 text-white/60" />
                <p className="max-w-[140px] truncate text-[10px] font-medium text-white/60">
                  {roleLabel}
                </p>
              </div>
            </div>
          </button>

          {profileOpen && (
            <div
              className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-white/10 bg-[#141414] py-2 shadow-xl"
              role="menu"
            >
              <div className="border-b border-white/5 px-4 py-3 md:hidden">
                <p className="truncate text-sm font-semibold text-white">{user.name}</p>
                <p className="truncate text-xs text-zinc-500">{user.email}</p>
                <p className="mt-1 text-[10px] font-medium text-zinc-400">{roleLabel}</p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full px-4 py-2.5 text-left text-sm text-red-400 transition-colors hover:bg-white/5"
                role="menuitem"
              >
                Sair da conta
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
