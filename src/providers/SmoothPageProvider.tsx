"use client";

import { ReactNode, useEffect, useRef } from "react";

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

export function SmoothPageProvider({
  children,
}: {
  children: ReactNode;
}) {
  const current = useRef(0);
  const target = useRef(0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      target.current += e.deltaY;
      target.current = Math.max(
        0,
        Math.min(target.current, document.body.scrollHeight - window.innerHeight)
      );
    };

    const update = () => {
      current.current += (target.current - current.current) * 0.08;

      window.scrollTo(0, current.current);

      if (Math.abs(target.current - current.current) > 0.5) {
        raf.current = requestAnimationFrame(update);
      } else {
        raf.current = null;
      }
    };

    const start = () => {
      if (!raf.current) update();
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("wheel", start);

    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("wheel", start);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, []);

  return <>{children}</>;
}
