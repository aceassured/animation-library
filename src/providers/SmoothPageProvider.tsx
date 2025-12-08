"use client";

import { ReactNode, useEffect, useRef } from "react";
import Lenis from "@studio-freight/lenis";

export function SmoothPageProvider({ children }: { children: ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const lenis = new Lenis({
      // ⭐ THESE CONTROL THE "CHEESE FEEL"
      duration: 1.2,             // longer = smoother
      easing: (t: number) => 1 - Math.pow(1 - t, 3), // butter curve
      smoothWheel: true,          // mouse wheel inertia ✅
      touchMultiplier: 1.5,
      wheelMultiplier: 1.0,
      infinite: false,
    });

    lenisRef.current = lenis;

    function raf(time: number) {
      lenis.raf(time);
      rafRef.current = requestAnimationFrame(raf);
    }

    rafRef.current = requestAnimationFrame(raf);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
