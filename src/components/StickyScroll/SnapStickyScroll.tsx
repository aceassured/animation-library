import StickyScroll, { StickyScrollProps } from "./StickyScroll";

export function SnapStickyScroll(props: StickyScrollProps) {
  return (
    <StickyScroll
      {...props}
      cardSpacing="space-y-0"
      cardsContainerClassName="snap-y snap-mandatory"
      cardClassName="snap-start"
      enableAnimation
      animationConfig={{
        yStart: 80,
        yEnd: 0,
        opacityStart: 0,
        opacityEnd: 1,
        animationRange: 0.12,
      }}
    />
  );
}
