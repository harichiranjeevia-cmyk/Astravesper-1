import { useEffect, useMemo, useRef, useState } from 'react';
import { getStrictDailyQuote } from './HeroConstellationOverlay';
import { Showcase3DCard } from './Showcase3DCard';

/**
 * Full-width glassy minimalist daily quote card placed directly beneath the Hero
 * across desktop and mobile viewports. Updates strictly once per local calendar day
 * and forms with GPU-composited motion (zero layout shift, zero blur lag).
 */
export function DailyQuoteCard() {
  const dailyQuote = useMemo(() => getStrictDailyQuote(), []);
  const cardRef = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [shimmerSeed, setShimmerSeed] = useState(0);

  useEffect(() => {
    const el = cardRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={cardRef}
      aria-label="Daily studio reflection"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 [contain:layout_paint]"
    >
      <div
        role="button"
        tabIndex={0}
        aria-label="Daily quote showcase — activate for starlight shimmer"
        onClick={() => setShimmerSeed((n) => n + 1)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setShimmerSeed((n) => n + 1);
          }
        }}
        className="w-full rounded-3xl cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-600/60"
      >
        <Showcase3DCard
          maxTiltDeg={1.6}
          className="group w-full rounded-3xl overflow-hidden border border-black/10 dark:border-white/14 bg-white/82 dark:bg-[#11151e]/88 sm:backdrop-blur-md px-6 py-8 sm:px-10 sm:py-11 lg:px-14 lg:py-12 shadow-[0_12px_36px_-22px_rgba(11,12,16,0.22)] dark:shadow-[0_14px_40px_-22px_rgba(124,58,237,0.3)]"
        >
          {/* Ambient glass edge tint */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-[inherit]"
            style={{
              background:
                'linear-gradient(120deg, rgba(139, 92, 246, 0.08) 0%, rgba(226, 232, 240, 0.14) 50%, rgba(139, 92, 246, 0.06) 100%)',
            }}
          />

          {/* Interactive GPU-only shimmer sweep */}
          {visible && (
            <div
              key={`sweep-${shimmerSeed}`}
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 left-0 w-1/2 quote-glass-sweep"
              style={{
                background:
                  'linear-gradient(90deg, transparent 0%, rgba(167, 139, 250, 0.16) 50%, transparent 100%)',
              }}
            />
          )}

          <div
            key={visible ? `quote-body-${shimmerSeed}` : 'quote-idle'}
            className={`relative z-20 flex flex-col items-center text-center space-y-4 ${
              visible ? 'quote-form-reveal' : 'opacity-0'
            }`}
          >
            {/* Minimalist geometric star-crest spark linking to Hero constellation above */}
            <svg
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              className="w-5 h-5 text-violet-600 dark:text-violet-400 transition-transform duration-300 group-hover:scale-110"
            >
              <path
                d="M12 2.5L13.9 10.1L21.5 12L13.9 13.9L12 21.5L10.1 13.9L2.5 12L10.1 10.1L12 2.5Z"
                fill="currentColor"
                fillOpacity="0.88"
              />
            </svg>

            <blockquote
              className="font-display font-bold tracking-tight text-[#0b0c10] dark:text-white leading-[1.16] max-w-4xl"
              style={{
                fontSize: 'clamp(1.45rem, 2.7vw, 2.35rem)',
                textWrap: 'balance',
              }}
            >
              &ldquo;{dailyQuote}&rdquo;
            </blockquote>
          </div>
        </Showcase3DCard>
      </div>
    </section>
  );
}
