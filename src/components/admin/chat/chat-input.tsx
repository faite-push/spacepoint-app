'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Image as ImageIcon, Trash2, Paperclip } from 'lucide-react';
import { RiImageAddLine } from "react-icons/ri";
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  message: string;
  onMessageChange: (value: string) => void;
  file: File | null;
  onFileChange: (file: File | null) => void;
  onSend: () => void;
  isSending?: boolean;
  placeholder?: string;
  maxLength?: number;
  showMacroHint?: boolean;
  onMacroTrigger?: (show: boolean) => void;
  className?: string;
}

export function ChatInput({ message, onMessageChange, file, onFileChange, onSend, isSending = false, placeholder = 'Digite sua mensagem...', maxLength = 1000, showMacroHint = false, onMacroTrigger, className, }: ChatInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleFileSelect = (selected: File | null) => {
    if (!selected) return;
    if (!selected.type.startsWith('image/')) return;
    if (selected.size > 5 * 1024 * 1024) return;
    onFileChange(selected);
  };

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current += 1;
    if (e.dataTransfer.types.includes('Files')) setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) handleFileSelect(dropped);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isSending && (message.trim() || file)) onSend();
    }
  };

  return (
    <div className={cn('relative', className)} onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop}>
      {isDragging && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm rounded-md border-2 border-dashed border-primary/50 pointer-events-none">
          <p className="text-xl font-medium text-white">
            Solte a imagem para enviar 📷
          </p>
        </div>
      )}

      <div className="border border-white/10 rounded-md bg-white/[0.02] overflow-hidden">
        {previewUrl && (
          <div className="flex items-start gap-3 p-3 border-b border-white/5">
            <div className="relative group">
              <img
                src={previewUrl}
                alt="Preview"
                className="h-20 w-20 rounded-md object-cover border border-white/10"
              />
            </div>
            <button
              type="button"
              onClick={() => onFileChange(null)}
              className="mt-1 p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-md transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="flex items-center justify-center gap-2 px-2 py-2">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
          />
          <Button
            type="button"
            size="icon"
            className="h-10 w-10 bg-amber-500/15 hover:bg-amber-500/10 text-amber-400"
            onClick={() => fileInputRef.current?.click()}
          >
            <RiImageAddLine className="h-4 w-4" />
          </Button>

          <div className="flex-1 relative">
            <Textarea
              placeholder={placeholder}
              value={message}
              onChange={(e) => {
                const val = e.target.value;
                onMessageChange(val);
                if (showMacroHint && onMacroTrigger) {
                  onMacroTrigger(val.startsWith('!'));
                }
              }}
              className="min-h-[40px] max-h-[220px] overflow-y-auto resize-none border-0 bg-transparent"
              onKeyDown={handleKeyDown}
              maxLength={maxLength}
            />
            <span className="absolute bottom-2 right-2 text-[10px] text-zinc-600">
              {message.length} / {maxLength}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
