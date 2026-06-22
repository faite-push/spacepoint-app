import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { MediaGallery } from "./media-gallery";

interface MediaLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (urls: string[]) => void;
  maxSelections?: number;
  allowMultiple?: boolean;
}

export function MediaLibraryModal({
  isOpen,
  onClose,
  onSelect,
  maxSelections = 1,
  allowMultiple = false,
}: MediaLibraryModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl font-bold text-white">Galeria</DialogTitle>
              <p className="text-sm text-zinc-500 mt-1">Adicione e gerencie imagens</p>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 min-h-0 pt-2">
          <MediaGallery
            onSelect={(urls) => {
              onSelect(urls);
              onClose();
            }}
            maxSelections={maxSelections}
            allowMultiple={allowMultiple}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}