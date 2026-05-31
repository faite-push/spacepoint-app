"use client";

import { PlusCircle, Trash2, Search } from "lucide-react";
import * as Fa from "react-icons/fa";
import * as Si from "react-icons/si";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SocialLink } from "@/lib/admin-api";
import { useState, useMemo } from "react";

const POPULAR_ICONS = [
  { id: "FaFacebook", label: "Facebook", icon: Fa.FaFacebook },
  { id: "FaInstagram", label: "Instagram", icon: Fa.FaInstagram },
  { id: "FaTwitter", label: "Twitter / X", icon: Fa.FaTwitter },
  { id: "FaLinkedin", label: "LinkedIn", icon: Fa.FaLinkedin },
  { id: "FaYoutube", label: "YouTube", icon: Fa.FaYoutube },
  { id: "FaTiktok", label: "TikTok", icon: Fa.FaTiktok },
  { id: "FaDiscord", label: "Discord", icon: Fa.FaDiscord },
  { id: "FaWhatsapp", label: "WhatsApp", icon: Fa.FaWhatsapp },
  { id: "FaGithub", label: "GitHub", icon: Fa.FaGithub },
  { id: "FaTwitch", label: "Twitch", icon: Fa.FaTwitch },
  { id: "FaTelegram", label: "Telegram", icon: Fa.FaTelegram },
];

export function SocialLinksEditor({
  links,
  onChange,
}: {
  links: SocialLink[];
  onChange: (links: SocialLink[]) => void;
}) {
  const update = (index: number, patch: Partial<SocialLink>) => {
    onChange(
      links.map((item, i) => (i === index ? { ...item, ...patch } : item))
    );
  };

  const add = () => onChange([...links, { platform: "FaFacebook", url: "" }]);
  const remove = (index: number) =>
    onChange(links.filter((_, i) => i !== index));

  return (
    <div className="space-y-4 rounded-xl border border-white/10 bg-[#0a0a0a] p-4 lg:p-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-medium text-white">Redes Sociais Dinâmicas</h3>
          <p className="text-xs text-zinc-500 mt-0.5">Adicione quantas redes quiser e escolha o ícone.</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1 h-9 shrink-0 border-white/10 hover:bg-white/5"
          onClick={add}
        >
          <PlusCircle className="h-4 w-4" />
          Adicionar rede
        </Button>
      </div>

      {links.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 rounded-lg border border-dashed border-white/10 bg-white/[0.02]">
          <p className="text-sm text-zinc-500 italic">Nenhuma rede social configurada.</p>
          <Button 
            variant="ghost" 
            size="sm" 
            className="mt-2 text-[#9333EA] hover:text-[#A855F7] hover:bg-[#9333EA]/10"
            onClick={add}
          >
            Clique para adicionar a primeira
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {links.map((link, index) => {
            const IconConfig = POPULAR_ICONS.find(i => i.id === link.platform) || POPULAR_ICONS[0];
            const Icon = IconConfig.icon;

            return (
              <div
                key={index}
                className="group flex flex-col sm:flex-row items-start sm:items-center gap-3 rounded-lg border border-white/10 bg-[#111] p-3 transition-colors hover:border-white/20"
              >
                <div className="w-full sm:w-[180px] shrink-0">
                  <Select
                    value={link.platform}
                    onValueChange={(v) => update(index, { platform: v })}
                  >
                    <SelectTrigger className="bg-[#0a0a0a] border-white/10 h-10">
                      <div className="flex items-center gap-2">
                        <SelectValue placeholder="Ícone" />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="bg-[#0a0a0a] border-white/10 text-white">
                      {POPULAR_ICONS.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          <div className="flex items-center gap-2">
                            <item.icon className="h-4 w-4" />
                            <span>{item.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1 w-full">
                  <Input
                    placeholder="https://facebook.com/seu-perfil"
                    value={link.url}
                    onChange={(e) => update(index, { url: e.target.value })}
                    className="bg-[#0a0a0a] border-white/10 h-10"
                  />
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-zinc-500 hover:text-destructive hover:bg-destructive/10 shrink-0 self-end sm:self-center"
                  onClick={() => remove(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
