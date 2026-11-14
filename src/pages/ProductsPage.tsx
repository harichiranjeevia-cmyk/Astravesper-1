import { useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layers, Search, X } from 'lucide-react';
import { useCatalog } from '../context/CatalogContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { prepareEcosystemLaunch } from '../lib/ecosystem';
import { PRODUCT_CATEGORIES } from '../data/catalog';
import { Product } from '../types';
import { ProductCard } from '../components/ProductCard';
import { PreviewModal } from '../components/PreviewModal';
import { PixelLoadingMatrix } from '../components/PixelTransitionCanvas';

export default function ProductsPage({ title = 'Products & Applications' }: { title?: string }) {
  const { publishedProducts, loading } = useCatalog();
  const { logActivity, recordDownload, getIdToken, connectedApps } = useAuth();
  const { theme, language, compactDensity } = useTheme();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const initialCategory = searchParams.get('category') || 'All';
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<'featured' | 'newest' | 'alphabetical'>('featured');
  const [previewProduct, setPreviewProduct] = useState<Product | null>(null);

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    if (cat === 'All') {
      searchParams.delete('category');
    } else {
      searchParams.set('category', cat);
    }
    setSearchParams(searchParams, { replace: true });
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = publishedProducts.filter((p) => {
      if (selectedCategory !== 'All' && p.category !== selectedCategory) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.platforms.some((pl) => pl.toLowerCase().includes(q))
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
  }, [publishedProducts, selectedCategory, query, sortBy]);

  return (
    <div
      className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${
        compactDensity ? 'py-8 space-y-6' : 'py-12 space-y-8'
      }`}
    >
      <div className="space-y-2">
        <p className="text-xs font-semibold text-violet-700 dark:text-violet-400">
          Astra Vesper Store
        </p>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#0b0c10] dark:text-white">
          {title}
        </h1>
        <p className="text-sm sm:text-base text-[#4b5563] dark:text-slate-400 max-w-2xl">
          Explore verified applications developed by Vioratundra, inspect live previews, and review available capabilities versus upcoming roadmap features.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search applications or platforms..."
            aria-label="Search applications or platforms"
            className="w-full min-h-[44px] pl-10 pr-10 rounded-xl border border-black/10 dark:border-white/10 bg-[#f8f9fa] dark:bg-[#12151c] text-sm text-[#0b0c10] dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-600/40"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                searchInputRef.current?.focus();
              }}
              aria-label="Clear search query"
              className="absolute right-2 top-1/2 -translate-y-1/2 min-h-[34px] min-w-[34px] inline-flex items-center justify-center rounded-lg text-[#4b5563] dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
          aria-label="Sort products"
          className="min-h-[44px] px-3.5 rounded-xl border border-black/10 dark:border-white/10 bg-[#f8f9fa] dark:bg-[#12151c] text-sm text-[#0b0c10] dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-600/40"
        >
          <option value="featured">Sort: Featured</option>
          <option value="newest">Sort: Newest</option>
          <option value="alphabetical">Sort: Alphabetical</option>
        </select>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {['All', ...PRODUCT_CATEGORIES].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => handleCategoryChange(cat)}
              className={`min-h-[42px] px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap shrink-0 border transition-colors ${
                selectedCategory === cat
                  ? 'bg-[#0b0c10] dark:bg-white text-white dark:text-[#0b0c10] border-transparent'
                  : 'bg-white dark:bg-[#12151c] text-[#4b5563] dark:text-slate-300 border-black/10 dark:border-white/10 hover:border-violet-500/40'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        {!loading && (
          <p className="text-xs font-mono-tabular text-[#4b5563] dark:text-slate-400 whitespace-nowrap shrink-0">
            Showing {filtered.length} of {publishedProducts.length}
          </p>
        )}
      </div>

      {loading ? (
        <div className="space-y-6">
          <PixelLoadingMatrix compact label="Loading Astra Vesper applications..." />
          <div className={`grid grid-cols-1 md:grid-cols-2 ${compactDensity ? 'gap-4' : 'gap-6'}`}>
            {[0, 1].map((i) => (
              <div
                key={i}
                className="h-72 rounded-2xl border border-black/8 dark:border-white/10 bg-[#f8f9fa] dark:bg-[#12151c] animate-pulse"
              />
            ))}
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-black/8 dark:border-white/10 bg-[#f8f9fa] dark:bg-[#12151c] p-12 text-center space-y-3">
          <Layers className="w-8 h-8 mx-auto text-slate-400" />
          <p className="text-sm font-semibold text-[#0b0c10] dark:text-white">
            No applications found in this category yet
          </p>
          <button
            type="button"
            onClick={() => {
              handleCategoryChange('All');
              setQuery('');
            }}
            className="min-h-[40px] px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-medium hover:bg-violet-700"
          >
            Show All Products
          </button>
        </div>
      ) : (
        <div className={`grid grid-cols-1 md:grid-cols-2 ${compactDensity ? 'gap-4' : 'gap-6'}`}>
          {filtered.map((product) => (
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

      <PreviewModal
        product={previewProduct}
        onClose={() => setPreviewProduct(null)}
        onVisit={(p) => logActivity('Launched from preview', p.name, 'launch').catch(() => null)}
      />
    </div>
  );
}
