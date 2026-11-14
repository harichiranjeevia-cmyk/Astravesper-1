import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, PanInfo, useReducedMotion } from 'motion/react';
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Compass,
  Eye,
  ShieldCheck,
  Watch,
} from 'lucide-react';
import { SOLIS_VEXEN_DATA } from '../data/catalog';
import { Product } from '../types';
import { LivePreviewFrame } from '../components/LivePreviewFrame';

const SOLIS_PREVIEW_PRODUCT: Product = {
  id: 'solis-vexen-preview',
  slug: 'solis-vexen',
  name: 'Solis Vexen',
  tagline: SOLIS_VEXEN_DATA.headline,
  description: SOLIS_VEXEN_DATA.description,
  category: 'Future Technologies',
  status: 'In Development',
  published: true,
  featured: false,
  version: 'Prototype',
  platforms: ['Web Showcase', 'Horology Division'],
  websiteUrl: SOLIS_VEXEN_DATA.websiteUrl,
  previewUrl: SOLIS_VEXEN_DATA.websiteUrl,
  iconKey: 'future',
  heroImageUrl: SOLIS_VEXEN_DATA.slides[0].imageUrl,
  screenshots: SOLIS_VEXEN_DATA.slides.map((s) => s.imageUrl),
  availableFeatures: SOLIS_VEXEN_DATA.highlights,
  plannedFeatures: [
    'Production chronometer dial & caliber specification release',
    'Interactive collector reservation portal',
  ],
  createdAt: '2026-10-01T00:00:00.000Z',
  updatedAt: '2026-11-01T00:00:00.000Z',
};

function PixelFadeWordmark({ text }: { text: string }) {
  const letters = text.split('');
  const total = letters.length;

  // Stepped cascading pixel dissolve extending cleanly off the right end only
  const rightFadeCols = [
    [0.64, 0.82, 0.68, 0.46, 0.24],
    [0.38, 0.56, 0.42, 0.26],
    [0.2, 0.32, 0.22, 0.12],
    [0.09, 0.16, 0.09],
  ];

  return (
    <h1
      aria-label={text}
      className="inline-flex items-center gap-1.5 font-display font-bold text-[#0b0c10] dark:text-white leading-[1.04] tracking-tight"
      style={{ fontSize: 'clamp(2.25rem, 4.4vw, 3.6rem)' }}
    >
      {/* Solid Left & Center Characters -> Pixel Dissolve on Right Trailing Letters */}
      <span className="relative inline-flex items-baseline">
        {letters.map((char, idx) => {
          const distFromRight = total - 1 - idx;
          const opacityClass =
            distFromRight === 0
              ? 'opacity-45'
              : distFromRight === 1
              ? 'opacity-72'
              : distFromRight === 2
              ? 'opacity-88'
              : 'opacity-100';

          return (
            <span key={`${char}-${idx}`} className={opacityClass}>
              {char === ' ' ? '\u00A0' : char}
            </span>
          );
        })}
      </span>

      {/* Right-End Cascading Pixel Fade */}
      <span className="inline-flex items-center gap-1 shrink-0" aria-hidden="true">
        {rightFadeCols.map((col, cIdx) => (
          <span key={cIdx} className="flex flex-col gap-1">
            {col.map((op, rIdx) => (
              <span
                key={rIdx}
                className="w-1.5 h-1.5 rounded-[1px] bg-[#0b0c10] dark:bg-white"
                style={{ opacity: op }}
              />
            ))}
          </span>
        ))}
      </span>
    </h1>
  );
}

