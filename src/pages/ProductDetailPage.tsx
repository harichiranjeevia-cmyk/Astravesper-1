import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  Link2,
  Share2,
  Unlink,
} from 'lucide-react';
import { useCatalog } from '../context/CatalogContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { prepareEcosystemLaunch } from '../lib/ecosystem';
import { ProductIcon } from '../components/ProductIcon';
import { LivePreviewFrame } from '../components/LivePreviewFrame';
import { Showcase3DCard } from '../components/Showcase3DCard';
import { PixelTransitionSurface } from '../components/PixelTransitionCanvas';
import { resolveAssetUrl } from '../data/catalog';

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { publishedProducts, products } = useCatalog();
  const {
    firebaseUser,
    isAdmin,
    connectedApps,
    toggleConnectedApp,
    logActivity,
    recordDownload,
    getIdToken,
  } = useAuth();
  const { theme, language, compactDensity } = useTheme();
  const { toast } = useToast();
  const [copiedLink, setCopiedLink] = useState(false);

  const pool = isAdmin ? products : publishedProducts;
  const product = pool.find((p) => p.slug === slug || p.id === slug);

  const related = useMemo(
    () => publishedProducts.filter((p) => p.id !== product?.id).slice(0, 3),
    [publishedProducts, product?.id]
  );

  if (!product) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-20 text-center space-y-4">
        <h1 className="font-display text-2xl font-bold text-[#0b0c10] dark:text-white">
          Application not found
        </h1>
        <p className="text-sm text-[#4b5563] dark:text-slate-400">
          The requested product could not be located in the Astra Vesper catalog.
        </p>
        <Link
          to="/products"
          className="inline-flex items-center px-5 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-medium hover:bg-violet-700"
        >
          Back to Products
        </Link>
      </div>
    );
  }

  const isConnected = connectedApps.some(
    (c) => c.productId === product.id && c.status === 'connected'
  );

  const handleCopyShareLink = async () => {
    const shareUrl = `${window.location.origin}/products/${product.slug}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      toast({
        variant: 'success',
        title: 'Application link copied',
        description: `${product.name} link is ready to share.`,
      });
      window.setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      toast({
        variant: 'info',
        title: 'Copy unavailable in this browser context',
        description: shareUrl,
      });
    }
  };

  return (
    <div
      className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${
        compactDensity ? 'py-7 space-y-8' : 'py-10 space-y-12'
      }`}
    >
      {/* Breadcrumb Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-[#4b5563] dark:text-slate-400">
        <Link to="/" className="hover:text-[#0b0c10] dark:hover:text-white">
          Home
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <Link to="/products" className="hover:text-[#0b0c10] dark:hover:text-white">
          Products
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="font-medium text-[#0b0c10] dark:text-white truncate">
          {product.name}
        </span>
      </nav>

      {/* Product Overview Header with 3D Depth & Pixel Reconstruction */}
      <Showcase3DCard
        maxTiltDeg={2.4}
        className={`rounded-3xl border border-black/10 dark:border-white/10 bg-[#f8f9fa] dark:bg-[#12151c] ${
          compactDensity ? 'p-5 sm:p-7 space-y-4' : 'p-6 sm:p-10 space-y-6'
        }`}
      >
        <div className="relative z-20 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <PixelTransitionSurface
              transitionKey={product.slug}
              maxParticlesDesktop={36}
              maxParticlesMobile={20}
              className="showcase-icon-float w-14 h-14 rounded-2xl overflow-hidden shrink-0"
            >
              <div className="w-14 h-14 rounded-2xl bg-violet-600 text-white flex items-center justify-center shadow-md">
                <ProductIcon iconKey={product.iconKey} className="w-7 h-7" />
              </div>
            </PixelTransitionSurface>
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#4b5563] dark:text-slate-400">
                <span className="font-medium text-violet-700 dark:text-violet-400">
                  {product.category}
                </span>
                <span aria-hidden="true">·</span>
                <span>{product.status}</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono-tabular">v{product.version}</span>
                <span aria-hidden="true">·</span>
                <span>Developed by Vioratundra</span>
              </div>
              <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#0b0c10] dark:text-white">
                {product.name}
              </h1>
              <p className="text-sm sm:text-base text-[#4b5563] dark:text-slate-300 max-w-2xl leading-relaxed">
                {product.description}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {product.websiteUrl && (
              <a
                href={product.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  void getIdToken().then((idToken) => {
                    prepareEcosystemLaunch(product, { idToken, theme, language, isConnected });
                  });
                  logActivity('Visited external application', product.name, 'launch').catch(
                    () => null
                  );
                }}
                className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 active:scale-[0.98] transition-transform"
              >
                Visit {product.name}
                <ArrowUpRight className="w-4 h-4" />
              </a>
            )}

            {product.downloadUrl && (
              <a
                href={product.downloadUrl}
                download
                onClick={() => {
                  toast({
                    variant: 'success',
                    title: `Download started · ${product.name}`,
                    description: `Package v${product.version}`,
                  });
                  recordDownload({
                    productId: product.id,
                    productName: product.name,
                    version: product.version,
                    platform: product.platforms[0] || 'Desktop',
                    downloadUrl: product.downloadUrl!,
                  }).catch(() => null);
                }}
                className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 active:scale-[0.98] transition-transform"
              >
                <Download className="w-4 h-4" />
                Download v{product.version}
              </a>
            )}

            {firebaseUser && (
              <button
                type="button"
                onClick={async () => {
                  const wasConnected = isConnected;
                  try {
                    await toggleConnectedApp(product.id, product.name);
                    toast({
                      variant: wasConnected ? 'info' : 'success',
                      title: wasConnected
                        ? `Disconnected ${product.name}`
                        : `Connected ${product.name} to your account`,
                    });
                  } catch {
                    toast({
                      variant: 'error',
                      title: 'Could not update connection status',
                    });
                  }
                }}
                className="min-h-[44px] inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-[#1a1f29] text-xs font-medium text-[#0b0c10] dark:text-white hover:border-violet-500/40 active:scale-[0.98] transition-transform"
              >
                {isConnected ? (
                  <>
                    <Unlink className="w-3.5 h-3.5 text-emerald-500" />
                    Connected
                  </>
                ) : (
                  <>
                    <Link2 className="w-3.5 h-3.5" />
                    Connect to Account
                  </>
                )}
              </button>
            )}

            <button
              type="button"
              onClick={handleCopyShareLink}
              aria-label={`Copy ${product.name} link`}
              className="min-h-[44px] inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-[#1a1f29] text-xs font-medium text-[#0b0c10] dark:text-white hover:border-violet-500/40 active:scale-[0.98] transition-transform whitespace-nowrap"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  Copied
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" />
                  Copy Link
                </>
              )}
            </button>
          </div>
        </div>

        {/* Supported Platforms & Download Availability */}
        <div className="relative z-20 pt-4 border-t border-black/8 dark:border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs text-[#4b5563] dark:text-slate-400">
          <div>
            <span className="font-medium text-[#0b0c10] dark:text-white">Supported Platforms: </span>
            {product.platforms.join(' · ')}
          </div>
          {!product.downloadUrl && (
            <span>
              Direct installer packages are not hosted here; access via the official application portal above.
            </span>
          )}
        </div>
      </Showcase3DCard>

      {/* Interactive Live Preview Section */}
      <section className="space-y-4">
        <h2 className="font-display text-2xl font-bold text-[#0b0c10] dark:text-white">
          Live Application Preview
        </h2>
        <PixelTransitionSurface
          transitionKey={product.slug}
          maxParticlesDesktop={68}
          maxParticlesMobile={32}
          className="rounded-2xl overflow-hidden"
        >
          <LivePreviewFrame
            product={product}
            onVisit={() =>
              logActivity('Launched from detail preview', product.name, 'launch').catch(() => null)
            }
          />
        </PixelTransitionSurface>
      </section>

      {/* Features: Available vs. Planned */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#12151c] p-6 space-y-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
              Currently Available
            </p>
            <h2 className="font-display text-xl font-bold text-[#0b0c10] dark:text-white">
              Verified Features
            </h2>
          </div>
          <ul className="space-y-2.5">
            {product.availableFeatures.map((feat) => (
              <li
                key={feat}
                className="flex items-start gap-2.5 text-sm text-[#0b0c10] dark:text-slate-200"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>{feat}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#12151c] p-6 space-y-4">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">
              Roadmap
            </p>
            <h2 className="font-display text-xl font-bold text-[#0b0c10] dark:text-white">
              Planned Capabilities
            </h2>
          </div>
          {product.plannedFeatures.length === 0 ? (
            <p className="text-sm text-[#4b5563] dark:text-slate-400">
              No additional planned roadmap items listed for this release cycle.
            </p>
          ) : (
            <ul className="space-y-2.5">
              {product.plannedFeatures.map((feat) => (
                <li
                  key={feat}
                  className="flex items-start gap-2.5 text-sm text-[#4b5563] dark:text-slate-300"
                >
                  <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Screenshots & Media */}
      {product.screenshots && product.screenshots.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-display text-2xl font-bold text-[#0b0c10] dark:text-white">
            Product Visuals
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {product.screenshots.map((src, i) => (
              <PixelTransitionSurface
                key={`${product.slug}-${src}-${i}`}
                transitionKey={`${product.slug}-${i}`}
                maxParticlesDesktop={48}
                maxParticlesMobile={24}
                className="rounded-2xl overflow-hidden border border-black/10 dark:border-white/10 bg-[#12151c] aspect-[16/10]"
              >
                <img
                  src={resolveAssetUrl(src)}
                  alt={`${product.name} showcase ${i + 1}`}
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              </PixelTransitionSurface>
            ))}
          </div>
        </section>
      )}

      {/* Release Notes & Changelog */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 rounded-2xl border border-black/10 dark:border-white/10 bg-[#f8f9fa] dark:bg-[#12151c] p-6 space-y-3">
          <h2 className="font-display text-lg font-bold text-[#0b0c10] dark:text-white">
            Release Notes · v{product.version}
          </h2>
          <p className="text-sm leading-relaxed text-[#4b5563] dark:text-slate-300">
            {product.releaseNotes || 'Standard maintenance and platform stability release.'}
          </p>
        </div>

        <div className="lg:col-span-7 rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#12151c] p-6 space-y-4">
          <h2 className="font-display text-lg font-bold text-[#0b0c10] dark:text-white">
            Changelog
          </h2>
          {product.changelog && product.changelog.length > 0 ? (
            <div className="divide-y divide-black/8 dark:divide-white/10">
              {product.changelog.map((entry) => (
                <div key={entry.version} className="py-3 first:pt-0 last:pb-0 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-mono-tabular font-semibold text-[#0b0c10] dark:text-white">
                      v{entry.version}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono-tabular text-[#4b5563] dark:text-slate-400">
                      {entry.date}
                    </span>
                  </div>
                  <ul className="list-disc list-inside text-sm text-[#4b5563] dark:text-slate-300 space-y-1">
                    {entry.notes.map((note) => (
                      <li key={note}>{note}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#4b5563] dark:text-slate-400">
              Initial ecosystem listing for v{product.version}.
            </p>
          )}
        </div>
      </section>

      {/* Related Products */}
      {related.length > 0 && (
        <section className="space-y-4 pt-4 border-t border-black/8 dark:border-white/10">
          <h2 className="font-display text-xl font-bold text-[#0b0c10] dark:text-white">
            More in the Astra Vesper Ecosystem
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {related.map((rel) => (
              <Link
                key={rel.id}
                to={`/products/${rel.slug}`}
                state={{ pixelTransition: rel.slug }}
                className="rounded-2xl border border-black/10 dark:border-white/10 bg-[#f8f9fa] dark:bg-[#12151c] p-5 space-y-2 hover:border-violet-500/40 active:scale-[0.99] transition-all"
              >
                <p className="text-xs text-violet-700 dark:text-violet-400 font-medium">
                  {rel.category} · v{rel.version}
                </p>
                <h3 className="font-display text-base font-semibold text-[#0b0c10] dark:text-white">
                  {rel.name}
                </h3>
                <p className="text-xs text-[#4b5563] dark:text-slate-400 line-clamp-2">
                  {rel.tagline}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
