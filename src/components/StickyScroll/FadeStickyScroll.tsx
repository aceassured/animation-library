import { StickyScroll, StickyScrollProps } from "./StickyScroll";

export function FadeStickyScroll(props: StickyScrollProps) {
  return (
    <StickyScroll
      {...props}
      enableAnimation
      animationConfig={{
        yStart: 60,
        yEnd: 0,
        opacityStart: 0,
        opacityEnd: 1,
        animationRange: 0.15,
      }}
    />
  );
}
