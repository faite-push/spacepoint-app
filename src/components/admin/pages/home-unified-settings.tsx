"use client";

import { useState } from "react";
import { Home, MessageSquareQuote, Megaphone } from "lucide-react";
import { HomePageSettings } from "./home-page-settings";
import { HomeReviewsSettings } from "./home-reviews-settings";
import { TopBarSettings } from "./top-bar-settings";

type TabId = "banners" | "reviews" | "top-bar";

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "banners", label: "Banners Principais", icon: Home },
  { id: "reviews", label: "Depoimentos", icon: MessageSquareQuote },
  { id: "top-bar", label: "Faixa Promocional", icon: Megaphone },
];

export function HomeUnifiedSettings() {
  const [activeTab, setActiveTab] = useState<TabId>("banners");

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white lg:text-3xl">Página Inicial</h1>
          <p className="text-sm text-muted-foreground mt-1 lg:text-base">
            Configure todos os elementos visuais e de conteúdo da sua vitrine principal.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center mx-auto gap-2 border-b border-white/10 overflow-x-auto pb-px">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-lg whitespace-nowrap cursor-pointer transition-all duration-200
                ${isActive
                  ? "border-[#9333EA] text-white bg-white/5"
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
        {activeTab === "banners" && <HomePageSettings hideHeader />}
        {activeTab === "reviews" && <HomeReviewsSettings hideHeader />}
        {activeTab === "top-bar" && <TopBarSettings hideHeader />}
      </div>
    </div>
  );
}
