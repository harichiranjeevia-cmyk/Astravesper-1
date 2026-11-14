import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Clock,
  FileText,
  HelpCircle,
  Layers,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import { useCatalog } from '../context/CatalogContext';
import { ECOSYSTEM_FAQS, ECOSYSTEM_SERVICES, PRODUCT_CATEGORIES } from '../data/catalog';

interface SearchEntry {
  id: string;
  type: 'Application' | 'Feature' | 'Service' | 'Category' | 'Documentation' | 'FAQ';
  title: string;
  subtitle: string;
  to: string;
  keywords: string;
}

const HISTORY_KEY = 'astra_vesper_search_history';

export function SearchModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { publishedProducts } = useCatalog();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [rawQuery, setRawQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [history, setHistory] = useState<string[]>(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
      return Array.isArray(saved) ? saved : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(rawQuery.trim()), 140);
    return () => clearTimeout(timer);
  }, [rawQuery]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 40);
      setSelectedIndex(0);
    } else {
      setRawQuery('');
      setDebouncedQuery('');
    }
  }, [open]);

  const indexEntries = useMemo<SearchEntry[]>(() => {
    const entries: SearchEntry[] = [];

    for (const p of publishedProducts) {
      entries.push({
        id: `app-${p.id}`,
        type: 'Application',
        title: p.name,
        subtitle: `${p.category} · v${p.version} · ${p.tagline}`,
        to: `/products/${p.slug}`,
        keywords: `${p.name} ${p.description} ${p.category} ${p.platforms.join(' ')}`,
      });
      for (const feat of p.availableFeatures) {
        entries.push({
          id: `feat-${p.id}-${feat}`,
          type: 'Feature',
          title: feat,
          subtitle: `Available in ${p.name}`,
          to: `/products/${p.slug}`,
          keywords: `${feat} ${p.name} ${p.category}`,
        });
      }
    }

    for (const svc of ECOSYSTEM_SERVICES) {
      entries.push({
        id: `svc-${svc.id}`,
        type: 'Service',
        title: svc.title,
        subtitle: svc.summary,
        to: '/services',
        keywords: `${svc.title} ${svc.summary} ${svc.capabilities.join(' ')}`,
      });
    }

    for (const cat of PRODUCT_CATEGORIES) {
      entries.push({
        id: `cat-${cat}`,
        type: 'Category',
        title: cat,
        subtitle: 'Browse applications in this category',
        to: `/products?category=${encodeURIComponent(cat)}`,
        keywords: cat,
      });
    }

    entries.push(
      {
        id: 'solis-vexen-brand',
        type: 'Documentation',
        title: 'Solis Vexen — Watch Brand (Under Development)',
        subtitle: 'Separate brushed-silver chronometer brand · solisvexen.vercel.app',
        to: '/solis-vexen',
        keywords: 'solis vexen watch horology chronometer silver development prototype vercel',
      },
      {
        id: 'doc-ecosystem',
        type: 'Documentation',
        title: 'Astra Vesper & Vioratundra Architecture',
        subtitle: 'Parent brand, product studio relationship & visual diagram',
        to: '/about',
        keywords: 'astra vesper vioratundra architecture ecosystem diagram documentation',
      },
      {
        id: 'doc-safety',
        type: 'Documentation',
        title: 'Safety, Security & Privacy Policy',
        subtitle: 'Google Sign-In security, Firestore isolation & Viora AI boundaries',
        to: '/support/safety',
        keywords: 'safety security privacy policy google auth protection rules',
      },
      {
        id: 'doc-account',
        type: 'Documentation',
        title: 'Vioratundra Account & Privacy Guide',
        subtitle: 'Profile management, data export, and account deletion',
        to: '/account',
        keywords: 'account profile export delete privacy security vioratundra',
      }
    );

    for (const faq of ECOSYSTEM_FAQS) {
      entries.push({
        id: `faq-${faq.id}`,
        type: 'FAQ',
        title: faq.question,
        subtitle: faq.answer,
        to: '/services#faqs',
        keywords: `${faq.question} ${faq.answer} ${faq.category}`,
      });
    }

    return entries;
  }, [publishedProducts]);

  const filteredResults = useMemo(() => {
    const q = debouncedQuery.toLowerCase();
    return indexEntries
      .filter((entry) => {
        if (activeFilter !== 'All' && entry.type !== activeFilter) return false;
        if (!q) return entry.type === 'Application' || entry.type === 'Service';
        return (
          entry.title.toLowerCase().includes(q) ||
          entry.subtitle.toLowerCase().includes(q) ||
          entry.keywords.toLowerCase().includes(q)
        );
      })
      .slice(0, 12);
  }, [indexEntries, debouncedQuery, activeFilter]);

  const saveSearchTerm = (term: string) => {
    const clean = term.trim();
    if (!clean) return;
    const next = [clean, ...history.filter((h) => h !== clean)].slice(0, 5);
    setHistory(next);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  };

  const handleSelect = (entry: SearchEntry) => {
    if (rawQuery.trim()) saveSearchTerm(rawQuery);
    onClose();
    navigate(entry.to);
  };

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, Math.max(0, filteredResults.length - 1)));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(0, i - 1));
      } else if (e.key === 'Enter' && filteredResults[selectedIndex]) {
        e.preventDefault();
        handleSelect(filteredResults[selectedIndex]);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, filteredResults, selectedIndex]);

  if (!open) return null;

  const filterTypes = ['All', 'Application', 'Feature', 'Service', 'Category', 'FAQ'];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Global Astra Vesper Search"
      className="fixed inset-0 z-50 bg-black/55 backdrop-blur-sm flex items-start justify-center p-4 sm:pt-16"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl border border-black/10 dark:border-white/15 bg-white dark:bg-[#12151c] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-black/8 dark:border-white/10">
          <Search className="w-5 h-5 text-[#4b5563] dark:text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={rawQuery}
            onChange={(e) => {
              setRawQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Search applications, features, services, documentation, FAQs..."
            className="w-full bg-transparent text-sm sm:text-base text-[#0b0c10] dark:text-white placeholder:text-slate-400 focus:outline-none"
          />
          {rawQuery && (
            <button
              type="button"
              onClick={() => setRawQuery('')}
              aria-label="Clear search query"
              className="p-1.5 rounded-lg text-slate-400 hover:text-[#0b0c10] dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-2 py-1 text-xs font-mono-tabular rounded-md border border-black/10 dark:border-white/10 text-[#4b5563] dark:text-slate-400"
          >
            ESC
          </button>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 px-4 py-2.5 overflow-x-auto border-b border-black/6 dark:border-white/8 bg-[#f8f9fa] dark:bg-[#0e1117]">
          {filterTypes.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => {
                setActiveFilter(type);
                setSelectedIndex(0);
              }}
              className={`min-h-[32px] px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                activeFilter === type
                  ? 'bg-violet-600 text-white'
                  : 'text-[#4b5563] dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/10'
              }`}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Recent Searches */}
        {!debouncedQuery && history.length > 0 && (
          <div className="px-4 py-2.5 border-b border-black/6 dark:border-white/8 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] text-[#4b5563] dark:text-slate-400">
              <Clock className="w-3 h-3" />
              Recent:
            </span>
            {history.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => setRawQuery(term)}
                className="px-2.5 py-1 rounded-lg text-xs bg-[#f1f3f5] dark:bg-[#1b2029] text-[#0b0c10] dark:text-slate-200 hover:bg-violet-600/10"
              >
                {term}
              </button>
            ))}
          </div>
        )}

        {/* Results */}
        <div className="max-h-[55vh] overflow-y-auto divide-y divide-black/6 dark:divide-white/8">
          {filteredResults.length === 0 ? (
            <div className="p-8 text-center space-y-3">
              <p className="text-sm font-medium text-[#0b0c10] dark:text-white">
                No results matched &ldquo;{debouncedQuery}&rdquo;
              </p>
              <p className="text-xs text-[#4b5563] dark:text-slate-400">
                Try searching for Viora+ Music, VioraFlow, Membership, or AI Radio.
              </p>
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                {['Viora+ Music', 'VioraFlow', 'Account', 'Lyrics'].map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => setRawQuery(sug)}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium bg-[#f1f3f5] dark:bg-[#1b2029] text-[#0b0c10] dark:text-white hover:bg-violet-600/10"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            filteredResults.map((entry, idx) => (
              <button
                key={entry.id}
                type="button"
                onClick={() => handleSelect(entry)}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`w-full text-left px-4 py-3 flex items-center justify-between gap-3 transition-colors ${
                  idx === selectedIndex
                    ? 'bg-violet-600/8 dark:bg-violet-500/15'
                    : 'hover:bg-black/3 dark:hover:bg-white/5'
                }`}
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="mt-0.5 w-8 h-8 rounded-lg bg-[#f1f3f5] dark:bg-[#1b2029] flex items-center justify-center text-violet-600 dark:text-violet-400 shrink-0">
                    {entry.type === 'Application' && <Layers className="w-4 h-4" />}
                    {entry.type === 'Feature' && <Sparkles className="w-4 h-4" />}
                    {entry.type === 'FAQ' && <HelpCircle className="w-4 h-4" />}
                    {(entry.type === 'Service' ||
                      entry.type === 'Category' ||
                      entry.type === 'Documentation') && <FileText className="w-4 h-4" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-xs text-[#4b5563] dark:text-slate-400">
                      <span className="font-medium text-violet-700 dark:text-violet-400">
                        {entry.type}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-[#0b0c10] dark:text-white truncate">
                      {entry.title}
                    </p>
                    <p className="text-xs text-[#4b5563] dark:text-slate-400 truncate">
                      {entry.subtitle}
                    </p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
