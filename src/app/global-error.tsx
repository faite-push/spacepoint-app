"use client";

import { useEffect } from "react";

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
    <html lang="pt-BR" className="dark">
      <body className="min-h-screen bg-[#0a0a0a] text-white antialiased">
        <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
          <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-red-500/10 ring-1 ring-red-500/20">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-12 w-12 text-red-500"
            >
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
            </svg>
          </div>

          <h1 className="mb-3 text-4xl font-bold tracking-tight">
            Erro crítico do servidor
          </h1>
          <p className="mb-8 max-w-md text-base text-white/60 md:text-lg">
            Ocorreu um erro grave na aplicação. Por favor, tente novamente em
            alguns instantes.
          </p>

          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-purple-600 px-6 py-3 text-sm font-medium text-white shadow-lg transition-all hover:bg-purple-700"
          >
            Tentar novamente
          </button>
        </div>
      </body>
    </html>
  );
}
