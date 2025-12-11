// FadeHorizontalStickyScroll.tsx
"use client";

import React from "react";
import { motion, useTransform, MotionValue } from "framer-motion";
import HorizontalStickyScroll, {
  HorizontalStickyScrollProps,
  DEFAULT_CARD,
} from "./HorizontalStickyScroll";
import { StickyScrollItem } from "./StickyScroll";

/**
 * FadeCard is a proper React component so we can use hooks (useTransform) safely.
 * It receives the scrollYProgress MotionValue from HorizontalStickyScroll.
 */
function FadeCard({
  item,
  index,
  totalItems,
  scrollYProgress,
}: {
  item: StickyScrollItem;
  index: number;
  totalItems: number;
  scrollYProgress: MotionValue<number>;
}) {
  const range = 0.18; // how long each card's animation spans
  const start = index / totalItems;
  const end = Math.min(1, start + range);

  const opacity = useTransform(scrollYProgress, [start, end], [0, 1]);
  const translateX = useTransform(scrollYProgress, [start, end], [80, 0]);

  return (
    <motion.div style={{ opacity, x: translateX }}>
      {DEFAULT_CARD(item)}
    </motion.div>
  );
}

/**
 * FadeHorizontalStickyScroll – wrapper that passes a custom renderer into HorizontalStickyScroll
 */
export function FadeHorizontalStickyScroll(
  props: Omit<HorizontalStickyScrollProps, "renderCustomCard">
) {
  return (
    <HorizontalStickyScroll
      {...(props as HorizontalStickyScrollProps)}
      renderCustomCard={(item, index, scrollYProgress, totalItems) => (
        <FadeCard
          key={`${item.title}-${index}`}
          item={item}
          index={index}
          totalItems={totalItems}
          scrollYProgress={scrollYProgress}
        />
      )}
    />
  );
}

export default FadeHorizontalStickyScroll;
