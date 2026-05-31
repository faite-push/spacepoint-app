"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { bannersApi } from "@/lib/admin-api";
import { BannerForm } from "@/components/admin/forms/banner-form";

export default function EditBannerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { data: resp, isLoading } = useQuery({
    // Our list endpoint returns `{ banners: Banner[] }`.
    // It is simpler to fetch the list and find the banner.
    queryKey: ["admin", "banners"],
    queryFn: () => bannersApi.list(),
  });

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  const banner = resp?.banners.find((b) => b.id === id);

  if (!banner && resp?.banners) {
    return (
      <div className="flex h-[400px] flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Banner não encontrado.</p>
      </div>
    );
  }

  return <BannerForm banner={banner} />;
}
