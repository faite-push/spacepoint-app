"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { DocumentLayoutData } from "@/lib/institutional-layout";

export function DocumentLayoutEditor({
  value,
  onChange,
}: {
  value: DocumentLayoutData;
  onChange: (next: DocumentLayoutData) => void;
}) {
  const set = <K extends keyof DocumentLayoutData>(
    key: K,
    v: DocumentLayoutData[K]
  ) => {
    onChange({ ...value, [key]: v });
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-white">Layout documental</h3>
        <p className="text-xs text-zinc-500">
          Cabeçalho e sumário automático a partir dos títulos H2/H3 do conteúdo.
        </p>
      </div>
      <div className="space-y-2">
        <Label className="text-zinc-300">Eyebrow (rótulo acima do título)</Label>
        <Input
          value={value.eyebrow}
          onChange={(e) => set("eyebrow", e.target.value)}
          placeholder="Empresa"
          className="bg-[#111] border-white/10"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-zinc-300">Introdução</Label>
        <textarea
          rows={3}
          value={value.intro}
          onChange={(e) => set("intro", e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-white focus:border-[#9333EA]/60 focus:outline-none resize-none"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-zinc-300">Rótulo de atualização</Label>
        <Input
          value={value.updatedLabel}
          onChange={(e) => set("updatedLabel", e.target.value)}
          placeholder="Atualizado periodicamente..."
          className="bg-[#111] border-white/10"
        />
      </div>
      <div className="flex items-center justify-between rounded-lg border border-white/10 bg-[#111] px-4 py-3">
        <div>
          <p className="text-sm font-medium text-white">Sumário (TOC)</p>
          <p className="text-xs text-zinc-500">
            Mostra âncoras dos headings H2/H3 na lateral (desktop).
          </p>
        </div>
        <Switch checked={value.showToc} onCheckedChange={(v) => set("showToc", v)} />
      </div>
    </div>
  );
}
