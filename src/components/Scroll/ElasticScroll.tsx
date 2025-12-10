"use client";

import { useEffect, useRef } from "react";

export function ElasticScroll({
  children,
  height = "500px",
  ease = 0.12,
  elasticity = 0.25,
}: {
  children: React.ReactNode;
  height?: string | number;
  ease?: number;
  elasticity?: number;
}) {
  const wrapper = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);

  const pos = useRef(0);
  const target = useRef(0);
  const max = useRef(0);

  useEffect(() => {
    const w = wrapper.current!;
    const c = content.current!;

    const measure = () => {
      max.current = c.scrollHeight - w.clientHeight;
    };
    measure();

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      target.current += e.deltaY;

      if (target.current < 0) target.current *= elasticity;

      if (target.current > max.current)
        target.current =
          max.current + (target.current - max.current) * elasticity;
    };

    w.addEventListener("wheel", onWheel, { passive: false });

    const raf = () => {
      pos.current += (target.current - pos.current) * ease;
      pos.current = Math.max(-80, Math.min(pos.current, max.current + 80));
      c.style.transform = `translate3d(0, ${-pos.current}px, 0)`;
      requestAnimationFrame(raf);
    };

    raf();

    return () => w.removeEventListener("wheel", onWheel);
  }, [ease, elasticity]);

  return (
    <div ref={wrapper} style={{ height, overflow: "hidden" }}>
      <div ref={content} style={{ willChange: "transform" }}>
        {children}
      </div>
    </div>
  );
}
