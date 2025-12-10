import StickyScroll, { StickyScrollProps } from "./StickyScroll";

export function RevealStickyScroll(props: StickyScrollProps) {
  return (
    <StickyScroll
      {...props}
      enableAnimation
      animationConfig={{
        yStart: 80,
        yEnd: 0,
        opacityStart: 0,
        opacityEnd: 1,
        animationRange: 0.22,
      }}
      cardClassName="scale-95 will-change-transform"
    />
  );
}
