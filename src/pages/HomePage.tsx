import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ArrowRight,
  Bell,
  Compass,
  Layers,
  Search,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { useCatalog } from '../context/CatalogContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { prepareEcosystemLaunch } from '../lib/ecosystem';
import { GENERATED_ASSETS, PRODUCT_CATEGORIES } from '../data/catalog';
import { Product } from '../types';
import { StarfieldCanvas } from '../components/StarfieldCanvas';
import { ProductCard } from '../components/ProductCard';
import { PreviewModal } from '../components/PreviewModal';
import { EcosystemDiagram } from '../components/EcosystemDiagram';
import { MembershipForm } from '../components/MembershipForm';
import { FeaturedSpotlight } from '../components/FeaturedSpotlight';
import { Showcase3DCard } from '../components/Showcase3DCard';
import { HeroConstellationOverlay } from '../components/HeroConstellationOverlay';
import { DailyQuoteCard } from '../components/DailyQuoteCard';
import {
  PixelLoadingMatrix,
  PixelTransitionSurface,
} from '../components/PixelTransitionCanvas';

const MEMBERSHIP_HIGHLIGHTS = [
  'Member profile synced with Vioratundra identity',
  'Product announcements and release dispatches',
  'Early access opportunities for upcoming betas',
  'Exclusive ecosystem updates and previews',
  'Community access across Astra Vesper channels',
  'Member benefits and launch notifications',
];

