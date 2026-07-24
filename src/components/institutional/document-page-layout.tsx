"use client";

import { useMemo } from "react";
import { RichContent } from "@/components/shared/rich-content";
import type { DocumentLayoutData } from "@/lib/institutional-layout";

type TipTapNode = {
  type?: string;
  attrs?: { level?: number };
  content?: TipTapNode[];
  text?: string;
};

function extractText(node?: TipTapNode): string {
  if (!node) return "";
  if (node.text) return node.text;
  if (!node.content) return "";
  return node.content.map(extractText).join("");
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function extractHeadings(content: unknown): { id: string; text: string; level: number }[] {
  const doc = content as TipTapNode | null;
  if (!doc?.content || !Array.isArray(doc.content)) return [];

  return doc.content
    .filter((n) => n.type === "heading" && (n.attrs?.level === 2 || n.attrs?.level === 3))
    .map((n) => {
      const text = extractText(n).trim();
      return {
        id: slugify(text),
        text,
        level: n.attrs?.level ?? 2,
      };
    })
    .filter((h) => h.text && h.id);
}

function contentWithHeadingIds(content: unknown): unknown {
  const doc = content as TipTapNode | null;
  if (!doc?.content || !Array.isArray(doc.content)) return content;

  return {
    ...doc,
    content: doc.content.map((node) => {
      if (node.type !== "heading") return node;
      const text = extractText(node).trim();
      if (!text) return node;
      return {
        ...node,
        attrs: {
          ...(node.attrs || {}),
          id: slugify(text),
        },
      };
    }),
  };
}

export function DocumentPageLayout({
  title,
  layout,
  content,
}: {
  title: string;
  layout: DocumentLayoutData;
  content?: unknown;
}) {
  const headings = useMemo(() => extractHeadings(content), [content]);
  const enrichedContent = useMemo(() => contentWithHeadingIds(content), [content]);
  const showToc = layout.showToc && headings.length > 1;

  return (
    <div className="mx-auto max-w-5xl py-8 sm:py-12">
      <header className="mb-10 max-w-3xl">
        {layout.eyebrow ? (
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-primary">
            {layout.eyebrow}
          </p>
        ) : null}
        <h1 className="text-3xl font-black tracking-tight text-white sm:text-2xl">{title}</h1>
        {layout.intro ? (
          <p className="mt-4 text-sm leading-relaxed text-white/60 sm:text-base">{layout.intro}</p>
        ) : null}
        {layout.updatedLabel ? (
          <p className="mt-3 text-xs text-white/40">{layout.updatedLabel}</p>
        ) : null}
      </header>

      <div className={showToc ? "lg:grid lg:grid-cols-[220px_1fr] lg:gap-10" : undefined}>
        {showToc ? (
          <aside className="mb-8 hidden lg:block">
            <nav className="sticky top-36 space-y-1 rounded-2xl border border-white/10 bg-[#0c0c0c] p-4">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-white/40">
                Nesta página
              </p>
              {headings.map((h) => (
                <a
                  key={h.id}
                  href={`#${h.id}`}
                  className={`block rounded-md px-2 py-1.5 text-sm text-white/60 transition-colors hover:bg-white/5 hover:text-white ${
                    h.level === 3 ? "pl-4 text-xs" : ""
                  }`}
                >
                  {h.text}
                </a>
              ))}
            </nav>
          </aside>
        ) : null}

        <article className="max-w-3xl rounded-2xl border border-white/10 bg-[#0c0c0c]/60 p-6 sm:p-8">
          {content ? (
            <RichContent content={enrichedContent} className="text-white/80" />
          ) : (
            <p className="text-sm italic text-white/50">Conteúdo em breve.</p>
          )}
        </article>
      </div>
    </div>
  );
}
