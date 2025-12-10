import StickyScroll, { StickyScrollProps } from "./StickyScroll";

export function ParallaxStickyScroll(props: StickyScrollProps) {
  return (
    <StickyScroll
      {...props}
      enableAnimation
      animationConfig={{
        yStart: 120,
        yEnd: -20, // 👈 parallax drift
        opacityStart: 0,
        opacityEnd: 1,
        animationRange: 0.3,
      }}
    />
  );
}
