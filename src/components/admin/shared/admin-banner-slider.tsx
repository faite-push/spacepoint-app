"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useKeenSlider } from "keen-slider/react";
import "keen-slider/keen-slider.min.css";
import type { ShopBannerRow } from "@/lib/site-api";

export function AdminBannerSlider({
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
    <div className="max-w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0A0A0A] relative mb-6">
      <div ref={sliderRef} className="keen-slider h-full">
        {banners.map((b) => (
          <div
            key={b.id}
            className="keen-slider__slide flex justify-center shrink-0 w-full min-w-full relative"
          >
            {b.linkUrl ? (
              <Link href={b.linkUrl} className="block w-full h-auto relative group">
                <Image
                  src={b.imageUrl}
                  alt="Banner"
                  width={2560}
                  height={1080}
                  className="w-full h-auto object-cover pointer-events-none select-none rounded-2xl"
                  priority
                />
              </Link>
            ) : (
              <div className="block w-full h-auto relative group">
                <Image
                  src={b.imageUrl}
                  alt="Banner"
                  width={2560}
                  height={1080}
                  className="w-full h-auto object-cover pointer-events-none select-none rounded-2xl"
                  priority
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
