// HorizontalStickyScroll.tsx
"use client";

import React, { ReactNode, useRef } from "react";
import { motion, useScroll, useTransform, MotionValue } from "framer-motion";
import { StickyScrollItem } from "./StickyScroll"; // reuse your StickyScrollItem type

export interface HorizontalStickyScrollProps {
  title: string;
  subtitle: string;
  items: StickyScrollItem[];
  height?: string | number;
  /**
   * Optional custom card renderer.
   * It's called for each item and passed the scrollYProgress MotionValue and totalItems.
   */
  renderCustomCard?: (
    item: StickyScrollItem,
    index: number,
    scrollYProgress: MotionValue<number>,
    totalItems: number
  ) => ReactNode;
  containerClassName?: string;
  leftClassName?: string;
  cardsWrapperClassName?: string;
}

/** Default card renderer you can reuse */
export const DEFAULT_CARD = (item: StickyScrollItem) => (
  <div className="w-[60vw] max-w-md bg-white rounded-2xl shadow-xl p-6">
    <img
      src={item.image}
      alt={item.title}
      className="w-full h-64 rounded-xl object-cover mb-4"
    />
    <h3 className="text-2xl font-semibold">{item.title}</h3>
    <p className="text-gray-600 mt-2">{item.description}</p>
  </div>
);

export function HorizontalStickyScroll({
  title,
  subtitle,
  items,
  renderCustomCard,
  containerClassName = "",
  leftClassName = "flex flex-col justify-center px-16",
  cardsWrapperClassName = "flex h-full items-center gap-12 pr-16",
}: HorizontalStickyScrollProps) {
  const sectionRef = useRef<HTMLElement | null>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    // full section from top to bottom maps to 0..1
    offset: ["start start", "end end"],
  });

  // translate cards horizontally across the viewport width
  const x = useTransform(
    scrollYProgress,
    [0, 1],
    ["0%", `-${(items.length - 1) * 100}%`]
  );

  return (
    <section
      ref={sectionRef as React.RefObject<HTMLDivElement>}
      className={`relative h-[300vh] bg-[#F4F4F4] ${containerClassName}`}
    >
      <div className="sticky top-0 left-0 h-screen grid grid-cols-2">
        {/* LEFT – Sticky Content */}
        <div className={leftClassName}>
          <h2 className="text-4xl font-bold mb-4">{title}</h2>
          <p className="text-black/70 text-lg">{subtitle}</p>
        </div>

        {/* RIGHT – Horizontal Scroll Content */}
        <motion.div style={{ x }} className={`${cardsWrapperClassName}`}>
          {items.map((item, index) => {
            const key = `${item.title}-${index}`;

            if (renderCustomCard) {
              // pass scrollYProgress & totalItems to the custom renderer
              return (
                <div key={key} className="min-w-[60vw] flex-shrink-0">
                  {renderCustomCard(item, index, scrollYProgress, items.length)}
                </div>
              );
            }

            // default card
            return (
              <div key={key} className="min-w-[60vw] flex-shrink-0">
                {DEFAULT_CARD(item)}
              </div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

export default HorizontalStickyScroll;
