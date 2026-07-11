import { resolveMediaUrl } from "@/lib/media";

export function getSiteUrl() {
  const url =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    process.env.FRONTEND_URL ||
    "http://localhost:3000";

  return url.replace(/\/$/, "");
}

export function toAbsoluteUrl(path?: string | null, siteUrl = getSiteUrl()) {
  if (!path?.trim()) return undefined;

  const resolved = resolveMediaUrl(path.trim()) || path.trim();
  if (/^https?:\/\//i.test(resolved)) return resolved;

  const base = siteUrl.replace(/\/$/, "");
  return `${base}${resolved.startsWith("/") ? resolved : `/${resolved}`}`;
}

export function toAbsolutePath(path: string, siteUrl = getSiteUrl()) {
  const base = siteUrl.replace(/\/$/, "");
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}
