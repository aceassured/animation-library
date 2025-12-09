// StickyScroll.tsx
"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, ReactNode } from "react";

export interface StickyScrollItem {
  title: string;
  description: string;
  image: string;
}

interface StickyScrollProps {
  title: string;
  subtitle: string;
  items: StickyScrollItem[];
  cardClassName?: string;
  imageClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  sectionClassName?: string;
  containerClassName?: string;
  stickyContentClassName?: string;
  cardsContainerClassName?: string;
  cardSpacing?: string;
  enableAnimation?: boolean;
  animationConfig?: {
    yStart?: number;
    yEnd?: number;
    opacityStart?: number;
    opacityEnd?: number;
    animationRange?: number;
  };
  renderCustomCard?: (item: StickyScrollItem, index: number) => ReactNode;
}

interface FeatureCardProps {
  item: StickyScrollItem;
  index: number;
  totalItems: number;
  scrollYProgress: ReturnType<typeof useScroll>["scrollYProgress"];
  enableAnimation?: boolean;
  animationConfig?: StickyScrollProps["animationConfig"];
  cardClassName?: string;
  imageClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;
}

function FeatureCard({
  item,
  index,
  totalItems,
  scrollYProgress,
  enableAnimation = false,
  animationConfig = {},
  cardClassName = "",
  imageClassName = "",
  titleClassName = "",
  descriptionClassName = "",
}: FeatureCardProps) {
  const {
    yStart = 60,
    yEnd = 0,
    opacityStart = 0,
    opacityEnd = 1,
    animationRange = 0.15,
  } = animationConfig;

  const start = index / totalItems;

  const y = enableAnimation
    ? useTransform(scrollYProgress, [start, start + animationRange], [yStart, yEnd])
    : undefined;

  const opacity = enableAnimation
    ? useTransform(scrollYProgress, [start, start + animationRange], [opacityStart, opacityEnd])
    : undefined;

  const baseCardClass = "rounded-2xl bg-white p-6 shadow-xl";
  const baseImageClass = "relative mb-4 h-64 w-full overflow-hidden rounded-xl";
  const baseTitleClass = "mb-2 text-2xl font-semibold";
  const baseDescClass = "text-neutral-500";

  return (
    <motion.div
      style={enableAnimation ? { y, opacity } : undefined}
      className={`${baseCardClass} ${cardClassName}`}
    >
      <div className={`${baseImageClass} ${imageClassName}`}>
        <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
      </div>

      <h3 className={`${baseTitleClass} ${titleClassName}`}>{item.title}</h3>

      <p className={`${baseDescClass} ${descriptionClassName}`}>{item.description}</p>
    </motion.div>
  );
}

export function StickyScroll({
  title,
  subtitle,
  items,
  cardClassName,
  imageClassName,
  titleClassName,
  descriptionClassName,
  sectionClassName = "",
  containerClassName = "",
  stickyContentClassName = "",
  cardsContainerClassName = "",
  cardSpacing = "space-y-20",
  enableAnimation = false,
  animationConfig,
  renderCustomCard,
}: StickyScrollProps) {
  const sectionRef = useRef<HTMLDivElement | null>(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start center", "end start"],
  });

  const baseSectionClass = "bg-[#F4F4F4] py-32";
  const baseContainerClass = "mx-auto grid max-w-7xl grid-cols-1 gap-16 px-6 md:grid-cols-2";
  const baseStickyClass = "md:sticky md:top-1/2 h-fit";

  return (
    <section ref={sectionRef} className={`${baseSectionClass} ${sectionClassName}`}>
      <div className={`${baseContainerClass} ${containerClassName}`}>
        {/* LEFT – STICKY */}
        <div className={`${baseStickyClass} ${stickyContentClassName}`}>
          <h2 className="mb-6 text-4xl font-bold">{title}</h2>
          <p className="text-lg leading-relaxed text-black/60">{subtitle}</p>
        </div>

        {/* RIGHT – CARDS */}
        <div className={`${cardSpacing} ${cardsContainerClassName}`}>
          {items.map((item, index) =>
            renderCustomCard ? (
              <div key={index}>{renderCustomCard(item, index)}</div>
            ) : (
              <FeatureCard
                key={index}
                item={item}
                index={index}
                totalItems={items.length}
                scrollYProgress={scrollYProgress}
                enableAnimation={enableAnimation}
                animationConfig={animationConfig}
                cardClassName={cardClassName}
                imageClassName={imageClassName}
                titleClassName={titleClassName}
                descriptionClassName={descriptionClassName}
              />
            )
          )}
        </div>
      </div>
    </section>
  );
}

export default StickyScroll;