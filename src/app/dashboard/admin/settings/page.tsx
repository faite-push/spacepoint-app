"use client";

import { useState } from "react";
import { Save, Store, CreditCard, Mail, Shield, Bell, Globe, } from "lucide-react";

import { usePermission, Can } from "@/providers/PermissionProvider";

const tabs = [
  { id: "general", label: "Geral", icon: Store },
  { id: "payment", label: "Pagamento", icon: CreditCard },
  { id: "email", label: "E-mail", icon: Mail },
  { id: "security", label: "Segurança", icon: Shield },
  { id: "notifications", label: "Notificações", icon: Bell },
];

export default function SettingsPage() {
  const { hasPermission } = usePermission();
  const canManage = hasPermission('settings:manage');

  const [activeTab, setActiveTab] = useState("general");
  const [saving, setSaving] = useState(false);

  if (!canManage) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Configurações</h1>
          <p className="text-zinc-400">Gerencie as configurações da sua loja</p>
        </div>
        <div className="flex h-[40vh] flex-col items-center justify-center gap-4 rounded-xl border border-white/5 bg-[#111111]">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#9333EA]/10">
            <Shield className="h-8 w-8 text-[#9333EA]" />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-semibold text-white">Acesso Restrito</h2>
            <p className="mt-1 text-sm text-zinc-400">Você não tem permissão para visualizar ou gerenciar as configurações.</p>
          </div>
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-white lg:text-2xl">Configurações</h1>
          <p className="text-sm text-zinc-400 lg:text-base">Gerencie as configurações da sua loja</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#9333EA] px-4 py-2.5 font-medium text-white transition-colors hover:bg-[#7c3aed] disabled:opacity-50 sm:w-auto"
        >
          <Save className="h-4 w-4 hidden" />
          {saving ? "Salvando..." : "Salvar Alterações"}
        </button>
      </div>

      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-4 lg:gap-6">
        <div className="flex gap-2 overflow-x-auto pb-1 lg:col-span-1 lg:flex-col lg:overflow-visible lg:pb-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors lg:w-full lg:gap-3 lg:px-4 lg:py-3 ${
                  activeTab === tab.id
                    ? "bg-[#9333EA]/10 text-[#9333EA]"
                    : "text-zinc-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="rounded-xl border border-white/5 bg-[#111111] p-4 lg:col-span-3 lg:p-6">
          {activeTab === "general" && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-white">Configurações Gerais</h2>
              
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-300">Nome da Loja</label>
                  <input
                    type="text"
                    defaultValue="Space Point"
                    className="h-10 w-full rounded-lg border border-white/10 bg-zinc-900 px-3 text-white focus:border-[#9333EA] focus:outline-none focus:ring-1 focus:ring-[#9333EA]"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-300">E-mail de Contato</label>
                  <input
                    type="email"
                    defaultValue="contato@spacepoint.com"
                    className="h-10 w-full rounded-lg border border-white/10 bg-zinc-900 px-3 text-white focus:border-[#9333EA] focus:outline-none focus:ring-1 focus:ring-[#9333EA]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-zinc-300">Descrição</label>
                  <textarea
                    rows={3}
                    defaultValue="A melhor plataforma para compra de jogos digitais com entrega segura e instantânea."
                    className="w-full rounded-lg border border-white/10 bg-zinc-900 px-3 py-2 text-white focus:border-[#9333EA] focus:outline-none focus:ring-1 focus:ring-[#9333EA]"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-300">CNPJ</label>
                  <input
                    type="text"
                    defaultValue="12.345.678/0001-90"
                    className="h-10 w-full rounded-lg border border-white/10 bg-zinc-900 px-3 text-white focus:border-[#9333EA] focus:outline-none focus:ring-1 focus:ring-[#9333EA]"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-300">Telefone</label>
                  <input
                    type="text"
                    defaultValue="(11) 99999-9999"
                    className="h-10 w-full rounded-lg border border-white/10 bg-zinc-900 px-3 text-white focus:border-[#9333EA] focus:outline-none focus:ring-1 focus:ring-[#9333EA]"
                  />
                </div>
              </div>

              <div className="border-t border-white/5 pt-6">
                <h3 className="mb-4 text-sm font-medium text-white">Redes Sociais</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs text-zinc-400">Instagram</label>
                    <input
                      type="text"
                      defaultValue="@spacepoint"
                      className="h-10 w-full rounded-lg border border-white/10 bg-zinc-900 px-3 text-white focus:border-[#9333EA] focus:outline-none focus:ring-1 focus:ring-[#9333EA]"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs text-zinc-400">Discord</label>
                    <input
                      type="text"
                      defaultValue="discord.gg/spacepoint"
                      className="h-10 w-full rounded-lg border border-white/10 bg-zinc-900 px-3 text-white focus:border-[#9333EA] focus:outline-none focus:ring-1 focus:ring-[#9333EA]"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "payment" && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-white">Configurações de Pagamento</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-white/5 bg-zinc-900/50 p-4">
                  <div>
                    <p className="font-medium text-white">PIX</p>
                    <p className="text-sm text-zinc-400">Pagamento instantâneo com QR Code</p>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input type="checkbox" defaultChecked className="peer sr-only" />
                    <div className="h-6 w-11 rounded-full bg-zinc-700 peer-checked:bg-[#9333EA] peer-focus:outline-none"></div>
                    <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-5"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-white/5 bg-zinc-900/50 p-4">
                  <div>
                    <p className="font-medium text-white">Cartão de Crédito</p>
                    <p className="text-sm text-zinc-400">Via EfiPay / Mercado Pago</p>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input type="checkbox" defaultChecked className="peer sr-only" />
                    <div className="h-6 w-11 rounded-full bg-zinc-700 peer-checked:bg-[#9333EA] peer-focus:outline-none"></div>
                    <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-5"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-white/5 bg-zinc-900/50 p-4">
                  <div>
                    <p className="font-medium text-white">Boleto Bancário</p>
                    <p className="text-sm text-zinc-400">Pagamento em até 3 dias úteis</p>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input type="checkbox" className="peer sr-only" />
                    <div className="h-6 w-11 rounded-full bg-zinc-700 peer-checked:bg-[#9333EA] peer-focus:outline-none"></div>
                    <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-5"></div>
                  </label>
                </div>
              </div>

              <div className="border-t border-white/5 pt-6">
                <h3 className="mb-4 text-sm font-medium text-white">Credenciais EfiPay</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-xs text-zinc-400">Client ID</label>
                    <input
                      type="text"
                      placeholder="Client ID"
                      className="h-10 w-full rounded-lg border border-white/10 bg-zinc-900 px-3 text-white focus:border-[#9333EA] focus:outline-none focus:ring-1 focus:ring-[#9333EA]"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs text-zinc-400">Client Secret</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="h-10 w-full rounded-lg border border-white/10 bg-zinc-900 px-3 text-white focus:border-[#9333EA] focus:outline-none focus:ring-1 focus:ring-[#9333EA]"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "email" && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-white">Configurações de E-mail</h2>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-300">SMTP Host</label>
                  <input
                    type="text"
                    defaultValue="smtp.gmail.com"
                    className="h-10 w-full rounded-lg border border-white/10 bg-zinc-900 px-3 text-white focus:border-[#9333EA] focus:outline-none focus:ring-1 focus:ring-[#9333EA]"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-300">Porta</label>
                  <input
                    type="text"
                    defaultValue="587"
                    className="h-10 w-full rounded-lg border border-white/10 bg-zinc-900 px-3 text-white focus:border-[#9333EA] focus:outline-none focus:ring-1 focus:ring-[#9333EA]"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-300">Usuário</label>
                  <input
                    type="text"
                    defaultValue="noreply@spacepoint.com"
                    className="h-10 w-full rounded-lg border border-white/10 bg-zinc-900 px-3 text-white focus:border-[#9333EA] focus:outline-none focus:ring-1 focus:ring-[#9333EA]"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-300">Senha</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="h-10 w-full rounded-lg border border-white/10 bg-zinc-900 px-3 text-white focus:border-[#9333EA] focus:outline-none focus:ring-1 focus:ring-[#9333EA]"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-white">Segurança</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-white/5 bg-zinc-900/50 p-4">
                  <div>
                    <p className="font-medium text-white">Autenticação de Dois Fatores (MFA)</p>
                    <p className="text-sm text-zinc-400">Obrigatório para todos os administradores</p>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input type="checkbox" defaultChecked className="peer sr-only" />
                    <div className="h-6 w-11 rounded-full bg-zinc-700 peer-checked:bg-[#9333EA] peer-focus:outline-none"></div>
                    <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-5"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-white/5 bg-zinc-900/50 p-4">
                  <div>
                    <p className="font-medium text-white">Bloquear IPs Suspeitos</p>
                    <p className="text-sm text-zinc-400">Bloquear automaticamente IPs com múltiplas tentativas falhas</p>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input type="checkbox" defaultChecked className="peer sr-only" />
                    <div className="h-6 w-11 rounded-full bg-zinc-700 peer-checked:bg-[#9333EA] peer-focus:outline-none"></div>
                    <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-5"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-white/5 bg-zinc-900/50 p-4">
                  <div>
                    <p className="font-medium text-white">Rate Limiting</p>
                    <p className="text-sm text-zinc-400">Limitar requisições por IP</p>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input type="checkbox" defaultChecked className="peer sr-only" />
                    <div className="h-6 w-11 rounded-full bg-zinc-700 peer-checked:bg-[#9333EA] peer-focus:outline-none"></div>
                    <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-5"></div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-white">Notificações</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-white/5 bg-zinc-900/50 p-4">
                  <div>
                    <p className="font-medium text-white">Novo Pedido</p>
                    <p className="text-sm text-zinc-400">Receber notificação quando houver novo pedido</p>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input type="checkbox" defaultChecked className="peer sr-only" />
                    <div className="h-6 w-11 rounded-full bg-zinc-700 peer-checked:bg-[#9333EA] peer-focus:outline-none"></div>
                    <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-5"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-white/5 bg-zinc-900/50 p-4">
                  <div>
                    <p className="font-medium text-white">Estoque Baixo</p>
                    <p className="text-sm text-zinc-400">Alertar quando produtos estiverem com estoque baixo</p>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input type="checkbox" defaultChecked className="peer sr-only" />
                    <div className="h-6 w-11 rounded-full bg-zinc-700 peer-checked:bg-[#9333EA] peer-focus:outline-none"></div>
                    <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-5"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-white/5 bg-zinc-900/50 p-4">
                  <div>
                    <p className="font-medium text-white">Novo Usuário</p>
                    <p className="text-sm text-zinc-400">Notificar quando novo usuário se cadastrar</p>
                  </div>
                  <label className="relative inline-flex cursor-pointer items-center">
                    <input type="checkbox" className="peer sr-only" />
                    <div className="h-6 w-11 rounded-full bg-zinc-700 peer-checked:bg-[#9333EA] peer-focus:outline-none"></div>
                    <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-5"></div>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
