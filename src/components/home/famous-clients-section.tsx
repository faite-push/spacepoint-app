"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import { useKeenSlider } from "keen-slider/react";
import type { KeenSliderInstance } from "keen-slider";
import "keen-slider/keen-slider.min.css";

import type { PublicFamousClient } from "@/lib/site-api";
import { cn } from "@/lib/utils";
import { AnimateSvg } from "@/components/ui/animate-svg";
import { AnimatedTooltipItem } from "@/components/ui/animated-tooltip";

const FAMOUS_UNDERLINE_PATH = "M222.462 12.8345C177.074 10.0328 132.077 4.80881 86.6062 3.64623C60.4691 2.97796 -17.6945 1.02174 8.17755 4.79475C50.7028 10.9964 94.6534 10.7971 137.47 14.9675C154.059 16.5834 170.516 18.7493 187.021 21.0384C193.373 21.9193 198.334 23.4078 188.17 22.8432C142.806 20.323 97.6784 14.7225 52.3141 12.0141C47.4732 11.7251 33.1304 11.5843 37.7934 12.9165C54.8856 17.8 73.2224 19.7239 90.7081 22.433C111.764 25.6952 133.161 27.7326 154.042 32.0315C161.542 33.5757 171.588 34.0575 178.571 37.1999C190.929 42.7607 151.511 39.3406 137.962 39.0868C115.414 38.6643 92.8916 37.3627 70.3626 36.4616";

const SLIDE_GAP = 16;

type FamousClientsSectionProps = {
  clients: PublicFamousClient[];
  enabled?: boolean | null;
  titlePrimary?: string | null;
  titleSecondary?: string | null;
};

function ContinuousAutoplay(slider: KeenSliderInstance) {
  let raf = 0;
  let paused = false;
  const speed = 0.0012;

  slider.on("created", () => {
    const tick = () => {
      if (!paused && slider.track.details) {
        slider.track.to(slider.track.details.position + speed);
      }
      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);

    slider.container.addEventListener("mouseenter", () => {
      paused = true;
    });
    slider.container.addEventListener("mouseleave", () => {
      paused = false;
    });
  });

  slider.on("destroyed", () => {
    cancelAnimationFrame(raf);
  });
}

function buildLoopSlides(clients: PublicFamousClient[]) {
  if (clients.length === 0) return [];
  const minSlides = 20;
  const repeats = Math.max(2, Math.ceil(minSlides / clients.length));
  const slides: Array<PublicFamousClient & { _key: string }> = [];

  for (let r = 0; r < repeats; r += 1) {
    for (const client of clients) {
      slides.push({ ...client, _key: `${client.id}-${r}` });
    }
  }

  return slides;
}

function SectionMouseGlow({ children, className, }: { children: ReactNode; className?: string; }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [active, setActive] = useState(false);

  return (
    <div
      ref={ref}
      className={cn("relative", className)}
      onMouseMove={(e) => {
        const el = ref.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        setPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        setActive(true);
      }}
      onMouseLeave={() => setActive(false)}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1] overflow-hidden rounded-[inherit]"
      >
        <div
          className="absolute inset-0 transition-opacity duration-300"
          style={{
            opacity: active ? 1 : 0,
            background: `radial-gradient(320px circle at ${pos.x}px ${pos.y}px, rgba(168, 85, 247, 0.22), transparent 55%)`,
          }}
        />
        <div
          className="absolute inset-0 transition-opacity duration-300"
          style={{
            opacity: active ? 0.7 : 0,
            background: `radial-gradient(140px circle at ${pos.x}px ${pos.y}px, rgba(255, 255, 255, 0.08), transparent 60%)`,
          }}
        />
      </div>
      <div className="relative z-[2] overflow-visible">{children}</div>
    </div>
  );
}

function ClientCard({ client, itemKey, }: { client: PublicFamousClient; itemKey: string; }) {
  const followers = client.subtitle?.trim() || "";
  const designation = followers
    ? followers.includes("seguidor")
      ? followers
      : `${followers} seguidores`
    : "";

  return (
    <AnimatedTooltipItem
      item={{
        id: itemKey,
        name: client.name,
        designation,
        image: client.avatarUrl || "",
        href: client.videoUrl,
      }}
    />
  );
}

