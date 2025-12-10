"use client";

import { useEffect, useRef } from "react";

interface SmoothSectionProps {
  children: React.ReactNode;
  height?: number | string;         // container height
  ease?: number;                    // smoothing factor
  inertia?: boolean;                // mobile inertia
  parallax?: boolean;               // optional parallax effect
  parallaxStrength?: number;        // how strong parallax movement is
}

export function SmoothSection({
  children,
  height = "500px",
  ease = 0.1,
  inertia = true,
  parallax = false,
  parallaxStrength = 0.15,
}: SmoothSectionProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);

  const scrollY = useRef(0);
  const targetY = useRef(0);
  const velocity = useRef(0);

  useEffect(() => {
    const container = containerRef.current;
    const content = contentRef.current;

    if (!container || !content) return;

    container.style.overflowY = "scroll";
    container.style.position = "relative";
    container.style.willChange = "transform";

    const handleScroll = () => {
      targetY.current = container.scrollTop;
    };

    container.addEventListener("scroll", handleScroll);

    const animate = () => {
      const diff = targetY.current - scrollY.current;

      // inertia effect (mobile-like momentum)
      if (inertia) {
        velocity.current += diff * ease;
        velocity.current *= 0.8; // friction
        scrollY.current += velocity.current;
      } else {
        scrollY.current += diff * ease;
      }

      // smooth transform
      content.style.transform = `translateY(${-scrollY.current}px)`;

      // parallax
      if (parallax) {
        const parallaxValue = scrollY.current * parallaxStrength;

        content.style.opacity = `${1 - Math.min(0.5, parallaxValue / 600)}`;
        content.style.scale = `${1 - Math.min(0.1, parallaxValue / 2000)}`;
      }

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, [ease, inertia, parallax, parallaxStrength]);

  return (
    <div
      ref={containerRef}
      style={{
        height,
        overflow: "hidden",
      }}
    >
      <div ref={contentRef} style={{ willChange: "transform" }}>
        {children}
      </div>
    </div>
  );
}
