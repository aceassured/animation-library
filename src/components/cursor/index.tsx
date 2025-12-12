import React, { useEffect, useRef, useState } from "react";
import FluidRainbowCursor from "./FluidRainbowCursor";

/**
 * 1) SplashCursor
 */
export function SplashCursor() {
  const mainRef = useRef<HTMLDivElement | null>(null);
  const glowRef = useRef<HTMLDivElement | null>(null);
  const trailRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const main = mainRef.current;
    const glow = glowRef.current;
    const trail = trailRef.current;
    if (!main || !glow || !trail) return;

    let mouseX = 0;
    let mouseY = 0;
    let posX = 0;
    let posY = 0;
    let animationId = 0;

    const lerp = (s: number, e: number, f: number) => s + (e - s) * f;

    const move = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const animate = () => {
      posX = lerp(posX, mouseX, 0.2);
      posY = lerp(posY, mouseY, 0.2);

      main.style.left = `${mouseX}px`;
      main.style.top = `${mouseY}px`;

      glow.style.left = `${posX}px`;
      glow.style.top = `${posY}px`;

      trail.style.left = `${posX}px`;
      trail.style.top = `${posY}px`;

      animationId = requestAnimationFrame(animate);
    };
    animate();

    const click = () => {
      glow.classList.add("scale-[1.8]", "opacity-[0.25]");
      setTimeout(() => {
        glow.classList.remove("scale-[1.8]", "opacity-[0.25]");
      }, 250);
    };

    window.addEventListener("mousemove", move);
    window.addEventListener("click", click);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("mousemove", move);
      window.removeEventListener("click", click);
    };
  }, []);

  return (
    <>
      <div
        ref={mainRef}
        className="pointer-events-none fixed z-[9999] w-4 h-4 bg-white rounded-full mix-blend-difference -translate-x-1/2 -translate-y-1/2"
      />
      <div
        ref={glowRef}
        className="pointer-events-none fixed z-[9998] w-40 h-40 rounded-full bg-[radial-gradient(circle,rgba(255,0,200,0.6),rgba(0,200,255,0.2),transparent)] blur-3xl opacity-70 transition-all duration-300 ease-out -translate-x-1/2 -translate-y-1/2"
      />
      <div
        ref={trailRef}
        className="pointer-events-none fixed z-[9997] w-[300px] h-[300px] rounded-full bg-[radial-gradient(circle,rgba(255,0,150,0.5),rgba(0,150,255,0.3),transparent)] blur-[80px] opacity-40 -translate-x-1/2 -translate-y-1/2"
      />
    </>
  );
}

/**
 * 2) InvertedCursor
 */
export function InvertedCursor() {
  const cursorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;
    const move = (e: MouseEvent) => {
      cursor.style.left = `${e.clientX}px`;
      cursor.style.top = `${e.clientY}px`;
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);

  return (
    <div
      ref={cursorRef}
      className="pointer-events-none fixed z-[9999] w-8 h-8 rounded-full bg-white mix-blend-difference transition-all duration-75 ease-out -translate-x-1/2 -translate-y-1/2"
    />
  );
}

/**
 * 3) NeonRingCursor
 */
export function NeonRingCursor() {
  const outerRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;

    let mouseX = 0;
    let mouseY = 0;
    let outerX = 0;
    let outerY = 0;
    let animationId = 0;

    const lerp = (s: number, e: number, f: number) => s + (e - s) * f;

    const move = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      inner.style.left = `${mouseX}px`;
      inner.style.top = `${mouseY}px`;
    };

    const animate = () => {
      outerX = lerp(outerX, mouseX, 0.15);
      outerY = lerp(outerY, mouseY, 0.15);
      outer.style.left = `${outerX}px`;
      outer.style.top = `${outerY}px`;
      animationId = requestAnimationFrame(animate);
    };

    animate();
    window.addEventListener("mousemove", move);
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("mousemove", move);
    };
  }, []);

  return (
    <>
      <div
        ref={outerRef}
        className="pointer-events-none fixed z-[9999] w-10 h-10 rounded-full border-2 border-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.8)] -translate-x-1/2 -translate-y-1/2"
      />
      <div
        ref={innerRef}
        className="pointer-events-none fixed z-[10000] w-2 h-2 rounded-full bg-cyan-400 -translate-x-1/2 -translate-y-1/2"
      />
    </>
  );
}

