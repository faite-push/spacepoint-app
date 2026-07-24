export type HelpChannel = {
  id: string;
  icon: string;
  title: string;
  description: string;
  responseTime: string;
  features: string[];
  ctaLabel: string;
  ctaAction: "chat" | "link";
  ctaHref: string;
};

export type HelpFaqItem = {
  question: string;
  answer: string;
};

export type HelpHours = {
  title: string;
  weekdays: string;
  weekend: string;
  timezone: string;
};

export type HelpLayoutData = {
  heroTitle: string;
  heroSubtitle: string;
  channels: HelpChannel[];
  faq: HelpFaqItem[];
  hours: HelpHours;
};

export type DocumentLayoutData = {
  eyebrow: string;
  intro: string;
  showToc: boolean;
  updatedLabel: string;
};

export function isHelpLayoutData(data: unknown): data is HelpLayoutData {
  return Boolean(data && typeof data === "object" && "heroTitle" in data && "channels" in data);
}

export function isDocumentLayoutData(data: unknown): data is DocumentLayoutData {
  return Boolean(data && typeof data === "object" && "showToc" in data);
}

export function emptyHelpChannel(): HelpChannel {
  return {
    id: `ch-${Date.now()}`,
    icon: "message-circle",
    title: "",
    description: "",
    responseTime: "",
    features: [],
    ctaLabel: "Saiba mais",
    ctaAction: "chat",
    ctaHref: "",
  };
}

export function emptyFaqItem(): HelpFaqItem {
  return { question: "", answer: "" };
}
