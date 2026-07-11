"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

import { API_URL } from "@/lib/api";
import { getVisitorId } from "@/lib/visitor-id";

const DEDUPE_MS = 30_000;

function shouldTrack(path: string) {
  if (!path || path.startsWith("/dashboard")) return false;
  if (path.startsWith("/api") || path.startsWith("/cdn")) return false;
  return true;
}

export function AnalyticsVisit() {
  const pathname = usePathname();
  const lastTracked = useRef<{ path: string; at: number } | null>(null);

  useEffect(() => {
    if (!pathname || !shouldTrack(pathname)) return;

    const now = Date.now();
    if (
      lastTracked.current?.path === pathname &&
      now - lastTracked.current.at < DEDUPE_MS
    ) {
      return;
    }

    const visitorId = getVisitorId();
    if (!visitorId || !API_URL) return;

    lastTracked.current = { path: pathname, at: now };

    fetch(`${API_URL}/v2/api/analytics/visit`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        visitorId,
        path: pathname,
        referrer: document.referrer || null,
      }),
      keepalive: true,
    }).catch(() => {});
  }, [pathname]);

  return null;
}
