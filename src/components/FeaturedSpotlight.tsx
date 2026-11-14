import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ArrowRight, ArrowUpRight, CheckCircle2, Eye } from 'lucide-react';
import { Product } from '../types';
import { resolveAssetUrl } from '../data/catalog';
import { useTheme } from '../context/ThemeContext';
import { ProductIcon } from './ProductIcon';
import { Showcase3DCard } from './Showcase3DCard';
import { PixelTransitionSurface } from './PixelTransitionCanvas';

interface FeaturedSpotlightProps {
  products: Product[];
  onPreview: (product: Product) => void;
  onVisit: (product: Product) => void;
}

export function FeaturedSpotlight({
  products,
  onPreview,
  onVisit,
}: FeaturedSpotlightProps) {
  const { compactDensity } = useTheme();
  const [selectedId, setSelectedId] = useState<string>(products[0]?.id || '');

  if (products.length === 0) return null;

  const activeProduct = products.find((p) => p.id === selectedId) || products[0];
  const heroSrc = resolveAssetUrl(activeProduct.heroImageUrl);

  return (
    <Showcase3DCard
      maxTiltDeg={3.2}
      className="group rounded-3xl border border-black/10 dark:border-white/10 bg-[#f8f9fa] dark:bg-[#11141b] overflow-hidden"
    >
      {/* Top Switcher Bar */}
      {products.length > 1 && (
        <div className="relative z-20 px-4 sm:px-6 pt-4 pb-3 border-b border-black/8 dark:border-white/10 flex flex-wrap items-center justify-between gap-3 bg-white/60 dark:bg-[#141822]/70">
          <p className="text-xs font-semibold text-violet-700 dark:text-violet-400">
            Featured Showcase
          </p>
          <div
            role="tablist"
            aria-label="Select featured application showcase"
            className="flex items-center gap-1.5 overflow-x-auto no-scrollbar"
          >
            {products.map((item) => {
              const active = item.id === activeProduct.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setSelectedId(item.id)}
                  className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                    active
                      ? 'bg-[#0b0c10] dark:bg-white text-white dark:text-[#0b0c10]'
                      : 'text-[#4b5563] dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/8'
                  }`}
                >
                  {item.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Layered 2-Column Interactive Showroom */}
      <div
        className={`relative z-20 grid grid-cols-1 lg:grid-cols-12 items-stretch ${
          compactDensity ? 'gap-5 p-4 sm:p-6' : 'gap-6 lg:gap-8 p-5 sm:p-8'
        }`}
      >
        {/* Visual + Floating 3D Icon Column */}
        <div className="lg:col-span-6 flex">
          <PixelTransitionSurface
            transitionKey={activeProduct.id}
            maxParticlesDesktop={84}
            maxParticlesMobile={40}
            className="w-full min-h-[220px] sm:min-h-[260px] lg:h-full rounded-2xl overflow-hidden border border-black/10 dark:border-white/12 bg-gradient-to-br from-[#14171f] via-[#1c1f2e] to-[#281e46]"
          >
            {heroSrc ? (
              <img
                src={heroSrc}
                alt={`${activeProduct.name} featured showcase artwork`}
                decoding="async"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.02]"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/30">
                <ProductIcon iconKey={activeProduct.iconKey} className="w-16 h-16" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />

            {/* Floating Non-Rotating Large Application Icon Badge */}
            <div className="absolute top-4 left-4 showcase-icon-float">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-black/45 sm:bg-white/14 sm:backdrop-blur-md border border-white/25 shadow-lg flex items-center justify-center text-white animate-subtle-float">
                <ProductIcon iconKey={activeProduct.iconKey} className="w-7 h-7 sm:w-8 sm:h-8" />
              </div>
            </div>

            <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3 text-white">
              <div className="min-w-0">
                <p className="text-xs text-white/75 truncate">
                  {activeProduct.category} · {activeProduct.platforms.join(' / ')}
                </p>
                <p className="font-display text-lg sm:text-xl font-bold truncate">
                  {activeProduct.name}
                </p>
              </div>
              <span className="text-xs font-mono-tabular text-white/85 shrink-0">
                v{activeProduct.version}
              </span>
            </div>
          </PixelTransitionSurface>
        </div>

        {/* Details, Features & Actions Column */}
        <motion.div
          key={activeProduct.id}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="lg:col-span-6 flex flex-col justify-between space-y-5"
        >
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#4b5563] dark:text-slate-400">
              <span className="font-semibold text-violet-700 dark:text-violet-400">
                {activeProduct.category}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono-tabular">v{activeProduct.version}</span>
              <span aria-hidden="true">·</span>
              <span>{activeProduct.status}</span>
            </div>

            <h3 className="font-display text-2xl sm:text-3xl font-bold text-[#0b0c10] dark:text-white">
              {activeProduct.name}
            </h3>

            <p className="text-sm sm:text-base text-[#4b5563] dark:text-slate-300 leading-relaxed">
              {activeProduct.description}
            </p>

            {activeProduct.availableFeatures.length > 0 && (
              <div className="pt-1 space-y-2">
                <p className="text-xs font-semibold text-[#0b0c10] dark:text-slate-200">
                  Available Capabilities
                </p>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
                  {activeProduct.availableFeatures.slice(0, 4).map((feat) => (
                    <li
                      key={feat}
                      className="flex items-start gap-2 text-xs sm:text-sm text-[#4b5563] dark:text-slate-300"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-black/8 dark:border-white/10 flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => onPreview(activeProduct)}
              className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-black/12 dark:border-white/15 bg-white dark:bg-[#1a1f29] text-xs font-semibold text-[#0b0c10] dark:text-white hover:border-violet-500/40 active:scale-[0.98] transition-transform whitespace-nowrap"
            >
              <Eye className="w-4 h-4" />
              Live Preview
            </button>

            {activeProduct.websiteUrl && (
              <a
                href={activeProduct.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onVisit(activeProduct)}
                className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 active:scale-[0.98] transition-transform whitespace-nowrap"
              >
                Visit Application
                <ArrowUpRight className="w-4 h-4" />
              </a>
            )}

            <Link
              to={`/products/${activeProduct.slug}`}
              state={{ pixelTransition: activeProduct.slug }}
              className="min-h-[44px] inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#4b5563] dark:text-slate-300 hover:text-[#0b0c10] dark:hover:text-white transition-colors ml-auto whitespace-nowrap"
            >
              Open Details
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </motion.div>
      </div>
    </Showcase3DCard>
  );
}
