"use client";

import { useEffect, useRef } from "react";

export function GravityScroll({
  children,
  height = "500px",
  gravity = 0.003, // ✅ stronger gravity
  ease = 0.12, // ✅ slightly faster follow
  maxSpeed = 60, // ✅ prevent runaway
}: {
  children: React.ReactNode;
  height?: string | number;
  gravity?: number;
  ease?: number;
  maxSpeed?: number;
}) {
  const wrapper = useRef<HTMLDivElement>(null);
  const content = useRef<HTMLDivElement>(null);

  const pos = useRef(0);
  const target = useRef(0);
  const speed = useRef(0);

  useEffect(() => {
    const w = wrapper.current!;
    const c = content.current!;
    const max = c.scrollHeight - w.clientHeight;

    const wheel = (e: WheelEvent) => {
      e.preventDefault();

      // ✅ scale with deltaY for real devices
      speed.current += e.deltaY * gravity;

      // ✅ clamp speed
      speed.current = Math.max(-maxSpeed, Math.min(speed.current, maxSpeed));
    };

    w.addEventListener("wheel", wheel, { passive: false });

    const raf = () => {
      // ✅ air resistance
      speed.current *= 0.92;

      target.current += speed.current;
      target.current = Math.max(0, Math.min(target.current, max));

      pos.current += (target.current - pos.current) * ease;

      c.style.transform = `translate3d(0, ${-pos.current}px, 0)`;

      requestAnimationFrame(raf);
    };

    raf();

    return () => w.removeEventListener("wheel", wheel);
  }, [gravity, ease, maxSpeed]);

  return (
    <div ref={wrapper} style={{ height, overflow: "hidden" }}>
      <div ref={content} style={{ willChange: "transform" }}>
        {children}
      </div>
    </div>
  );
}
