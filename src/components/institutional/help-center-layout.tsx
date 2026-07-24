"use client";

import Link from "next/link";
import { useState } from "react";
import { MessageCircle, Clock, ChevronDown, ExternalLink, Headphones, Mail, HelpCircle, } from "lucide-react";
import { FaDiscord } from "react-icons/fa";
import { RichContent } from "@/components/shared/rich-content";
import { openStorefrontChat } from "@/lib/open-storefront-chat";
import type { HelpLayoutData, HelpChannel } from "@/lib/institutional-layout";
import { cn } from "@/lib/utils";

function ChannelIcon({ icon, className }: { icon: string; className?: string }) {
  const cls = cn("h-6 w-6", className);
  switch (icon) {
    case "discord":
      return <FaDiscord className={cls} />;
    case "mail":
      return <Mail className={cls} />;
    case "headphones":
      return <Headphones className={cls} />;
    case "help":
      return <HelpCircle className={cls} />;
    case "message-circle":
    default:
      return <MessageCircle className={cls} />;
  }
}

function ChannelCard({ channel }: { channel: HelpChannel }) {
  const handleCta = () => {
    if (channel.ctaAction === "chat") {
      const opened = openStorefrontChat();
      if (!opened && channel.ctaHref) {
        window.open(channel.ctaHref, "_blank", "noopener,noreferrer");
      } else if (!opened) {
        window.location.href = "/trust/fale-conosco";
      }
    }
  };

  const isLink = channel.ctaAction === "link" && Boolean(channel.ctaHref);
  const isPrimary = channel.ctaAction === "chat" || channel.id === "chat";

  const buttonClass = cn(
    "inline-flex w-full items-center justify-center gap-2 rounded-md px-4 py-3 text-sm font-medium transition-colors",
    isPrimary
      ? "bg-primary text-white hover:bg-primary/90"
      : "border border-white/15 bg-white/5 text-white hover:bg-white/10"
  );

  return (
    <div className="flex h-full flex-col rounded-xl border border-white/5 bg-transparent backdrop-blur-md p-6 sm:p-8">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <ChannelIcon icon={channel.icon} />
        </div>
        <div className="flex flex-col">
          <h3 className="text-lg font-bold text-white">{channel.title} {channel.responseTime ? (
            <div className="inline-flex w-fit items-center gap-1.5 rounded bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
              <Clock className="h-3.5 w-3.5" />
              {channel.responseTime}
            </div>
          ) : null}</h3>
          <p className="text-sm text-muted-foreground">{channel.description}</p>
        </div>
      </div>

      {channel.features.length > 0 ? (
        <ul className="mt-4 space-y-2.5">
          {channel.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2 text-sm text-white/80">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              {feature}
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-auto pt-6">
        {isLink ? (
          <Link href={channel.ctaHref} target="_blank" rel="noopener noreferrer" className={buttonClass}>
            <ChannelIcon icon={channel.icon} className="h-4 w-4" />
            {channel.ctaLabel}
            <ExternalLink className="h-3.5 w-3.5 opacity-70" />
          </Link>
        ) : (
          <button type="button" onClick={handleCta} className={buttonClass}>
            <MessageCircle className="h-4 w-4" />
            {channel.ctaLabel}
          </button>
        )}
      </div>
    </div>
  );
}

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/10 last:border-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 py-4 text-left"
      >
        <span className="text-sm font-medium text-white sm:text-base">{question}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-white/50 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>
      {open ? <p className="pb-4 text-sm leading-relaxed text-white/65">{answer}</p> : null}
    </div>
  );
}

export function HelpCenterLayout({ title, layout, content, }: { title: string; layout: HelpLayoutData; content?: unknown; }) {
  const hasExtraContent =
    content &&
    typeof content === "object" &&
    Array.isArray((content as { content?: unknown[] }).content) &&
    ((content as { content: unknown[] }).content?.length ?? 0) > 0;

  return (
    <div className="mx-auto max-w-7xl pb-24 lg:pb-12 -mt-32 py-6 md:py-12 relative">
      <div className="absolute top-0 right-[-10%] w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-primary/20 rounded-full blur-[120px] -z-10 pointer-events-none" />
      <div className="absolute top-0 left-[-10%] w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-primary/20 rounded-full blur-[120px] -z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-[-10%] w-[250px] sm:w-[400px] h-[250px] sm:h-[400px] bg-primary/20 rounded-full blur-[120px] -z-10 pointer-events-none" />
      <div className="absolute bottom-0 right-[-10%] w-[250px] sm:w-[400px] h-[250px] sm:h-[400px] bg-primary/20 rounded-full blur-[120px] -z-10 pointer-events-none" />

      <header className="mb-10 text-center sm:mb-14">
        <p className="mb-xs text-xs font-semibold uppercase tracking-widest text-primary">
          {title}
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
          {layout.heroTitle}
        </h1>
        {layout.heroSubtitle ? (
          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {layout.heroSubtitle}
          </p>
        ) : null}
      </header>

      {layout.channels.length > 0 ? (
        <section className="mb-10 rounded-xl border border-white/5 bg-transparent backdrop-blur-md p-4 sm:p-6 lg:p-8">
          <h2 className="mb-6 text-center text-sm font-semibold uppercase tracking-wider text-white/50">
            Canais de Ajuda
          </h2>
          <div
            className={cn(
              "grid gap-4 sm:gap-6",
              layout.channels.length === 1 ? "mx-auto max-w-md" : "sm:grid-cols-2"
            )}
          >
            {layout.channels.map((channel) => (
              <ChannelCard key={channel.id} channel={channel} />
            ))}
          </div>

          {layout.hours ? (
            <div className="mt-8 border-t border-white/10 pt-6">
              <div className="mb-3 flex items-center justify-center gap-2 text-sm font-semibold text-white">
                <Clock className="h-4 w-4 text-primary" />
                {layout.hours.title}
              </div>
              <div className="flex flex-col items-center gap-1 text-center text-sm text-white/60 sm:flex-row sm:justify-center sm:gap-6">
                <span>{layout.hours.weekdays}</span>
                <span className="hidden text-white/20 sm:inline">·</span>
                <span>{layout.hours.weekend}</span>
              </div>
              {layout.hours.timezone ? (
                <p className="mt-2 text-center text-xs text-white/40">{layout.hours.timezone}</p>
              ) : null}
            </div>
          ) : null}
        </section>
      ) : null}

      {layout.faq.length > 0 ? (
        <section className="mb-10">
          <h2 className="mb-4 text-xl font-bold text-white">Perguntas frequentes</h2>
          <div className="rounded-xl border border-white/5 bg-transparent backdrop-blur-md px-5 sm:px-6">
            {layout.faq.map((item) => (
              <FaqItem key={item.question} question={item.question} answer={item.answer} />
            ))}
          </div>
        </section>
      ) : null}

      {hasExtraContent ? (
        <section className="rounded-xl border border-white/5 bg-transparent backdrop-blur-md p-6 sm:p-8">
          <h2 className="mb-4 text-lg font-bold text-white">Mais informações</h2>
          <RichContent content={content} className="text-white/80" />
        </section>
      ) : null}
    </div>
  );
}
