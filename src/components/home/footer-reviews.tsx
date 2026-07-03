"use client";

import Link from "next/link";
import { ExternalLink, Star } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useKeenSlider } from "keen-slider/react";
import "keen-slider/keen-slider.min.css";
import type { PublicHomeReview, PublicSiteConfig } from "@/lib/site-api";

const DEFAULT_MAPS_URL =
  "https://www.google.com/maps/place/SPACE+POINT+BR/@-7.2093142,-35.9250211,17z";

function GoogleIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function initialsFromName(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function FooterReviews({
  config,
  reviews,
}: {
  config?: PublicSiteConfig | null;
  reviews: PublicHomeReview[];
}) {
  const [sliderRef] = useKeenSlider({
    mode: "free-snap",
    slides: { perView: 1.12, spacing: 12 },
    breakpoints: {
      "(min-width: 640px)": { slides: { perView: 2.1, spacing: 16 } },
      "(min-width: 1024px)": { slides: { perView: 3, spacing: 20 } },
    },
  });

  if (config?.homeReviewsEnabled === false || reviews.length === 0) {
    return null;
  }

  const badgeLabel = config?.homeReviewsBadgeLabel?.trim() || "Google Reviews";
  const title = config?.homeReviewsTitle?.trim() || "O que nossos clientes dizem";
  const average = config?.homeReviewsAverageRating ?? 4.9;
  const total = config?.homeReviewsTotalCount ?? reviews.length;
  const mapsUrl = config?.homeReviewsGoogleMapsUrl?.trim() || DEFAULT_MAPS_URL;
  const linkLabel = config?.homeReviewsLinkLabel?.trim() || "Ver todas";

  return (
    <div className="pb-10">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center mb-3">
        <div>
          <div className="mb-3 flex items-center gap-2">
            <GoogleIcon className="h-4 w-4" />
            <span className="text-[11px] font-semibold uppercase tracking-widest text-white/60">
              {badgeLabel}
            </span>
          </div>
          <h3 className="text-xl font-bold text-white leading-tight">{title}</h3>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="text-4xl font-extrabold text-white leading-none">
            {average.toFixed(1)}
          </span>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
              ))}
            </div>
            <span className="text-xs text-white/60">{total} avaliações</span>
            <Link
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-white/75 underline underline-offset-2 transition-colors hover:text-white"
            >
              {linkLabel}
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

      <div ref={sliderRef} className="keen-slider">
        {reviews.map((review) => (
          <div
            key={review.id}
            className="keen-slider__slide flex flex-col gap-3 rounded-2xl bg-white/10 p-4 ring-1 ring-white/15 transition-colors hover:bg-white/[0.15]"
          >
            <div className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-3.5 w-3.5 ${
                    i < review.rating
                      ? "fill-yellow-400 text-yellow-400"
                      : "fill-white/20 text-white/20"
                  }`}
                />
              ))}
            </div>

            <p className="flex-1 text-sm leading-relaxed text-white/80 line-clamp-3">
              {review.comment ? (
                <>&ldquo;{review.comment}&rdquo;</>
              ) : null}
            </p>

            <div className="flex items-center justify-between border-t border-white/10 pt-3">
              <div className="flex items-center gap-2.5">
                <Avatar className="h-8 w-8 ring-2 ring-white/25">
                  {review.avatarUrl ? (
                    <AvatarImage src={review.avatarUrl} alt={review.name} />
                  ) : null}
                  <AvatarFallback className="bg-white/20 text-[11px] font-semibold text-white">
                    {initialsFromName(review.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold leading-tight text-white">{review.name}</p>
                  {review.dateLabel && (
                    <p className="text-[11px] text-white/50">{review.dateLabel}</p>
                  )}
                </div>
              </div>
              <GoogleIcon className="h-4 w-4 shrink-0" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
