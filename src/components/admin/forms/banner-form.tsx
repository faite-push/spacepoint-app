"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ImageUpload } from "@/components/admin/shared/image-upload";
import { bannersApi, type Banner } from "@/lib/admin-api";

const bannerSchema = z.object({
  imageUrl: z.string().min(1, "A imagem é obrigatória"),
  linkUrl: z.string().url("URL inválida").nullable().optional().or(z.literal("")),
  isActive: z.boolean(),
});

type BannerFormValues = z.infer<typeof bannerSchema>;

interface BannerFormProps {
  banner?: Banner | null;
}

export function BannerForm({ banner }: BannerFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEditing = !!banner;

  const form = useForm<BannerFormValues>({
    resolver: zodResolver(bannerSchema),
    values: banner ? {
      imageUrl: banner.imageUrl,
      linkUrl: banner.linkUrl ?? "",
      isActive: banner.isActive,
    } : {
      imageUrl: "",
      linkUrl: "",
      isActive: true,
    },
    resetOptions: { keepDirtyValues: true }
  });

  const mutation = useMutation({
    mutationFn: (values: BannerFormValues) => {
      const payload = {
        ...values,
        linkUrl: values.linkUrl || null,
      };
      return isEditing && banner
        ? bannersApi.update(banner.id, payload)
        : bannersApi.create(payload);
    },
    onSuccess: () => {
      toast.success(isEditing ? "Banner atualizado" : "Banner criado");
      queryClient.invalidateQueries({ queryKey: ["admin", "banners"] });
      router.push("/dashboard/admin/banners");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const onSubmit = (values: BannerFormValues) => mutation.mutate(values);

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" className="h-9 w-9">
            <Link href="/dashboard/admin/banners" aria-label="Voltar">
              <ChevronLeft className="h-4 w-4 text-white" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              {isEditing ? "Editar Banner" : "Novo Banner"}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" className="px-5 py-4 cursor-pointer" onClick={() => router.push("/dashboard/admin/banners")}>
            Cancelar
          </Button>
          <Button type="submit" disabled={mutation.isPending} className="gap-2 px-5 py-4 cursor-pointer">
            {mutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4 hidden" />
            )}
            {isEditing ? "Salvar alterações" : "Criar banner"}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
        <div className="space-y-6">
          <section className="rounded-xl border border-white/10 bg-card p-6 space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-white">Arte</h2>
              <p className="text-xs text-muted-foreground">Imagem que aparecerá na vitrine principal.</p>
            </div>
            <div className="space-y-2">
              <Controller
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <ImageUpload
                    value={field.value}
                    onChange={field.onChange}
                    aspectRatio="banner"
                    uploadType="banner"
                    recommendation="Recomendado: 1920x600px ou formato ultra-wide. (máx. 10MB)"
                  />
                )}
              />
              {form.formState.errors.imageUrl && (
                <p className="text-xs text-destructive">{form.formState.errors.imageUrl.message}</p>
              )}
            </div>
          </section>

          <section className="rounded-xl border border-white/10 bg-card p-6 space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-white">Link (Opcional)</h2>
              <p className="text-xs text-muted-foreground">URL para onde o usuário será levado se clicar.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="linkUrl">URL de redirecionamento</Label>
              <input
                id="linkUrl"
                placeholder="Ex: https://google.com ou /products/123"
                className="w-full rounded-lg mt-1 border border-white/10 bg-card px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:border-primary focus:outline-none focus:ring-none transition-all duration-300"
                {...form.register("linkUrl")}
              />
              {form.formState.errors.linkUrl && (
                <p className="text-xs text-destructive">{form.formState.errors.linkUrl.message}</p>
              )}
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-xl border border-white/10 bg-card p-6 space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Status</h2>
              <p className="text-xs text-muted-foreground">Controle a exibição.</p>
            </div>
            <Controller
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Ativo na vitrine</Label>
                    <p className="text-xs text-zinc-500">Banners inativos ficam ocultos.</p>
                  </div>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </div>
              )}
            />
          </section>
        </div>
      </div>
    </form>
  );
}
