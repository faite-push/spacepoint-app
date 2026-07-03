"use client";

import { MediaGallery } from "@/components/admin/shared/media-gallery";

export default function GalleryPage() {
  return (
    <div className="relative flex flex-col gap-6">
      <div className="absolute top-0 right-[-5%] w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-white/3 rounded-full blur-[120px] z-0 pointer-events-none" />
      <div className="absolute top-0 left-[-5%] w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-white/3 rounded-full blur-[120px] z-0 pointer-events-none" />
      <div className="absolute top-0 left-[35%] w-[250px] sm:w-[500px] h-[250px] sm:h-[500px] bg-white/3 rounded-full blur-[120px] z-0 pointer-events-none" />

      <div className="absolute bottom-0 right-[-5%] w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-white/3 rounded-full blur-[120px] z-0 pointer-events-none" />
      <div className="absolute bottom-0 left-[-5%] w-[300px] sm:w-[600px] h-[300px] sm:h-[600px] bg-white/3 rounded-full blur-[120px] z-0 pointer-events-none" />
      <div className="absolute bottom-0 left-[35%] w-[250px] sm:w-[500px] h-[250px] sm:h-[500px] bg-white/3 rounded-full blur-[120px] z-0 pointer-events-none" />
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-white">Galeria de Mídia</h1>
        <p className="text-muted-foreground">
          Gerencie todas as imagens carregadas no sistema.
        </p>
      </div>

      <div className="rounded-md border border-white/5 bg-black/5 p-6 h-[calc(100vh-200px)]">
        <MediaGallery allowMultiple maxSelections={100} />
      </div>
    </div>
  );
}
