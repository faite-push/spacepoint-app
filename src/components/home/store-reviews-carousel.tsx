"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowRight, Calendar, ChevronRight, MoveRight, Package, Star } from "lucide-react";
import { useKeenSlider } from "keen-slider/react";
import type { KeenSliderInstance } from "keen-slider";
import "keen-slider/keen-slider.min.css";
import type { ProductReviewsSummary, PublicStoreReview } from "@/lib/store-reviews-api";
import { Button } from "../ui/button";

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

function formatAverage(value: number) {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatPercent(value: number) {
  return value.toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

function summarizeFromReviews(reviews: PublicStoreReview[]): ProductReviewsSummary {
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as ProductReviewsSummary["distribution"];
  let sum = 0;
  for (const review of reviews) {
    const rating = Math.min(5, Math.max(1, Number(review.rating) || 0)) as 1 | 2 | 3 | 4 | 5;
    sum += rating;
    distribution[rating] += 1;
  }
  const total = reviews.length;
  return {
    averageRating: total ? Math.round((sum / total) * 100) / 100 : 0,
    total,
    distribution,
  };
}

function ReviewStatsSummary({ summary }: { summary: ProductReviewsSummary }) {
  const rows = [5, 4, 3, 2, 1] as const;
  const filledStars = Math.round(summary.averageRating);

  return (
    <div className="mb-8 rounded-xl border border-white/5 bg-transparent px-5 py-6 sm:px-8 sm:py-8">
      <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:gap-12 lg:gap-16">
        <div className="flex shrink-0 flex-col items-center sm:items-start">
          <p className="text-6xl font-bold text-primary sm:text-5xl">
            {formatAverage(summary.averageRating)}
          </p>
          <div className="mt-3 flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`size-5 ${i < filledStars
                    ? "fill-amber-400 text-amber-400"
                    : "fill-white/10 text-white/15"
                  }`}
              />
            ))}
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {summary.total} avaliação{summary.total === 1 ? "" : "ões"}
          </p>
        </div>

        <div className="w-full min-w-0 flex-1 space-y-2.5">
          {rows.map((stars) => {
            const count = summary.distribution[stars] ?? 0;
            const pct = summary.total > 0 ? (count / summary.total) * 100 : 0;
            return (
              <div key={stars} className="flex items-center gap-3 text-sm">
                <span className="w-8 shrink-0 text-muted-foreground">{stars}★</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/8">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
                <span className="w-14 shrink-0 text-right tabular-nums text-muted-foreground">
                  {formatPercent(pct)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

type StoreReviewsCarouselProps = {
  reviews: PublicStoreReview[];
  summary?: ProductReviewsSummary;
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

export function StoreReviewsCarousel({
  reviews,
  summary,
  title = "O que os clientes dizem",
  subtitle = "Experiências reais de quem já confiou na nossa loja",
}: StoreReviewsCarouselProps) {
  const slides = useMemo(() => buildLoopSlides(reviews), [reviews]);
  const resolvedSummary = useMemo(
    () => (summary && summary.total > 0 ? summary : summarizeFromReviews(reviews)),
    [summary, reviews]
  );
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

      <div className="mx-auto w-full max-w-[1540px] space-y-2">
        <div className="flex items-center justify-between">
          <div className="mb-2 text-start">
            <p className="text-xl font-bold leading-tight md:text-3xl">O que os <span className="text-primary">clientes dizem</span></p>
          </div>
          <div>
            <Button
              className="bg-primary text-white hover:bg-primary/90 px-4"
              size="lg"
            >
              Ler todas <MoveRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <ReviewStatsSummary summary={resolvedSummary} />

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