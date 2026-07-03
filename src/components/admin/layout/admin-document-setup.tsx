"use client";

import { useEffect } from "react";

/** Marca o documento como painel admin (fundo uniforme, sem overflow horizontal). */
export function AdminDocumentSetup() {
  useEffect(() => {
    document.documentElement.classList.add("admin-dashboard");
    return () => {
      document.documentElement.classList.remove("admin-dashboard");
    };
  }, []);

  return null;
}
