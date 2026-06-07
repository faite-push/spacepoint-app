"use client";

import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Image from "@tiptap/extension-image";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import { cn } from "@/lib/utils";

interface RichContentProps {
  content: any;
  className?: string;
}

export function RichContent({ content, className }: RichContentProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      Link.configure({
        openOnClick: true,
        HTMLAttributes: { class: "text-primary underline hover:text-primary/80 transition-colors" },
      }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Image.configure({ HTMLAttributes: { class: "rounded-lg my-4 max-w-full" } }),
      TextStyle,
      Color,
    ],
    content: content ?? "",
    editable: false,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-invert max-w-none",
          "prose-headings:font-bold prose-headings:text-white prose-headings:tracking-tight",
          "prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg",
          "prose-p:text-white/70 prose-p:leading-relaxed",
          "prose-strong:text-white prose-strong:font-semibold",
          "prose-em:text-white/80",
          "prose-a:text-primary prose-a:no-underline hover:prose-a:underline",
          "prose-blockquote:border-l-primary prose-blockquote:text-white/60 prose-blockquote:bg-white/[0.02] prose-blockquote:rounded-r-lg prose-blockquote:py-1",
          "prose-code:text-primary prose-code:bg-white/10 prose-code:px-1.5 prose-code:rounded prose-code:text-sm",
          "prose-ul:text-white/70 prose-ol:text-white/70",
          "prose-li:marker:text-primary",
          "prose-hr:border-white/10",
          "focus:outline-none",
          className
        ),
      },
    },
  });
  
  // Update content when it changes
  useEffect(() => {
    if (editor && content) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) return null;

  return <EditorContent editor={editor} />;
}
