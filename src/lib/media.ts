import { API_URL } from "@/lib/api";

export function resolveMediaUrl(url?: string | null): string | null {
  if (!url) return null;

  const trimmed = url.trim();
  if (!trimmed) return null;

  const apiBase = API_URL?.replace(/\/$/, "");
  const cdnMatch = trimmed.match(/\/cdn\/([^/?#]+)/i);

  if (cdnMatch && apiBase) {
    return `${apiBase}/cdn/${cdnMatch[1]}`;
  }

  if (apiBase && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//i.test(trimmed)) {
    try {
      const parsed = new URL(trimmed);
      if (parsed.pathname.startsWith("/cdn/")) {
        return `${apiBase}${parsed.pathname}`;
      }
    } catch {
      return trimmed;
    }
  }

  return trimmed;
}
