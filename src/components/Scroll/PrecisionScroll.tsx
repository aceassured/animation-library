"use client";
import { useEffect, useRef } from "react";

export function PrecisionScroll({
  children,
  height = "500px",
  wheelSpeed = 1.2,
}: {
  children: React.ReactNode;
  height?: string | number;
  wheelSpeed?: number;
}) {
  const wrapper = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const y = useRef(0);
  const max = useRef(0);

  useEffect(() => {
    const w = wrapper.current!;
    const c = content.current!;

    const measure = () => {
      max.current = c.scrollHeight - w.clientHeight;
    };

    measure();
    window.addEventListener("resize", measure);

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      y.current += e.deltaY * wheelSpeed;
      y.current = Math.max(0, Math.min(y.current, max.current));
      c.style.transform = `translate3d(0, ${-y.current}px, 0)`;
    };

    w.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      w.removeEventListener("wheel", onWheel);
      window.removeEventListener("resize", measure);
    };
  }, [wheelSpeed]);

  return (
    <div ref={wrapper} style={{ height, overflow: "hidden" }}>
      <div ref={content} style={{ willChange: "transform" }}>
        {children}
      </div>
    </div>
  );
}
