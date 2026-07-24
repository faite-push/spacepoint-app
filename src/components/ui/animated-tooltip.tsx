"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  motion,
  useTransform,
  AnimatePresence,
  useMotionValue,
  useSpring,
} from "motion/react";

import { cn } from "@/lib/utils";

export type AnimatedTooltipItemData = {
  id: string | number;
  name: string;
  designation: string;
  image: string;
  href?: string | null;
};

type SpringValue = ReturnType<typeof useSpring>;

function TooltipBubble({
  item,
  rotate,
  translateX,
  className,
  style,
}: {
  item: AnimatedTooltipItemData;
  rotate: SpringValue;
  translateX: SpringValue;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.6 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
        transition: { type: "spring", stiffness: 260, damping: 12 },
      }}
      exit={{ opacity: 0, y: 12, scale: 0.6 }}
      style={{
        translateX,
        rotate,
        whiteSpace: "nowrap",
        ...style,
      }}
      className={cn(
        "pointer-events-none relative z-[9999] flex flex-col items-center justify-center rounded-md bg-background px-4 py-2 text-xs shadow-xl",
        className
      )}
    >
      <div className="absolute inset-x-10 -bottom-px z-30 h-px w-[20%] bg-gradient-to-r from-transparent via-primary to-transparent" />
      <div className="absolute -bottom-px left-10 z-30 h-px w-[40%] bg-gradient-to-r from-transparent via-primary to-transparent" />
      <div className="relative z-30 text-base font-bold text-white">{item.name}</div>
      {item.designation ? (
        <div className="text-xs text-white/70">{item.designation}</div>
      ) : null}
    </motion.div>
  );
}

/** Tooltip animado no estilo Aceternity — https://ui.aceternity.com/components/animated-tooltip */
export function AnimatedTooltip({
  items,
  className,
}: {
  items: AnimatedTooltipItemData[];
  className?: string;
}) {
  const [hoveredIndex, setHoveredIndex] = useState<string | number | null>(null);
  const springConfig = { stiffness: 100, damping: 15 };
  const x = useMotionValue(0);
  const animationFrameRef = useRef<number | null>(null);

  const rotate = useSpring(useTransform(x, [-100, 100], [-45, 45]), springConfig);
  const translateX = useSpring(useTransform(x, [-100, 100], [-50, 50]), springConfig);

  const handleMouseMove = (event: React.MouseEvent<HTMLElement>) => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    const target = event.currentTarget;
    if (!target) return;
    const halfWidth = target.offsetWidth / 2;
    const offsetX = event.nativeEvent.offsetX;

    animationFrameRef.current = requestAnimationFrame(() => {
      x.set(offsetX - halfWidth);
    });
  };

  return (
    <div className={cn("flex items-center", className)}>
      {items.map((item) => (
        <div
          key={item.id}
          className="group relative -mr-4"
          onMouseEnter={() => setHoveredIndex(item.id)}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <AnimatePresence>
            {hoveredIndex === item.id && (
              <TooltipBubble
                item={item}
                rotate={rotate}
                translateX={translateX}
                className="absolute -top-16 left-1/2 -translate-x-1/2"
              />
            )}
          </AnimatePresence>
          {item.href ? (
            <a href={item.href} target="_blank" rel="noopener noreferrer" className="block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                onMouseMove={handleMouseMove}
                height={100}
                width={100}
                src={item.image}
                alt={item.name}
                draggable={false}
                className="relative !m-0 h-14 w-14 rounded-full border-2 border-primary/40 object-cover object-top !p-0 transition duration-500 group-hover:z-30 group-hover:scale-105"
              />
            </a>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              onMouseMove={handleMouseMove}
              height={100}
              width={100}
              src={item.image}
              alt={item.name}
              draggable={false}
              className="relative !m-0 h-14 w-14 rounded-full border-2 border-primary/40 object-cover object-top !p-0 transition duration-500 group-hover:z-30 group-hover:scale-105"
            />
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * Item único para carrossel (keen-slider).
 * Tooltip via portal no body — não é cortado pelo overflow do slider.
 */
export function AnimatedTooltipItem({
  item,
  className,
}: {
  item: AnimatedTooltipItemData;
  className?: string;
}) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);

  const springConfig = { stiffness: 100, damping: 15 };
  const x = useMotionValue(0);
  const animationFrameRef = useRef<number | null>(null);
  const rotate = useSpring(useTransform(x, [-100, 100], [-45, 45]), springConfig);
  const translateX = useSpring(useTransform(x, [-100, 100], [-50, 50]), springConfig);

  useEffect(() => {
    setMounted(true);
  }, []);

  const updateCoords = () => {
    const el = anchorRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setCoords({
      top: rect.top,
      left: rect.left + rect.width / 2,
    });
  };

  useEffect(() => {
    if (!hovered) return;

    updateCoords();
    const id = window.setInterval(updateCoords, 50);
    window.addEventListener("scroll", updateCoords, true);
    window.addEventListener("resize", updateCoords);

    return () => {
      window.clearInterval(id);
      window.removeEventListener("scroll", updateCoords, true);
      window.removeEventListener("resize", updateCoords);
    };
  }, [hovered]);

  const handleMouseMove = (event: React.MouseEvent<HTMLElement>) => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    const target = event.currentTarget;
    if (!target) return;
    const halfWidth = target.offsetWidth / 2;
    const offsetX = event.nativeEvent.offsetX;

    animationFrameRef.current = requestAnimationFrame(() => {
      x.set(offsetX - halfWidth);
    });
  };

  const open = () => {
    updateCoords();
    setHovered(true);
  };

  const glareDelay = (() => {
    const raw = String(item.id);
    let hash = 0;
    for (let i = 0; i < raw.length; i += 1) hash = (hash + raw.charCodeAt(i) * (i + 1)) % 2400;
    return `${hash}ms`;
  })();

  const mediaInner = item.image ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      onMouseMove={handleMouseMove}
      height={100}
      width={100}
      src={item.image}
      alt={item.name}
      draggable={false}
      className="relative z-0 !m-0 h-full w-full rounded-full object-cover object-top !p-0"
    />
  ) : (
    <div
      onMouseMove={handleMouseMove}
      className="relative z-0 flex h-full w-full items-center justify-center rounded-full bg-white/10 text-lg font-bold text-white/70"
    >
      {item.name.slice(0, 1).toUpperCase()}
    </div>
  );

  const media = (
    <div className="relative h-14 w-14 overflow-hidden rounded-full border-2 border-primary/40 transition duration-500 group-hover:z-30 group-hover:scale-105 sm:h-20 sm:w-20">
      {mediaInner}
      <span
        aria-hidden
        className="famous-avatar-glare"
        style={{ ["--glare-delay" as string]: glareDelay }}
      />
    </div>
  );

  return (
    <div className={cn("flex justify-center", className)}>
      <div
        ref={anchorRef}
        className="group relative"
        onMouseEnter={open}
        onMouseLeave={() => setHovered(false)}
      >
        {item.href ? (
          <a href={item.href} target="_blank" rel="noopener noreferrer" className="block">
            {media}
          </a>
        ) : (
          media
        )}
      </div>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {hovered ? (
              <motion.div
                key={`famous-tooltip-${item.id}`}
                className="pointer-events-none fixed z-[9999]"
                style={{
                  top: coords.top - 10,
                  left: coords.left,
                  x: "-50%",
                  y: "-100%",
                }}
              >
                <TooltipBubble item={item} rotate={rotate} translateX={translateX} />
              </motion.div>
            ) : null}
          </AnimatePresence>,
          document.body
        )}
    </div>
  );
}
