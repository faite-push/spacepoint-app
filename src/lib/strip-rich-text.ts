/**
 * Extrai texto limpo de conteúdo TipTap/ProseMirror (JSON), HTML ou string.
 * Ignora nomes de nós (doc, heading, paragraph, etc.) e marks (bold, italic).
 */
export function stripRichText(value: unknown): string {
  if (value == null) return "";

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return "";

    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
      try {
        return stripRichText(JSON.parse(trimmed));
      } catch {
        // não é JSON válido — trata como HTML/texto
      }
    }

    return trimmed.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  }

  if (Array.isArray(value)) {
    return value
      .map(stripRichText)
      .filter(Boolean)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
  }

  if (typeof value === "object") {
    const node = value as Record<string, unknown>;

    // Nó de texto TipTap: { type: "text", text: "..." }
    if (typeof node.text === "string") {
      return node.text;
    }

    // Documento/bloco TipTap: { type: "doc"|"paragraph"|..., content: [...] }
    if (Array.isArray(node.content)) {
      return stripRichText(node.content);
    }

    return "";
  }

  return "";
}
