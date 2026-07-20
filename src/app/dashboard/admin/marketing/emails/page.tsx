"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

import { ChevronRight, Loader2, Mail } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

import { emailTemplatesApi, type EmailTemplateBlock } from "@/lib/admin-api";
import { emailTemplateHref } from "@/lib/marketing-email-routes";
import { cn } from "@/lib/utils";

type TabKey = "components" | "transactional" | "abandonedCart" | "abandonedProduct";

const VALID_TABS: TabKey[] = ["components", "transactional", "abandonedCart", "abandonedProduct"];

function BlockCard({ block }: { block: EmailTemplateBlock }) {
  return (
    <Link
      href={emailTemplateHref(block.id)}
      className="group flex w-full cursor-pointer items-center gap-2 rounded-md border border-white/5 bg-background/30 px-4 py-4 text-left transition-colors hover:border-white/15 hover:bg-white/[0.03]"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-white/5 text-white/70 group-hover:text-white">
        <Mail className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-white">{block.title}</p>
        <p className="mt-1 text-xs leading-relaxed text-white/45">{block.description}</p>
      </div>
      <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-white/25 group-hover:text-white/50" />
    </Link>
  );
}

function BlocksGrid({ blocks }: { blocks: EmailTemplateBlock[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {blocks.map((block) => (
        <BlockCard key={block.id} block={block} />
      ))}
    </div>
  );
}

function MarketingEmailsPageContent() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<TabKey>(() => {
    const raw = searchParams.get("tab");
    return raw && VALID_TABS.includes(raw as TabKey) ? (raw as TabKey) : "components";
  });

  useEffect(() => {
    const raw = searchParams.get("tab");
    if (raw && VALID_TABS.includes(raw as TabKey)) setTab(raw as TabKey);
  }, [searchParams]);

  const query = useQuery({
    queryKey: ["admin", "marketing", "email-templates"],
    queryFn: emailTemplatesApi.get,
  });

  const data = query.data;
  if (query.isLoading || !data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64 bg-white/5" />
        <Skeleton className="h-10 w-full max-w-xl bg-white/5" />
        <div className="grid gap-3 sm:grid-cols-2">
          <Skeleton className="h-24 bg-white/5" />
          <Skeleton className="h-24 bg-white/5" />
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col gap-4 animate-in fade-in duration-500">
      <div className="pointer-events-none absolute top-10 right-[-5%] z-0 h-[300px] w-[300px] rounded-full bg-white/3 blur-[120px] sm:h-[600px] sm:w-[600px]" />
      <div className="pointer-events-none absolute top-0 left-[-5%] z-0 h-[300px] w-[300px] rounded-full bg-white/3 blur-[120px] sm:h-[600px] sm:w-[600px]" />
      <div className="pointer-events-none absolute top-10 left-[35%] z-0 h-[250px] w-[250px] rounded-full bg-white/3 blur-[120px] sm:h-[500px] sm:w-[500px]" />

      <div className="relative z-10 flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-white">Editor de E-mails</h1>
        <p className="max-w-2xl text-muted-foreground">
          Configure cabeçalho, rodapé e conteúdos reutilizáveis dos e-mails enviados pela loja.
        </p>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)} className="relative z-10">
        <TabsList className={cn("h-auto w-full flex-wrap bg-transparent p-0 sm:w-auto")}>
          <TabsTrigger
            value="components"
            className="flex cursor-pointer items-center gap-2 rounded-md px-4 py-3 text-sm font-medium transition-all duration-200"
          >
            Componentes do e-mail
          </TabsTrigger>
          <TabsTrigger
            value="transactional"
            className="flex cursor-pointer items-center gap-2 rounded-md px-4 py-3 text-sm font-medium transition-all duration-200"
          >
            Atualizações transacionais
          </TabsTrigger>
          <TabsTrigger
            value="abandonedCart"
            className="flex cursor-pointer items-center gap-2 rounded-md px-4 py-3 text-sm font-medium transition-all duration-200"
          >
            Carrinho abandonado
          </TabsTrigger>
          <TabsTrigger
            value="abandonedProduct"
            className="flex cursor-pointer items-center gap-2 rounded-md px-4 py-3 text-sm font-medium transition-all duration-200"
          >
            Abandono de produto
          </TabsTrigger>
        </TabsList>

        <TabsContent value="components" className="space-y-3">
          <p className="text-sm text-white/40">
            Inclusão global: cabeçalho e rodapé aparecem no início e no final de todos os e-mails.
          </p>
          <BlocksGrid blocks={data.catalog.components} />
        </TabsContent>

        <TabsContent value="transactional" className="space-y-3">
          <p className="text-sm text-white/40">
            E-mails de status do pedido (pagamento, entrega, cancelamento e avaliação).
          </p>
          <BlocksGrid blocks={data.catalog.transactional} />
        </TabsContent>

        <TabsContent value="abandonedCart" className="space-y-3">
          <p className="text-sm text-white/40">
            Conteúdo da régua automática de recuperação de carrinho.
          </p>
          <BlocksGrid blocks={data.catalog.abandonedCart} />
        </TabsContent>

        <TabsContent value="abandonedProduct" className="space-y-3">
          <p className="text-sm text-white/40">
            E-mails focados em produtos específicos abandonados no carrinho.
          </p>
          <BlocksGrid blocks={data.catalog.abandonedProduct} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function MarketingEmailsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <MarketingEmailsPageContent />
    </Suspense>
  );
}
