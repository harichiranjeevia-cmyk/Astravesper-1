import { useEffect, useRef, useState } from 'react';

export const DAILY_QUOTES: readonly string[] = [
  'Stillness frames vision. Motion brings it to life.',
  'Precision in silence. Clarity in motion.',
  'Design begins where noise disappears.',
  'Every pixel earns its place in space.',
  'Form holds the horizon; light sets it free.',
  'Quiet geometry reveals what matters most.',
  'True craft feels effortless at every frame.',
  'Restraint turns complexity into calm.',
  'Where obsidian meets light, focus awakens.',
  'Built to move cleanly at the speed of thought.',
  'Minimal lines carry maximum depth.',
  'A system shines brightest when nothing feels forced.',
  'Order gives imagination room to breathe.',
  'Balance transforms utility into presence.',
  'Subtle shifts define unforgettable interfaces.',
  'Clarity is the highest form of sophistication.',
  'Let the structure vanish so the work speaks.',
  'Precision outlasts spectacle.',
  'Calm surfaces invite deeper exploration.',
  'From quiet architecture, living worlds emerge.',
  'Clean motion is invisible engineering.',
  'Space is not empty; it frames intention.',
  'Elegance lives in the millimeter between elements.',
  'Simplicity is strength refined over time.',
  'Great tools never compete for attention.',
  'Still frames anchor; continuous motion connects.',
  'Every transition should feel like breathing.',
  'Crafted for zero friction from first glance.',
  'Harmony between depth, light, and speed.',
  'Pure focus shapes the future cleanly.',
  'Less ornament. More horizon.',
];

export function getStrictDailyQuote(): string {
  const now = new Date();
  const localDayIndex = Math.floor(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / 86400000
  );
  const idx = ((localDayIndex % DAILY_QUOTES.length) + DAILY_QUOTES.length) % DAILY_QUOTES.length;
  return DAILY_QUOTES[idx];
}

interface HeroConstellationOverlayProps {
  replayTrigger?: number;
}

/**
 * Clean celestial sky overlay inside the single Hero observatory image:
 * Luminous silver & violet stars ignite and trace the Astra Vesper A-crest constellation
 * cleanly in the night sky without obscuring the observatory or bottom studio caption.
 */
export function HeroConstellationOverlay({
  replayTrigger = 0,
}: HeroConstellationOverlayProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [activated, setActivated] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setActivated(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setActivated(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const sequenceKey = activated ? `active-${replayTrigger}` : 'idle';

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-20 flex items-start justify-center pt-5 sm:pt-7 px-4 overflow-hidden [contain:layout_paint]"
    >
      {activated && (
        <svg
          key={sequenceKey}
          viewBox="0 0 360 190"
          fill="none"
          className="w-full max-w-[300px] sm:max-w-[340px] h-auto sm:drop-shadow-[0_0_10px_rgba(167,139,250,0.3)]"
        >
          <defs>
            <linearGradient
              id="astraCrestStroke"
              x1="100"
              y1="24"
              x2="260"
              y2="140"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#e2e8f0" stopOpacity="0.92" />
              <stop offset="52%" stopColor="#c4b5fd" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.88" />
            </linearGradient>
            <linearGradient
              id="astraOrbitStroke"
              x1="86"
              y1="120"
              x2="274"
              y2="54"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#94a3b8" stopOpacity="0.15" />
              <stop offset="55%" stopColor="#a78bfa" stopOpacity="0.82" />
              <stop offset="100%" stopColor="#e2e8f0" stopOpacity="0.65" />
            </linearGradient>
          </defs>

          {/* Ambient Flanking Starlinks */}
          <path
            d="M 66 68 L 106 46 L 148 80 M 212 80 L 266 56 L 298 92"
            stroke="#cbd5e1"
            strokeOpacity="0.28"
            strokeWidth="0.9"
            strokeLinecap="round"
            pathLength={100}
            className="constellation-draw-secondary"
          />

          {/* Primary Astra Vesper A-Crest Constellation */}
          <path
            d="M 180 28 L 148 80 L 118 134"
            stroke="url(#astraCrestStroke)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={100}
            className="constellation-draw-1"
          />
          <path
            d="M 180 28 L 212 80 L 242 134"
            stroke="url(#astraCrestStroke)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={100}
            className="constellation-draw-2"
          />
          <path
            d="M 148 80 L 180 62 L 212 80 M 142 104 L 218 104"
            stroke="url(#astraCrestStroke)"
            strokeWidth="1.15"
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={100}
            className="constellation-draw-3"
          />
          <path
            d="M 96 116 Q 182 40 264 62"
            stroke="url(#astraOrbitStroke)"
            strokeWidth="1.25"
            strokeLinecap="round"
            pathLength={100}
            className="constellation-draw-4"
          />

          {/* Constellation Star Vertices */}
          {[
            { cx: 180, cy: 28, r: 3.1, fill: '#f8fafc', delay: '60ms' },
            { cx: 148, cy: 80, r: 2.2, fill: '#e2e8f0', delay: '140ms' },
            { cx: 212, cy: 80, r: 2.2, fill: '#c4b5fd', delay: '180ms' },
            { cx: 180, cy: 62, r: 2.0, fill: '#a78bfa', delay: '220ms' },
            { cx: 118, cy: 134, r: 2.3, fill: '#e2e8f0', delay: '260ms' },
            { cx: 242, cy: 134, r: 2.3, fill: '#c4b5fd', delay: '300ms' },
            { cx: 142, cy: 104, r: 1.8, fill: '#cbd5e1', delay: '340ms' },
            { cx: 218, cy: 104, r: 1.8, fill: '#a78bfa', delay: '360ms' },
            { cx: 106, cy: 46, r: 1.6, fill: '#cbd5e1', delay: '200ms' },
            { cx: 66, cy: 68, r: 1.4, fill: '#94a3b8', delay: '260ms' },
            { cx: 266, cy: 56, r: 2.4, fill: '#f8fafc', delay: '400ms' },
            { cx: 298, cy: 92, r: 1.5, fill: '#c4b5fd', delay: '440ms' },
          ].map((star, idx) => (
            <circle
              key={idx}
              cx={star.cx}
              cy={star.cy}
              r={star.r}
              fill={star.fill}
              className="constellation-star-node"
              style={{ animationDelay: star.delay }}
            />
          ))}

          {/* 4-Point Vesper Polar Star */}
          <path
            d="M 266 47 L 268.2 53.8 L 275 56 L 268.2 58.2 L 266 65 L 263.8 58.2 L 257 56 L 263.8 53.8 Z"
            fill="#e2e8f0"
            className="constellation-star-node"
            style={{ animationDelay: '480ms' }}
          />
        </svg>
      )}
    </div>
  );
}
