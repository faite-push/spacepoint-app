"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown } from "lucide-react";
import { API_URL } from "@/lib/api";

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
  const res = await fetch(`${API_URL}/v2/api/categories`, {
    credentials: "include",
  });
  if (!res.ok) return [];
  const data = (await res.json()) as { categories: NavCategory[] };
  return (data.categories ?? []).filter(
    (c) => !c.parentId && c.isActive && c.showInNavbar
  );
}

export function NavbarCategoriesDesktop() {
  const { data } = useQuery({
    queryKey: ["public", "navbar-categories"],
    queryFn: fetchNavbarCategories,
    staleTime: 5 * 60_000,
  });

  if (!data?.length) return null;

  return (
    <motion.nav
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="hidden bg-primary md:block"
    >
      <div className="mx-auto flex h-11 max-w-7xl items-center justify-center gap-6 px-4 font-medium text-sm">
        {data.map((cat, idx) => {
          const subs = (cat.subcategories ?? []).filter((s) => s.isActive && s.showInNavbar);
          const hasSubs = subs.length > 0;
          const href = `/category/${cat.slug}`;

          return (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
              className="group relative h-full flex items-center"
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

// ─── Mobile ──────────────────────────────────────────────────────────────────

export function NavbarCategoriesMobile() {
  const { data } = useQuery({
    queryKey: ["public", "navbar-categories"],
    queryFn: fetchNavbarCategories,
    staleTime: 5 * 60_000,
  });

  if (!data?.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      className="space-y-1 overflow-hidden"
    >
      {data.map((cat) => {
        const subs = (cat.subcategories ?? []).filter((s) => s.isActive && s.showInNavbar);
        return (
          <details
            key={cat.id}
            className="group rounded-lg open:bg-white/5"
          >
            <summary className="flex cursor-pointer items-center justify-between rounded-lg px-3 py-3 text-white/90 hover:bg-white/10 hover:text-white">
              <Link
                href={`/category/${cat.slug}`}
                className="flex-1"
                onClick={(e) => e.stopPropagation()}
              >
                {cat.name}
              </Link>
              {subs.length > 0 && (
                <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
              )}
            </summary>

            {subs.length > 0 && (
              <ul className="pl-4 pb-1">
                {subs.map((sub) => (
                  <li key={sub.id}>
                    <Link
                      href={`/category/${sub.slug}`}
                      className="block rounded-lg px-3 py-2 text-sm text-white/80 hover:bg-white/10 hover:text-white"
                    >
                      {sub.name}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </details>
        );
      })}
    </motion.div>
  );
}
