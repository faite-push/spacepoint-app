"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Check, ChevronLeft, Loader2, Save, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Toggle } from "@/components/ui/toggle";

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
      <div className="absolute top-0 right-[-5%] w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-white/2 rounded-full blur-[120px] z-0 pointer-events-none" />
      <div className="absolute top-0 left-[-5%] w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-white/2 rounded-full blur-[120px] z-0 pointer-events-none" />
      <div className="absolute top-0 left-[35%] w-[250px] sm:w-[500px] h-[250px] sm:h-[500px] bg-white/2 rounded-full blur-[120px] z-0 pointer-events-none" />

      <div className="absolute bottom-0 right-[-5%] w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-white/2 rounded-full blur-[120px] z-0 pointer-events-none" />
      <div className="absolute bottom-0 left-[-5%] w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-white/2 rounded-full blur-[120px] z-0 pointer-events-none" />
      <div className="absolute bottom-0 left-[35%] w-[250px] sm:w-[500px] h-[250px] sm:h-[500px] bg-white/2 rounded-full blur-[120px] z-0 pointer-events-none" />

      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon" className="h-9 w-9">
            <Link href="/dashboard/admin/pages/home" aria-label="Voltar">
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
          <section className="rounded-md border border-white/5 bg-transparent">
            <div className="border-b border-white/5 px-4 py-3">
              <h2 className="text-sm font-semibold text-white">Informações</h2>
            </div>

            <div className="grid grid-cols-1 gap-4 py-4 px-4">
              <div className="space-y-2">
                <Label htmlFor="linkUrl">URL de redirecionamento <span className="text-muted-foreground">( Opcional )</span></Label>
                <Input
                  id="linkUrl"
                  placeholder="Ex: https://google.com ou /products/123"
                  className="w-full mt-0.5"
                  {...form.register("linkUrl")}
                />
                {form.formState.errors.linkUrl && (
                  <p className="text-xs text-destructive">{form.formState.errors.linkUrl.message}</p>
                )}
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
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-md border border-white/5 bg-transparent">
            <div className="border-b border-white/5 px-4 py-3">
              <h2 className="text-sm font-semibold text-white">Configurações</h2>
            </div>

            <div className="px-4 py-3">
              <Controller
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <div className="flex items-center gap-2">
                    <Toggle
                      id="cfg-visible"
                      size="sm"
                      pressed={field.value ?? true}
                      onPressedChange={field.onChange}
                    >
                      {field.value ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                    </Toggle>

                    <div className="space-y-0.5">
                      <Label htmlFor="cfg-visible" className="font-medium text-sm cursor-pointer">
                        {field.value ? "Ativo na vitrine" : "Inativo na vitrine"}
                      </Label>
                      <p className="text-xs text-zinc-500">
                        {field.value
                          ? "O banner está ativo na vitrine."
                          : "O banner está inativo e não aparece na vitrine."}
                      </p>
                    </div>
                  </div>
                )}
              />
            </div>
          </section>
        </div>
      </div>
    </form>
  );
};