"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { AutomationSettingsPanel } from "@/components/admin/marketing/automation-settings-panel";
import { AUTOMATIONS_BASE } from "@/lib/marketing-email-routes";

export default function AutomationSettingsPage() {
  return (
    <div className="relative flex flex-col gap-4 animate-in fade-in duration-500">
      <div className="pointer-events-none absolute top-10 right-[-5%] z-0 h-[300px] w-[300px] rounded-full bg-white/3 blur-[120px] sm:h-[600px] sm:w-[600px]" />
      <div className="pointer-events-none absolute top-0 left-[-5%] z-0 h-[300px] w-[300px] rounded-full bg-white/3 blur-[120px] sm:h-[600px] sm:w-[600px]" />

      <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="mt-0.5 text-white/60 hover:text-white"
            asChild
          >
            <Link href={AUTOMATIONS_BASE}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-white">Configurações de Automações</h1>
            <p className="max-w-2xl text-muted-foreground">
              Defina horários, mensagens e intervalos das réguas de recuperação.
            </p>
          </div>
        </div>
      </div>

      <div className="relative z-10 rounded-md border border-white/5">
        <AutomationSettingsPanel />
      </div>
    </div>
  );
}
