import React, { useEffect, useRef, useState } from 'react';

interface PixelParticle {
  homeX: number;
  homeY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  delay: number;
}

interface PixelTransitionSurfaceProps {
  children: React.ReactNode;
  transitionKey?: string | number;
  triggerOnMount?: boolean;
  className?: string;
  maxParticlesDesktop?: number;
  maxParticlesMobile?: number;
}

const SILVER_VIOLET_PALETTE = [
  '#e2e8f0', // crisp silver
  '#cbd5e1', // soft silver
  '#94a3b8', // slate silver
  '#a78bfa', // luminous violet
  '#7c3aed', // astra violet
  '#6d28d9', // deep violet
];

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Localized, DPR-aware HTML5 Canvas overlay that renders crisp silver-and-violet
 * square pixels reconstructing into sharp content (or dissolving & reconstructing on key switch).
 * Zero idle loops: RAF terminates immediately once settled (~340ms) and respects IntersectionObserver.
 */
export function PixelTransitionSurface({
  children,
  transitionKey,
  triggerOnMount = true,
  className = '',
  maxParticlesDesktop = 72,
  maxParticlesMobile = 34,
}: PixelTransitionSurfaceProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const prevKeyRef = useRef<string | number | undefined>(transitionKey);
  const hasTriggeredInitialRef = useRef(false);

  const [inView, setInView] = useState(false);

  // Observe visibility so off-screen elements never spend animation frames
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true);
            observer.disconnect();
            break;
          }
        }
      },
      { threshold: 0.12, rootMargin: '40px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const isKeySwitch = prevKeyRef.current !== transitionKey;
    prevKeyRef.current = transitionKey;

    const setDomOpacity = (val: number) => {
      if (contentRef.current) {
        contentRef.current.style.opacity = String(val);
      }
    };

    if (!inView) return;
    if (!isKeySwitch && hasTriggeredInitialRef.current) return;
    if (!isKeySwitch && !triggerOnMount) {
      setDomOpacity(1);
      return;
    }

    hasTriggeredInitialRef.current = true;

    if (prefersReducedMotion()) {
      setDomOpacity(1);
      return;
    }

    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) {
      setDomOpacity(1);
      return;
    }

    const rect = container.getBoundingClientRect();
    const width = Math.max(48, Math.round(rect.width));
    const height = Math.max(48, Math.round(rect.height));
    const isMobile = window.innerWidth < 768;
    const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1.5 : 2);

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      setDomOpacity(1);
      return;
    }

    const targetCount = isMobile ? maxParticlesMobile : maxParticlesDesktop;
    const aspect = width / height;
    const cols = Math.max(4, Math.round(Math.sqrt(targetCount * aspect)));
    const rows = Math.max(3, Math.round(targetCount / cols));
    const cellW = width / cols;
    const cellH = height / rows;

    const particles: PixelParticle[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if ((r * 7 + c * 11) % 4 === 0) continue;

        const homeX = (c + 0.5) * cellW;
        const homeY = (r + 0.5) * cellH;
        const angle = ((r * 31 + c * 17) % 360) * (Math.PI / 180);
        const driftDist = (isMobile ? 10 : 16) + ((r + c) % 4) * 5;
        const size = isMobile ? 3 + ((r + c) % 2) : 3.5 + ((r + c) % 3);

        particles.push({
          homeX,
          homeY,
          x: homeX + Math.cos(angle) * driftDist,
          y: homeY + Math.sin(angle) * driftDist,
          vx: Math.cos(angle) * driftDist,
          vy: Math.sin(angle) * driftDist,
          size,
          color: SILVER_VIOLET_PALETTE[(r * 3 + c * 5) % SILVER_VIOLET_PALETTE.length],
          alpha: 0.72 + ((r + c) % 3) * 0.08,
          delay: ((r + c) % 5) * 0.04,
        });
      }
    }

    const durationMs = isKeySwitch ? 360 : 300;
    const startTime = performance.now();
    setDomOpacity(isKeySwitch ? 0.55 : 0.78);

    const renderFrame = (now: number) => {
      const elapsed = now - startTime;
      const rawProgress = Math.min(1, elapsed / durationMs);
      const eased = 1 - Math.pow(1 - rawProgress, 3);

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      if (isKeySwitch) {
        if (rawProgress < 0.35) {
          const outT = rawProgress / 0.35;
          const outEase = 1 - Math.pow(1 - outT, 2);
          for (const p of particles) {
            const px = p.homeX + p.vx * 0.75 * outEase;
            const py = p.homeY + p.vy * 0.75 * outEase;
            ctx.globalAlpha = p.alpha * (0.35 + outEase * 0.55);
            ctx.fillStyle = p.color;
            ctx.fillRect(px - p.size * 0.5, py - p.size * 0.5, p.size, p.size);
          }
          setDomOpacity(0.88 - outEase * 0.36);
        } else {
          const inT = (rawProgress - 0.35) / 0.65;
          const inEase = 1 - Math.pow(1 - inT, 3);
          for (const p of particles) {
            const localT = Math.max(0, Math.min(1, (inEase - p.delay) / (1 - p.delay)));
            const px = p.homeX + p.vx * (1 - localT);
            const py = p.homeY + p.vy * (1 - localT);
            ctx.globalAlpha = p.alpha * (1 - localT);
            ctx.fillStyle = p.color;
            const s = p.size * (1 - localT * 0.35);
            ctx.fillRect(px - s * 0.5, py - s * 0.5, s, s);
          }
          setDomOpacity(0.55 + inEase * 0.45);
        }
      } else {
        for (const p of particles) {
          const localT = Math.max(0, Math.min(1, (eased - p.delay) / (1 - p.delay)));
          const px = p.homeX + p.vx * (1 - localT);
          const py = p.homeY + p.vy * (1 - localT);
          ctx.globalAlpha = p.alpha * (1 - localT);
          ctx.fillStyle = p.color;
          const s = p.size * (1 - localT * 0.3);
          ctx.fillRect(px - s * 0.5, py - s * 0.5, s, s);
        }
        setDomOpacity(0.78 + eased * 0.22);
      }

      ctx.restore();

      if (rawProgress < 1) {
        rafRef.current = window.requestAnimationFrame(renderFrame);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setDomOpacity(1);
        rafRef.current = null;
      }
    };

    rafRef.current = window.requestAnimationFrame(renderFrame);

    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setDomOpacity(1);
    };
  }, [inView, transitionKey, triggerOnMount, maxParticlesDesktop, maxParticlesMobile]);

  return (
    <div ref={containerRef} className={`relative [contain:layout_paint] ${className}`}>
      <div
        ref={contentRef}
        className="w-full h-full will-change-[opacity]"
      >
        {children}
      </div>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 w-full h-full z-20"
      />
    </div>
  );
}

