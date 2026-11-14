import { lazy, Suspense, useEffect, useState } from 'react';
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom';
import { AnimatePresence, motion, MotionConfig } from 'motion/react';
import { ArrowUp } from 'lucide-react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { CatalogProvider } from './context/CatalogContext';
import { ToastProvider } from './context/ToastContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { SearchModal } from './components/SearchModal';
import { VioraAiWidget } from './components/VioraAiWidget';
import { PixelLoadingMatrix } from './components/PixelTransitionCanvas';

const HomePage = lazy(() => import('./pages/HomePage'));
const ProductsPage = lazy(() => import('./pages/ProductsPage'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'));
const SolisVexenPage = lazy(() => import('./pages/SolisVexenPage'));
const ServicesPage = lazy(() => import('./pages/ServicesPage'));
const MembershipPage = lazy(() => import('./pages/MembershipPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const AccountPage = lazy(() => import('./pages/AccountPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const LegalPage = lazy(() => import('./pages/LegalPage'));

function PageSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 space-y-6">
      <PixelLoadingMatrix compact label="Loading Astra Vesper..." />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
        <div className="h-56 rounded-2xl bg-slate-200 dark:bg-slate-800" />
        <div className="h-56 rounded-2xl bg-slate-200 dark:bg-slate-800" />
      </div>
    </div>
  );
}

function ScrollManager() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const target = document.getElementById(hash.slice(1));
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
        return;
      }
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname, hash]);

  return null;
}

function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 420);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          key="scroll-top-btn"
          type="button"
          aria-label="Scroll back to top"
          title="Back to top"
          initial={{ opacity: 0, y: 10, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.92 }}
          transition={{ duration: 0.16, ease: [0.16, 1, 0.3, 1] }}
          onClick={() => {
            const prefersReduced =
              typeof window !== 'undefined' &&
              window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            window.scrollTo({
              top: 0,
              behavior: prefersReduced ? 'auto' : 'smooth',
            });
          }}
          className="fixed bottom-4 left-4 z-30 min-h-[44px] min-w-[44px] rounded-2xl border border-black/10 dark:border-white/15 bg-white/96 dark:bg-[#151922]/96 sm:backdrop-blur-md text-[#0b0c10] dark:text-white shadow-lg inline-flex items-center justify-center hover:border-violet-500/40 active:scale-95 transition-transform will-change-transform"
        >
          <ArrowUp className="w-4 h-4" />
        </motion.button>
      )}
    </AnimatePresence>
  );
}

function AppShell() {
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-[#0b0c10] text-[#0b0c10] dark:text-[#f8fafc] transition-colors duration-150">
      <ScrollManager />
      <Navbar
        onOpenSearch={() => setSearchOpen(true)}
        onOpenAi={() => setAiOpen(true)}
      />

      <main className="flex-1">
        <ErrorBoundary>
          <Suspense fallback={<PageSkeleton />}>
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="will-change-transform"
            >
              <Routes location={location}>
                <Route path="/" element={<HomePage />} />
                <Route
                  path="/products"
                  element={<ProductsPage title="Products" />}
                />
                <Route
                  path="/applications"
                  element={<ProductsPage title="Applications" />}
                />
                <Route path="/products/:slug" element={<ProductDetailPage />} />
                <Route path="/solis-vexen" element={<SolisVexenPage />} />
                <Route path="/services" element={<ServicesPage />} />
                <Route path="/membership" element={<MembershipPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/account" element={<AccountPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/support/:topic" element={<LegalPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </motion.div>
          </Suspense>
        </ErrorBoundary>
      </main>

      <Footer />

      <ScrollToTopButton />
      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
      <VioraAiWidget
        open={aiOpen}
        onOpen={() => setAiOpen(true)}
        onClose={() => setAiOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <ThemeProvider>
        <AuthProvider>
          <CatalogProvider>
            <ToastProvider>
              <BrowserRouter>
                <AppShell />
              </BrowserRouter>
            </ToastProvider>
          </CatalogProvider>
        </AuthProvider>
      </ThemeProvider>
    </MotionConfig>
  );
}
