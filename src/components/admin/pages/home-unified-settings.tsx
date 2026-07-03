"use client";

import { useState } from "react";

import { Home, MessageSquareQuote, Megaphone } from "lucide-react";
import { RiGoogleFill } from "react-icons/ri"
import { TbLayoutNavbarFilled } from "react-icons/tb";
import { BiSolidImage } from "react-icons/bi";
import { FaBasketShopping } from "react-icons/fa6";

import { HomePageSettings } from "./home-page-settings";
import { HomeReviewsSettings } from "./home-reviews-settings";
import { TopBarSettings } from "./top-bar-settings";
import { HomeShowcaseSettings } from "./home-showcase-settings";
import { HomePopupSettings } from "./home-popup-settings";
import { MousePointerClick } from "lucide-react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type TabId = "banners" | "vitrines" | "reviews" | "top-bar" | "popup";

const TABS: { id: TabId; label: string; description: string; icon: React.ElementType }[] = [
  { id: "banners", label: "Banners Principais", description: "Configure o banner principal e outros elementos exibidos na home da loja.", icon: BiSolidImage },
  { id: "vitrines", label: "Vitrine de Produtos", description: "Configure os produtos e coleções que aparecem na home.", icon: FaBasketShopping },
  { id: "reviews", label: "Avaliações Google", description: "Configure as avaliações do Google exibidas na home da loja.", icon: RiGoogleFill },
  // { id: "top-bar", label: "Anúncios", description: "Configure os anúncios exibidos no topo da página.", icon: TbLayoutNavbarFilled },
  { id: "popup", label: "Pop-up", description: "Configure o pop-up de conversão de entrada ou saída.", icon: MousePointerClick },
];

export function HomeUnifiedSettings() {
  const [activeTab, setActiveTab] = useState<TabId>("banners");

  return (
    <div className="relative space-y-6">
      <div className="absolute top-0 right-[-5%] w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-white/1 rounded-full blur-[120px] z-0 pointer-events-none" />
      <div className="absolute top-0 left-[-5%] w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-white/1 rounded-full blur-[120px] z-0 pointer-events-none" />
      <div className="absolute top-0 left-[35%] w-[250px] sm:w-[500px] h-[250px] sm:h-[500px] bg-white/1 rounded-full blur-[120px] z-0 pointer-events-none" />

      <div className="absolute bottom-0 right-[-5%] w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-white/1 rounded-full blur-[120px] z-0 pointer-events-none" />
      <div className="absolute bottom-0 left-[-5%] w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-white/1 rounded-full blur-[120px] z-0 pointer-events-none" />
      <div className="absolute bottom-0 left-[35%] w-[250px] sm:w-[500px] h-[250px] sm:h-[500px] bg-white/1 rounded-full blur-[120px] z-0 pointer-events-none" />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Página Inicial</h1>
          <p className="text-muted-foreground">
            Configure todos os elementos visuais e de conteúdo da sua vitrine principal.
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:items-center gap-2 overflow-x-auto pb-px">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <Tooltip key={tab.id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium rounded-md cursor-pointer transition-all duration-200 ${isActive
                    ? "border-white/5 text-white bg-white/5"
                    : "border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                  }`}>
                  <Icon className={`h-4 w-4`} />
                  {tab.label}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" align="center">
                <p>{tab.description}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>

      <div className="mt-6">
        {activeTab === "banners" && <HomePageSettings hideHeader />}
        {activeTab === "vitrines" && <HomeShowcaseSettings hideHeader />}
        {activeTab === "reviews" && <HomeReviewsSettings hideHeader />}
        {/* {activeTab === "top-bar" && <TopBarSettings hideHeader />} */}
        {activeTab === "popup" && <HomePopupSettings hideHeader />}
      </div>
    </div>
  );
}
