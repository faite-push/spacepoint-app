"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Calendar, ChevronRight, Package, Star } from "lucide-react";
import { useKeenSlider } from "keen-slider/react";
import type { KeenSliderInstance } from "keen-slider";
import "keen-slider/keen-slider.min.css";
import type { PublicStoreReview } from "@/lib/store-reviews-api";

const SLIDE_GAP = 16;

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "C";
  const first = parts[0][0]?.toUpperCase() ?? "";
  if (parts.length === 1) return first;
  const last = parts[parts.length - 1][0]?.toUpperCase() ?? "";
  return `${first}${last}`;
};

function formatReviewDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

function ContinuousAutoplay(slider: KeenSliderInstance) {
  let raf = 0;
  let paused = false;
  const speed = 0.001;

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
};

function buildLoopSlides(reviews: PublicStoreReview[]) {
  if (reviews.length === 0) return [];
  const minSlides = 16;
  const repeats = Math.max(2, Math.ceil(minSlides / reviews.length));
  const slides: Array<PublicStoreReview & { _key: string }> = [];

  for (let r = 0; r < repeats; r += 1) {
    for (const review of reviews) {
      slides.push({ ...review, _key: `${review.id}-${r}` });
    }
  };

  return slides;
};

type StoreReviewsCarouselProps = {
  reviews: PublicStoreReview[];
  title?: string;
  subtitle?: string;
};

function ReviewCard({ review }: { review: PublicStoreReview }) {
  const reviewer = review.name?.trim() || "Cliente";
  const message = review.comment?.trim() || review.tags?.join(" · ") || "Ótima experiência de compra.";
  const dateLabel = formatReviewDate(review.dateLabel);

  return (
    <div className="flex h-full min-h-auto cursor-pointer w-full flex-col gap-2 rounded-lg border border-white/5 bg-white/1 px-6 py-4 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-primary/30 bg-primary/15">
            <span className="text-sm font-semibold uppercase text-primary">
              {initialsFromName(reviewer)}
            </span>
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-tight text-foreground">
              {reviewer}
            </p>
            {dateLabel ? (
              <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="size-3 shrink-0" />
                <span className="truncate">{dateLabel}</span>
              </p>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`size-4 ${i < review.rating
                ? "fill-primary text-primary"
                : "fill-muted-foreground/10 text-muted-foreground/20"
                }`}
            />
          ))}
        </div>
      </div>

      <p className="flex-1 text-sm leading-relaxed text-muted-foreground">{message}</p>
    </div>
  );
}

export function StoreReviewsCarousel({ reviews, title = "Depoimentos de clientes", subtitle = "Experiências reais de quem já confiou na nossa loja", }: StoreReviewsCarouselProps) {
  const slides = useMemo(() => buildLoopSlides(reviews), [reviews]);
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

  if (!reviews.length) return null;

  return (
    <section className="py-12 relative">
      <div className="absolute top-0 right-[5%] w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-primary/20 rounded-full blur-[120px] -z-10 pointer-events-none" />
      <div className="absolute bottom-[0%] left-[5%] w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-primary/20 rounded-full blur-[120px] -z-10 pointer-events-none" />

      <div className="mx-auto w-full max-w-[1540px] px-3">
        <div className="mb-6 text-center">
          <p className="mb-1 text-3xl font-bold leading-tight md:text-4xl">{title}</p>
          <p className="mx-auto max-w-2xl text-base text-muted-foreground">{subtitle}</p>
        </div>

        <div className="relative overflow-hidden">
          <div ref={sliderRef} className="keen-slider">
            {slides.map((review) => (
              <div
                key={review._key}
                className="keen-slider__slide !w-[min(88vw,340px)] !min-w-[min(88vw,340px)] !max-w-[340px] sm:!w-[340px] sm:!min-w-[340px]"
              >
                <ReviewCard review={review} />
              </div>
            ))}
          </div>

          <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-black/20 to-transparent sm:w-16" />
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-black/20 to-transparent sm:w-16" />
        </div>
      </div>
    </section>
  );
};