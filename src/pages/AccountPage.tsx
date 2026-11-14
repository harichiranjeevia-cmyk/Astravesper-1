import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Activity,
  CheckCircle2,
  Download,
  ExternalLink,
  Layers,
  LogOut,
  Shield,
  Sparkles,
  Trash2,
  User,
  Users,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCatalog } from '../context/CatalogContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../context/ToastContext';
import { MembershipForm } from '../components/MembershipForm';
import { PixelLoadingMatrix } from '../components/PixelTransitionCanvas';

type AccountTab =
  | 'overview'
  | 'apps'
  | 'downloads'
  | 'activity'
  | 'membership'
  | 'privacy'
  | 'settings';

const TAB_ITEMS: { id: AccountTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'overview', label: 'Overview', icon: User },
  { id: 'apps', label: 'My Applications', icon: Layers },
  { id: 'downloads', label: 'Downloads', icon: Download },
  { id: 'activity', label: 'Activity', icon: Activity },
  { id: 'membership', label: 'Membership', icon: Users },
  { id: 'privacy', label: 'Privacy & Security', icon: Shield },
  { id: 'settings', label: 'Account Settings', icon: Sparkles },
];

export default function AccountPage() {
  const [searchParams] = useSearchParams();
  const {
    firebaseUser,
    profile,
    isAdmin,
    loading,
    authError,
    activity,
    downloads,
    connectedApps,
    signInWithGoogle,
    signOut,
    updateProfileData,
    toggleConnectedApp,
    exportAccountData,
    deleteAccount,
    logActivity,
  } = useAuth();
  const { publishedProducts } = useCatalog();
  const { compactDensity } = useTheme();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<AccountTab>('overview');
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [activityFilter, setActivityFilter] = useState<string>('all');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [signingIn, setSigningIn] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || '');
      setUsername(profile.username || '');
      setAvatarUrl(profile.avatarUrl || '');
      setBio(profile.bio || '');
    }
  }, [profile]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 space-y-6">
        <PixelLoadingMatrix label="Loading your Vioratundra account..." />
      </div>
    );
  }

  if (!firebaseUser || !profile) {
    const isCreate = searchParams.get('mode') === 'create';
    return (
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="rounded-3xl border border-black/10 dark:border-white/10 bg-[#f8f9fa] dark:bg-[#12151c] p-6 sm:p-8 space-y-6 text-center shadow-sm">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-violet-600 text-white flex items-center justify-center">
            <Shield className="w-6 h-6" />
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold text-violet-700 dark:text-violet-400">
              Vioratundra Verified Identity
            </p>
            <h1 className="font-display text-2xl font-bold text-[#0b0c10] dark:text-white">
              {isCreate ? 'Create Your Vioratundra Account' : 'Sign In to Astra Vesper'}
            </h1>
            <p className="text-sm text-[#4b5563] dark:text-slate-400 leading-relaxed">
              {isCreate
                ? 'Start an optional Vioratundra account with one click using your verified Google identity—no extra password needed.'
                : 'Access your connected applications, download history, membership profile, and privacy controls using verified Google Sign-In.'}
            </p>
          </div>

          {authError && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-xs text-red-700 dark:text-red-300 text-left">
              {authError}
            </div>
          )}

          <button
            type="button"
            disabled={signingIn}
            onClick={async () => {
              setSigningIn(true);
              try {
                await signInWithGoogle();
              } catch {
                // handled via authError in context
              } finally {
                setSigningIn(false);
              }
            }}
            className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-[#0b0c10] dark:bg-white text-white dark:text-[#0b0c10] text-sm font-semibold hover:opacity-90 active:scale-[0.99] transition-transform inline-flex items-center justify-center gap-2.5 disabled:opacity-60"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="currentColor"
                d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27c3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10c5.35 0 9.25-3.67 9.25-9.09c0-1.15-.15-1.81-.15-1.81Z"
              />
            </svg>
            <span>
              {signingIn
                ? 'Verifying with Google...'
                : isCreate
                ? 'Create Account with Google'
                : 'Continue with Google'}
            </span>
          </button>

          <div className="flex items-center justify-center gap-2 text-xs text-[#4b5563] dark:text-slate-400">
            <span>{isCreate ? 'Already have an account?' : 'New to Astra Vesper?'}</span>
            <Link
              to={isCreate ? '/account' : '/account?mode=create'}
              className="font-semibold text-violet-700 dark:text-violet-400 hover:underline py-1"
            >
              {isCreate ? 'Sign In instead' : 'Create Account'}
            </Link>
          </div>

          <div className="pt-3 border-t border-black/8 dark:border-white/10 space-y-2 text-xs text-[#4b5563] dark:text-slate-400">
            <p>
              Optional browsing stays open · Protected by Firebase Authentication &amp; strict Firestore isolation.
            </p>
            <div className="flex items-center justify-center gap-5">
              <Link to="/support/safety" className="min-h-[40px] inline-flex items-center text-violet-700 dark:text-violet-400 hover:underline">
                Safety Standards
              </Link>
              <Link to="/support/privacy" className="min-h-[40px] inline-flex items-center text-violet-700 dark:text-violet-400 hover:underline">
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (profile.status === 'suspended') {
    return (
      <div className="max-w-lg mx-auto px-4 sm:px-6 py-16">
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-8 text-center space-y-4">
          <h1 className="font-display text-xl font-bold text-red-700 dark:text-red-300">
            Account Suspended
          </h1>
          <p className="text-sm text-[#4b5563] dark:text-slate-300">
            This Vioratundra account is currently suspended by an administrator. Please contact Astra Vesper support for review.
          </p>
          <button
            type="button"
            onClick={signOut}
            className="min-h-[44px] px-5 py-2 rounded-xl bg-[#0b0c10] dark:bg-white text-white dark:text-[#0b0c10] text-xs font-semibold"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setNotice(null);
    try {
      await updateProfileData({
        displayName: displayName.trim().slice(0, 100) || profile.displayName,
        username: username.trim().replace(/[^a-zA-Z0-9_.-]/g, '').slice(0, 40) || profile.username,
        avatarUrl: avatarUrl.trim().slice(0, 500),
        bio: bio.trim().slice(0, 500),
      });
      await logActivity('Updated profile details', displayName.trim(), 'account');
      setNotice('Profile changes saved.');
      toast({
        variant: 'success',
        title: 'Profile updated',
        description: 'Your Vioratundra profile details are saved.',
      });
    } catch (err: any) {
      const msg = err?.message || 'Unable to update profile.';
      setNotice(msg);
      toast({
        variant: 'error',
        title: 'Profile update failed',
        description: msg,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async () => {
    try {
      const data = await exportAccountData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vioratundra-account-export-${profile.username || 'user'}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setNotice('Account data archive downloaded.');
      toast({
        variant: 'success',
        title: 'Account data exported',
        description: 'Downloaded your JSON archive.',
      });
    } catch {
      toast({
        variant: 'error',
        title: 'Export failed',
        description: 'Please try downloading your archive again.',
      });
    }
  };

  const filteredActivity =
    activityFilter === 'all'
      ? activity
      : activity.filter((a) => a.category === activityFilter);

  return (
    <div
      className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 ${
        compactDensity ? 'py-6 space-y-6' : 'py-8 sm:py-10 space-y-8'
      }`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-black/8 dark:border-white/10">
        <div className="flex items-center gap-4">
          {profile.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt={profile.displayName}
              referrerPolicy="no-referrer"
              className="w-14 h-14 rounded-2xl object-cover border border-black/10 dark:border-white/15"
            />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-violet-600 text-white flex items-center justify-center font-display text-xl font-bold">
              {profile.displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="text-xs text-violet-700 dark:text-violet-400 font-medium">
              Vioratundra Account · {profile.emailVerified ? 'Verified Email' : 'Unverified'}
            </p>
            <h1 className="font-display text-2xl font-bold text-[#0b0c10] dark:text-white">
              {profile.displayName}
            </h1>
            <p className="text-xs text-[#4b5563] dark:text-slate-400">
              {profile.email} {profile.username ? `· @${profile.username}` : ''}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isAdmin && (
            <Link
              to="/admin"
              className="min-h-[44px] sm:min-h-[40px] inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700"
            >
              <Shield className="w-3.5 h-3.5" />
              Admin Console
            </Link>
          )}
          <button
            type="button"
            onClick={signOut}
            className="min-h-[44px] sm:min-h-[40px] inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-black/10 dark:border-white/15 text-xs font-medium text-[#0b0c10] dark:text-white hover:bg-black/5 dark:hover:bg-white/10"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
      </div>

      {notice && (
        <div className="rounded-xl border border-violet-500/30 bg-violet-600/10 px-4 py-3 text-xs font-medium text-violet-800 dark:text-violet-200 flex items-center justify-between">
          <span>{notice}</span>
          <button type="button" onClick={() => setNotice(null)} className="underline">
            Dismiss
          </button>
        </div>
      )}

      {/* 7-Tab Navigation + Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
        <aside className="lg:col-span-3 flex lg:flex-col gap-1.5 overflow-x-auto no-scrollbar pb-1 lg:pb-0">
          {TAB_ITEMS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`min-h-[44px] px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium inline-flex items-center gap-2.5 whitespace-nowrap shrink-0 transition-colors ${
                  active
                    ? 'bg-violet-600 text-white'
                    : 'text-[#4b5563] dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/8'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </aside>

        <div className="lg:col-span-9 space-y-6">
          {/* 1. Overview */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-[#f8f9fa] dark:bg-[#12151c] p-5 space-y-1">
                  <p className="text-xs text-[#4b5563] dark:text-slate-400">Connected Apps</p>
                  <p className="font-display text-2xl font-bold font-mono-tabular text-[#0b0c10] dark:text-white">
                    {connectedApps.filter((a) => a.status === 'connected').length}
                  </p>
                </div>
                <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-[#f8f9fa] dark:bg-[#12151c] p-5 space-y-1">
                  <p className="text-xs text-[#4b5563] dark:text-slate-400">Recorded Downloads</p>
                  <p className="font-display text-2xl font-bold font-mono-tabular text-[#0b0c10] dark:text-white">
                    {downloads.length}
                  </p>
                </div>
                <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-[#f8f9fa] dark:bg-[#12151c] p-5 space-y-1">
                  <p className="text-xs text-[#4b5563] dark:text-slate-400">Membership</p>
                  <p className="font-display text-xl font-bold capitalize text-violet-700 dark:text-violet-400">
                    {profile.membershipStatus === 'none' ? 'Standard Account' : profile.membershipStatus}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#12151c] p-6 space-y-3">
                <h2 className="font-display text-lg font-bold text-[#0b0c10] dark:text-white">
                  Profile Summary
                </h2>
                <p className="text-sm text-[#4b5563] dark:text-slate-300">
                  {profile.bio || 'No bio added yet. Customize your Vioratundra profile under Account Settings.'}
                </p>
                <div className="pt-2 flex flex-wrap gap-3 text-xs text-[#4b5563] dark:text-slate-400">
                  <span>Member since {new Date(profile.createdAt).toLocaleDateString()}</span>
                  <span aria-hidden="true">·</span>
                  <span>Role: {profile.role.replace('_', ' ')}</span>
                </div>
              </div>
            </div>
          )}

          {/* 2. My Applications */}
          {activeTab === 'apps' && (
            <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#12151c] p-6 space-y-4">
              <div className="space-y-1">
                <h2 className="font-display text-lg font-bold text-[#0b0c10] dark:text-white">
                  My Applications
                </h2>
                <p className="text-xs text-[#4b5563] dark:text-slate-400">
                  Connect or revoke Vioratundra applications linked with your account.
                </p>
              </div>
              <div className="divide-y divide-black/8 dark:divide-white/10">
                {publishedProducts.map((app) => {
                  const linkState = connectedApps.find((c) => c.productId === app.id);
                  const isConn = linkState?.status === 'connected';
                  return (
                    <div
                      key={app.id}
                      className="py-4 first:pt-2 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <p className="font-semibold text-sm text-[#0b0c10] dark:text-white">
                          {app.name}
                        </p>
                        <p className="text-xs text-[#4b5563] dark:text-slate-400">
                          {app.category} · v{app.version} · {isConn ? 'Connected' : 'Not connected'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link
                          to={`/products/${app.slug}`}
                          className="min-h-[38px] inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-black/10 dark:border-white/10 text-xs font-medium text-[#0b0c10] dark:text-white"
                        >
                          Details
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              await toggleConnectedApp(app.id, app.name);
                              toast({
                                variant: isConn ? 'info' : 'success',
                                title: isConn
                                  ? `Disconnected ${app.name}`
                                  : `Connected ${app.name}`,
                              });
                            } catch {
                              toast({
                                variant: 'error',
                                title: `Could not update ${app.name} connection`,
                              });
                            }
                          }}
                          className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                            isConn
                              ? 'bg-[#f1f3f5] dark:bg-[#1b2029] text-[#0b0c10] dark:text-white'
                              : 'bg-violet-600 text-white hover:bg-violet-700'
                          }`}
                        >
                          {isConn ? 'Disconnect' : 'Connect'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. Downloads */}
          {activeTab === 'downloads' && (
            <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#12151c] p-6 space-y-4">
              <h2 className="font-display text-lg font-bold text-[#0b0c10] dark:text-white">
                Download History
              </h2>
              {downloads.length === 0 ? (
                <div className="py-8 text-center space-y-2">
                  <Download className="w-7 h-7 mx-auto text-slate-400" />
                  <p className="text-sm font-medium text-[#0b0c10] dark:text-white">
                    No direct builds downloaded yet
                  </p>
                  <p className="text-xs text-[#4b5563] dark:text-slate-400">
                    When you download an available application package from Astra Vesper, it will appear here.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-black/8 dark:divide-white/10">
                  {downloads.map((dl) => (
                    <div key={dl.id} className="py-3 flex items-center justify-between gap-4 text-sm">
                      <div>
                        <p className="font-medium text-[#0b0c10] dark:text-white">
                          {dl.productName} <span className="font-mono-tabular text-xs">v{dl.version}</span>
                        </p>
                        <p className="text-xs text-[#4b5563] dark:text-slate-400">
                          {dl.platform} · {new Date(dl.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <a
                        href={dl.downloadUrl}
                        download
                        className="text-xs font-medium text-violet-700 dark:text-violet-400 hover:underline"
                      >
                        Download Again
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 4. Activity */}
          {activeTab === 'activity' && (
            <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#12151c] p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-display text-lg font-bold text-[#0b0c10] dark:text-white">
                  Application Activity
                </h2>
                <select
                  value={activityFilter}
                  onChange={(e) => setActivityFilter(e.target.value)}
                  className="min-h-[36px] px-3 rounded-xl border border-black/10 dark:border-white/10 bg-[#f8f9fa] dark:bg-[#181c26] text-xs text-[#0b0c10] dark:text-white"
                >
                  <option value="all">All Activity</option>
                  <option value="launch">App Launches</option>
                  <option value="download">Downloads</option>
                  <option value="account">Account</option>
                  <option value="security">Security</option>
                </select>
              </div>
              {filteredActivity.length === 0 ? (
                <p className="py-6 text-sm text-[#4b5563] dark:text-slate-400 text-center">
                  No recorded activity events yet.
                </p>
              ) : (
                <div className="divide-y divide-black/8 dark:divide-white/10">
                  {filteredActivity.map((item) => (
                    <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium text-[#0b0c10] dark:text-white">
                          {item.action} — {item.targetName}
                        </p>
                        <p className="text-xs text-[#4b5563] dark:text-slate-400 capitalize">
                          {item.category}
                        </p>
                      </div>
                      <span className="text-xs font-mono-tabular text-[#4b5563] dark:text-slate-400 whitespace-nowrap">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 5. Membership */}
          {activeTab === 'membership' && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#12151c] p-6 space-y-2">
                <div className="flex items-center gap-2 text-violet-700 dark:text-violet-400">
                  <CheckCircle2 className="w-5 h-5" />
                  <h2 className="font-display text-lg font-bold text-[#0b0c10] dark:text-white">
                    Membership Status: {profile.membershipStatus === 'none' ? 'Not Enrolled' : 'Active Member'}
                  </h2>
                </div>
                <p className="text-sm text-[#4b5563] dark:text-slate-400">
                  {profile.membershipStatus === 'none'
                    ? 'Complete the Astra Vesper membership form below to unlock early access alerts and community updates.'
                    : 'Your Vioratundra account is enrolled in the Astra Vesper Membership program.'}
                </p>
              </div>
              {profile.membershipStatus === 'none' && <MembershipForm />}
            </div>
          )}

          {/* 6. Privacy & Security */}
          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#12151c] p-6 space-y-4">
                <h2 className="font-display text-lg font-bold text-[#0b0c10] dark:text-white">
                  Privacy Preferences &amp; Security
                </h2>

                <label className="flex items-center justify-between gap-4 py-2 cursor-pointer">
                  <div>
                    <p className="text-sm font-medium text-[#0b0c10] dark:text-white">
                      Pause Activity Logging
                    </p>
                    <p className="text-xs text-[#4b5563] dark:text-slate-400">
                      Stop recording application launch events in your account activity log.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={profile.privacyAnalyticsOptOut}
                    onChange={(e) => {
                      const next = e.target.checked;
                      updateProfileData({ privacyAnalyticsOptOut: next })
                        .then(() =>
                          toast({
                            variant: 'info',
                            title: next ? 'Activity logging paused' : 'Activity logging resumed',
                          })
                        )
                        .catch(() =>
                          toast({
                            variant: 'error',
                            title: 'Could not update privacy preference',
                          })
                        );
                    }}
                    className="h-4 w-4 text-violet-600 rounded"
                  />
                </label>

                <div className="pt-3 border-t border-black/8 dark:border-white/10 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-[#0b0c10] dark:text-white">
                      Password &amp; Google Security
                    </p>
                    <p className="text-xs text-[#4b5563] dark:text-slate-400">
                      Your Vioratundra account uses verified Google Sign-In. Manage password resets directly in Google Account Security.
                    </p>
                  </div>
                  <a
                    href="https://myaccount.google.com/security"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-[38px] inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-black/10 dark:border-white/15 text-xs font-medium text-[#0b0c10] dark:text-white"
                  >
                    Manage Google Security
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#12151c] p-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-display text-base font-bold text-[#0b0c10] dark:text-white">
                    Data Ownership &amp; Policies
                  </h3>
                  <div className="flex items-center gap-4 text-xs font-medium">
                    <Link to="/support/safety" className="text-violet-700 dark:text-violet-400 hover:underline">
                      Safety Standards
                    </Link>
                    <Link to="/support/privacy" className="text-violet-700 dark:text-violet-400 hover:underline">
                      Privacy Policy
                    </Link>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleExport}
                    className="min-h-[42px] inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0b0c10] dark:bg-white text-white dark:text-[#0b0c10] text-xs font-semibold"
                  >
                    <Download className="w-4 h-4" />
                    Export Account Data (JSON)
                  </button>

                  {!confirmDelete ? (
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(true)}
                      className="min-h-[42px] inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-semibold hover:bg-red-500/10"
                    >
                      <Trash2 className="w-4 h-4" />
                      Request Account Deletion
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => deleteAccount()}
                        className="min-h-[42px] px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-semibold"
                      >
                        Confirm Permanent Deletion
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(false)}
                        className="min-h-[42px] px-3 py-2 text-xs text-[#4b5563] dark:text-slate-400"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 7. Account Settings */}
          {activeTab === 'settings' && (
            <form
              onSubmit={handleSaveProfile}
              className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#12151c] p-6 space-y-4"
            >
              <h2 className="font-display text-lg font-bold text-[#0b0c10] dark:text-white">
                Account Profile Settings
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#0b0c10] dark:text-slate-200">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                    className="w-full min-h-[44px] px-3.5 rounded-xl border border-black/10 dark:border-white/10 bg-[#f8f9fa] dark:bg-[#181c26] text-sm text-[#0b0c10] dark:text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#0b0c10] dark:text-slate-200">
                    Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full min-h-[44px] px-3.5 rounded-xl border border-black/10 dark:border-white/10 bg-[#f8f9fa] dark:bg-[#181c26] text-sm text-[#0b0c10] dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#0b0c10] dark:text-slate-200">
                  Profile Picture URL
                </label>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full min-h-[44px] px-3.5 rounded-xl border border-black/10 dark:border-white/10 bg-[#f8f9fa] dark:bg-[#181c26] text-sm text-[#0b0c10] dark:text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#0b0c10] dark:text-slate-200">
                  Bio
                </label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={500}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-[#f8f9fa] dark:bg-[#181c26] text-sm text-[#0b0c10] dark:text-white"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="min-h-[44px] px-5 py-2 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
