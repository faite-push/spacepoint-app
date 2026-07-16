"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface NavCategory {
  id: string;
  name: string;
  slug: string;
  showInNavbar: boolean;
  isActive: boolean;
  parentId: string | null;
  subcategories?: NavCategory[];
}

async function fetchNavbarCategories(): Promise<NavCategory[]> {
  try {
    const data = await apiFetch<{ categories: NavCategory[] }>("/v2/api/categories");
    return (data.categories ?? []).filter(
      (c) => !c.parentId && c.isActive && c.showInNavbar
    );
  } catch {
    return [];
  }
}

export function NavbarCategoriesDesktop() {
  const [mounted, setMounted] = useState(false);
  const { data, isLoading } = useQuery({
    queryKey: ["public", "navbar-categories"],
    queryFn: fetchNavbarCategories,
    staleTime: 5 * 60_000,
    enabled: mounted,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isLoading) {
    return (
      <div className="hidden bg-primary md:block transition-all duration-300">
        <div className="mx-auto flex h-11 max-w-7xl items-center justify-center gap-6 px-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-4 w-20 bg-white/20" />
          ))}
        </div>
      </div>
    );
  }

  if (!data?.length) return null;

  return (
    <motion.nav
      className="hidden bg-primary md:block"
    >
      <div className="mx-auto flex h-10 max-w-7xl items-center justify-center gap-6 px-4 font-medium text-sm">
        {data.map((cat, idx) => {
          const subs = (cat.subcategories ?? []).filter((s) => s.isActive && s.showInNavbar);
          const hasSubs = subs.length > 0;
          const href = `/category/${cat.slug}`;

          return (
            <motion.div
              key={cat.id}
              className="group relative h-full flex items-center rounded-md"
            >
              <Link
                href={href}
                className="flex items-center gap-1 text-white/90 transition-colors hover:text-white"
              >
                <span>{cat.name}</span>
                {hasSubs && (
                  <ChevronDown className="h-3.5 w-3.5 transition-transform group-hover:rotate-180" />
                )}
              </Link>

              {hasSubs && (
                <div
                  className="invisible absolute left-1/2 top-full z-50 -translate-x-1/2 pt-2 opacity-0 transition-all duration-150 group-hover:visible group-hover:opacity-100"
                  role="menu"
                >
                  <div className="min-w-[200px] overflow-hidden rounded-xl border border-white/10 bg-zinc-900 shadow-xl shadow-black/40">
                    <ul className="py-1.5">
                      {subs.map((sub) => (
                        <li key={sub.id}>
                          <Link
                            href={`/category/${sub.slug}`}
                            className="block px-4 py-2 text-sm text-zinc-200 transition-colors hover:bg-white/5 hover:text-white"
                          >
                            {sub.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </motion.nav>
  );
}

export function NavbarCategoriesMobile({ onNavigate }: { onNavigate?: () => void }) {
  const [mounted, setMounted] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ["public", "navbar-categories"],
    queryFn: fetchNavbarCategories,
    staleTime: 5 * 60_000,
    enabled: mounted,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-12 w-full rounded-xl bg-white/10" />
        ))}
      </div>
    );
  }

  if (!data?.length) {
    return (
      <p className="px-3 py-10 text-center text-sm text-white/40">
        Nenhuma categoria disponível
      </p>
    );
  }

  return (
    <nav className="space-y-1.5">
      {data.map((cat) => {
        const subs = (cat.subcategories ?? []).filter((s) => s.isActive && s.showInNavbar);
        const hasSubs = subs.length > 0;
        const isOpen = expandedId === cat.id;

        if (!hasSubs) {
          return (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}`}
              onClick={() => onNavigate?.()}
              className="flex items-center rounded-xl px-3.5 py-3.5 text-[15px] font-medium text-white/90 transition-colors hover:bg-white/8 active:bg-white/12"
            >
              {cat.name}
            </Link>
          );
        }

        return (
          <div
            key={cat.id}
            className={cn(
              "overflow-hidden rounded-xl transition-colors",
              isOpen ? "bg-white/[0.06]" : "hover:bg-white/[0.04]"
            )}
          >
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setExpandedId(isOpen ? null : cat.id)}
                className="flex min-w-0 flex-1 items-center justify-between gap-3 px-3.5 py-3.5 text-left"
                aria-expanded={isOpen}
              >
                <span className="truncate text-[15px] font-medium text-white/90">
                  {cat.name}
                </span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 text-white/45 transition-transform duration-200",
                    isOpen && "rotate-180 text-white/70"
                  )}
                />
              </button>
            </div>

            <div
              className={cn(
                "grid transition-[grid-template-rows] duration-200 ease-out",
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              )}
            >
              <div className="min-h-0 overflow-hidden">
                <ul className="space-y-0.5 border-t border-white/5 px-2 pb-2 pt-1">
                  <li>
                    <Link
                      href={`/category/${cat.slug}`}
                      onClick={() => onNavigate?.()}
                      className="flex items-center rounded-lg px-3 py-2.5 text-sm font-medium text-white/80 transition-colors hover:bg-white/8 hover:text-white"
                    >
                      Ver todos
                    </Link>
                  </li>
                  {subs.map((sub) => (
                    <li key={sub.id}>
                      <Link
                        href={`/category/${sub.slug}`}
                        onClick={() => onNavigate?.()}
                        className="block rounded-lg px-3 py-2.5 text-sm text-white/55 transition-colors hover:bg-white/8 hover:text-white"
                      >
                        {sub.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        );
      })}
    </nav>
  );
}

