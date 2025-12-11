"use client";

import React, { ReactNode, useRef } from "react";
import { motion, useScroll, useTransform, MotionValue } from "framer-motion";

interface StickyScrollItem {
  title: string;
  description: string;
  image: string;
}

export interface HorizontalStickyScrollProps {
  title: string;
  subtitle: string;
  items: StickyScrollItem[];
  renderCustomCard?: (
    item: StickyScrollItem,
    index: number,
    scrollYProgress: MotionValue<number>,
    totalItems: number
  ) => ReactNode;
  containerClassName?: string;
  containerStyle?: React.CSSProperties;
  leftPanelClassName?: string;
  leftPanelStyle?: React.CSSProperties;
  titleClassName?: string;
  titleStyle?: React.CSSProperties;
  subtitleClassName?: string;
  subtitleStyle?: React.CSSProperties;
  rightPanelClassName?: string;
  rightPanelStyle?: React.CSSProperties;
  cardWrapperClassName?: string;
  cardWrapperStyle?: React.CSSProperties;
  cardWidth?: string;
  cardWidthMobile?: string;
}

export const DEFAULT_CARD = (item: StickyScrollItem) => (
  <div className="mx-auto max-w-xl bg-white rounded-2xl shadow-xl p-6">
    <img
      src={item.image}
      alt={item.title}
      className="w-full h-64 rounded-xl object-cover mb-4"
    />
    <h3 className="text-2xl font-semibold">{item.title}</h3>
    <p className="text-gray-600 mt-2">{item.description}</p>
  </div>
);

// ============================================
// VERSION 1: HORIZONTAL STICKY SCROLL (Original)
// ============================================
export  function HorizontalStickyScroll({
  title,
  subtitle,
  items,
  renderCustomCard,
  containerClassName = "",
  containerStyle = {},
  leftPanelClassName = "",
  leftPanelStyle = {},
  titleClassName = "",
  titleStyle = {},
  subtitleClassName = "",
  subtitleStyle = {},
  rightPanelClassName = "",
  rightPanelStyle = {},
  cardWrapperClassName = "",
  cardWrapperStyle = {},
  cardWidth = "700px",
  cardWidthMobile = "100%",
}: HorizontalStickyScrollProps) {
  const sectionRef = useRef<HTMLDivElement | null>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  const totalSteps = Math.max(1, items.length);

  const x = useTransform(scrollYProgress, (progress) => {
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
    if (isMobile) {
      return `${-progress * (totalSteps - 1) * 100}vw`;
    } else {
      const widthNum = parseInt(cardWidth);
      return `${-progress * (totalSteps - 1) * widthNum}px`;
    }
  });

  const sectionHeight = `${totalSteps * 100}vh`;

  return (
    <section
      ref={sectionRef}
      className={`relative bg-[#F4F4F4] ${containerClassName}`}
      style={{
        height: sectionHeight,
        ...containerStyle,
      }}
    >
      <div className="sticky top-0 left-0 h-screen w-full overflow-hidden">
        <div className="h-full w-full grid grid-cols-1 md:grid-cols-2">
          <div
            className={`flex flex-col justify-center px-6 py-8 md:px-12 lg:px-16 ${leftPanelClassName}`}
            style={leftPanelStyle}
          >
            <h2
              className={`text-3xl md:text-4xl lg:text-5xl font-bold mb-3 md:mb-4 ${titleClassName}`}
              style={titleStyle}
            >
              {title}
            </h2>
            <p
              className={`text-black/70 text-base md:text-lg lg:text-xl ${subtitleClassName}`}
              style={subtitleStyle}
            >
              {subtitle}
            </p>
          </div>

          <div
            className={`relative h-full flex items-center overflow-hidden ${rightPanelClassName}`}
            style={rightPanelStyle}
          >
            <motion.div style={{ x }} className="flex h-full items-center">
              {items.map((item, index) => {
                const key = `${item.title}-${index}`;
                return (
                  <div
                    key={key}
                    className={`flex-shrink-0 h-full flex items-center px-4 md:px-8 ${cardWrapperClassName}`}
                    style={{
                      width:
                        typeof window !== "undefined" && window.innerWidth < 768
                          ? cardWidthMobile
                          : cardWidth,
                      ...cardWrapperStyle,
                    }}
                  >
                    {renderCustomCard
                      ? renderCustomCard(
                          item,
                          index,
                          scrollYProgress,
                          items.length
                        )
                      : DEFAULT_CARD(item)}
                  </div>
                );
              })}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
