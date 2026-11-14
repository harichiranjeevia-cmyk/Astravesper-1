import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, PanInfo } from 'motion/react';
import {
  ArrowLeftRight,
  Menu,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  UserCircle2,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  onOpenSearch: () => void;
  onOpenAi: () => void;
}

const NAV_ITEMS = [
  { label: 'Home', to: '/' },
  { label: 'Products', to: '/products' },
  { label: 'Applications', to: '/applications' },
  { label: 'Solis Vexen', to: '/solis-vexen' },
  { label: 'Services', to: '/services' },
  { label: 'Membership', to: '/membership' },
  { label: 'About', to: '/about' },
];

export function Navbar({ onOpenSearch, onOpenAi }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { firebaseUser, profile, isAdmin } = useAuth();
  const location = useLocation();
  const isOnAdmin = location.pathname.startsWith('/admin');

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [mobileMenuOpen]);

  const handleDrawerDragEnd = (
    _: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    if (info.offset.x > 72 || info.velocity.x > 360) {
      setMobileMenuOpen(false);
    }
  };

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors ${
      isActive
        ? 'text-[#0b0c10] dark:text-white border-violet-600 dark:border-violet-400'
        : 'text-[#4b5563] dark:text-slate-400 border-transparent hover:text-[#0b0c10] dark:hover:text-white'
    }`;

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-black/8 dark:border-white/10 bg-white/96 dark:bg-[#0b0c10]/96 sm:bg-white/90 sm:dark:bg-[#0b0c10]/90 sm:backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 md:h-16 flex items-center justify-between gap-3 lg:gap-6">
          {/* Zone 1: Brand Wordmark */}
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="font-display text-base sm:text-lg font-bold tracking-tight text-[#0b0c10] dark:text-white whitespace-nowrap shrink-0"
          >
            ASTRA VESPER
          </Link>

          {/* Zone 2: Desktop Navigation Links */}
          <nav
            aria-label="Primary Navigation"
            className="hidden lg:flex items-center gap-4 xl:gap-6"
          >
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.to} to={item.to} className={linkClass} end={item.to === '/'}>
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Zone 3: Actions (Search, Viora AI, Top-Bar Admin Switch, Account) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={onOpenSearch}
              aria-label="Search Astra Vesper"
              className="min-h-[44px] min-w-[44px] lg:min-h-[40px] lg:px-3 inline-flex items-center justify-center gap-2 rounded-xl text-sm text-[#4b5563] dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-transform whitespace-nowrap"
            >
              <Search className="w-4 h-4" />
              <span className="hidden xl:inline text-xs font-medium">Search</span>
              <kbd className="hidden xl:inline text-[10px] font-mono-tabular px-1.5 py-0.5 rounded border border-black/10 dark:border-white/15 text-[#4b5563] dark:text-slate-400">
                ⌘K
              </kbd>
            </button>

            <button
              type="button"
              onClick={onOpenAi}
              aria-label="Open Viora AI assistant"
              title="Viora AI · Powered by Gemini"
              className="min-h-[44px] min-w-[44px] lg:min-h-[40px] sm:px-3 inline-flex items-center justify-center gap-1.5 rounded-xl text-xs font-medium text-violet-700 dark:text-violet-300 hover:bg-violet-600/10 active:scale-95 transition-transform whitespace-nowrap"
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden md:inline">Viora AI</span>
            </button>

            {isAdmin && (
              <Link
                to={isOnAdmin ? '/' : '/admin'}
                aria-label={isOnAdmin ? 'Switch to Storefront' : 'Switch to Admin Console'}
                className={`min-h-[40px] inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold border transition-transform active:scale-95 whitespace-nowrap shrink-0 ${
                  isOnAdmin
                    ? 'bg-violet-600 text-white border-transparent hover:bg-violet-700'
                    : 'bg-violet-600/10 text-violet-700 dark:text-violet-300 border-violet-500/30 hover:bg-violet-600/20'
                }`}
              >
                {isOnAdmin ? (
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                ) : (
                  <ShieldCheck className="w-3.5 h-3.5" />
                )}
                <span className="hidden sm:inline">
                  {isOnAdmin ? 'Storefront' : 'Admin'}
                </span>
              </Link>
            )}

            <Link
              to="/settings"
              aria-label="Settings"
              className={`hidden sm:inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl transition-colors ${
                location.pathname === '/settings'
                  ? 'bg-black/5 dark:bg-white/10 text-[#0b0c10] dark:text-white'
                  : 'text-[#4b5563] dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10'
              }`}
            >
              <Settings className="w-4 h-4" />
            </Link>

            <Link
              to="/account"
              aria-label="Vioratundra Account"
              className="min-h-[40px] inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0b0c10] dark:bg-white text-white dark:text-[#0b0c10] text-xs font-semibold hover:opacity-90 active:scale-95 transition-transform whitespace-nowrap shrink-0"
            >
              {profile?.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.displayName}
                  referrerPolicy="no-referrer"
                  className="w-5 h-5 rounded-full object-cover"
                />
              ) : (
                <UserCircle2 className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">
                {firebaseUser ? profile?.displayName?.split(' ')[0] || 'Account' : 'Account'}
              </span>
            </Link>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={mobileMenuOpen}
              className="lg:hidden min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl text-[#0b0c10] dark:text-white hover:bg-black/5 dark:hover:bg-white/10 active:scale-95 transition-transform"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* GPU-Composited Swipeable Mobile Navigation Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex justify-end">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/45 backdrop-blur-[2px]"
            />

            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-label="Mobile Navigation Drawer"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={{ left: 0.04, right: 0.35 }}
              onDragEnd={handleDrawerDragEnd}
              className="relative z-10 w-[min(85vw,330px)] h-full bg-white dark:bg-[#0e1118] border-l border-black/10 dark:border-white/12 shadow-2xl flex flex-col will-change-transform"
            >
              <div className="h-14 px-4 flex items-center justify-between border-b border-black/8 dark:border-white/10">
                <span className="font-display text-sm font-bold tracking-tight text-[#0b0c10] dark:text-white">
                  ASTRA VESPER
                </span>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Close menu"
                  className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl text-[#4b5563] dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
                {isAdmin && (
                  <div className="pb-3 mb-2 border-b border-black/8 dark:border-white/10">
                    <Link
                      to={isOnAdmin ? '/' : '/admin'}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center justify-between min-h-[46px] px-3.5 rounded-2xl bg-violet-600 text-white text-sm font-semibold"
                    >
                      <span className="inline-flex items-center gap-2.5">
                        {isOnAdmin ? (
                          <ArrowLeftRight className="w-4 h-4" />
                        ) : (
                          <ShieldCheck className="w-4 h-4" />
                        )}
                        {isOnAdmin ? 'Switch to Storefront' : 'Open Admin Console'}
                      </span>
                    </Link>
                  </div>
                )}

                {NAV_ITEMS.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    onClick={() => setMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center justify-between min-h-[46px] px-3.5 rounded-2xl text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-violet-600/12 text-violet-700 dark:text-violet-300 font-semibold'
                          : 'text-[#0b0c10] dark:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5'
                      }`
                    }
                  >
                    <span>{item.label}</span>
                  </NavLink>
                ))}

                <div className="pt-3 mt-3 border-t border-black/8 dark:border-white/10 space-y-1">
                  <Link
                    to="/settings"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 min-h-[46px] px-3.5 rounded-2xl text-sm font-medium text-[#0b0c10] dark:text-slate-200 hover:bg-black/5 dark:hover:bg-white/5"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Settings</span>
                  </Link>
                </div>
              </nav>

              <div className="px-4 py-3 border-t border-black/8 dark:border-white/10 text-[11px] text-[#4b5563] dark:text-slate-400">
                Swipe right to close drawer
              </div>
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
