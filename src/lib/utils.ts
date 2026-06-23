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
