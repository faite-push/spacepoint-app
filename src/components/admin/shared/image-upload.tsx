"use client";

import { useRef, useState } from "react";
import { UploadCloud, X, Loader2 } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { API_URL, getCsrfToken } from "@/lib/api";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  recommendation?: string;
  aspectRatio?: "portrait" | "banner" | "square" | "video" | "auto";
  uploadType?: "banner" | "product" | "general";
  className?: string;
  disabled?: boolean;
}

const ASPECT = {
  portrait: "aspect-[190/255]",
  banner: "aspect-[412/90]",
  square: "aspect-square",
  video: "aspect-video",
  auto: "min-h-[200px] h-auto w-full",
} as const;

export function ImageUpload({
  value,
  onChange,
  recommendation,
  aspectRatio = "square",
  uploadType = "general",
  className,
  disabled,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

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
      <input
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
              // eslint-disable-next-line @next/next/no-img-element
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
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange(null);
              }}
              className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-white opacity-0 transition-opacity group-hover:opacity-100"
              aria-label="Remover"
            >
              <X className="h-4 w-4" />
            </button>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
            {uploading ? (
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            ) : (
              <UploadCloud className="h-8 w-8 text-zinc-500" />
            )}
            <p className="text-sm text-zinc-300">
              <span className="text-primary">Arraste</span> ou{" "}
              <span className="text-primary">selecione</span>
            </p>
            {recommendation && (
              <p className="text-xs text-zinc-500">{recommendation}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
