'use client';

import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Send, Trash2 } from 'lucide-react';
import { RiImageAddLine } from 'react-icons/ri';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  message: string;
  onMessageChange: (value: string) => void;
  files: File[];
  onFilesChange: (files: File[]) => void;
  onSend: () => void;
  isSending?: boolean;
  placeholder?: string;
  maxLength?: number;
  showMacroHint?: boolean;
  onMacroTrigger?: (show: boolean) => void;
  className?: string;
  typingIndicator?: React.ReactNode;
}

export function ChatInput({
  message,
  onMessageChange,
  files,
  onFilesChange,
  onSend,
  isSending = false,
  placeholder = 'Digite sua mensagem...',
  maxLength = 1000,
  showMacroHint = false,
  onMacroTrigger,
  className,
  typingIndicator,
}: ChatInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  useEffect(() => {
    const urls = files.map((f) => URL.createObjectURL(f));
    setPreviewUrls(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  const resizeTextarea = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = '40px';
    el.style.height = `${Math.min(el.scrollHeight, 220)}px`;
  }, []);

  useEffect(() => {
    resizeTextarea();
  }, []);

  const handleMessageChange = (val: string) => {
    onMessageChange(val);
    requestAnimationFrame(() => resizeTextarea());
    if (showMacroHint && onMacroTrigger) {
      onMacroTrigger(val.startsWith('!'));
    }
  };

  const addFiles = (incoming: FileList | File[]) => {
    const list = Array.from(incoming).filter(
      (f) => f.type.startsWith('image/') && f.size <= 5 * 1024 * 1024
    );
    if (!list.length) return;
    const merged = [...files];
    for (const f of list) {
      if (merged.length >= 10) break;
      if (!merged.some((x) => x.name === f.name && x.size === f.size)) {
        merged.push(f);
      }
    }
    onFilesChange(merged);
  };

  const removeFile = (index: number) => {
    onFilesChange(files.filter((_, i) => i !== index));
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

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDragging(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  }, [files]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isSending && (message.trim() || files.length)) onSend();
    }
  };

  return (
    <div
      className={cn('relative', className)}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm rounded-md border-2 border-dashed border-primary/50 pointer-events-none">
          <p className="text-xl font-medium text-white">Solte as imagens para enviar 📷</p>
        </div>
      )}

      {typingIndicator && (
        <div className="px-1 pb-2">{typingIndicator}</div>
      )}

      <div className="border border-white/10 rounded-md bg-white/[0.02] overflow-hidden">
        {previewUrls.length > 0 && (
          <div className="flex flex-wrap gap-2 p-3 border-b border-white/5">
            {previewUrls.map((url, i) => (
              <div key={url} className="relative group">
                <img
                  src={url}
                  alt={`Preview ${i + 1}`}
                  className="h-20 w-20 rounded-md object-cover border border-white/10"
                />
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="absolute -top-1 -right-1 p-1 bg-red-500 rounded-full text-white hover:bg-red-600"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-end gap-2 px-2 py-2">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            multiple
            onChange={(e) => {
              if (e.target.files?.length) addFiles(e.target.files);
              e.target.value = '';
            }}
          />
          <Button
            type="button"
            size="icon"
            className="h-10 w-10 shrink-0 bg-amber-500/15 hover:bg-amber-500/10 text-amber-400"
            onClick={() => fileInputRef.current?.click()}
          >
            <RiImageAddLine className="h-4 w-4" />
          </Button>

          <div className="flex-1 relative min-w-0">
            <Textarea
              ref={textareaRef}
              placeholder={placeholder}
              value={message}
              onChange={(e) => handleMessageChange(e.target.value)}
              className="min-h-[40px] max-h-[220px] overflow-y-auto resize-none border-0 bg-transparent py-2.5 whitespace-pre-wrap"
              onKeyDown={handleKeyDown}
              maxLength={maxLength}
              rows={1}
            />
          </div>

          <Button
            type="button"
            size="icon"
            className="md:hidden flex h-10 w-10 shrink-0 bg-primary text-black hover:bg-primary/90 disabled:opacity-40"
            onClick={onSend}
            disabled={isSending || (!message.trim() && !files.length)}
            aria-label="Enviar mensagem"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
