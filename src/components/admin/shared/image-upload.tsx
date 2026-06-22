"use client";

import { useRef, useState } from "react";
import { UploadCloud, X, Loader2, Library } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { API_URL, getCsrfToken } from "@/lib/api";
import { cn } from "@/lib/utils";
import { MediaLibraryModal } from "./media-library-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ImageUploadProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  recommendation?: string;
  aspectRatio?: "portrait" | "banner" | "square" | "video" | "auto" | "product";
  uploadType?: "banner" | "product" | "general";
  className?: string;
  disabled?: boolean;
}

const ASPECT = {
  portrait: "aspect-[190/255]",
  banner: "aspect-[412/90]",
  square: "aspect-square",
  video: "aspect-video",
  product: "aspect-[190/255]",
  auto: "min-h-[200px] h-auto w-full",
} as const;

export function ImageUpload({ value, onChange, recommendation, aspectRatio = "square", uploadType = "general", className, disabled, }: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Arquivo deve ser uma imagem");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Imagem maior que 10MB");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", uploadType);

      const res = await fetch(`${API_URL}/v1/cdn/upload`, {
        method: "POST",
        credentials: "include",
        headers: { "X-CSRF-Token": getCsrfToken() },
        body: formData,
      });
      if (!res.ok) throw new Error("Falha no upload");
      const data = await res.json();
      onChange(data.url);
      toast.success("Imagem enviada");
    } catch (err) {
      console.error(err);
      toast.error("Erro no upload da imagem");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={cn("relative w-full", className)}>
      <Input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
        disabled={disabled || uploading}
      />

      <div
        onClick={() => !disabled && !uploading && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
        }}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files?.[0];
          if (f) handleFile(f);
        }}
        className={cn(
          "group relative w-full overflow-hidden rounded-xl border border-dashed border-white/15 bg-white/[0.02] transition-colors",
          !disabled && !uploading && "cursor-pointer hover:border-primary/50 hover:bg-white/[0.04]",
          ASPECT[aspectRatio]
        )}
      >
        {value ? (
          <>
            {aspectRatio === "auto" ? (
              <img
                src={value}
                alt="Preview"
                className="h-auto w-full object-contain"
              />
            ) : (
              <Image
                src={value}
                alt="Preview"
                fill
                className="object-cover"
                sizes="400px"
                unoptimized
              />
            )}
            <div className="absolute right-2 top-2 flex flex-col gap-2 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(null);
                }}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white transition-hover hover:bg-red-500"
                aria-label="Remover"
              >
                <X className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setLibraryOpen(true);
                }}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white transition-hover hover:bg-primary"
                aria-label="Trocar imagem"
              >
                <Library className="h-4 w-4" />
              </button>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
            {uploading ? (
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            ) : (
              <UploadCloud className="h-8 w-8 text-zinc-500" />
            )}
            <div className="flex flex-col gap-1">
              <p className="text-sm text-zinc-300">
                <span className="text-primary">Arraste</span> ou{" "}
                <span className="text-primary">selecione</span>
              </p>
              <Button
                type="button"
                variant="link"
                onClick={(e) => {
                  e.stopPropagation();
                  setLibraryOpen(true);
                }}
                className="text-xs text-zinc-500 hover:text-primary transition-colors flex items-center justify-center gap-1.5"
              >
                Abrir biblioteca
              </Button>
            </div>
            {recommendation && (
              <p className="text-xs text-zinc-500">{recommendation}</p>
            )}
          </div>
        )}
      </div>

      <MediaLibraryModal
        isOpen={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        onSelect={(urls) => {
          if (urls.length > 0) onChange(urls[0]);
        }}
      />
    </div>
  );
}
