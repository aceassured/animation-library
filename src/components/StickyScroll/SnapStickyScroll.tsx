import StickyScroll, { StickyScrollProps } from "./StickyScroll";

export function SnapStickyScroll(props: StickyScrollProps) {
  return (
    <StickyScroll
      {...props}
      enableAnimation
      animationConfig={{
        yStart: 120,
        yEnd: 0,
        opacityStart: 0,
        opacityEnd: 1,
        animationRange: 0.1,
      }}
      cardsContainerClassName="snap-y snap-mandatory"
      cardClassName="snap-start"
    />
  );
}
