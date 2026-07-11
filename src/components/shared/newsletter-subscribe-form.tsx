"use client";

import { useState } from "react";
import { toast } from "sonner";
import { subscribeNewsletter, type NewsletterSource } from "@/lib/newsletter-api";

type NewsletterSubscribeFormProps = {
  source: NewsletterSource;
  placeholder: string;
  buttonLabel: string;
  className?: string;
  inputClassName?: string;
  buttonClassName?: string;
  buttonStyle?: React.CSSProperties;
  layout?: "stacked" | "inline";
};

export function NewsletterSubscribeForm({
  source,
  placeholder,
  buttonLabel,
  className,
  inputClassName,
  buttonClassName,
  buttonStyle,
  layout = "stacked",
}: NewsletterSubscribeFormProps) {
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;

    const form = e.currentTarget;
    const email = String(new FormData(form).get("email") ?? "").trim();
    if (!email) return;

    setLoading(true);
    try {
      const result = await subscribeNewsletter(email, source);
      toast.success(result.message);
      form.reset();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Não foi possível concluir a inscrição.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  const isInline = layout === "inline";

  return (
    <form
      onSubmit={handleSubmit}
      className={
        className ??
        (isInline
          ? "flex items-center gap-2 rounded-full bg-white/10 p-1.5 ring-1 ring-white/20"
          : "mx-auto mt-6 flex max-w-xl flex-col gap-3 sm:flex-row sm:items-center")
      }
    >
      <input
        name="email"
        type="email"
        placeholder={placeholder}
        disabled={loading}
        className={
          inputClassName ??
          (isInline
            ? "flex-1 bg-transparent px-4 py-2 text-sm text-white placeholder:text-white/60 focus:outline-none min-w-0 disabled:opacity-60"
            : "flex-1 md:h-12 rounded-md border border-white/10 bg-transparent px-5 py-4 text-sm text-white placeholder:text-white/50 focus:border-primary/40 focus:outline-none transition-all duration-300 disabled:opacity-60")
        }
        required
      />
      <button
        type="submit"
        disabled={loading}
        style={buttonStyle}
        className={
          buttonClassName ??
          (isInline
            ? "shrink-0 rounded-full bg-white/95 px-4 py-2 text-sm font-semibold transition-colors hover:bg-white sm:px-5 disabled:opacity-60"
            : "h-12 shrink-0 rounded-md bg-primary px-6 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-60")
        }
      >
        {loading ? "Enviando..." : buttonLabel}
      </button>
    </form>
  );
}
