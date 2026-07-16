import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { getCsrfToken as getTokenFromApi } from "@/lib/api"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(price);
}

export function getCsrfToken(): string {
  return getTokenFromApi();
}

/** Decodifica entidades HTML comuns em nomes (ex.: &#39; → '). */
export function decodeHtmlEntities(value: string | null | undefined): string {
  if (!value) return "";
  if (!value.includes("&")) return value;

  if (typeof document !== "undefined") {
    const el = document.createElement("textarea");
    el.innerHTML = value;
    return el.value;
  }

  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}
