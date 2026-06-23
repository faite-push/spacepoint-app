"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useKeenSlider } from "keen-slider/react";
import "keen-slider/keen-slider.min.css";
import type { ShopBannerRow } from "@/lib/site-api";
import { resolveMediaUrl } from "@/lib/media";

export function BannerSlider({ 
  banners, 
  autoPlaySeconds = 8
}: { 
  banners: ShopBannerRow[],
  autoPlaySeconds?: number
}) {
  const isLoop = banners.length > 1;
  const [sliderRef] = useKeenSlider<HTMLDivElement>(
    {
      loop: isLoop,
      mode: "snap",
      drag: isLoop,
      slides: {
        perView: 1,
        spacing: 16,
      },
      breakpoints: {
        "(min-width: 640px)": {
          slides: { perView: 1, spacing: 20 },
        },
        "(min-width: 1024px)": {
          slides: { perView: 1, spacing: 24 },
        },
      },
    },
    [
      (slider) => {
        let timeout: ReturnType<typeof setTimeout>;
        let mouseOver = false;
        
        function clearNextTimeout() {
          clearTimeout(timeout);
        }
        
        function nextTimeout() {
          clearTimeout(timeout);
          if (mouseOver) return;
          timeout = setTimeout(() => {
            slider.next();
          }, autoPlaySeconds * 1000);
        }

        if (isLoop) {
          slider.on("created", () => {
            slider.container.addEventListener("mouseover", () => {
              mouseOver = true;
              clearNextTimeout();
            });
            slider.container.addEventListener("mouseout", () => {
              mouseOver = false;
              nextTimeout();
            });
            nextTimeout();
          });
          slider.on("dragStarted", clearNextTimeout);
          slider.on("animationEnded", nextTimeout);
          slider.on("updated", nextTimeout);
        }
      },
    ]
  );

  if (!banners || banners.length === 0) return null;

  return (
    <div className="w-[100vw] relative left-1/2 -translate-x-1/2 overflow-hidden max-w-[1580px] mx-auto px-4 sm:px-6 lg:px-[2rem] -mt-28 rounded-2xl">
      <div ref={sliderRef} className="keen-slider h-full rounded-2xl">
        {banners.map((b) => {
          const imageUrl = resolveMediaUrl(b.imageUrl) || "/placeholder.svg";
          return (
          <div
            key={b.id}
            className="keen-slider__slide flex justify-center shrink-0 w-full min-w-full rounded-2xl overflow-hidden relative"
          >
            {b.linkUrl ? (
              <Link href={b.linkUrl} className="block w-full h-auto relative group">
                <Image
                  src={imageUrl}
                  alt="Banner"
                  width={2560}
                  height={1080}
                  className="w-full h-auto object-cover pointer-events-none select-none rounded-2xl transition-transform duration-500"
                  priority
                />
                <div className="absolute inset-0 bg-black/5 transition-colors duration-300" />
              </Link>
            ) : (
              <div className="block w-full h-auto relative group">
                <Image
                  src={imageUrl}
                  alt="Banner"
                  width={2560}
                  height={1080}
                  className="w-full h-auto object-cover pointer-events-none select-none rounded-2xl"
                  priority
                />
              </div>
            )}
          </div>
        );
        })}
      </div>
    </div>
  );
}