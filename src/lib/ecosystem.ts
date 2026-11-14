import { AiConfig, Product, SiteContentConfig, ThemePreference } from '../types';

const CATALOG_CACHE_KEY = 'av_catalog_cache_v1';
const ECOSYSTEM_STATE_KEY = 'av_ecosystem_state_v1';
const ECOSYSTEM_CHANNEL_NAME = 'astra-vesper-ecosystem';
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes stale-while-revalidate freshness window

export interface CachedCatalogSnapshot {
  products: Product[];
  siteContent: SiteContentConfig;
  aiConfig: AiConfig;
  cachedAt: number;
}

export interface EcosystemStateSnapshot {
  signedIn: boolean;
  uidHash?: string;
  theme: ThemePreference;
  language: string;
  compactDensity: boolean;
  connectedProductIds: string[];
  updatedAt: number;
}

export type EcosystemBroadcastMessage =
  | { type: 'THEME_SYNC'; theme: ThemePreference }
  | { type: 'LANGUAGE_SYNC'; language: string }
  | { type: 'DENSITY_SYNC'; compactDensity: boolean }
  | { type: 'AUTH_SYNC'; signedIn: boolean; connectedProductIds: string[] }
  | { type: 'CONNECTED_APPS_SYNC'; connectedProductIds: string[] }
  | { type: 'APP_LAUNCH_SYNC'; productId: string; slug: string; ts: number };

let sharedChannel: BroadcastChannel | null = null;

function getChannel(): BroadcastChannel | null {
  if (typeof window === 'undefined' || typeof BroadcastChannel === 'undefined') return null;
  if (!sharedChannel) {
    try {
      sharedChannel = new BroadcastChannel(ECOSYSTEM_CHANNEL_NAME);
    } catch {
      return null;
    }
  }
  return sharedChannel;
}

export function loadCatalogCache(): CachedCatalogSnapshot | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CATALOG_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedCatalogSnapshot;
    if (
      !parsed ||
      !Array.isArray(parsed.products) ||
      parsed.products.length === 0 ||
      !parsed.siteContent ||
      !parsed.aiConfig
    ) {
      return null;
    }
    if (typeof parsed.cachedAt === 'number' && Date.now() - parsed.cachedAt > CACHE_TTL_MS * 12) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveCatalogCache(snapshot: Omit<CachedCatalogSnapshot, 'cachedAt'>): void {
  if (typeof window === 'undefined') return;
  try {
    const payload: CachedCatalogSnapshot = {
      ...snapshot,
      cachedAt: Date.now(),
    };
    localStorage.setItem(CATALOG_CACHE_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage quota errors cleanly
  }
}

export function readEcosystemState(): EcosystemStateSnapshot | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(ECOSYSTEM_STATE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as EcosystemStateSnapshot;
  } catch {
    return null;
  }
}

export function updateEcosystemState(partial: Partial<EcosystemStateSnapshot>): void {
  if (typeof window === 'undefined') return;
  try {
    const current = readEcosystemState() || {
      signedIn: false,
      theme: 'system' as ThemePreference,
      language: 'English',
      compactDensity: false,
      connectedProductIds: [],
      updatedAt: Date.now(),
    };
    const next: EcosystemStateSnapshot = {
      ...current,
      ...partial,
      updatedAt: Date.now(),
    };
    localStorage.setItem(ECOSYSTEM_STATE_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage errors cleanly
  }
}

export function publishEcosystemBroadcast(message: EcosystemBroadcastMessage): void {
  const ch = getChannel();
  if (ch) {
    try {
      ch.postMessage(message);
    } catch {
      // Ignore closed channel
    }
  }
}

export function subscribeEcosystemBroadcast(
  handler: (message: EcosystemBroadcastMessage) => void
): () => void {
  if (typeof window === 'undefined') return () => undefined;
  const ch = getChannel();
  const onMessage = (ev: MessageEvent<EcosystemBroadcastMessage>) => {
    if (ev?.data?.type) {
      handler(ev.data);
    }
  };
  ch?.addEventListener('message', onMessage);

  const onStorage = (ev: StorageEvent) => {
    if (ev.key === ECOSYSTEM_STATE_KEY && ev.newValue) {
      try {
        const parsed = JSON.parse(ev.newValue) as EcosystemStateSnapshot;
        handler({ type: 'THEME_SYNC', theme: parsed.theme });
        handler({ type: 'LANGUAGE_SYNC', language: parsed.language });
        handler({ type: 'DENSITY_SYNC', compactDensity: parsed.compactDensity });
      } catch {
        // Ignore parse failures
      }
    }
  };
  window.addEventListener('storage', onStorage);

  return () => {
    ch?.removeEventListener('message', onMessage);
    window.removeEventListener('storage', onStorage);
  };
}

export function prepareEcosystemLaunch(
  product: Pick<Product, 'id' | 'slug' | 'name' | 'websiteUrl'>,
  options?: {
    idToken?: string | null;
    theme?: ThemePreference;
    language?: string;
    isConnected?: boolean;
  }
): void {
  if (typeof window === 'undefined') return;

  try {
    const handoffPayload = {
      productId: product.id,
      slug: product.slug,
      name: product.name,
      origin: 'astra-vesper',
      connected: Boolean(options?.isConnected),
      theme: options?.theme || 'system',
      language: options?.language || 'English',
      launchedAt: Date.now(),
    };
    sessionStorage.setItem(`av_handoff_${product.slug}`, JSON.stringify(handoffPayload));
    publishEcosystemBroadcast({
      type: 'APP_LAUNCH_SYNC',
      productId: product.id,
      slug: product.slug,
      ts: Date.now(),
    });
  } catch {
    // Ignore storage issues
  }

  if (options?.idToken && product.websiteUrl) {
    fetch('/api/ecosystem/handoff', {
      method: 'POST',
      keepalive: true,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${options.idToken}`,
      },
      body: JSON.stringify({
        productId: product.id,
        productSlug: product.slug,
        websiteUrl: product.websiteUrl,
        theme: options.theme || 'system',
        language: options.language || 'English',
      }),
    }).catch(() => null);
  }
}