/**
 * 4) MagneticCursor
 */
export function MagneticCursor() {
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const isPressedRef = useRef(false);

  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;

    const move = (e: MouseEvent) => {
      cursor.style.left = `${e.clientX}px`;
      cursor.style.top = `${e.clientY}px`;
      cursor.style.transform = `translate(-50%, -50%) scale(${
        isPressedRef.current ? 1.5 : 1
      })`;
    };

    const mouseDown = () => (isPressedRef.current = true);
    const mouseUp = () => (isPressedRef.current = false);

    window.addEventListener("mousemove", move);
    window.addEventListener("mousedown", mouseDown);
    window.addEventListener("mouseup", mouseUp);

    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mousedown", mouseDown);
      window.removeEventListener("mouseup", mouseUp);
    };
  }, []);

  return (
    <div
      ref={cursorRef}
      className="pointer-events-none fixed z-[9999] w-10 h-10 rounded-full border-2 border-white bg-white/20 backdrop-blur-sm transition-all duration-200 ease-out -translate-x-1/2 -translate-y-1/2"
    />
  );
}

/**
 * 5) ParticleTrailCursor
 */
export function ParticleTrailCursor({
  max = 80,
  chance = 0.3,
}: {
  max?: number;
  chance?: number;
}) {
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const [particles, setParticles] = useState<
    Array<{ id: number; x: number; y: number }>
  >([]);
  const idRef = useRef(0);

  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;

    const move = (e: MouseEvent) => {
      cursor.style.left = `${e.clientX}px`;
      cursor.style.top = `${e.clientY}px`;

      if (Math.random() < chance) {
        const id = idRef.current++;
        const newParticle = { id, x: e.clientX, y: e.clientY };
        setParticles((prev) => {
          const next = [...prev, newParticle].slice(-max);
          return next;
        });
        setTimeout(() => {
          setParticles((prev) => prev.filter((p) => p.id !== id));
        }, 1000);
      }
    };

    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, [chance, max]);

  return (
    <>
      <div
        ref={cursorRef}
        className="pointer-events-none fixed z-[9999] w-3 h-3 rounded-full bg-white shadow-lg -translate-x-1/2 -translate-y-1/2"
      />
      {particles.map((p) => (
        <div
          key={p.id}
          className="pointer-events-none fixed z-[9998] w-2 h-2 rounded-full bg-white animate-[fade-out_1s_ease-out_forwards] -translate-x-1/2 -translate-y-1/2"
          style={{ left: p.x, top: p.y }}
        />
      ))}
    </>
  );
}

/**
 * 6) RippleCursor
 * - Creates ripple elements on click and uses Web Animations API where available.
 */
export function RippleCursor() {
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const [ripples, setRipples] = useState<
    { id: number; x: number; y: number }[]
  >([]);
  const idRef = useRef(0);

  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;

    const move = (e: MouseEvent) => {
      cursor.style.left = `${e.clientX}px`;
      cursor.style.top = `${e.clientY}px`;
    };

    const click = (e: MouseEvent) => {
      const id = idRef.current++;
      setRipples((r) => [...r, { id, x: e.clientX, y: e.clientY }]);

      setTimeout(() => {
        setRipples((r) => r.filter((rp) => rp.id !== id));
      }, 600);
    };

    window.addEventListener("mousemove", move);
    window.addEventListener("click", click);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("click", click);
    };
  }, []);

  // Minimal keyframes inline for the fade used by Tailwind-like animate class
  // Your environment likely has Tailwind; if not, the animation still works via transition
  return (
    <>
      <div
        ref={cursorRef}
        className="pointer-events-none fixed z-[9999] w-4 h-4 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"
      />
      {ripples.map((r) => (
        <span
          key={r.id}
          className="pointer-events-none fixed z-[9998] border border-white rounded-full opacity-50"
          style={{
            left: r.x,
            top: r.y,
            width: 4,
            height: 4,
            transform: "translate(-50%, -50%)",
            animation: "ripple 0.6s ease-out forwards",
          }}
        />
      ))}

      <style>{`
        @keyframes ripple {
          from { width:4px; height:4px; opacity:0.6; }
          to { width:80px; height:80px; opacity:0; }
        }
        @keyframes fade-out {
          from { opacity:1; transform:translate(-50%,-50%) scale(1); }
          to { opacity:0; transform:translate(-50%,-50%) scale(0.3); }
        }
      `}</style>
    </>
  );
}

