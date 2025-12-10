"use client";

import { useEffect, useRef } from "react";

export function MomentumScroll({
  children,
  height = "500px",
  strength = 2.4,
  ease = 0.1,
}: {
  children: React.ReactNode;
  height?: string | number;
  strength?: number;
  ease?: number;
}) {
  const wrapper = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);

  const target = useRef(0);
  const pos = useRef(0);
  const max = useRef(0);

  useEffect(() => {
    const w = wrapper.current!;
    const c = content.current!;

    max.current = c.scrollHeight - w.clientHeight;

    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      target.current += e.deltaY * strength;
      target.current = Math.max(0, Math.min(target.current, max.current));
    };

    w.addEventListener("wheel", wheel, { passive: false });

    const raf = () => {
      pos.current += (target.current - pos.current) * ease;
      c.style.transform = `translate3d(0, ${-pos.current}px, 0)`;
      requestAnimationFrame(raf);
    };

    raf();

    return () => {
      w.removeEventListener("wheel", wheel);
    };
  }, [strength, ease]);

  return (
    <div ref={wrapper} style={{ height, overflow: "hidden" }}>
      <div ref={content}>{children}</div>
    </div>
  );
}
