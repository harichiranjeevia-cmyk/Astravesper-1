import { Link } from 'react-router-dom';
import { Monitor, Moon, ShieldCheck, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useCatalog } from '../context/CatalogContext';
import { useToast } from '../context/ToastContext';
import { ThemePreference } from '../types';

export default function SettingsPage() {
  const { theme, setTheme, language, setLanguage, compactDensity, setCompactDensity } =
    useTheme();
  const { firebaseUser, profile, isAdmin, updateProfileData, exportAccountData } = useAuth();
  const { siteContent } = useCatalog();
  const { toast } = useToast();

  const handleThemeChange = (next: ThemePreference) => {
    setTheme(next);
    const label = next.charAt(0).toUpperCase() + next.slice(1);
    toast({
      variant: 'success',
      title: `Appearance set to ${label}`,
      description: 'Synced across your open Astra Vesper tabs.',
    });
    if (firebaseUser) {
      updateProfileData({ themePreference: next }).catch(() => null);
    }
  };

  const handleExport = async () => {
    try {
      const data = await exportAccountData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `astra-vesper-data-export.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast({
        variant: 'success',
        title: 'Account data exported',
        description: 'Downloaded astra-vesper-data-export.json.',
      });
    } catch {
      toast({
        variant: 'error',
        title: 'Export failed',
        description: 'Unable to prepare your JSON archive right now.',
      });
    }
  };

  return (
    <div
      className={`max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 ${
        compactDensity ? 'py-8 space-y-6' : 'py-12 space-y-10'
      }`}
    >
      <div className="space-y-2">
        <p className="text-xs font-semibold text-violet-700 dark:text-violet-400">
          Preferences
        </p>
        <h1 className="font-display text-3xl font-bold text-[#0b0c10] dark:text-white">
          Settings
        </h1>
        <p className="text-sm text-[#4b5563] dark:text-slate-400">
          Manage your appearance, language, account preferences, and privacy controls.
        </p>
      </div>

      {/* General */}
      <section
        className={`rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#12151c] ${
          compactDensity ? 'p-4 sm:p-5 space-y-4' : 'p-6 space-y-6'
        }`}
      >
        <h2 className="font-display text-lg font-bold text-[#0b0c10] dark:text-white">
          General
        </h2>

        <div className="space-y-2">
          <p className="text-xs font-medium text-[#0b0c10] dark:text-slate-200">Theme</p>
          <div className="grid grid-cols-3 gap-2 max-w-md">
            {(
              [
                { id: 'system', label: 'System', icon: Monitor },
                { id: 'light', label: 'Light', icon: Sun },
                { id: 'dark', label: 'Dark', icon: Moon },
              ] as const
            ).map((opt) => {
              const Icon = opt.icon;
              const active = theme === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleThemeChange(opt.id)}
                  className={`min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl border text-xs font-medium transition-colors ${
                    active
                      ? 'bg-violet-600 border-violet-600 text-white'
                      : 'bg-[#f8f9fa] dark:bg-[#181c26] border-black/10 dark:border-white/10 text-[#0b0c10] dark:text-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-black/8 dark:border-white/10">
          <div className="space-y-1.5">
            <label htmlFor="settings-lang" className="text-xs font-medium text-[#0b0c10] dark:text-slate-200">
              Language
            </label>
            <select
              id="settings-lang"
              value={language}
              onChange={(e) => {
                const nextLang = e.target.value;
                setLanguage(nextLang);
                toast({
                  variant: 'info',
                  title: `Language set to ${nextLang}`,
                });
                if (firebaseUser) updateProfileData({ language: nextLang }).catch(() => null);
              }}
              className="w-full min-h-[44px] px-3.5 rounded-xl border border-black/10 dark:border-white/10 bg-[#f8f9fa] dark:bg-[#181c26] text-sm text-[#0b0c10] dark:text-white"
            >
              <option value="English">English</option>
              <option value="Spanish">Spanish</option>
              <option value="French">French</option>
              <option value="German">German</option>
              <option value="Japanese">Japanese</option>
            </select>
          </div>

          <div className="flex items-center justify-between gap-4 sm:pt-6">
            <div>
              <p className="text-sm font-medium text-[#0b0c10] dark:text-white">
                Compact Interface
              </p>
              <p className="text-xs text-[#4b5563] dark:text-slate-400">
                Denser card and table spacing
              </p>
            </div>
            <input
              type="checkbox"
              checked={compactDensity}
              onChange={(e) => {
                const next = e.target.checked;
                setCompactDensity(next);
                toast({
                  variant: 'success',
                  title: next ? 'Compact interface enabled' : 'Standard spacing restored',
                });
              }}
              className="h-4 w-4 text-violet-600 rounded"
            />
          </div>
        </div>

        {profile && (
          <div className="flex items-center justify-between gap-4 pt-2 border-t border-black/8 dark:border-white/10">
            <div>
              <p className="text-sm font-medium text-[#0b0c10] dark:text-white">
                Product &amp; Ecosystem Notifications
              </p>
              <p className="text-xs text-[#4b5563] dark:text-slate-400">
                Receive release notices for Vioratundra updates
              </p>
            </div>
            <input
              type="checkbox"
              checked={profile.notificationsEnabled}
              onChange={(e) => {
                const next = e.target.checked;
                updateProfileData({ notificationsEnabled: next })
                  .then(() =>
                    toast({
                      variant: 'success',
                      title: next ? 'Notifications enabled' : 'Notifications paused',
                    })
                  )
                  .catch(() =>
                    toast({
                      variant: 'error',
                      title: 'Could not update notification preference',
                    })
                  );
              }}
              className="h-4 w-4 text-violet-600 rounded"
            />
          </div>
        )}
      </section>

      {/* Account */}
      <section className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#12151c] p-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-lg font-bold text-[#0b0c10] dark:text-white">
              Account
            </h2>
            <p className="text-xs text-[#4b5563] dark:text-slate-400">
              {firebaseUser
                ? `Signed in as ${profile?.email}`
                : 'Sign in to sync your Vioratundra profile and connected applications.'}
            </p>
          </div>
          <Link
            to="/account"
            className="min-h-[40px] inline-flex items-center px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700"
          >
            {firebaseUser ? 'Manage Account' : 'Sign In'}
          </Link>
        </div>
      </section>

      {/* Privacy & Security */}
      <section className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#12151c] p-6 space-y-4">
        <h2 className="font-display text-lg font-bold text-[#0b0c10] dark:text-white">
          Privacy &amp; Security
        </h2>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-[#4b5563] dark:text-slate-400">
            Active authentication session, data export, and account deletion are managed securely via your Vioratundra account.
          </p>
          <div className="flex flex-wrap gap-2">
            {firebaseUser && (
              <button
                type="button"
                onClick={handleExport}
                className="min-h-[38px] px-3.5 py-1.5 rounded-xl border border-black/10 dark:border-white/15 text-xs font-medium text-[#0b0c10] dark:text-white"
              >
                Export Data
              </button>
            )}
            <Link
              to="/account"
              className="min-h-[38px] inline-flex items-center px-3.5 py-1.5 rounded-xl border border-black/10 dark:border-white/15 text-xs font-medium text-[#0b0c10] dark:text-white"
            >
              Security Controls
            </Link>
          </div>
        </div>
      </section>

      {/* Application Management (Strictly Visible Only to Authorized Administrators) */}
      {isAdmin && (
        <section className="rounded-2xl border border-violet-500/30 bg-violet-600/8 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-violet-700 dark:text-violet-400 shrink-0 mt-0.5" />
            <div>
              <h2 className="font-display text-base font-bold text-[#0b0c10] dark:text-white">
                Application Management
              </h2>
              <p className="text-xs text-[#4b5563] dark:text-slate-300">
                Access the protected Astra Vesper administration dashboard for product, user, CMS, and Viora AI governance.
              </p>
            </div>
          </div>
          <Link
            to="/admin"
            className="min-h-[42px] inline-flex items-center px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 whitespace-nowrap shrink-0"
          >
            Open Admin Console
          </Link>
        </section>
      )}

      {/* About Astra Vesper */}
      <section className="rounded-2xl border border-black/10 dark:border-white/10 bg-[#f8f9fa] dark:bg-[#12151c] p-6 sm:p-8 space-y-4">
        <div className="space-y-2">
          <p className="font-display text-sm font-bold tracking-wider text-[#0b0c10] dark:text-white">
            ASTRA VESPER
          </p>
          <p className="text-sm text-[#4b5563] dark:text-slate-300 leading-relaxed">
            &ldquo;{siteContent.companyDescription}&rdquo;
          </p>
          <div className="text-xs text-[#4b5563] dark:text-slate-400 space-y-1 pt-1">
            <p>Parent ecosystem: Astra Vesper.</p>
            <p>Developed applications and products: Vioratundra.</p>
          </div>
        </div>

        <div className="pt-4 border-t border-black/8 dark:border-white/10 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#4b5563] dark:text-slate-400">
          <span>Crafted by Hari Chiranjeevi</span>
          <span>Crafted by Tundra Viora</span>
        </div>
      </section>
    </div>
  );
}
