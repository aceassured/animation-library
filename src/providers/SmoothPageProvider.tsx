"use client";

import Lenis from "lenis";
import { ReactNode, useEffect, useRef } from "react";

export function SmoothPageProvider({ children }: { children: ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    // const lenis = new Lenis({
    //   duration: 1.2,
    //   easing: (t) => 1 - Math.pow(1 - t, 3),
    //   smoothWheel: true,
    //   wheelMultiplier: 1,
    //   touchMultiplier: 1.5,

    //   // ✅ THIS IS THE KEY FIX
    //   prevent: (node) => {
    //     if (!(node instanceof HTMLElement)) return false;

    //     const style = window.getComputedStyle(node);
    //     const overflowY = style.overflowY;

    //     return (
    //       (overflowY === "auto" || overflowY === "scroll") &&
    //       node.scrollHeight > node.clientHeight
    //     );
    //   },
    // });

    const lenis = new Lenis({
      duration: 0.9, // ✅ faster completion
      easing: (t) => 1 - Math.pow(1 - t, 4),
      smoothWheel: true,
      wheelMultiplier: 1.25, // ✅ stronger scroll
      touchMultiplier: 1.5,

      prevent: (node) => {
        if (!(node instanceof HTMLElement)) return false;

        const style = window.getComputedStyle(node);
        return (
          (style.overflowY === "auto" || style.overflowY === "scroll") &&
          node.scrollHeight > node.clientHeight
        );
      },
    });

    lenisRef.current = lenis;

    const raf = (time: number) => {
      lenis.raf(time);
      rafRef.current = requestAnimationFrame(raf);
    };

    rafRef.current = requestAnimationFrame(raf);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
