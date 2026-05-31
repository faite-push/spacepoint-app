import Link from "next/link";
import { fetchSiteConfig } from "@/lib/site-api";

export default async function NotFound() {
  const config = await fetchSiteConfig();

  const title = config?.page404Title?.trim() || "Página não encontrada";
  const message =
    config?.page404Message?.trim() ||
    "O conteúdo que você procura não existe ou foi removido.";
  const buttonLabel = config?.page404ButtonLabel?.trim() || "Voltar para a loja";
  const buttonHref = config?.page404ButtonHref?.trim() || "/";

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <p className="text-6xl font-black text-[#9333EA] mb-2">404</p>
      <h1 className="text-2xl font-bold text-white mb-4">{title}</h1>
      <p className="max-w-md text-white/60 leading-relaxed mb-8">{message}</p>
      <Link
        href={buttonHref}
        className="rounded-lg bg-[#9333EA] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#7c3aed]"
      >
        {buttonLabel}
      </Link>
    </div>
  );
}
