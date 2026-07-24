"use client";

import { PlusCircle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  emptyFaqItem,
  emptyHelpChannel,
  type HelpLayoutData,
} from "@/lib/institutional-layout";

const ICON_OPTIONS = [
  { value: "message-circle", label: "Chat" },
  { value: "discord", label: "Discord" },
  { value: "mail", label: "E-mail" },
  { value: "headphones", label: "Suporte" },
  { value: "help", label: "Ajuda" },
];

export function HelpLayoutEditor({
  value,
  onChange,
}: {
  value: HelpLayoutData;
  onChange: (next: HelpLayoutData) => void;
}) {
  const set = <K extends keyof HelpLayoutData>(key: K, v: HelpLayoutData[K]) => {
    onChange({ ...value, [key]: v });
  };

  const updateChannel = (index: number, patch: Partial<HelpLayoutData["channels"][0]>) => {
    set(
      "channels",
      value.channels.map((ch, i) => (i === index ? { ...ch, ...patch } : ch))
    );
  };

  const updateFaq = (index: number, patch: Partial<HelpLayoutData["faq"][0]>) => {
    set(
      "faq",
      value.faq.map((item, i) => (i === index ? { ...item, ...patch } : item))
    );
  };

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-white">Hero</h3>
          <p className="text-xs text-zinc-500">Título e subtítulo no topo da página.</p>
        </div>
        <div className="space-y-2">
          <Label className="text-zinc-300">Título do hero</Label>
          <Input
            value={value.heroTitle}
            onChange={(e) => set("heroTitle", e.target.value)}
            className="bg-[#111] border-white/10"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-zinc-300">Subtítulo</Label>
          <textarea
            rows={3}
            value={value.heroSubtitle}
            onChange={(e) => set("heroSubtitle", e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-[#111] px-3 py-2 text-sm text-white focus:border-[#9333EA]/60 focus:outline-none resize-none"
          />
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-white">Canais de Ajuda</h3>
            <p className="text-xs text-zinc-500">Cards de contato (chat, Discord, etc.).</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1 h-8"
            onClick={() => set("channels", [...value.channels, emptyHelpChannel()])}
          >
            <PlusCircle className="h-3.5 w-3.5" />
            Canal
          </Button>
        </div>

        {value.channels.map((channel, index) => (
          <div
            key={channel.id}
            className="space-y-3 rounded-lg border border-white/10 bg-[#111] p-4"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-zinc-400">Canal {index + 1}</p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 text-red-400 hover:text-red-300"
                onClick={() =>
                  set(
                    "channels",
                    value.channels.filter((_, i) => i !== index)
                  )
                }
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-xs text-zinc-500">Título</Label>
                <Input
                  value={channel.title}
                  onChange={(e) => updateChannel(index, { title: e.target.value })}
                  className="bg-[#0a0a0a] border-white/10"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-zinc-500">Ícone</Label>
                <select
                  value={channel.icon}
                  onChange={(e) => updateChannel(index, { icon: e.target.value })}
                  className="h-10 w-full rounded-md border border-white/10 bg-[#0a0a0a] px-3 text-sm text-white"
                >
                  {ICON_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label className="text-xs text-zinc-500">Descrição</Label>
                <Input
                  value={channel.description}
                  onChange={(e) => updateChannel(index, { description: e.target.value })}
                  className="bg-[#0a0a0a] border-white/10"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-zinc-500">Badge de tempo</Label>
                <Input
                  value={channel.responseTime}
                  onChange={(e) => updateChannel(index, { responseTime: e.target.value })}
                  placeholder="Respondemos em 5 min"
                  className="bg-[#0a0a0a] border-white/10"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-zinc-500">Texto do botão</Label>
                <Input
                  value={channel.ctaLabel}
                  onChange={(e) => updateChannel(index, { ctaLabel: e.target.value })}
                  className="bg-[#0a0a0a] border-white/10"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-zinc-500">Ação do botão</Label>
                <select
                  value={channel.ctaAction}
                  onChange={(e) =>
                    updateChannel(index, {
                      ctaAction: e.target.value === "link" ? "link" : "chat",
                    })
                  }
                  className="h-10 w-full rounded-md border border-white/10 bg-[#0a0a0a] px-3 text-sm text-white"
                >
                  <option value="chat">Abrir chat (Crisp/Chatwoot)</option>
                  <option value="link">Link externo</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-zinc-500">URL (se link / fallback)</Label>
                <Input
                  value={channel.ctaHref}
                  onChange={(e) => updateChannel(index, { ctaHref: e.target.value })}
                  placeholder="https://discord.gg/..."
                  className="bg-[#0a0a0a] border-white/10"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label className="text-xs text-zinc-500">
                  Itens da lista (um por linha)
                </Label>
                <textarea
                  rows={3}
                  value={channel.features.join("\n")}
                  onChange={(e) =>
                    updateChannel(index, {
                      features: e.target.value
                        .split("\n")
                        .map((l) => l.trim())
                        .filter(Boolean),
                    })
                  }
                  className="w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-3 py-2 text-sm text-white focus:border-[#9333EA]/60 focus:outline-none resize-none"
                />
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-white">Horário de atendimento</h3>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-xs text-zinc-500">Título</Label>
            <Input
              value={value.hours.title}
              onChange={(e) => set("hours", { ...value.hours, title: e.target.value })}
              className="bg-[#111] border-white/10"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-zinc-500">Fuso</Label>
            <Input
              value={value.hours.timezone}
              onChange={(e) => set("hours", { ...value.hours, timezone: e.target.value })}
              className="bg-[#111] border-white/10"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-zinc-500">Dias úteis</Label>
            <Input
              value={value.hours.weekdays}
              onChange={(e) => set("hours", { ...value.hours, weekdays: e.target.value })}
              className="bg-[#111] border-white/10"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-zinc-500">Fim de semana</Label>
            <Input
              value={value.hours.weekend}
              onChange={(e) => set("hours", { ...value.hours, weekend: e.target.value })}
              className="bg-[#111] border-white/10"
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-white">Perguntas frequentes</h3>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1 h-8"
            onClick={() => set("faq", [...value.faq, emptyFaqItem()])}
          >
            <PlusCircle className="h-3.5 w-3.5" />
            FAQ
          </Button>
        </div>
        {value.faq.map((item, index) => (
          <div
            key={index}
            className="space-y-2 rounded-lg border border-white/10 bg-[#111] p-4"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs text-zinc-400">Pergunta {index + 1}</p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 text-red-400"
                onClick={() => set("faq", value.faq.filter((_, i) => i !== index))}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
            <Input
              value={item.question}
              onChange={(e) => updateFaq(index, { question: e.target.value })}
              placeholder="Pergunta"
              className="bg-[#0a0a0a] border-white/10"
            />
            <textarea
              rows={3}
              value={item.answer}
              onChange={(e) => updateFaq(index, { answer: e.target.value })}
              placeholder="Resposta"
              className="w-full rounded-lg border border-white/10 bg-[#0a0a0a] px-3 py-2 text-sm text-white focus:border-[#9333EA]/60 focus:outline-none resize-none"
            />
          </div>
        ))}
      </section>
    </div>
  );
}
