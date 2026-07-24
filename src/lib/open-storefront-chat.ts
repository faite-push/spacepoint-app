"use client";

declare global {
  interface Window {
    $crisp?: unknown[] & { push?: (args: unknown[]) => void };
    $chatwoot?: { toggle?: (state?: "open" | "close") => void };
    chatwootSDK?: unknown;
  }
}

/** Abre Crisp ou Chatwoot se o plugin estiver carregado. */
export function openStorefrontChat(): boolean {
  if (typeof window === "undefined") return false;

  try {
    if (Array.isArray(window.$crisp)) {
      window.$crisp.push(["do", "chat:open"]);
      return true;
    }
  } catch {
    /* ignore */
  }

  try {
    if (window.$chatwoot && typeof window.$chatwoot.toggle === "function") {
      window.$chatwoot.toggle("open");
      return true;
    }
  } catch {
    /* ignore */
  }

  return false;
}

export function hasStorefrontChat(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(
    (Array.isArray(window.$crisp) && window.$crisp.length >= 0) ||
      window.$chatwoot ||
      window.chatwootSDK
  );
}
