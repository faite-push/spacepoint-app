"use client";

import { Plus, PlusCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import type { FooterLink } from "@/lib/admin-api";

export function FooterLinksEditor({ label, links, onChange, columnTitle, onColumnTitleChange, showColumnTitle = false, }: {
  label: string;
  links: FooterLink[];
  onChange: (links: FooterLink[]) => void;
  columnTitle?: string;
  onColumnTitleChange?: (title: string) => void;
  showColumnTitle?: boolean;
}) {
  const update = (index: number, patch: Partial<FooterLink>) => {
    onChange(links.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const add = () => onChange([...links, { label: "", href: "" }]);
  const remove = (index: number) => onChange(links.filter((_, i) => i !== index));

  return (
    <div className="space-y-2 rounded-lg border border-white/10 bg-[#0a0a0a] p-4">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-zinc-200 font-medium">{label}</Label>
        <Button type="button" variant="outline" size="sm" className="gap-1 h-8 shrink-0" onClick={add}>
          <PlusCircle className="h-3.5 w-3.5" />
          Adicionar link
        </Button>
      </div>

      {showColumnTitle && onColumnTitleChange && (
        <div className="space-y-2">
          <Label className="text-xs text-zinc-500">Título da coluna no rodapé</Label>
          <Input
            value={columnTitle ?? ""}
            onChange={(e) => onColumnTitleChange(e.target.value)}
            placeholder="Ex: Categorias:"
            className="bg-[#111] border-white/10"
          />
        </div>
      )}

      {links.length === 0 ? (
        <p className="text-xs text-zinc-500 italic">Nenhum link configurado.</p>
      ) : (
        <div className="space-y-2 grid gap-2 sm:grid-cols-2">
          {links.map((link, index) => (
            <div
              key={index}
              className="space-y-2 rounded-lg border border-white/10 bg-[#111] p-3"
            >
              <div className="grid gap-2 sm:grid-cols-2">
                <Input
                  placeholder="Texto do link"
                  value={link.label}
                  onChange={(e) => update(index, { label: e.target.value })}
                  className="bg-[#0a0a0a] border-white/10"
                />
                <Input
                  placeholder="/caminho ou https://..."
                  value={link.href}
                  onChange={(e) => update(index, { href: e.target.value })}
                  className="bg-[#0a0a0a] border-white/10"
                />
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={!!link.external}
                    onCheckedChange={(v) => update(index, { external: v })}
                  />
                  <span className="text-xs text-zinc-400">Link externo (ícone ↗)</span>
                </div>
                <div className="flex flex-1 items-center gap-2 min-w-[140px]">
                  <Label className="text-xs text-zinc-500 shrink-0">Badge</Label>
                  <Input
                    placeholder="Ex: New"
                    value={link.badge ?? ""}
                    onChange={(e) =>
                      update(index, { badge: e.target.value || undefined })
                    }
                    className="h-8 bg-[#0a0a0a] border-white/10 text-xs"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:bg-destructive/10 ml-auto shrink-0"
                  onClick={() => remove(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};