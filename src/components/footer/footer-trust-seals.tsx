"use client";

import Link from "next/link";
import { Lock, ShieldCheck, Zap } from "lucide-react";
import type { FooterTrustSeal } from "@/lib/footer-config";

function ReclameAquiIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" aria-hidden>
      <circle cx="12" cy="12" r="10" fill="#00A859" />
      <path
        fill="#fff"
        d="M7.5 8.5h9v1.4h-3.1v5.6h-2.8v-5.6H7.5V8.5zm1.8 8.2a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm5.4 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"
      />
    </svg>
  );
}

function SealIcon({ id }: { id: string }) {
  if (id === "reclame-aqui") return <ReclameAquiIcon />;
  if (id === "ssl") return <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-300" aria-hidden />;
  if (id === "pagamento") return <Lock className="h-5 w-5 shrink-0 text-sky-300" aria-hidden />;
  return <Zap className="h-5 w-5 shrink-0 text-amber-300" aria-hidden />;
}

function SealCard({ seal }: { seal: FooterTrustSeal }) {
  const content = (
    <div className="flex min-w-[9.5rem] items-center gap-2.5 rounded-lg bg-white/10 px-3 py-2.5 ring-1 ring-white/15 transition-colors hover:bg-white/15">
      <SealIcon id={seal.id} />
      <div className="min-w-0 text-left">
        <p className="text-xs font-semibold leading-tight text-white">{seal.title}</p>
        {seal.subtitle ? (
          <p className="text-[10px] leading-tight text-white/70">{seal.subtitle}</p>
        ) : null}
      </div>
    </div>
  );

  if (seal.href) {
    return (
      <Link
        href={seal.href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={seal.title}
        className="shrink-0"
      >
        {content}
      </Link>
    );
  }

  return <div className="shrink-0">{content}</div>;
}
