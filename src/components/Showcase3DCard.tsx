import React, { useEffect, useRef } from 'react';

interface Showcase3DCardProps {
  children: React.ReactNode;
  className?: string;
  maxTiltDeg?: number;
}

/**
 * Ultra-subtle minimalist 3D showroom wrapper.
 * - Computes pointer-driven tilt and cursor-following specular sheen via direct DOM
 *   CSS variables throttled by requestAnimationFrame (zero React re-renders, zero idle loops).
 * - Automatically disables cursor tilt on coarse/touch pointers & prefers-reduced-motion,
 *   providing lightweight touch-responsive feedback on mobile.
 */
export function Showcase3DCard({
  children,
  className = '',
  maxTiltDeg = 3.8,
}: Showcase3DCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const sheenRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const pointerPosRef = useRef({ nx: 0, ny: 0, px: 50, py: 50 });

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, []);

  const canUseFineTilt = () => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    const fine = window.matchMedia('(pointer: fine)').matches;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    return fine && !reduced;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse' && !canUseFineTilt()) return;
    if (!canUseFineTilt()) return;

    const el = cardRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const relX = (e.clientX - rect.left) / rect.width;
    const relY = (e.clientY - rect.top) / rect.height;

    pointerPosRef.current = {
      nx: (relX - 0.5) * 2, // -1 .. +1
      ny: (relY - 0.5) * 2,
      px: Math.max(0, Math.min(100, relX * 100)),
      py: Math.max(0, Math.min(100, relY * 100)),
    };

    if (rafRef.current !== null) return;
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = null;
      const node = cardRef.current;
      const sheen = sheenRef.current;
      if (!node) return;

      const { nx, ny, px, py } = pointerPosRef.current;
      const rotateY = (nx * maxTiltDeg).toFixed(2);
      const rotateX = (-ny * maxTiltDeg).toFixed(2);

      node.style.transform = `perspective(1100px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translate3d(0, -3px, 0)`;
      if (sheen) {
        sheen.style.opacity = '1';
        sheen.style.background = `radial-gradient(420px circle at ${px}% ${py}%, rgba(139, 92, 246, 0.13), rgba(226, 232, 240, 0.08) 42%, transparent 72%)`;
      }
    });
  };

  const handlePointerLeave = () => {
    if (rafRef.current !== null) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    const node = cardRef.current;
    const sheen = sheenRef.current;
    if (node) {
      node.style.transform = 'perspective(1100px) rotateX(0deg) rotateY(0deg) translate3d(0, 0, 0)';
    }
    if (sheen) {
      sheen.style.opacity = '0';
    }
  };

  return (
    <div
      ref={cardRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className={`showcase-3d-surface relative active:scale-[0.99] transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform ${className}`}
    >
      <div
        ref={sheenRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-200 z-10"
      />
      {children}
    </div>
  );
}
