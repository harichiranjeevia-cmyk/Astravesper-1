import { Link } from 'react-router-dom';
import { ArrowUpRight, Download, Eye } from 'lucide-react';
import { Product } from '../types';
import { resolveAssetUrl } from '../data/catalog';
import { useTheme } from '../context/ThemeContext';
import { ProductIcon } from './ProductIcon';
import { Showcase3DCard } from './Showcase3DCard';
import { PixelTransitionSurface } from './PixelTransitionCanvas';

interface ProductCardProps {
  product: Product;
  onPreview: (product: Product) => void;
  onVisit?: (product: Product) => void;
  onDownload?: (product: Product) => void;
}

export function ProductCard({
  product,
  onPreview,
  onVisit,
  onDownload,
}: ProductCardProps) {
  const { compactDensity } = useTheme();
  const heroSrc = resolveAssetUrl(product.heroImageUrl);

  return (
    <Showcase3DCard
      maxTiltDeg={3.8}
      className="group flex flex-col justify-between rounded-2xl border border-black/8 dark:border-white/10 bg-[#f8f9fa] dark:bg-[#12151c] overflow-hidden hover:border-violet-500/35"
    >
      <div className="relative z-20">
        {/* Product Artwork Banner with Pixel Reconstruction & Click-through */}
        <Link
          to={`/products/${product.slug}`}
          state={{ pixelTransition: product.slug }}
          aria-label={`View ${product.name} details`}
          className={`block relative w-full overflow-hidden bg-gradient-to-br from-[#14171f] via-[#1c1f2e] to-[#281e46] ${
            compactDensity ? 'aspect-[2/1]' : 'aspect-[16/9]'
          }`}
        >
          <PixelTransitionSurface
            maxParticlesDesktop={54}
            maxParticlesMobile={26}
            className="w-full h-full"
          >
            {heroSrc ? (
              <img
                src={heroSrc}
                alt={`${product.name} preview artwork`}
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
              />
            ) : (
              <div className="h-full w-full flex items-center justify-center text-white/40">
                <ProductIcon iconKey={product.iconKey} className="w-12 h-12" />
              </div>
            )}
          </PixelTransitionSurface>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />
          <div className="pointer-events-none absolute bottom-3 left-4 right-4 flex items-center justify-between gap-3 z-20">
            <div className="flex items-center gap-3 min-w-0">
              <div className="showcase-icon-float w-10 h-10 rounded-xl bg-black/45 sm:bg-white/15 sm:backdrop-blur-md border border-white/25 flex items-center justify-center text-white shrink-0">
                <ProductIcon iconKey={product.iconKey} className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-display text-lg font-semibold text-white truncate">
                  {product.name}
                </h3>
                <p className="text-xs text-white/80 truncate">{product.category}</p>
              </div>
            </div>
          </div>
        </Link>

        {/* Unboxed Metadata & Description */}
        <div className={compactDensity ? 'p-4 space-y-2' : 'p-5 sm:p-6 space-y-3'}>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#4b5563] dark:text-slate-400">
            <span className="font-medium text-violet-700 dark:text-violet-400">
              {product.status}
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-tabular">v{product.version}</span>
            <span aria-hidden="true">·</span>
            <span>{product.platforms.join(' / ')}</span>
          </div>

          <p
            className={`text-sm leading-relaxed text-[#4b5563] dark:text-slate-300 ${
              compactDensity ? 'line-clamp-2' : 'line-clamp-3'
            }`}
          >
            {product.description}
          </p>
        </div>
      </div>

      {/* Action Controls */}
      <div
        className={`relative z-20 ${
          compactDensity ? 'px-4 pb-4 pt-2' : 'px-5 pb-5 sm:px-6 sm:pb-6 pt-2'
        } flex flex-wrap items-center gap-2 border-t border-black/6 dark:border-white/8`}
      >
        <button
          type="button"
          onClick={() => onPreview(product)}
          className="min-h-[44px] sm:min-h-[40px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-white dark:bg-[#1b2029] text-[#0b0c10] dark:text-white border border-black/10 dark:border-white/10 hover:border-violet-500/40 active:scale-[0.98] transition-transform whitespace-nowrap shrink-0"
        >
          <Eye className="w-3.5 h-3.5" />
          Live Preview
        </button>

        {product.websiteUrl && (
          <a
            href={product.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => onVisit?.(product)}
            className="min-h-[44px] sm:min-h-[40px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-violet-600 text-white hover:bg-violet-700 active:scale-[0.98] transition-transform whitespace-nowrap shrink-0"
          >
            Visit {product.name}
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        )}

        {product.downloadUrl && (
          <a
            href={product.downloadUrl}
            download
            onClick={() => onDownload?.(product)}
            className="min-h-[44px] sm:min-h-[40px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] transition-transform whitespace-nowrap shrink-0"
          >
            <Download className="w-3.5 h-3.5" />
            Download
          </a>
        )}

        <Link
          to={`/products/${product.slug}`}
          state={{ pixelTransition: product.slug }}
          className="min-h-[44px] sm:min-h-[40px] inline-flex items-center px-3 py-2 text-xs font-medium text-[#4b5563] dark:text-slate-300 hover:text-[#0b0c10] dark:hover:text-white transition-colors ml-auto whitespace-nowrap shrink-0"
        >
          Learn More
        </Link>
      </div>
    </Showcase3DCard>
  );
}
