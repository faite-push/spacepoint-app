"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Home, RotateCw, AlertTriangle } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-red-500/10 ring-1 ring-red-500/20">
        <AlertTriangle className="h-12 w-12 text-red-500" />
      </div>

      <h1 className="mb-3 text-3xl font-bold tracking-tight md:text-4xl">
        Algo deu errado
      </h1>
      <p className="mb-2 max-w-md text-base text-muted-foreground md:text-lg">
        Ocorreu um erro inesperado. Nossa equipe foi notificada e está
        trabalhando para resolver.
      </p>
      {error.digest && (
        <p className="mb-8 font-mono text-xs text-muted-foreground/60">
          ID do erro: {error.digest}
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          onClick={reset}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-white shadow-lg shadow-primary/30 transition-all hover:bg-primary/90"
        >
          <RotateCw className="h-4 w-4" />
          Tentar novamente
        </button>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/5 px-6 py-3 text-sm font-medium text-white transition-all hover:bg-white/10"
        >
          <Home className="h-4 w-4" />
          Voltar para Home
        </Link>
      </div>
    </div>
  );
}
