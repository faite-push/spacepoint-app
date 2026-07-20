"use client";

import { use } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { notFound } from "next/navigation";

import { Skeleton } from "@/components/ui/skeleton";
import { EmailBlockEditor } from "@/components/admin/marketing/email-block-editor";
import { emailTemplatesApi } from "@/lib/admin-api";
import { EMAILS_BASE, catalogTabForBlock, findEmailBlockBySlug, } from "@/lib/marketing-email-routes";

type Props = {
  params: Promise<{ slug: string }>;
};

export default function EmailTemplateEditorPage({ params }: Props) {
  const { slug } = use(params);
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["admin", "marketing", "email-templates"],
    queryFn: emailTemplatesApi.get,
  });

  if (query.isLoading || !query.data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64 bg-white/5" />
        <Skeleton className="h-[420px] w-full bg-white/5" />
      </div>
    );
  }

  const block = findEmailBlockBySlug(query.data.catalog, slug);
  if (!block) {
    notFound();
    return null;
  }

  const backHref = `${EMAILS_BASE}?tab=${catalogTabForBlock(block)}`;

  return (
    <div className="relative animate-in fade-in duration-300">
      <EmailBlockEditor
        block={block}
        data={query.data}
        onBackHref={backHref}
        onSaved={(next) => {
          queryClient.setQueryData(["admin", "marketing", "email-templates"], next);
        }}
      />
    </div>
  );
}
