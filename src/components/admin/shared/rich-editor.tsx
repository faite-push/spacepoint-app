"use client";

import { useEditor, EditorContent, type Editor, type Content } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Image from "@tiptap/extension-image";
import Placeholder from "@tiptap/extension-placeholder";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { useEffect, useState } from "react";
import { Bold, Italic, Underline as UnderlineIcon, Strikethrough, Heading1, Heading2, List, ListOrdered, Quote, Minus, Link as LinkIcon, Image as ImageIcon, AlignLeft, AlignCenter, AlignRight, AlignJustify, Undo, Redo, Code, RemoveFormatting, Palette, } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { API_URL, getCsrfToken } from "@/lib/api";
import { toast } from "sonner";
import { MediaLibraryModal } from "./media-library-modal";

interface RichEditorProps {
  value?: Content;
  onChange: (value: any) => void;
  placeholder?: string;
  className?: string;
  minHeight?: number;
}

export function RichEditor({
  value,
  onChange,
  placeholder = "Escreva aqui...",
  className,
  minHeight = 240,
}: RichEditorProps) {
  const [libraryOpen, setLibraryOpen] = useState(false);
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: {
          openOnClick: false,
          autolink: true,
          HTMLAttributes: { class: "text-primary underline" },
        }
      }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Image.configure({ HTMLAttributes: { class: "rounded-md my-2" } }),
      Placeholder.configure({ placeholder }),
      TextStyle,
      Color,
    ],
    content: value ?? "",
    immediatelyRender: false,
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getJSON());
    },
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-invert max-w-none focus:outline-none px-4 py-3",
          "prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg",
          "prose-a:text-primary prose-strong:text-white",
          "prose-blockquote:border-l-primary prose-blockquote:text-zinc-300",
          "prose-code:text-primary prose-code:bg-white/10 prose-code:px-1 prose-code:rounded"
        ),
      },
    },
  });

  useEffect(() => {
    if (!editor || value === undefined) return;

    const currentJSON = editor.getJSON();
    const valueJSON = typeof value === 'string' ? value : JSON.stringify(value);

    if (JSON.stringify(currentJSON) !== valueJSON && JSON.stringify(value) !== "{}") {
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [editor, value]);

  if (!editor) return null;

  return (
    <div
      className={cn(
        "rounded-md border border-input bg-card p-2 overflow-hidden flex flex-col",
        className
      )}
    >
      <EditorToolbar editor={editor} onOpenLibrary={() => setLibraryOpen(true)} />
      <div
        style={{ minHeight }}
        className="rounded-md cursor-text flex-1 border max-h-[240px] overflow-y-auto border-input bg-card mt-2"
        onClick={() => editor.commands.focus()}
      >
        <EditorContent editor={editor} />
      </div>

      <MediaLibraryModal
        isOpen={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        onSelect={(urls) => {
          urls.forEach((url) => {
            editor.chain().focus().setImage({ src: url }).run();
          });
        }}
        allowMultiple
        maxSelections={10}
      />
    </div>
  );
}

const ToolbarBtn = ({
  onClick,
  active,
  disabled,
  children,
  label,
}: {
  onClick: () => any;
  active?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  label: string;
}) => (
  <Tooltip>
    <TooltipTrigger
      render={
        <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          aria-label={label}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded cursor-pointer text-zinc-300 transition-colors",
            active && "bg-primary text-white",
            !active && "hover:bg-white/10 hover:text-white",
            disabled && "opacity-30 pointer-events-none"
          )}
        >
          {children}
        </button>
      }>
    </TooltipTrigger>
    <TooltipContent side="top">
      {label}
    </TooltipContent>
  </Tooltip>
);

const Sep = () => <span className="mx-1 h-5 w-px bg-white/10" />;

