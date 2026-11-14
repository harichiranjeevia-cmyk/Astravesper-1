import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { loadCatalogCache, saveCatalogCache } from '../lib/ecosystem';
import {
  DEFAULT_AI_CONFIG,
  DEFAULT_SITE_CONTENT,
  INITIAL_PRODUCTS,
} from '../data/catalog';
import { AiConfig, Product, SiteContentConfig } from '../types';
import { useAuth } from './AuthContext';

interface CatalogContextValue {
  products: Product[];
  publishedProducts: Product[];
  siteContent: SiteContentConfig;
  aiConfig: AiConfig;
  loading: boolean;
  refreshCatalog: () => Promise<void>;
  saveProduct: (product: Product, isNew: boolean) => Promise<void>;
  removeProduct: (productId: string, productName: string) => Promise<void>;
  saveSiteContent: (content: SiteContentConfig) => Promise<void>;
  saveAiConfig: (config: AiConfig) => Promise<void>;
  writeAuditLog: (
    action: string,
    targetType: string,
    summary: string,
    targetId?: string
  ) => Promise<void>;
}

const CatalogContext = createContext<CatalogContextValue | null>(null);

function tsToIso(val: unknown): string {
  if (val instanceof Timestamp) return val.toDate().toISOString();
  if (typeof val === 'string') return val;
  return new Date().toISOString();
}

