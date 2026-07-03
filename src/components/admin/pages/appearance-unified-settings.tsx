"use client";

import { useState } from "react";
import { Palette, Globe } from "lucide-react";
import { GlobalSettings } from "./global-settings";
import { FooterSettings } from "./footer-settings";

type TabId = "global" | "footer";

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  // { id: "global", label: "Identidade Visual", icon: Globe },
  { id: "footer", label: "Rodapé", icon: Palette },
];

export function AppearanceUnifiedSettings() {
  const [activeTab, setActiveTab] = useState<TabId>("footer");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-white lg:text-2xl">Aparência da Loja</h1>
          <p className="text-muted-foreground">
            Personalize as cores, logos e o rodapé da sua loja.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-start gap-2 overflow-x-auto pb-px">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-md cursor-pointer transition-all duration-200
                ${isActive
                  ? "border-white/5 text-white bg-white/5"
                  : "border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                }
              `}
            >
              <Icon className={`h-4 w-4 ${isActive ? "text-[#9333EA]" : ""}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        {/* {activeTab === "global" && <GlobalSettings hideHeader />} */}
        {activeTab === "footer" && <FooterSettings hideHeader />}
      </div>
    </div>
  );
}