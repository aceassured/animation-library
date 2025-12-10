"use client";

import { useEffect, useRef } from "react";

export function WaveScroll({
  children,
  height = "500px",
  intensity = 0.5,
  ease = 0.1,
}: {
  children: React.ReactNode;
  height?: string | number;
  intensity?: number;
  ease?: number;
}) {
  const wrapper = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);

  const pos = useRef(0);
  const target = useRef(0);
  const wave = useRef(0);

  useEffect(() => {
    const w = wrapper.current!;
    const c = content.current!;

    const max = c.scrollHeight - w.clientHeight;

    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      target.current += e.deltaY;
      target.current = Math.max(0, Math.min(target.current, max));
    };

    w.addEventListener("wheel", wheel, { passive: false });

    const raf = () => {
      pos.current += (target.current - pos.current) * ease;
      wave.current += (target.current - pos.current) * 0.01;

      const waveOffset = Math.sin(wave.current) * intensity * 20;

      c.style.transform = `translate3d(${waveOffset}px, ${-pos.current}px, 0)`;

      requestAnimationFrame(raf);
    };

    raf();

    return () => w.removeEventListener("wheel", wheel);
  }, [intensity, ease]);

  return (
    <div ref={wrapper} style={{ height, overflow: "hidden" }}>
      <div ref={content} style={{ willChange: "transform" }}>
        {children}
      </div>
    </div>
  );
}
