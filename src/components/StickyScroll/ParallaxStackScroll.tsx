"use client";

import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  DEFAULT_CARD,
  HorizontalStickyScrollProps,
} from "./HorizontalStickyScroll";

// ---- Hook-safe extracted card ----
function ParallaxCard({
  item,
  index,
  totalSteps,
  scrollYProgress,
  renderCustomCard,
  cardWrapperClassName,
  cardWrapperStyle,
}: any) {
  const cardProgress = totalSteps > 1 ? index / (totalSteps - 1) : 0;

  const opacity = useTransform(
    scrollYProgress,
    [
      Math.max(0, cardProgress - 0.1),
      cardProgress,
      Math.min(1, cardProgress + 0.1),
    ],
    [0, 1, 0]
  );

  const scale = useTransform(
    scrollYProgress,
    [
      Math.max(0, cardProgress - 0.1),
      cardProgress,
      Math.min(1, cardProgress + 0.1),
    ],
    [0.8, 1, 0.8]
  );

  const rotateY = useTransform(
    scrollYProgress,
    [
      Math.max(0, cardProgress - 0.1),
      cardProgress,
      Math.min(1, cardProgress + 0.1),
    ],
    [45, 0, -45]
  );

  return (
    <motion.div
      className={`absolute inset-0 flex items-center justify-center ${cardWrapperClassName}`}
      style={{
        opacity,
        scale,
        rotateY,
        ...cardWrapperStyle,
      }}
    >
      {renderCustomCard
        ? renderCustomCard(item, index, scrollYProgress, totalSteps)
        : DEFAULT_CARD(item)}
    </motion.div>
  );
}

// ---- Main Component ----
export function ParallaxStackScroll({
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
}: Omit<HorizontalStickyScrollProps, "cardWidth" | "cardWidthMobile">) {
  const sectionRef = useRef<HTMLDivElement | null>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  const totalSteps = Math.max(1, items.length);
  const sectionHeight = `${totalSteps * 100}vh`;

  return (
    <section
      ref={sectionRef}
      className={`relative bg-[#F4F4F4] ${containerClassName}`}
      style={{ height: sectionHeight, ...containerStyle }}
    >
      <div className="sticky top-0 left-0 h-screen w-full overflow-hidden">
        <div className="h-full w-full grid grid-cols-1 md:grid-cols-2">
          {/* LEFT PANEL */}
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

          {/* RIGHT PANEL */}
          <div
            className={`relative h-full flex items-center justify-center overflow-hidden ${rightPanelClassName}`}
            style={rightPanelStyle}
          >
            <div className="relative w-full h-full flex items-center justify-center px-4 md:px-8">
              {items.map((item, index) => (
                <ParallaxCard
                  key={index}
                  item={item}
                  index={index}
                  totalSteps={items.length}
                  scrollYProgress={scrollYProgress}
                  renderCustomCard={renderCustomCard}
                  cardWrapperClassName={cardWrapperClassName}
                  cardWrapperStyle={cardWrapperStyle}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