export default function HomePage() {
  const { publishedProducts, siteContent, loading } = useCatalog();
  const { logActivity, recordDownload, getIdToken, connectedApps } = useAuth();
  const { theme, language, compactDensity } = useTheme();
  const { toast } = useToast();
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'featured' | 'newest' | 'alphabetical'>('featured');
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);
  const [constellationReplay, setConstellationReplay] = useState(0);

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = publishedProducts.filter((p) => {
      if (selectedCategory !== 'All' && p.category !== selectedCategory) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.availableFeatures.some((f) => f.toLowerCase().includes(q))
      );
    });

    return [...list].sort((a, b) => {
      if (sortBy === 'alphabetical') return a.name.localeCompare(b.name);
      if (sortBy === 'newest') {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }, [publishedProducts, searchQuery, selectedCategory, sortBy]);

  return (
    <div className={compactDensity ? 'space-y-10 sm:space-y-12 pb-14' : 'space-y-12 sm:space-y-18 pb-20'}>
      {/* Optional Admin Announcement */}
      {siteContent.announcementVisible && siteContent.announcementBanner && (
        <div className="border-b border-violet-600/20 bg-violet-600/8 dark:bg-violet-500/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-center gap-2 text-xs font-medium text-violet-800 dark:text-violet-200 text-center">
            <Bell className="w-3.5 h-3.5 shrink-0" />
            <span>{siteContent.announcementBanner}</span>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-black/8 dark:border-white/10">
        <StarfieldCanvas />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 lg:py-22">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10 lg:gap-12 items-stretch">
            {/* Hero Copy */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-7 flex flex-col justify-center space-y-6"
            >
              <div className="space-y-3">
                <p className="font-display text-xs font-semibold tracking-[0.18em] text-violet-700 dark:text-violet-400">
                  ASTRA VESPER
                </p>
                <h1
                  className="font-display font-bold text-[#0b0c10] dark:text-white leading-[1.08]"
                  style={{ fontSize: 'clamp(2.25rem, 4.4vw, 3.75rem)', textWrap: 'balance' }}
                >
                  {siteContent.heroHeadline}
                </h1>
                <p className="text-base sm:text-lg text-[#4b5563] dark:text-slate-300 leading-relaxed max-w-2xl">
                  {siteContent.heroDescription}
                </p>
              </div>

              {/* Primary & Secondary CTAs */}
              <div className="space-y-3 pt-1">
                <div className="flex flex-wrap items-center gap-3">
                  <a
                    href="#featured-ecosystem"
                    className="min-h-[46px] inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors whitespace-nowrap"
                  >
                    Explore Products
                    <ArrowRight className="w-4 h-4" />
                  </a>
                  <Link
                    to="/about"
                    className="min-h-[46px] inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-black/12 dark:border-white/15 bg-white/80 dark:bg-[#12151c]/80 text-[#0b0c10] dark:text-white text-sm font-semibold hover:border-violet-500/40 transition-colors whitespace-nowrap"
                  >
                    <Compass className="w-4 h-4" />
                    Discover Our Ecosystem
                  </Link>
                </div>

                <div className="flex flex-wrap items-center gap-5 pt-1 text-xs font-medium text-[#4b5563] dark:text-slate-400">
                  <Link
                    to="/account?mode=create"
                    className="hover:text-[#0b0c10] dark:hover:text-white underline underline-offset-4 transition-colors"
                  >
                    Create Account
                  </Link>
                  <a
                    href="#membership-section"
                    className="hover:text-[#0b0c10] dark:hover:text-white underline underline-offset-4 transition-colors"
                  >
                    Join Astra Vesper
                  </a>
                </div>
              </div>
            </motion.div>

            {/* Single Hero Observatory Visual with A-Crest Constellation Animation */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="lg:col-span-5 flex"
            >
              <div
                role="button"
                tabIndex={0}
                aria-label="Astra Vesper observatory showcase — activate to replay constellation formation"
                onClick={() => setConstellationReplay((n) => n + 1)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setConstellationReplay((n) => n + 1);
                  }
                }}
                className="w-full flex rounded-3xl cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-600/60"
              >
                <Showcase3DCard
                  maxTiltDeg={3.0}
                  className="w-full min-h-[270px] sm:min-h-[320px] lg:min-h-[360px] lg:h-full rounded-3xl overflow-hidden border border-black/10 dark:border-white/12 bg-[#0b0c10]"
                >
                  <PixelTransitionSurface
                    maxParticlesDesktop={78}
                    maxParticlesMobile={36}
                    className="w-full h-full"
                  >
                    <img
                      src={GENERATED_ASSETS.heroStarfield}
                      alt="Astra Vesper observatory beneath geometric starfield"
                      decoding="async"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </PixelTransitionSurface>
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/18 to-black/12 z-10" />
                  <HeroConstellationOverlay replayTrigger={constellationReplay} />
                  <div className="pointer-events-none absolute bottom-5 left-5 right-5 text-white space-y-1 z-20">
                    <p className="text-xs text-white/75">Vioratundra Digital Studio</p>
                    <p className="font-display text-base font-semibold">
                      Unified Applications, Services &amp; Viora AI
                    </p>
                  </div>
                </Showcase3DCard>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Full-Width Glassy Daily Quote Showcase Below Hero Animation */}
      <DailyQuoteCard />

      {/* Featured Ecosystem App Store Grid */}
      <section id="featured-ecosystem" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-violet-700 dark:text-violet-400">
              Featured Ecosystem
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#0b0c10] dark:text-white">
              Vioratundra Applications
            </h2>
            <p className="text-sm text-[#4b5563] dark:text-slate-400 max-w-xl">
              Discover software, digital workspaces, and intelligent media experiences curated under Astra Vesper.
            </p>
          </div>
          <Link
            to="/products"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-violet-700 dark:text-violet-400 hover:underline whitespace-nowrap"
          >
            View All Applications
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* 3D Interactive Featured Product Showcase */}
        {!loading && publishedProducts.length > 0 && (
          <FeaturedSpotlight
            products={
              publishedProducts.some((p) => p.featured)
                ? publishedProducts.filter((p) => p.featured)
                : publishedProducts.slice(0, 2)
            }
            onPreview={(p) => {
              setPreviewProduct(p);
              logActivity('Opened live preview', p.name, 'launch').catch(() => null);
            }}
            onVisit={(p) => {
              const isConnected = connectedApps.some(
                (c) => c.productId === p.id && c.status === 'connected'
              );
              void getIdToken().then((idToken) => {
                prepareEcosystemLaunch(p, { idToken, theme, language, isConnected });
              });
              logActivity('Visited external application', p.name, 'launch').catch(() => null);
            }}
          />
        )}

        {/* Search, Category Filter & Sort Toolbar */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter applications by name, feature, or category..."
                aria-label="Filter ecosystem applications"
                className="w-full min-h-[44px] pl-10 pr-10 rounded-xl border border-black/10 dark:border-white/10 bg-[#f8f9fa] dark:bg-[#12151c] text-sm text-[#0b0c10] dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-600/40"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    searchInputRef.current?.focus();
                  }}
                  aria-label="Clear search filter"
                  className="absolute right-2 top-1/2 -translate-y-1/2 min-h-[34px] min-w-[34px] inline-flex items-center justify-center rounded-lg text-[#4b5563] dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="home-sort" className="text-xs font-medium text-[#4b5563] dark:text-slate-400 whitespace-nowrap">
                Sort by
              </label>
              <select
                id="home-sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="min-h-[44px] px-3.5 rounded-xl border border-black/10 dark:border-white/10 bg-[#f8f9fa] dark:bg-[#12151c] text-sm text-[#0b0c10] dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-600/40"
              >
                <option value="featured">Featured</option>
                <option value="newest">Newest</option>
                <option value="alphabetical">Alphabetical</option>
              </select>
            </div>
          </div>

          {/* Category Filter Buttons & Tabular Result Counter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
              {['All', ...PRODUCT_CATEGORIES].map((cat) => {
                const active = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`min-h-[42px] px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap shrink-0 border transition-colors ${
                      active
                        ? 'bg-[#0b0c10] dark:bg-white text-white dark:text-[#0b0c10] border-transparent'
                        : 'bg-white dark:bg-[#12151c] text-[#4b5563] dark:text-slate-300 border-black/10 dark:border-white/10 hover:border-violet-500/40'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
            {!loading && (
              <p className="text-xs font-mono-tabular text-[#4b5563] dark:text-slate-400 whitespace-nowrap shrink-0">
                Showing {filteredProducts.length} of {publishedProducts.length}
              </p>
            )}
          </div>
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="space-y-6">
            <PixelLoadingMatrix compact label="Loading Vioratundra applications..." />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[0, 1].map((idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-black/8 dark:border-white/10 bg-[#f8f9fa] dark:bg-[#12151c] p-6 space-y-4 animate-pulse"
                >
                  <div className="aspect-[16/9] rounded-xl bg-slate-200 dark:bg-slate-800" />
                  <div className="h-4 w-1/3 rounded bg-slate-200 dark:bg-slate-800" />
                  <div className="h-3 w-full rounded bg-slate-200 dark:bg-slate-800" />
                </div>
              ))}
            </div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="rounded-2xl border border-black/8 dark:border-white/10 bg-[#f8f9fa] dark:bg-[#12151c] p-10 text-center space-y-3">
            <Layers className="w-8 h-8 mx-auto text-slate-400" />
            <p className="text-sm font-semibold text-[#0b0c10] dark:text-white">
              No applications match the active filter
            </p>
            <p className="text-xs text-[#4b5563] dark:text-slate-400">
              Try resetting your category selection or clearing your search keywords.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('All');
                setSearchQuery('');
              }}
              className="min-h-[40px] px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-medium hover:bg-violet-700"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className={`grid grid-cols-1 md:grid-cols-2 ${compactDensity ? 'gap-4' : 'gap-6'}`}>
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onPreview={(p) => {
                  setPreviewProduct(p);
                  logActivity('Opened live preview', p.name, 'launch').catch(() => null);
                }}
                onVisit={(p) => {
                  const isConnected = connectedApps.some(
                    (c) => c.productId === p.id && c.status === 'connected'
                  );
                  void getIdToken().then((idToken) => {
                    prepareEcosystemLaunch(p, { idToken, theme, language, isConnected });
                  });
                  logActivity('Visited external application', p.name, 'launch').catch(() => null);
                }}
                onDownload={(p) => {
                  if (p.downloadUrl) {
                    toast({
                      variant: 'success',
                      title: `Download started · ${p.name}`,
                      description: `Package v${p.version}`,
                    });
                    recordDownload({
                      productId: p.id,
                      productName: p.name,
                      version: p.version,
                      platform: p.platforms[0] || 'Desktop',
                      downloadUrl: p.downloadUrl,
                    }).catch(() => null);
                  }
                }}
              />
            ))}
          </div>
        )}
      </section>

      {/* Ecosystem Relationship Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">
              Architecture &amp; Identity
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#0b0c10] dark:text-white">
              How Astra Vesper Connects Vioratundra
            </h2>
          </div>
          <Link
            to="/about"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-700 dark:text-blue-400 hover:underline whitespace-nowrap"
          >
            Read About Astra Vesper
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <EcosystemDiagram />
      </section>

      {/* Membership Section */}
      <section
        id="membership-section"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      >
        <div className="rounded-3xl border border-black/10 dark:border-white/10 bg-[#f8f9fa] dark:bg-[#10131a] p-6 sm:p-10 lg:p-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            <div className="lg:col-span-5 space-y-5">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-violet-700 dark:text-violet-400">
                <Users className="w-4 h-4" />
                <span>Astra Vesper Membership</span>
              </div>
              <h2
                className="font-display text-2xl sm:text-3xl font-bold text-[#0b0c10] dark:text-white"
                style={{ textWrap: 'balance' }}
              >
                {siteContent.membershipHeadline}
              </h2>
              <p className="text-sm sm:text-base text-[#4b5563] dark:text-slate-300 leading-relaxed">
                {siteContent.membershipDescription}
              </p>

              <ul className="space-y-2.5 pt-2">
                {MEMBERSHIP_HIGHLIGHTS.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-sm text-[#0b0c10] dark:text-slate-200"
                  >
                    <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:col-span-7">
              <MembershipForm />
            </div>
          </div>
        </div>
      </section>

      <PreviewModal
        product={previewProduct}
        onClose={() => setPreviewProduct(null)}
        onVisit={(p) => {
          logActivity('Launched from preview', p.name, 'launch').catch(() => null);
        }}
      />
    </div>
  );
}
