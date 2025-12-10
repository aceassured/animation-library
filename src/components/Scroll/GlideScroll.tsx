"use client";

import { useEffect, useRef } from "react";

export function GlideScroll({
  children,
  height = "500px",
  glide = 0.04, // much smoother than butter
  friction = 0.92,
}: {
  children: React.ReactNode;
  height?: string | number;
  glide?: number;
  friction?: number;
}) {
  const wrapper = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);

  const pos = useRef(0);
  const momentum = useRef(0);
  const max = useRef(0);

  useEffect(() => {
    const w = wrapper.current!;
    const c = content.current!;

    const measure = () => {
      max.current = c.scrollHeight - w.clientHeight;
    };
    measure();
    window.addEventListener("resize", measure);

    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      momentum.current += e.deltaY * 0.5;
    };

    w.addEventListener("wheel", wheel, { passive: false });

    const raf = () => {
      momentum.current *= friction;
      pos.current += momentum.current * glide;

      pos.current = Math.max(0, Math.min(pos.current, max.current));

      c.style.transform = `translate3d(0, ${-pos.current}px, 0)`;

      requestAnimationFrame(raf);
    };

    raf();

    return () => {
      w.removeEventListener("wheel", wheel);
      window.removeEventListener("resize", measure);
    };
  }, [glide, friction]);

  return (
    <div ref={wrapper} style={{ height, overflow: "hidden" }}>
      <div ref={content}>{children}</div>
    </div>
  );
}