/**
 * 7) FireflyCursor
 */
export function FireflyCursor() {
  const [flies, setFlies] = useState<{ id: number; x: number; y: number }[]>(
    []
  );
  const idRef = useRef(0);

  useEffect(() => {
    const move = (e: MouseEvent) => {
      const id = idRef.current++;
      setFlies((prev) => [...prev, { id, x: e.clientX, y: e.clientY }]);
      setTimeout(() => {
        setFlies((prev) => prev.filter((f) => f.id !== id));
      }, 1200);
    };

    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);

  return (
    <>
      {flies.map((fly) => (
        <div
          key={fly.id}
          className="pointer-events-none fixed w-1.5 h-1.5 rounded-full bg-yellow-300"
          style={{
            left: fly.x,
            top: fly.y,
            animation: "fly 1.2s linear forwards",
          }}
        />
      ))}
      <style>{`
        @keyframes fly {
          from { opacity:1; transform: translate(0,0) scale(1); }
          to { opacity:0; transform: translate(-10px,-20px) scale(0.4); }
        }
      `}</style>
    </>
  );
}

/**
 * 8) PixelCursor
 */
export function PixelCursor() {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const move = (e: MouseEvent) => {
      el.style.left = `${e.clientX}px`;
      el.style.top = `${e.clientY}px`;
      el.style.backgroundColor = `hsl(${Math.random() * 360}, 80%, 50%)`;
    };

    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);

  return (
    <div
      ref={ref}
      className="pointer-events-none fixed w-4 h-4 bg-slate-300 -translate-x-1/2 -translate-y-1/2"
    />
  );
}

/**
 * 9) ElasticRingCursor
 */
export function ElasticRingCursor() {
  const ringRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const ring = ringRef.current;
    if (!ring) return;

    let x = 0;
    let y = 0;

    const move = (e: MouseEvent) => {
      x += (e.clientX - x) * 0.25;
      y += (e.clientY - y) * 0.25;
      ring.style.left = `${x}px`;
      ring.style.top = `${y}px`;
    };

    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);

  return (
    <div
      ref={ringRef}
      className="pointer-events-none fixed w-12 h-12 border-2 border-purple-400 rounded-full blur-sm opacity-80 -translate-x-1/2 -translate-y-1/2"
    />
  );
}

/**
 * 10) ConstellationCursor
 */