function EditorToolbar({ editor, onOpenLibrary }: { editor: Editor, onOpenLibrary: () => void }) {
  const handleSetLink = () => {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL do link:", prev || "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <div className="flex flex-wrap rounded-md items-center gap-0.5 border border-input bg-transparent p-2">
      <ToolbarBtn
        label="Negrito"
        onClick={() => editor.chain().focus().toggleBold().run()}
        active={editor.isActive("bold")}
      >
        <Bold className="h-4 w-4" />
      </ToolbarBtn>

      <ToolbarBtn
        label="Itálico"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        active={editor.isActive("italic")}
      >
        <Italic className="h-4 w-4" />
      </ToolbarBtn>

      <ToolbarBtn
        label="Sublinhado"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        active={editor.isActive("underline")}
      >
        <UnderlineIcon className="h-4 w-4" />
      </ToolbarBtn>

      <ToolbarBtn
        label="Tachado"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        active={editor.isActive("strike")}
      >
        <Strikethrough className="h-4 w-4" />
      </ToolbarBtn>

      <Sep />

      <ToolbarBtn
        label="Título 1"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        active={editor.isActive("heading", { level: 1 })}
      >
        <Heading1 className="h-4 w-4" />
      </ToolbarBtn>

      <ToolbarBtn
        label="Título 2"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        active={editor.isActive("heading", { level: 2 })}
      >
        <Heading2 className="h-4 w-4" />
      </ToolbarBtn>

      <Sep />

      <ToolbarBtn
        label="Lista"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        active={editor.isActive("bulletList")}
      >
        <List className="h-4 w-4" />
      </ToolbarBtn>

      <ToolbarBtn
        label="Lista ordenada"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        active={editor.isActive("orderedList")}
      >
        <ListOrdered className="h-4 w-4" />
      </ToolbarBtn>

      <ToolbarBtn
        label="Citação"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        active={editor.isActive("blockquote")}
      >
        <Quote className="h-4 w-4" />
      </ToolbarBtn>

      <ToolbarBtn
        label="Linha horizontal"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
      >
        <Minus className="h-4 w-4" />
      </ToolbarBtn>

      <ToolbarBtn
        label="Código"
        onClick={() => editor.chain().focus().toggleCode().run()}
        active={editor.isActive("code")}
      >
        <Code className="h-4 w-4" />
      </ToolbarBtn>

      <Sep />

      <ToolbarBtn
        label="Alinhar à esquerda"
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
        active={editor.isActive({ textAlign: "left" })}
      >
        <AlignLeft className="h-4 w-4" />
      </ToolbarBtn>

      <ToolbarBtn
        label="Centralizar"
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
        active={editor.isActive({ textAlign: "center" })}
      >
        <AlignCenter className="h-4 w-4" />
      </ToolbarBtn>

      <ToolbarBtn
        label="Alinhar à direita"
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
        active={editor.isActive({ textAlign: "right" })}
      >
        <AlignRight className="h-4 w-4" />
      </ToolbarBtn>

      <ToolbarBtn
        label="Justificar"
        onClick={() => editor.chain().focus().setTextAlign("justify").run()}
        active={editor.isActive({ textAlign: "justify" })}
      >
        <AlignJustify className="h-4 w-4" />
      </ToolbarBtn>

      <Sep />

      <ToolbarBtn label="Inserir link" onClick={handleSetLink}>
        <LinkIcon className="h-4 w-4" />
      </ToolbarBtn>

      <ToolbarBtn label="Inserir imagem" onClick={onOpenLibrary}>
        <ImageIcon className="h-4 w-4" />
      </ToolbarBtn>

      <Sep />

      <div className="flex items-center gap-1.5 px-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <label
              htmlFor="text-color"
              className="cursor-pointer text-zinc-300 hover:text-white transition-colors"
            >
              <Palette className="h-4 w-4" />
            </label>
          </TooltipTrigger>
          <TooltipContent side="top">Cor do texto</TooltipContent>
        </Tooltip>
        <input
          id="text-color"
          type="color"
          className="h-6 w-6 cursor-pointer rounded-sm border-none bg-transparent p-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-sm [&::-webkit-color-swatch]:border border-white/10"
          value={editor.getAttributes("textStyle").color || "#ffffff"}
          onInput={(e) => {
            editor.chain().focus().setColor((e.target as HTMLInputElement).value).run();
          }}
        />
      </div>

      <Sep />

      <ToolbarBtn
        label="Limpar formatação"
        onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().unsetColor().run()}
      >
        <RemoveFormatting className="h-4 w-4" />
      </ToolbarBtn>

      <div className="ml-auto flex items-center gap-0.5">
        <ToolbarBtn
          label="Desfazer"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
        >
          <Undo className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn
          label="Refazer"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
        >
          <Redo className="h-4 w-4" />
        </ToolbarBtn>
      </div>
    </div>
  );
}