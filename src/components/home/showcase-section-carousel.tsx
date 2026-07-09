"use client";

import { useKeenSlider } from "keen-slider/react";
import type { KeenSliderInstance } from "keen-slider";
import "keen-slider/keen-slider.min.css";

import { ProductCard } from "@/components/shop/product-card";
import type { Product } from "@/types/shop";

const SLIDE_GAP = 16;
const AUTOPLAY_MS = 4500;

function AutoplayPlugin(slider: KeenSliderInstance) {
  let timer: ReturnType<typeof setInterval> | undefined;
  let paused = false;

  function start() {
    if (timer) clearInterval(timer);
    timer = setInterval(() => {
      if (!paused) slider.next();
    }, AUTOPLAY_MS);
  }

  slider.on("created", () => {
    start();
    slider.container.addEventListener("mouseenter", () => {
      paused = true;
    });
    slider.container.addEventListener("mouseleave", () => {
      paused = false;
    });
  });

  slider.on("destroyed", () => {
    if (timer) clearInterval(timer);
  });
}

export function ShowcaseSectionCarousel({ products }: { products: Product[] }) {
  const canLoop = products.length > 1;

  const [sliderRef] = useKeenSlider(
    {
      mode: "free-snap",
      loop: canLoop,
      drag: true,
      rubberband: true,
      slides: {
        perView: 2,
        spacing: SLIDE_GAP,
      },
      breakpoints: {
        "(min-width: 640px)": {
          slides: { perView: 2, spacing: SLIDE_GAP },
        },
        "(min-width: 768px)": {
          slides: { perView: 3, spacing: SLIDE_GAP },
        },
        "(min-width: 1024px)": {
          slides: { perView: 4, spacing: SLIDE_GAP },
        },
        "(min-width: 1280px)": {
          slides: { perView: 5, spacing: SLIDE_GAP },
        },
      },
    },
    canLoop ? [AutoplayPlugin] : []
  );

  return (
    <div className="relative overflow-hidden">
      <div ref={sliderRef} className="keen-slider cursor-grab active:cursor-grabbing">
        {products.map((product) => (
          <div key={product.id} className="keen-slider__slide min-w-0">
            <ProductCard product={product} />
          </div>
        ))}
      </div>

      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-6 bg-gradient-to-r from-background to-transparent sm:w-12" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-6 bg-gradient-to-l from-background to-transparent sm:w-12" />
    </div>
  );
}