export function ConstellationCursor() {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;

    const move = (e: MouseEvent) => {
      c.style.left = `${e.clientX}px`;
      c.style.top = `${e.clientY}px`;
    };

    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);

  return (
    <div
      ref={ref}
      className="pointer-events-none fixed -translate-x-1/2 -translate-y-1/2"
    >
      <div className="absolute w-10 h-10 border border-blue-300 rounded-full animate-spin-slow" />
      <div className="absolute w-6 h-6 border border-pink-300 rounded-full animate-spin-reverse-slow" />
      <div className="absolute w-3 h-3 bg-white rounded-full" />
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes spin-reverse { to { transform: rotate(-360deg); } }
        .animate-spin-slow { animation: spin 4s linear infinite; }
        .animate-spin-reverse-slow { animation: spin-reverse 5s linear infinite; }
      `}</style>
    </div>
  );
}

/**
 * 11) CometCursor
 */
export function CometCursor() {
  const cometRef = useRef<HTMLDivElement | null>(null);
  const lastXRef = useRef(0);
  const lastYRef = useRef(0);

  useEffect(() => {
    const comet = cometRef.current;
    if (!comet) return;

    const move = (e: MouseEvent) => {
      const lastX = lastXRef.current;
      const lastY = lastYRef.current;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      const speed = Math.sqrt(dx * dx + dy * dy) / 20;

      comet.style.left = `${e.clientX}px`;
      comet.style.top = `${e.clientY}px`;
      comet.style.transform = `translate(-50%, -50%) scaleX(${1 + speed})`;

      lastXRef.current = e.clientX;
      lastYRef.current = e.clientY;
    };

    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);

  return (
    <div
      ref={cometRef}
      className="pointer-events-none fixed z-[9999] w-20 h-3 bg-gradient-to-r from-white to-transparent blur-lg opacity-70 -translate-x-1/2 -translate-y-1/2"
    />
  );
}

/**
 * 12) PulseCursor
 */
export function PulseCursor() {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const cursor = ref.current;
    if (!cursor) return;

    const move = (e: MouseEvent) => {
      cursor.style.left = `${e.clientX}px`;
      cursor.style.top = `${e.clientY}px`;
    };

    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);

  return (
    <div
      ref={ref}
      className="pointer-events-none fixed w-8 h-8 rounded-full border-2 border-red-400 animate-pulse bg-red-400/20 -translate-x-1/2 -translate-y-1/2"
    />
  );
}

/**
 * 13) IceCursor
 */
export function IceCursor() {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const cursor = ref.current;
    if (!cursor) return;
    const move = (e: MouseEvent) => {
      cursor.style.left = `${e.clientX}px`;
      cursor.style.top = `${e.clientY}px`;
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);

  return (
    <div
      ref={ref}
      className="pointer-events-none fixed w-10 h-10 bg-[url('/snowflake.svg')] bg-cover opacity-80 drop-shadow-md -translate-x-1/2 -translate-y-1/2"
    />
  );
}

/**
 * 14) LavaCursor
 */
export function LavaCursor() {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const cursor = ref.current;
    if (!cursor) return;

    const move = (e: MouseEvent) => {
      cursor.style.left = `${e.clientX}px`;
      cursor.style.top = `${e.clientY}px`;
      cursor.style.transform = `translate(-50%, -50%) scale(${
        1 + Math.random() * 0.2
      })`;
    };

    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);

  return (
    <div
      ref={ref}
      className="pointer-events-none fixed w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-full blur-lg opacity-70 -translate-x-1/2 -translate-y-1/2"
    />
  );
}

/**
 * 15) GridCursor
 */
export function GridCursor() {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const move = (e: MouseEvent) => {
      el.style.left = `${e.clientX}px`;
      el.style.top = `${e.clientY}px`;
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);
  return (
    <div
      ref={ref}
      className="pointer-events-none fixed w-16 h-16 bg-[radial-gradient(circle,rgba(0,255,200,0.3),transparent)] border border-cyan-300 backdrop-blur-sm -translate-x-1/2 -translate-y-1/2"
    />
  );
}

/**
 * 16) OrbTrailCursor
 */
export function OrbTrailCursor({ count = 3 }: { count?: number }) {
  const orbRefs = useRef<(HTMLDivElement | null)[]>([]);
  const orbs = Array.from({ length: count });

  useEffect(() => {
    let targetX = 0;
    let targetY = 0;
    let smoothX = 0;
    let smoothY = 0;
    let rafId: number | null = null;

    const move = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
    };

    const animate = () => {
      smoothX += (targetX - smoothX) * 0.15;
      smoothY += (targetY - smoothY) * 0.15;

      orbRefs.current.forEach((orb, index) => {
        if (!orb) return;
        const delay = (index + 1) * 12;
        orb.style.left = `${smoothX - delay}px`;
        orb.style.top = `${smoothY - delay}px`;
      });

      rafId = requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", move);
    rafId = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", move);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <>
      {orbs.map((_, i) => (
        <div
          key={i}
          ref={(el) => {
            orbRefs.current[i] = el;
          }}
          className="pointer-events-none fixed z-[9999] w-4 h-4 rounded-full bg-purple-300 blur-sm opacity-70 -translate-x-1/2 -translate-y-1/2"
        />
      ))}
    </>
  );
}

/**
 * 17) ElectricCursor
 */
export function ElectricCursor() {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const move = (e: MouseEvent) => {
      el.style.left = `${e.clientX}px`;
      el.style.top = `${e.clientY}px`;
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);
  return (
    <div
      ref={ref}
      className="pointer-events-none fixed w-6 h-6 rounded-full border border-yellow-300 shadow-[0_0_20px_rgba(255,255,0,0.6)] -translate-x-1/2 -translate-y-1/2"
      style={{ animation: "electric 0.6s infinite ease-in-out" }}
    />
  );
}

/**
 * 18) EmojiCursor
 */
export function EmojiCursor({
  emojis = ["🔥", "✨", "💫", "⚡", "🌟"],
}: {
  emojis?: string[];
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const move = (e: MouseEvent) => {
      el.style.left = `${e.clientX}px`;
      el.style.top = `${e.clientY}px`;
      el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, [emojis]);

  return (
    <div
      ref={ref}
      className="pointer-events-none fixed text-3xl -translate-x-1/2 -translate-y-1/2"
    />
  );
}

/**
 * 19) ShadowCloneCursor
 */
export function ShadowCloneCursor({ max = 3 }: { max?: number }) {
  const [clones, setClones] = useState<{ id: number; x: number; y: number }[]>(
    []
  );
  const idRef = useRef(0);

  useEffect(() => {
    const move = (e: MouseEvent) => {
      const id = idRef.current++;
      setClones((prev) => [
        ...prev.slice(-max + 1),
        { id, x: e.clientX, y: e.clientY },
      ]);
      setTimeout(() => {
        setClones((prev) => prev.filter((c) => c.id !== id));
      }, 800);
    };

    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, [max]);

  return (
    <>
      {clones.map((c) => (
        <div
          key={c.id}
          className="pointer-events-none fixed w-4 h-4 bg-white rounded-full opacity-40 -translate-x-1/2 -translate-y-1/2"
          style={{ left: c.x, top: c.y, animation: "fadeOut 0.8s forwards" }}
        />
      ))}
      <style>{`
        @keyframes fadeOut { from { opacity: .4 } to { opacity: 0 } }
        @keyframes electric { 0%,100% { transform: scale(1) } 50% { transform: scale(1.15) } }
      `}</style>
    </>
  );
}

export function LiquidBlobCursor() {
  const mainRef = useRef<HTMLDivElement | null>(null);
  const glowRef = useRef<HTMLDivElement | null>(null);
  const trailRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const main = mainRef.current;
    const glow = glowRef.current;
    const trail = trailRef.current;
    if (!main || !glow || !trail) return;

    let mouseX = 0;
    let mouseY = 0;
    let posX = 0;
    let posY = 0;
    let animationId: number;

    const lerp = (start: number, end: number, t: number) =>
      start + (end - start) * t;

    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const animate = () => {
      posX = lerp(posX, mouseX, 0.18);
      posY = lerp(posY, mouseY, 0.18);

      // main snaps to exact mouse for crisp center point
      main.style.left = `${mouseX}px`;
      main.style.top = `${mouseY}px`;

      // glow & trail ease towards smoothed position
      glow.style.left = `${posX}px`;
      glow.style.top = `${posY}px`;

      trail.style.left = `${posX}px`;
      trail.style.top = `${posY}px`;

      animationId = requestAnimationFrame(animate);
    };

    animate();

    const onClick = () => {
      glow.classList.add("scale-[1.8]", "opacity-[0.25]");
      // ensure removal after effect (keeps class toggling predictable)
      const t = window.setTimeout(() => {
        glow.classList.remove("scale-[1.8]", "opacity-[0.25]");
        clearTimeout(t);
      }, 250);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("click", onClick);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("click", onClick);
    };
  }, []);

  return (
    <>
      <div
        ref={mainRef}
        className="pointer-events-none fixed z-[9999] w-4 h-4 bg-white rounded-full mix-blend-difference -translate-x-1/2 -translate-y-1/2"
      />
      <div
        ref={glowRef}
        className="pointer-events-none fixed z-[9998] w-40 h-40 rounded-full bg-[radial-gradient(circle,rgba(255,0,200,0.6),rgba(0,200,255,0.2),transparent)] blur-3xl opacity-70 transition-all duration-300 ease-out -translate-x-1/2 -translate-y-1/2"
      />
      <div
        ref={trailRef}
        className="pointer-events-none fixed z-[9997] w-[300px] h-[300px] rounded-full bg-[radial-gradient(circle,rgba(255,0,150,0.5),rgba(0,150,255,0.3),transparent)] blur-[80px] opacity-40 -translate-x-1/2 -translate-y-1/2"
      />
    </>
  );
}

/* Optional: default export map for convenience */
export default {
  SplashCursor,
  InvertedCursor,
  NeonRingCursor,
  MagneticCursor,
  ParticleTrailCursor,
  LiquidBlobCursor,
  RippleCursor,
  FireflyCursor,
  PixelCursor,
  ElasticRingCursor,
  ConstellationCursor,
  CometCursor,
  PulseCursor,
  IceCursor,
  LavaCursor,
  GridCursor,
  OrbTrailCursor,
  ElectricCursor,
  EmojiCursor,
  ShadowCloneCursor,
  FluidRainbowCursor,
};
