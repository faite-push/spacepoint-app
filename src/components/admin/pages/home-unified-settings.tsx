"use client";

import { useState } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HomePageSettings } from "./home-page-settings";
import { HomeReviewsSettings } from "./home-reviews-settings";
import { TopBarSettings } from "./top-bar-settings";
import { HomeShowcaseSettings } from "./home-showcase-settings";
import { HomePopupSettings } from "./home-popup-settings";
import { HomeFamousSettings } from "./home-famous-settings";

type TabId = "banners" | "vitrines" | "reviews" | "famosos" | "top-bar" | "popup";

export function HomeUnifiedSettings() {
  const [activeTab, setActiveTab] = useState<TabId>("top-bar");

  return (
    <div className="relative space-y-6">
      <div className="absolute top-0 right-[-5%] w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-white/5 rounded-full blur-[120px] z-0 pointer-events-none" />
      <div className="absolute top-0 left-[-5%] w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-white/5 rounded-full blur-[120px] z-0 pointer-events-none" />
      <div className="absolute top-0 left-[35%] w-[250px] sm:w-[500px] h-[250px] sm:h-[500px] bg-white/5 rounded-full blur-[120px] z-0 pointer-events-none" />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Página Inicial</h1>
          <p className="text-muted-foreground">
            Configure todos os elementos visuais e de conteúdo da sua vitrine principal.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(tabValue) => setActiveTab(tabValue as TabId)} className="relative z-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <TabsList className="h-auto w-full flex-nowrap overflow-x-auto justify-start bg-transparent p-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:w-auto md:flex-wrap md:overflow-visible">
            <TabsTrigger value="top-bar" className="flex shrink-0 items-center gap-2 px-3 py-2.5 text-xs font-medium rounded-md cursor-pointer transition-all duration-200 sm:px-4 sm:py-3 sm:text-sm">Anúncios</TabsTrigger>
            <TabsTrigger value="banners" className="flex shrink-0 items-center gap-2 px-3 py-2.5 text-xs font-medium rounded-md cursor-pointer transition-all duration-200 sm:px-4 sm:py-3 sm:text-sm">Banners Principais</TabsTrigger>
            <TabsTrigger value="famosos" className="flex shrink-0 items-center gap-2 px-3 py-2.5 text-xs font-medium rounded-md cursor-pointer transition-all duration-200 sm:px-4 sm:py-3 sm:text-sm">Clientes Famosos</TabsTrigger>
            <TabsTrigger value="vitrines" className="flex shrink-0 items-center gap-2 px-3 py-2.5 text-xs font-medium rounded-md cursor-pointer transition-all duration-200 sm:px-4 sm:py-3 sm:text-sm">Vitrine de Produtos</TabsTrigger>
            <TabsTrigger value="reviews" className="flex shrink-0 items-center gap-2 px-3 py-2.5 text-xs font-medium rounded-md cursor-pointer transition-all duration-200 sm:px-4 sm:py-3 sm:text-sm">Avaliações Google</TabsTrigger>
            <TabsTrigger value="popup" className="flex shrink-0 items-center gap-2 px-3 py-2.5 text-xs font-medium rounded-md cursor-pointer transition-all duration-200 sm:px-4 sm:py-3 sm:text-sm">Pop-up</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="banners" className="space-y-3 rounded-md border border-white/5 h-auto">
          <HomePageSettings hideHeader />
        </TabsContent>

        <TabsContent value="famosos" className="space-y-3 rounded-md border border-white/5 h-auto">
          <HomeFamousSettings hideHeader />
        </TabsContent>

        <TabsContent value="vitrines" className="space-y-3 rounded-md border border-white/5 h-auto">
          <HomeShowcaseSettings hideHeader />
        </TabsContent>

        <TabsContent value="reviews" className="space-y-3 rounded-md border border-white/5 h-auto">
          <HomeReviewsSettings hideHeader />
        </TabsContent>

        <TabsContent value="top-bar" className="space-y-3 rounded-md border border-white/5 h-auto">
          <TopBarSettings hideHeader />
        </TabsContent>

        <TabsContent value="popup" className="space-y-3 h-auto">
          <HomePopupSettings hideHeader />
        </TabsContent>
      </Tabs>

    </div>
  );
};
