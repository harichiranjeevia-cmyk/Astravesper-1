import { useEffect, useRef } from 'react';

interface StarNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  alpha: number;
}

export function StarfieldCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let animId = 0;
    let width = 0;
    let height = 0;
    let stars: StarNode[] = [];
    let isVisible = true;
    let isPageActive = !document.hidden;
    let isDark = document.documentElement.classList.contains('dark');
    let lastDraw = 0;

    const themeObserver =
      typeof MutationObserver !== 'undefined'
        ? new MutationObserver(() => {
            isDark = document.documentElement.classList.contains('dark');
          })
        : null;
    themeObserver?.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    const initStars = () => {
      const count = width < 640 ? 14 : 34;
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.14,
        vy: (Math.random() - 0.5) * 0.14,
        r: Math.random() * 1.4 + 0.6,
        alpha: Math.random() * 0.45 + 0.18,
      }));
    };

    const resize = () => {
      const maxDpr = window.innerWidth < 768 ? 1.25 : 2;
      const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      initStars();
    };

    resize();
    window.addEventListener('resize', resize);

    const drawFrame = (now = 0) => {
      if (!isVisible || !isPageActive) {
        animId = 0;
        return;
      }

      const isMobile = width < 768;
      if (isMobile && now - lastDraw < 32 && lastDraw !== 0) {
        animId = requestAnimationFrame(drawFrame);
        return;
      }
      lastDraw = now;

      ctx.clearRect(0, 0, width, height);
      const starColor = isDark ? '226, 232, 240' : '79, 70, 229';
      const lineColor = isDark ? '139, 92, 246' : '99, 102, 241';
      const maxDistSq = width < 640 ? 9000 : 14000;
      ctx.lineWidth = 0.75;

      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        if (!prefersReducedMotion) {
          s.x += s.vx;
          s.y += s.vy;
          if (s.x < 0) s.x = width;
          if (s.x > width) s.x = 0;
          if (s.y < 0) s.y = height;
          if (s.y > height) s.y = 0;
        }

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${starColor}, ${s.alpha})`;
        ctx.fill();

        for (let j = i + 1; j < stars.length; j++) {
          const s2 = stars[j];
          const dx = s.x - s2.x;
          const dy = s.y - s2.y;
          const dist = dx * dx + dy * dy;
          if (dist < maxDistSq) {
            ctx.beginPath();
            ctx.moveTo(s.x, s.y);
            ctx.lineTo(s2.x, s2.y);
            ctx.strokeStyle = `rgba(${lineColor}, ${(1 - dist / maxDistSq) * 0.12})`;
            ctx.stroke();
          }
        }
      }

      if (!prefersReducedMotion && isVisible && isPageActive) {
        animId = requestAnimationFrame(drawFrame);
      }
    };

    const startIfReady = () => {
      if (!animId && isVisible && isPageActive) {
        animId = requestAnimationFrame(drawFrame);
      }
    };

    const observer =
      typeof IntersectionObserver !== 'undefined'
        ? new IntersectionObserver(
            (entries) => {
              isVisible = entries[0]?.isIntersecting ?? true;
              if (isVisible) startIfReady();
            },
            { threshold: 0.05 }
          )
        : null;

    if (observer) observer.observe(canvas);

    const onVisibilityChange = () => {
      isPageActive = !document.hidden;
      if (isPageActive) startIfReady();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    drawFrame(performance.now());

    return () => {
      cancelAnimationFrame(animId);
      observer?.disconnect();
      themeObserver?.disconnect();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full opacity-75 will-change-transform"
    />
  );
}
