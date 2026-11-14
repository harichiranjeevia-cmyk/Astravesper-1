import { useEffect, useState } from 'react';
import {
  ArrowUpRight,
  Maximize2,
  Minimize2,
  Monitor,
  ShieldAlert,
  Smartphone,
} from 'lucide-react';
import { Product } from '../types';
import { GENERATED_ASSETS, resolveAssetUrl } from '../data/catalog';
import { ProductIcon } from './ProductIcon';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { prepareEcosystemLaunch } from '../lib/ecosystem';

interface LivePreviewFrameProps {
  product: Product;
  onVisit?: () => void;
}

function detectDeviceViewport(): 'desktop' | 'mobile' {
  if (typeof window === 'undefined') return 'desktop';
  const isSmallScreen = window.matchMedia('(max-width: 767px)').matches;
  const isCoarseNarrow =
    window.matchMedia('(pointer: coarse)').matches && window.innerWidth < 900;
  return isSmallScreen || isCoarseNarrow ? 'mobile' : 'desktop';
}

export function LivePreviewFrame({ product, onVisit }: LivePreviewFrameProps) {
  const { getIdToken, connectedApps } = useAuth();
  const { theme, language } = useTheme();
  const [detectedMode, setDetectedMode] = useState<'desktop' | 'mobile'>(() =>
    detectDeviceViewport()
  );
  const [viewport, setViewport] = useState<'desktop' | 'mobile'>(() =>
    detectDeviceViewport()
  );
  const [manualOverride, setManualOverride] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [probeState, setProbeState] = useState<'checking' | 'embeddable' | 'blocked'>(
    product.previewUrl ? 'checking' : 'blocked'
  );
  const [iframeLoaded, setIframeLoaded] = useState(false);

  const targetUrl = product.previewUrl || product.websiteUrl || '';
  const isConnected = connectedApps.some(
    (c) => c.productId === product.id && c.status === 'connected'
  );

  const handleOpenApplication = () => {
    void getIdToken().then((idToken) => {
      prepareEcosystemLaunch(product, {
        idToken,
        theme,
        language,
        isConnected,
      });
    });
    onVisit?.();
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const syncViewport = () => {
      const next = detectDeviceViewport();
      setDetectedMode(next);
      if (!manualOverride) {
        setViewport(next);
      }
    };
    window.addEventListener('resize', syncViewport);
    return () => window.removeEventListener('resize', syncViewport);
  }, [manualOverride]);

  useEffect(() => {
    let active = true;
    if (!targetUrl) {
      setProbeState('blocked');
      return;
    }

    setProbeState('checking');
    setIframeLoaded(false);

    fetch(`/api/preview-check?url=${encodeURIComponent(targetUrl)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!active) return;
        setProbeState(data.embeddable ? 'embeddable' : 'blocked');
      })
      .catch(() => {
        if (!active) return;
        setProbeState('blocked');
      });

    return () => {
      active = false;
    };
  }, [targetUrl]);

  const selectViewport = (mode: 'desktop' | 'mobile') => {
    setManualOverride(true);
    setViewport(mode);
  };

  const containerClass = fullscreen
    ? 'fixed inset-0 z-50 bg-[#0b0c10] p-3 sm:p-6 flex flex-col'
    : 'rounded-2xl border border-black/10 dark:border-white/10 bg-[#f8f9fa] dark:bg-[#12151c] overflow-hidden';

  return (
    <div className={containerClass}>
      {/* Clean Responsive Preview Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 px-3.5 sm:px-4 py-3 border-b border-black/8 dark:border-white/10 bg-white dark:bg-[#151922]">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-8 h-8 rounded-lg bg-violet-600/10 text-violet-700 dark:text-violet-400 flex items-center justify-center shrink-0">
            <ProductIcon iconKey={product.iconKey} className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-[#0b0c10] dark:text-white truncate">
              {product.name} · Live Preview
            </p>
            <p className="text-[11px] font-mono-tabular text-[#4b5563] dark:text-slate-400 truncate">
              Auto: {detectedMode === 'mobile' ? 'Mobile Screen' : 'Desktop Screen'} ·{' '}
              {targetUrl || 'Preview URL unavailable'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <div className="inline-flex items-center p-0.5 rounded-xl bg-[#f1f3f5] dark:bg-[#1e2430] border border-black/5 dark:border-white/5">
            <button
              type="button"
              onClick={() => selectViewport('desktop')}
              aria-label="Desktop preview"
              className={`min-h-[38px] px-2.5 py-1 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                viewport === 'desktop'
                  ? 'bg-white dark:bg-[#0b0c10] text-[#0b0c10] dark:text-white shadow-xs'
                  : 'text-[#4b5563] dark:text-slate-400'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Desktop</span>
            </button>
            <button
              type="button"
              onClick={() => selectViewport('mobile')}
              aria-label="Mobile preview"
              className={`min-h-[38px] px-2.5 py-1 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                viewport === 'mobile'
                  ? 'bg-white dark:bg-[#0b0c10] text-[#0b0c10] dark:text-white shadow-xs'
                  : 'text-[#4b5563] dark:text-slate-400'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Mobile</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setFullscreen((f) => !f)}
            aria-label={fullscreen ? 'Exit fullscreen preview' : 'Enter fullscreen preview'}
            className="min-h-[40px] min-w-[40px] inline-flex items-center justify-center rounded-xl border border-black/10 dark:border-white/10 text-[#4b5563] dark:text-slate-300 hover:text-[#0b0c10] dark:hover:text-white transition-colors"
          >
            {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {targetUrl && (
            <a
              href={targetUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleOpenApplication}
              className="min-h-[40px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 transition-colors whitespace-nowrap"
            >
              <span className="hidden sm:inline">Open Application</span>
              <span className="sm:hidden">Open</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>

      {/* Preview Canvas */}
      <div
        className={`relative flex items-center justify-center p-2.5 sm:p-5 bg-[#eef0f4] dark:bg-[#0d1016] ${
          fullscreen ? 'flex-1 overflow-auto' : 'min-h-[380px] sm:min-h-[500px]'
        }`}
      >
        {probeState === 'checking' && (
          <div className="w-full max-w-md rounded-2xl border border-black/8 dark:border-white/10 bg-white dark:bg-[#12151c] p-6 text-center space-y-3">
            <div className="h-3 w-2/3 mx-auto rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
            <div className="h-3 w-1/2 mx-auto rounded bg-slate-200 dark:bg-slate-800 animate-pulse" />
            <p className="text-xs text-[#4b5563] dark:text-slate-400">
              Checking live embedding availability for {product.name}...
            </p>
          </div>
        )}

        {probeState === 'embeddable' && targetUrl && (
          <div
            className={`relative bg-white dark:bg-[#0b0c10] border border-black/10 dark:border-white/15 overflow-hidden transition-transform duration-200 ${
              viewport === 'mobile'
                ? 'w-full max-w-[375px] h-[460px] sm:h-[600px] rounded-[26px] shadow-xl'
                : fullscreen
                ? 'w-full h-full rounded-xl'
                : 'w-full h-[380px] sm:h-[480px] rounded-xl'
            }`}
          >
            {!iframeLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-[#f8f9fa] dark:bg-[#12151c] text-xs text-[#4b5563] dark:text-slate-400">
                Loading {product.name} preview...
              </div>
            )}
            <iframe
              src={targetUrl}
              title={`${product.name} live application preview`}
              loading="lazy"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              onLoad={() => setIframeLoaded(true)}
              className="w-full h-full border-0"
            />
          </div>
        )}

        {probeState === 'blocked' && (
          <div
            className={`w-full ${
              viewport === 'mobile' ? 'max-w-[375px]' : 'max-w-2xl'
            } rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#12151c] overflow-hidden`}
          >
            <div className="relative aspect-[16/9] w-full bg-[#12151c]">
              <img
                src={resolveAssetUrl(product.heroImageUrl) || GENERATED_ASSETS.heroStarfield}
                alt={product.name}
                decoding="async"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
              <div className="pointer-events-none absolute bottom-4 left-4 right-4 text-white">
                <p className="text-xs text-white/75">
                  {product.category} · v{product.version}
                </p>
                <h4 className="font-display text-lg sm:text-xl font-semibold">
                  {product.name}
                </h4>
              </div>
            </div>
            <div className="p-4 sm:p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-[#0b0c10] dark:text-white">
                    Direct Browser Launch Recommended
                  </p>
                  <p className="text-xs leading-relaxed text-[#4b5563] dark:text-slate-400">
                    This application restricts third-party iframe embedding via its host security policy. Launch {product.name} directly in a dedicated browser tab for the complete interactive experience.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 pt-1">
                {targetUrl && (
                  <a
                    href={targetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleOpenApplication}
                    className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition-colors"
                  >
                    Open Application
                    <ArrowUpRight className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