/**
 * Minimalist 4x4 monochrome silver & violet Astra Vesper pixel matrix loading symbol.
 */
export function PixelLoadingMatrix({
  label = 'Loading...',
  compact = false,
}: {
  label?: string;
  compact?: boolean;
}) {
  const cells = [
    { delay: '0ms', color: 'bg-slate-300 dark:bg-slate-600' },
    { delay: '90ms', color: 'bg-violet-500' },
    { delay: '180ms', color: 'bg-slate-400 dark:bg-slate-500' },
    { delay: '270ms', color: 'bg-violet-600' },
    { delay: '90ms', color: 'bg-violet-400' },
    { delay: '180ms', color: 'bg-slate-200 dark:bg-slate-400' },
    { delay: '270ms', color: 'bg-violet-600' },
    { delay: '360ms', color: 'bg-slate-300 dark:bg-slate-500' },
    { delay: '180ms', color: 'bg-slate-300 dark:bg-slate-500' },
    { delay: '270ms', color: 'bg-violet-500' },
    { delay: '360ms', color: 'bg-slate-200 dark:bg-slate-400' },
    { delay: '450ms', color: 'bg-violet-400' },
    { delay: '270ms', color: 'bg-violet-600' },
    { delay: '360ms', color: 'bg-slate-400 dark:bg-slate-600' },
    { delay: '450ms', color: 'bg-violet-500' },
    { delay: '540ms', color: 'bg-slate-300 dark:bg-slate-500' },
  ];

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center gap-3 ${
        compact ? 'py-5' : 'py-10'
      }`}
    >
      <div
        aria-hidden="true"
        className="grid grid-cols-4 gap-1.5 p-2.5 rounded-xl border border-black/8 dark:border-white/10 bg-[#f8f9fa] dark:bg-[#12151c]"
      >
        {cells.map((cell, idx) => (
          <span
            key={idx}
            className={`w-2 h-2 rounded-[1.5px] ${cell.color} animate-pixel-cell`}
            style={{ animationDelay: cell.delay }}
          />
        ))}
      </div>
      <p className="text-xs font-medium text-[#4b5563] dark:text-slate-400">{label}</p>
    </div>
  );
}
