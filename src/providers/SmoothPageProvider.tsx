"use client";

import { ReactNode, useEffect, useRef } from "react";

function isScrollable(el: HTMLElement | null): boolean {
  if (!el) return false;

  const style = window.getComputedStyle(el);
  const overflowY = style.overflowY;

  return (
    (overflowY === "auto" || overflowY === "scroll") &&
    el.scrollHeight > el.clientHeight
  );
}

export function SmoothPageProvider({ children }: { children: ReactNode }) {
  const current = useRef(0);
  const target = useRef(0);
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const onWheel = (e: WheelEvent) => {
      let el = e.target as HTMLElement | null;

      // ✅ ALLOW native scrolling inside scrollable containers
      while (el) {
        if (isScrollable(el)) return;
        el = el.parentElement;
      }

      e.preventDefault();

      target.current += e.deltaY;
      target.current = Math.max(
        0,
        Math.min(
          target.current,
          document.documentElement.scrollHeight - window.innerHeight
        )
      );

      if (!raf.current) update();
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

    window.addEventListener("wheel", onWheel, { passive: false });

    return () => {
      window.removeEventListener("wheel", onWheel);
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, []);

  return <>{children}</>;
}
