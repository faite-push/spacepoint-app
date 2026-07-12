import { resolveMediaUrl } from "@/lib/media";

function normalizeSiteUrl(url: string) {
  return url.replace(/\/$/, "");
}

export function getSiteUrl() {
  const fromEnv =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    process.env.FRONTEND_URL;

  if (fromEnv?.trim()) {
    return normalizeSiteUrl(fromEnv.trim());
  }

  // Fallback em deploys Vercel quando a env da loja não foi configurada.
  const vercelProduction = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercelProduction?.trim()) {
    return normalizeSiteUrl(`https://${vercelProduction.trim()}`);
  }

  if (process.env.VERCEL_URL?.trim()) {
    return normalizeSiteUrl(`https://${process.env.VERCEL_URL.trim()}`);
  }

  return "http://localhost:3000";
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