export function FamousClientsSection({ clients, enabled = true, titlePrimary, titleSecondary, }: FamousClientsSectionProps) {
  const slides = useMemo(() => buildLoopSlides(clients), [clients]);
  const canAutoplay = slides.length > 1;

  const [sliderRef] = useKeenSlider(
    {
      loop: canAutoplay,
      drag: true,
      slides: {
        perView: "auto",
        spacing: SLIDE_GAP,
      },
    },
    canAutoplay ? [ContinuousAutoplay] : []
  );

  if (!enabled || !clients.length) return null;

  const line1 = titlePrimary?.trim() || "Famosos";
  const line2 = titleSecondary?.trim() || "Que Nos Indicaram";

  return (
    <section className="relative mx-auto w-[100vw] max-w-[1580px] left-1/2 -translate-x-1/2 px-4 sm:px-6 lg:px-[2rem]">
      <div aria-hidden className="pointer-events-none absolute -left-2 -top-10 z-0 sm:-left-4 sm:-top-12 lg:-left-12 lg:-top-14" >
        <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500/45 blur-2xl sm:h-32 sm:w-32" />
        <img
          src="/youtube-3d.png"
          alt=""
          className="relative h-24 w-24 object-contain opacity-80 mix-blend-screen blur-[2.5px] drop-shadow-[0_0_22px_rgba(255,0,0,0.75)] sm:h-32 sm:w-32 lg:h-36 lg:w-36"
        />
      </div>

      <div aria-hidden className="pointer-events-none absolute -bottom-10 -right-2 z-0 sm:-bottom-12 sm:-right-4 lg:-bottom-14 lg:-right-12" >
        <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-fuchsia-500/40 blur-2xl sm:h-32 sm:w-32" />
        <div className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-400/35 blur-xl" />
        <img
          src="/instagram-3d.png"
          alt=""
          className="relative h-24 w-24 -scale-x-100 object-contain opacity-80 mix-blend-screen blur-[2.5px] drop-shadow-[0_0_24px_rgba(225,48,108,0.2)] sm:h-32 sm:w-32 lg:h-36 lg:w-36"
        />
      </div>

      <SectionMouseGlow className="relative z-10 rounded-xl border border-primary/10 bg-transparent backdrop-blur-sm">
        <div aria-hidden className="pointer-events-none absolute inset-x-8 top-0 z-[3] h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

        <div className="relative flex flex-col gap-5 px-4 py-5 md:flex-row md:items-center md:gap-8 lg:px-8">
          <div className="hidden shrink-0 select-none flex-col items-start pl-6 md:flex md:pl-4">
            <p className="text-2xl font-bold leading-none tracking-tight text-primary sm:text-3xl">
              {line1}
            </p>
            <p className="text-lg font-semibold leading-none text-white sm:text-xl">
              {line2}
            </p>
            <AnimateSvg
              width="100%"
              height="34"
              viewBox="0 0 225 43"
              className="mt-1.5 w-full drop-shadow-[0_0_8px_rgba(168,85,247,0.55)]"
              path={FAMOUS_UNDERLINE_PATH}
              strokeColor="var(--primary)"
              strokeWidth={4}
              strokeLinecap="round"
              animationDuration={1.6}
              animationBounce={0.25}
              enableHoverAnimation
              hoverAnimationType="redraw"
            />
          </div>

          <div className="relative min-w-0 flex-1 overflow-hidden">
            <div
              ref={sliderRef}
              className="keen-slider cursor-grab active:cursor-grabbing"
            >
              {slides.map((client) => (
                <div
                  key={client._key}
                  className="keen-slider__slide py-1 !w-[4.75rem] !min-w-[4.75rem] !max-w-[4.75rem] sm:!w-[5.5rem] sm:!min-w-[5.5rem] sm:!max-w-[5.5rem]"
                >
                  <ClientCard client={client} itemKey={client._key} />
                </div>
              ))}
            </div>
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-4 bg-gradient-to-r from-background/25 to-transparent sm:w-8" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-4 bg-gradient-to-l from-background/25 to-transparent sm:w-8" />
          </div>
        </div>
      </SectionMouseGlow>
    </section>
  );
};