export function CatalogProvider({ children }: { children: React.ReactNode }) {
  const { firebaseUser, isAdmin, isSuperAdmin } = useAuth();
  const [initialCache] = useState(() => loadCatalogCache());
  const [products, setProducts] = useState<Product[]>(
    () => initialCache?.products || INITIAL_PRODUCTS
  );
  const [siteContent, setSiteContent] = useState<SiteContentConfig>(
    () => initialCache?.siteContent || DEFAULT_SITE_CONTENT
  );
  const [aiConfig, setAiConfig] = useState<AiConfig>(
    () => initialCache?.aiConfig || DEFAULT_AI_CONFIG
  );
  const [loading, setLoading] = useState<boolean>(() => !initialCache);

  const writeAuditLog = useCallback(
    async (action: string, targetType: string, summary: string, targetId?: string) => {
      if (!firebaseUser) return;
      const logId = `log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const payload: Record<string, unknown> = {
        actorUid: firebaseUser.uid,
        actorEmail: firebaseUser.email || '',
        action: action.slice(0, 120),
        targetType: targetType.slice(0, 64),
        summary: summary.slice(0, 500),
        createdAt: serverTimestamp(),
      };
      if (targetId) {
        payload.targetId = targetId.slice(0, 128);
      }
      await setDoc(doc(db, 'auditLogs', logId), payload).catch((e) =>
        handleFirestoreError(e, OperationType.CREATE, `auditLogs/${logId}`)
      );
    },
    [firebaseUser]
  );

  const seedBaselineIfAdmin = useCallback(async () => {
    if (!firebaseUser || !isAdmin) return;

    await Promise.all([
      ...INITIAL_PRODUCTS.map(async (p) => {
        const ref = doc(db, 'products', p.id);
        const snap = await getDoc(ref).catch(() => null);
        if (!snap || !snap.exists()) {
          await setDoc(ref, {
            ...p,
            ownerUid: firebaseUser.uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          }).catch(() => null);
        }
      }),
      (async () => {
        const siteRef = doc(db, 'siteContent', 'main');
        const siteSnap = await getDoc(siteRef).catch(() => null);
        if (!siteSnap || !siteSnap.exists()) {
          await setDoc(siteRef, {
            ...DEFAULT_SITE_CONTENT,
            updatedBy: firebaseUser.uid,
            updatedAt: serverTimestamp(),
          }).catch(() => null);
        }
      })(),
      (async () => {
        const aiRef = doc(db, 'aiConfig', 'main');
        const aiSnap = await getDoc(aiRef).catch(() => null);
        if (!aiSnap || !aiSnap.exists()) {
          await setDoc(aiRef, {
            ...DEFAULT_AI_CONFIG,
            updatedBy: firebaseUser.uid,
            updatedAt: serverTimestamp(),
          }).catch(() => null);
        }
      })(),
    ]);
  }, [firebaseUser, isAdmin]);

  const refreshCatalog = useCallback(async () => {
    try {
      if (isAdmin && firebaseUser) {
        await seedBaselineIfAdmin();
      }

      const prodQuery = isSuperAdmin
        ? collection(db, 'products')
        : query(collection(db, 'products'), where('published', '==', true));

      const ownDraftPromise =
        isAdmin && !isSuperAdmin && firebaseUser
          ? getDocs(
              query(collection(db, 'products'), where('ownerUid', '==', firebaseUser.uid))
            ).catch(() => null)
          : Promise.resolve(null);

      const [prodSnap, ownSnap, siteSnap, aiSnap] = await Promise.all([
        getDocs(prodQuery).catch((e) => {
          console.warn('Products fallback used:', e);
          return null;
        }),
        ownDraftPromise,
        getDoc(doc(db, 'siteContent', 'main')).catch(() => null),
        getDoc(doc(db, 'aiConfig', 'main')).catch(() => null),
      ]);

      let resolvedProducts: Product[] = INITIAL_PRODUCTS;
      const ownDraftDocs = ownSnap ? ownSnap.docs : [];

      if (prodSnap && !prodSnap.empty) {
        const docMap = new Map<string, any>();
        for (const d of prodSnap.docs) docMap.set(d.id, d.data());
        for (const d of ownDraftDocs) docMap.set(d.id, d.data());

        resolvedProducts = Array.from(docMap.values()).map((data) => ({
          id: data.id,
          slug: data.slug,
          name: data.name,
          tagline: data.tagline,
          description: data.description,
          category: data.category,
          status: data.status,
          published: Boolean(data.published),
          featured: Boolean(data.featured),
          version: data.version,
          platforms: Array.isArray(data.platforms) ? data.platforms : [],
          websiteUrl: data.websiteUrl || '',
          previewUrl: data.previewUrl || data.websiteUrl || '',
          iconKey: data.iconKey || 'apps',
          heroImageUrl: data.heroImageUrl || '',
          screenshots: Array.isArray(data.screenshots) ? data.screenshots : [],
          availableFeatures: Array.isArray(data.availableFeatures)
            ? data.availableFeatures
            : [],
          plannedFeatures: Array.isArray(data.plannedFeatures) ? data.plannedFeatures : [],
          releaseNotes: data.releaseNotes || '',
          changelog: Array.isArray(data.changelog) ? data.changelog : [],
          downloadUrl: data.downloadUrl || '',
          ownerUid: data.ownerUid,
          createdAt: tsToIso(data.createdAt),
          updatedAt: tsToIso(data.updatedAt),
        }));
      }

      let resolvedSite = DEFAULT_SITE_CONTENT;
      if (siteSnap && siteSnap.exists()) {
        const s = siteSnap.data();
        resolvedSite = {
          heroHeadline: s.heroHeadline || DEFAULT_SITE_CONTENT.heroHeadline,
          heroDescription: s.heroDescription || DEFAULT_SITE_CONTENT.heroDescription,
          announcementBanner: s.announcementBanner || '',
          announcementVisible: Boolean(s.announcementVisible),
          companyDescription: s.companyDescription || DEFAULT_SITE_CONTENT.companyDescription,
          membershipHeadline: s.membershipHeadline || DEFAULT_SITE_CONTENT.membershipHeadline,
          membershipDescription:
            s.membershipDescription || DEFAULT_SITE_CONTENT.membershipDescription,
          footerContactEmail: s.footerContactEmail || DEFAULT_SITE_CONTENT.footerContactEmail,
          updatedBy: s.updatedBy,
          updatedAt: tsToIso(s.updatedAt),
        };
      }

      let resolvedAi = DEFAULT_AI_CONFIG;
      if (aiSnap && aiSnap.exists()) {
        const a = aiSnap.data();
        resolvedAi = {
          enabled: a.enabled !== false,
          systemInstructions: a.systemInstructions || DEFAULT_AI_CONFIG.systemInstructions,
          knowledgeNotes: a.knowledgeNotes || DEFAULT_AI_CONFIG.knowledgeNotes,
          totalQueries: typeof a.totalQueries === 'number' ? a.totalQueries : 0,
          updatedBy: a.updatedBy,
          updatedAt: tsToIso(a.updatedAt),
        };
      }

      setProducts(resolvedProducts);
      setSiteContent(resolvedSite);
      setAiConfig(resolvedAi);
      saveCatalogCache({
        products: resolvedProducts,
        siteContent: resolvedSite,
        aiConfig: resolvedAi,
      });
    } finally {
      setLoading(false);
    }
  }, [firebaseUser, isAdmin, isSuperAdmin, seedBaselineIfAdmin]);

  useEffect(() => {
    refreshCatalog();
  }, [refreshCatalog]);

  const saveProduct = async (product: Product, isNew: boolean) => {
    if (!firebaseUser) throw new Error('Authentication required.');
    const normalizedWebsite = (product.websiteUrl || '').trim();
    const normalizedPreview = (product.previewUrl || '').trim() || normalizedWebsite;
    const normalizedScreenshots =
      product.screenshots && product.screenshots.length > 0
        ? product.screenshots
        : product.heroImageUrl
        ? [product.heroImageUrl]
        : [];

    const cleanProduct: Product = {
      ...product,
      websiteUrl: normalizedWebsite,
      previewUrl: normalizedPreview,
      screenshots: normalizedScreenshots,
    };

    const ref = doc(db, 'products', cleanProduct.id);
    if (isNew) {
      await setDoc(ref, {
        ...cleanProduct,
        ownerUid: firebaseUser.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }).catch((e) =>
        handleFirestoreError(e, OperationType.CREATE, `products/${cleanProduct.id}`)
      );
      await writeAuditLog('Created product', 'product', `Created ${cleanProduct.name}`, cleanProduct.id);
    } else {
      await updateDoc(ref, {
        slug: cleanProduct.slug,
        name: cleanProduct.name,
        tagline: cleanProduct.tagline,
        description: cleanProduct.description,
        category: cleanProduct.category,
        status: cleanProduct.status,
        published: cleanProduct.published,
        featured: cleanProduct.featured,
        version: cleanProduct.version,
        platforms: cleanProduct.platforms,
        websiteUrl: cleanProduct.websiteUrl || '',
        previewUrl: cleanProduct.previewUrl || '',
        iconKey: cleanProduct.iconKey || 'apps',
        heroImageUrl: cleanProduct.heroImageUrl || '',
        screenshots: cleanProduct.screenshots || [],
        availableFeatures: cleanProduct.availableFeatures,
        plannedFeatures: cleanProduct.plannedFeatures,
        releaseNotes: cleanProduct.releaseNotes || '',
        changelog: cleanProduct.changelog || [],
        downloadUrl: cleanProduct.downloadUrl || '',
        updatedAt: serverTimestamp(),
      }).catch((e) =>
        handleFirestoreError(e, OperationType.UPDATE, `products/${cleanProduct.id}`)
      );
      await writeAuditLog('Updated product', 'product', `Updated ${cleanProduct.name}`, cleanProduct.id);
    }
    await refreshCatalog();
  };

  const removeProduct = async (productId: string, productName: string) => {
    await deleteDoc(doc(db, 'products', productId)).catch((e) =>
      handleFirestoreError(e, OperationType.DELETE, `products/${productId}`)
    );
    await writeAuditLog('Deleted product', 'product', `Deleted ${productName}`, productId);
    await refreshCatalog();
  };

  const saveSiteContent = async (content: SiteContentConfig) => {
    if (!firebaseUser) throw new Error('Authentication required.');
    const ref = doc(db, 'siteContent', 'main');
    await setDoc(ref, {
      heroHeadline: content.heroHeadline,
      heroDescription: content.heroDescription,
      announcementBanner: content.announcementBanner,
      announcementVisible: content.announcementVisible,
      companyDescription: content.companyDescription,
      membershipHeadline: content.membershipHeadline,
      membershipDescription: content.membershipDescription,
      footerContactEmail: content.footerContactEmail,
      updatedBy: firebaseUser.uid,
      updatedAt: serverTimestamp(),
    }).catch((e) => handleFirestoreError(e, OperationType.WRITE, 'siteContent/main'));

    await writeAuditLog('Updated website content', 'siteContent', 'Updated homepage and ecosystem copy', 'main');
    const nextSite = { ...content, updatedAt: new Date().toISOString() };
    setSiteContent(nextSite);
    saveCatalogCache({ products, siteContent: nextSite, aiConfig });
  };

  const saveAiConfig = async (config: AiConfig) => {
    if (!firebaseUser) throw new Error('Authentication required.');
    const ref = doc(db, 'aiConfig', 'main');
    await setDoc(ref, {
      enabled: config.enabled,
      systemInstructions: config.systemInstructions,
      knowledgeNotes: config.knowledgeNotes,
      totalQueries: config.totalQueries,
      updatedBy: firebaseUser.uid,
      updatedAt: serverTimestamp(),
    }).catch((e) => handleFirestoreError(e, OperationType.WRITE, 'aiConfig/main'));

    await writeAuditLog('Updated Viora AI settings', 'aiConfig', 'Updated Viora AI instructions and state', 'main');
    const nextAi = { ...config, updatedAt: new Date().toISOString() };
    setAiConfig(nextAi);
    saveCatalogCache({ products, siteContent, aiConfig: nextAi });
  };

  const publishedProducts = products.filter((p) => p.published);

  return (
    <CatalogContext.Provider
      value={{
        products,
        publishedProducts,
        siteContent,
        aiConfig,
        loading,
        refreshCatalog,
        saveProduct,
        removeProduct,
        saveSiteContent,
        saveAiConfig,
        writeAuditLog,
      }}
    >
      {children}
    </CatalogContext.Provider>
  );
}

export function useCatalog() {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error('useCatalog must be used within CatalogProvider');
  return ctx;
}
