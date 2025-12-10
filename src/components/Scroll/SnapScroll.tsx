"use client";

import { useEffect, useRef } from "react";


export function SnapScroll({
  children,
  height = "500px",
  snapSize = 300,
  ease = 0.15,
}: {
  children: React.ReactNode;
  height?: string | number;
  snapSize?: number;
  ease?: number;
}) {
  const wrapper = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);

  const current = useRef(0);
  const target = useRef(0);
  const max = useRef(0);

  useEffect(() => {
    const w = wrapper.current!;
    const c = content.current!;

    max.current = c.scrollHeight - w.clientHeight;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      target.current += Math.sign(e.deltaY) * snapSize;
      target.current = Math.max(0, Math.min(target.current, max.current));
    };

    w.addEventListener("wheel", onWheel, { passive: false });

    const raf = () => {
      current.current += (target.current - current.current) * ease;
      c.style.transform = `translate3d(0, ${-current.current}px, 0)`;
      requestAnimationFrame(raf);
    };

    raf();

    return () => w.removeEventListener("wheel", onWheel);
  }, [snapSize, ease]);

  return (
    <div ref={wrapper} style={{ height, overflow: "hidden" }}>
      <div ref={content} style={{ willChange: "transform" }}>
        {children}
      </div>
    </div>
  );
}