export default function SolisVexenPage() {
  const slides = SOLIS_VEXEN_DATA.slides;
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [showLiveEmbed, setShowLiveEmbed] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const didDragRef = useRef(false);

  // Continuous automatic orbital slide (no pause button required)
  useEffect(() => {
    if (prefersReducedMotion) return;
    const timer = window.setInterval(() => {
      setDirection(1);
      setActiveIndex((prev) => (prev + 1) % slides.length);
    }, 4500);
    return () => window.clearInterval(timer);
  }, [prefersReducedMotion, slides.length]);

  const goToSlide = (nextIdx: number, explicitDir?: number) => {
    const normalized = ((nextIdx % slides.length) + slides.length) % slides.length;
    if (explicitDir !== undefined) {
      setDirection(explicitDir);
    } else {
      setDirection(normalized >= activeIndex ? 1 : -1);
    }
    setActiveIndex(normalized);
  };

  const handleDialDragStart = () => {
    didDragRef.current = true;
  };

  const handleDialDragEnd = (
    _: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    if (info.offset.x < -34 || info.velocity.x < -280) {
      goToSlide(activeIndex + 1, 1);
    } else if (info.offset.x > 34 || info.velocity.x > 280) {
      goToSlide(activeIndex - 1, -1);
    }
    window.setTimeout(() => {
      didDragRef.current = false;
    }, 60);
  };

  const handleHalfDialClick = (side: 'left' | 'right') => {
    if (didDragRef.current) return;
    if (side === 'left') {
      goToSlide(activeIndex - 1, -1);
    } else {
      goToSlide(activeIndex + 1, 1);
    }
  };

  const activeSlide = slides[activeIndex];
  const bezelRotation = activeIndex * 90;

  const slideVariants = {
    enter: (dir: number) =>
      prefersReducedMotion
        ? { opacity: 0 }
        : {
            opacity: 0,
            scale: 0.92,
            x: dir > 0 ? 72 : -72,
            rotate: dir > 0 ? 14 : -14,
          },
    center: {
      opacity: 1,
      scale: 1,
      x: 0,
      rotate: 0,
    },
    exit: (dir: number) =>
      prefersReducedMotion
        ? { opacity: 0 }
        : {
            opacity: 0,
            scale: 0.92,
            x: dir > 0 ? -72 : 72,
            rotate: dir > 0 ? -14 : 14,
          },
  };

  return (
    <div className="pb-20">
      {/* Pixel-Exclusive Solis Vexen Horology Canvas */}
      <section className="relative overflow-hidden border-b border-black/8 dark:border-white/10 bg-[#f4f6fa] dark:bg-[#0d1017]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Pixel Narrative Surface */}
            <div className="lg:col-span-5 space-y-6">
              <div className="space-y-3.5">
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-semibold">
                  <span className="text-[#0b0c10] dark:text-slate-200 tracking-wide">
                    {SOLIS_VEXEN_DATA.entityLabel}
                  </span>
                  <span className="text-slate-400" aria-hidden="true">
                    ·
                  </span>
                  <span className="text-amber-700 dark:text-amber-400">
                    {SOLIS_VEXEN_DATA.stageLabel}
                  </span>
                </div>

                <PixelFadeWordmark text={SOLIS_VEXEN_DATA.name} />

                <p className="font-display text-lg sm:text-xl font-medium text-[#374151] dark:text-slate-300">
                  {SOLIS_VEXEN_DATA.headline}
                </p>

                <p className="text-sm sm:text-base text-[#4b5563] dark:text-slate-400 leading-relaxed">
                  {SOLIS_VEXEN_DATA.description}
                </p>
              </div>

              {/* Clean Pixel Actions */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <a
                  href={SOLIS_VEXEN_DATA.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[46px] inline-flex items-center gap-2 px-5 py-2.5 rounded-3xl bg-[#0b0c10] dark:bg-white text-white dark:text-[#0b0c10] text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-transform whitespace-nowrap"
                >
                  Visit solisvexen.vercel.app
                  <ArrowUpRight className="w-4 h-4" />
                </a>

                <button
                  type="button"
                  onClick={() => setShowLiveEmbed((v) => !v)}
                  className="min-h-[46px] inline-flex items-center gap-2 px-4 py-2.5 rounded-3xl border border-black/10 dark:border-white/15 bg-white dark:bg-[#151a23] text-[#0b0c10] dark:text-white text-sm font-medium hover:border-slate-400 active:scale-[0.98] transition-transform whitespace-nowrap"
                >
                  <Eye className="w-4 h-4" />
                  {showLiveEmbed ? 'Hide Web Preview' : 'Preview Portal'}
                </button>
              </div>

              {/* Pixel Tonal Telemetry Card */}
              <div className="rounded-3xl border border-black/8 dark:border-white/10 bg-white dark:bg-[#141821] p-5 sm:p-6 space-y-3">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <span className="font-mono-tabular font-semibold text-[#0b0c10] dark:text-slate-200">
                    Study {activeSlide.code}
                  </span>
                  <span className="text-[#4b5563] dark:text-slate-400 font-mono-tabular">
                    0{activeIndex + 1} / 0{slides.length}
                  </span>
                </div>
                <div className="space-y-1">
                  <h2 className="font-display text-lg font-bold text-[#0b0c10] dark:text-white">
                    {activeSlide.title}
                  </h2>
                  <p className="text-xs font-medium text-[#4b5563] dark:text-slate-300">
                    {activeSlide.subtitle}
                  </p>
                </div>
                <div className="pt-3 border-t border-black/8 dark:border-white/10 space-y-1.5 text-xs text-[#4b5563] dark:text-slate-400">
                  <p>
                    <span className="font-semibold text-[#0b0c10] dark:text-slate-200">
                      Architecture:{' '}
                    </span>
                    {activeSlide.materialNote}
                  </p>
                  <p>
                    <span className="font-semibold text-amber-700 dark:text-amber-400">
                      Progress:{' '}
                    </span>
                    {activeSlide.developmentNote}
                  </p>
                </div>
              </div>
            </div>

            {/* Right Touch-Swipeable & Left/Right Half-Clickable Circular Watch Stage */}
            <div className="lg:col-span-7 flex flex-col items-center space-y-6">
              <div className="relative w-full max-w-[264px] sm:max-w-[396px] aspect-square flex items-center justify-center select-none">
                {/* Outer Brushed Silver Bezel Ring */}
                <motion.div
                  animate={{ rotate: prefersReducedMotion ? 0 : bezelRotation }}
                  transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
                  aria-hidden="true"
                  className="absolute inset-0 rounded-full border border-slate-300/80 dark:border-white/15 bg-gradient-to-br from-slate-100 via-slate-200/70 to-slate-200 dark:from-[#1c212c] dark:via-[#12161e] dark:to-[#1c212c] shadow-lg will-change-transform"
                >
                  <svg
                    viewBox="0 0 200 200"
                    className="w-full h-full text-slate-500/60 dark:text-slate-400/50"
                  >
                    {Array.from({ length: 60 }).map((_, idx) => {
                      const angle = (idx * 6 * Math.PI) / 180;
                      const isMajor = idx % 5 === 0;
                      const rOuter = 96;
                      const rInner = isMajor ? 88 : 92;
                      const x1 = 100 + rInner * Math.sin(angle);
                      const y1 = 100 - rInner * Math.cos(angle);
                      const x2 = 100 + rOuter * Math.sin(angle);
                      const y2 = 100 - rOuter * Math.cos(angle);
                      return (
                        <line
                          key={idx}
                          x1={x1}
                          y1={y1}
                          x2={x2}
                          y2={y2}
                          stroke="currentColor"
                          strokeWidth={isMajor ? 1.4 : 0.7}
                          strokeLinecap="round"
                        />
                      );
                    })}
                  </svg>
                </motion.div>

                {/* Inner Sapphire Circular Dial with Left/Right Half Click & Swipe */}
                <motion.div
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.14}
                  onDragStart={handleDialDragStart}
                  onDragEnd={handleDialDragEnd}
                  className="relative w-[82%] h-[82%] rounded-full overflow-hidden border-2 border-slate-300/90 dark:border-white/20 bg-[#0b0c10] cursor-pointer touch-pan-y"
                >
                  <AnimatePresence custom={direction} initial={false}>
                    <motion.div
                      key={activeSlide.id}
                      custom={direction}
                      variants={slideVariants}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
                      className="absolute inset-0 w-full h-full will-change-transform pointer-events-none"
                    >
                      <img
                        src={activeSlide.imageUrl}
                        alt={`Solis Vexen ${activeSlide.title}`}
                        draggable={false}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/10" />
                      <div className="absolute bottom-4 sm:bottom-5 inset-x-5 text-center text-white space-y-0.5">
                        <p className="text-[10px] font-mono-tabular tracking-[0.18em] text-slate-300 uppercase">
                          {activeSlide.code} · Solis Vexen
                        </p>
                        <p className="font-display text-xs sm:text-sm font-semibold truncate">
                          {activeSlide.title}
                        </p>
                      </div>
                    </motion.div>
                  </AnimatePresence>

                  {/* Left Half Click Zone -> Previous Dial */}
                  <button
                    type="button"
                    onClick={() => handleHalfDialClick('left')}
                    aria-label="Previous watch preview (click left half of dial)"
                    className="group/left absolute inset-y-0 left-0 w-1/2 z-10 flex items-center justify-start pl-3 sm:pl-4 bg-transparent hover:bg-black/10 focus-visible:outline-none transition-colors"
                  >
                    <span className="w-8 h-8 rounded-full bg-black/35 text-white/85 opacity-0 group-hover/left:opacity-100 flex items-center justify-center transition-opacity">
                      <ChevronLeft className="w-4 h-4" />
                    </span>
                  </button>

                  {/* Right Half Click Zone -> Next Dial */}
                  <button
                    type="button"
                    onClick={() => handleHalfDialClick('right')}
                    aria-label="Next watch preview (click right half of dial)"
                    className="group/right absolute inset-y-0 right-0 w-1/2 z-10 flex items-center justify-end pr-3 sm:pr-4 bg-transparent hover:bg-black/10 focus-visible:outline-none transition-colors"
                  >
                    <span className="w-8 h-8 rounded-full bg-black/35 text-white/85 opacity-0 group-hover/right:opacity-100 flex items-center justify-center transition-opacity">
                      <ChevronRight className="w-4 h-4" />
                    </span>
                  </button>
                </motion.div>

                {/* Touch-Ready Cardinal Orbital Selectors */}
                {slides.map((slide, idx) => {
                  const active = idx === activeIndex;
                  const positionClasses = [
                    'top-0 left-1/2 -translate-x-1/2 -translate-y-1/2',
                    'right-0 top-1/2 translate-x-1/2 -translate-y-1/2',
                    'bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2',
                    'left-0 top-1/2 -translate-x-1/2 -translate-y-1/2',
                  ][idx];
                  return (
                    <button
                      key={slide.id}
                      type="button"
                      onClick={() => goToSlide(idx)}
                      aria-label={`Inspect ${slide.code} ${slide.title}`}
                      className={`absolute ${positionClasses} z-20 min-h-[40px] min-w-[44px] px-2.5 rounded-full font-mono-tabular text-[11px] font-semibold border transition-transform duration-150 ${
                        active
                          ? 'bg-[#0b0c10] dark:bg-white text-white dark:text-[#0b0c10] border-transparent shadow-md scale-105'
                          : 'bg-white dark:bg-[#161b24] text-[#4b5563] dark:text-slate-300 border-black/12 dark:border-white/15 hover:border-slate-500'
                      }`}
                    >
                      {slide.code}
                    </button>
                  );
                })}
              </div>

              {/* Clean Directional Hints & Pixel Dial Strip */}
              <div className="flex items-center justify-center gap-3 text-xs text-[#4b5563] dark:text-slate-400">
                <button
                  type="button"
                  onClick={() => goToSlide(activeIndex - 1, -1)}
                  aria-label="Previous chronometer study"
                  className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-2xl border border-black/10 dark:border-white/15 bg-white dark:bg-[#141821] text-[#0b0c10] dark:text-white hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-transform"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <span className="font-mono-tabular text-[11px]">
                  Click left/right side of dial · Auto-sliding
                </span>

                <button
                  type="button"
                  onClick={() => goToSlide(activeIndex + 1, 1)}
                  aria-label="Next chronometer study"
                  className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-2xl border border-black/10 dark:border-white/15 bg-white dark:bg-[#141821] text-[#0b0c10] dark:text-white hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-transform"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Clean Pixel Dial Strip */}
              <div className="grid grid-cols-4 gap-2.5 w-full max-w-md">
                {slides.map((slide, idx) => {
                  const active = idx === activeIndex;
                  return (
                    <button
                      key={slide.id}
                      type="button"
                      onClick={() => goToSlide(idx)}
                      className={`group rounded-3xl overflow-hidden border p-1.5 text-left transition-transform duration-150 active:scale-95 ${
                        active
                          ? 'border-[#0b0c10] dark:border-white bg-white dark:bg-[#171c26]'
                          : 'border-black/8 dark:border-white/10 bg-white/75 dark:bg-[#141821]/75 opacity-75 hover:opacity-100'
                      }`}
                    >
                      <div className="aspect-square rounded-2xl overflow-hidden bg-[#0b0c10]">
                        <img
                          src={slide.imageUrl}
                          alt={`Solis Vexen ${slide.code}`}
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                        />
                      </div>
                      <p className="pt-1.5 text-center font-mono-tabular text-[11px] font-semibold text-[#0b0c10] dark:text-slate-200">
                        {slide.code}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Optional Auto-Sensing Live Portal Preview */}
      {showLiveEmbed && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
          <LivePreviewFrame product={SOLIS_PREVIEW_PRODUCT} />
        </section>
      )}

      {/* Pixel Tonal Card Grid: Horology & Development Progress */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="rounded-3xl border border-black/8 dark:border-white/10 bg-[#f4f6fa] dark:bg-[#141821] p-6 space-y-3">
            <Watch className="w-5 h-5 text-[#0b0c10] dark:text-slate-200" />
            <h3 className="font-display text-base font-bold text-[#0b0c10] dark:text-white">
              Brushed Silver Chronometer Language
            </h3>
            <p className="text-xs sm:text-sm text-[#4b5563] dark:text-slate-400 leading-relaxed">
              Every Solis Vexen dial study pairs satin-brushed 316L steel geometry with signature Solis Vexen dial typography and uncluttered chapter rings.
            </p>
          </div>

          <div className="rounded-3xl border border-black/8 dark:border-white/10 bg-[#f4f6fa] dark:bg-[#141821] p-6 space-y-3">
            <Compass className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            <h3 className="font-display text-base font-bold text-[#0b0c10] dark:text-white">
              Under Progress &amp; Development
            </h3>
            <p className="text-xs sm:text-sm text-[#4b5563] dark:text-slate-400 leading-relaxed">
              Solis Vexen is actively evolving through case prototyping, movement calibration, and storefront refinement. Previews represent works in progress.
            </p>
          </div>

          <div className="rounded-3xl border border-black/8 dark:border-white/10 bg-[#f4f6fa] dark:bg-[#141821] p-6 space-y-3">
            <ShieldCheck className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            <h3 className="font-display text-base font-bold text-[#0b0c10] dark:text-white">
              Independent Brand Identity
            </h3>
            <p className="text-xs sm:text-sm text-[#4b5563] dark:text-slate-400 leading-relaxed">
              {SOLIS_VEXEN_DATA.disclaimer}
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-black/8 dark:border-white/10 bg-[#f4f6fa] dark:bg-[#141821] p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-violet-700 dark:text-violet-400">
              Official Development Portal
            </p>
            <h3 className="font-display text-lg font-bold text-[#0b0c10] dark:text-white">
              Follow Solis Vexen progress on its dedicated showcase
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={SOLIS_VEXEN_DATA.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 rounded-3xl bg-[#0b0c10] dark:bg-white text-white dark:text-[#0b0c10] text-xs font-semibold hover:opacity-90 active:scale-[0.98] transition-transform whitespace-nowrap"
            >
              Open solisvexen.vercel.app
              <ArrowUpRight className="w-4 h-4" />
            </a>
            <Link
              to="/membership"
              className="min-h-[44px] inline-flex items-center px-4 py-2.5 rounded-3xl border border-black/10 dark:border-white/15 bg-white dark:bg-[#1a202c] text-xs font-semibold text-[#0b0c10] dark:text-white hover:bg-black/5 dark:hover:bg-white/10 active:scale-[0.98] transition-transform whitespace-nowrap"
            >
              Join Ecosystem Updates
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
