"use client";

import { useEffect, useRef } from "react";

interface ButterScrollProps {
  children: React.ReactNode;
  height?: string | number;
  smoothness?: number;   // lower = smoother
  wheelSpeed?: number;
}

export function ButterScroll({
  children,
  height = "500px",
  smoothness = 0.06,
  wheelSpeed = 0.8,
}: ButterScrollProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  const current = useRef(0);
  const target = useRef(0);
  const raf = useRef<number | null>(null);
  const maxScroll = useRef(0);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const content = contentRef.current;
    if (!wrapper || !content) return;

    const measure = () => {
      maxScroll.current = content.scrollHeight - wrapper.clientHeight;
    };

    measure();
    window.addEventListener("resize", measure);

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();

      target.current += e.deltaY * wheelSpeed;
      target.current = Math.max(0, Math.min(target.current, maxScroll.current));
    };

    wrapper.addEventListener("wheel", onWheel, { passive: false });

    const animate = () => {
      current.current += (target.current - current.current) * smoothness;

      content.style.transform = `translate3d(0, ${-current.current}px, 0)`;

      raf.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      wrapper.removeEventListener("wheel", onWheel);
      window.removeEventListener("resize", measure);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [smoothness, wheelSpeed]);

  return (
    <div
      ref={wrapperRef}
      style={{
        height,
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div
        ref={contentRef}
        style={{
          willChange: "transform",
        }}
      >
        {children}
      </div>
    </div>
  );
}
