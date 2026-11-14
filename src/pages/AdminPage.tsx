import React, { useCallback, useEffect, useState } from 'react';
import {
  Bot,
  CheckCircle2,
  Database,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  FileEdit,
  Image as ImageIcon,
  KeyRound,
  Lock,
  LogOut,
  Package,
  Plus,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trash2,
  Unlock,
  Upload,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
} from 'lucide-react';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { OWNER_EMAIL, useAuth } from '../context/AuthContext';
import { useCatalog } from '../context/CatalogContext';
import {
  getAutoPreviewForCategory,
  PREDEVELOPED_PREVIEWS,
  PRODUCT_CATEGORIES,
  resolveAssetUrl,
} from '../data/catalog';
import { PreviewModal } from '../components/PreviewModal';
import {
  AdminPermissions,
  AdminRecord,
  AdminRole,
  AuditLogItem,
  MembershipRecord,
  Product,
  ProductCategory,
  ProductStatus,
  UserProfile,
  UserRole,
} from '../types';

type AdminTab = 'products' | 'users' | 'website' | 'database' | 'security' | 'ai';
type DbSection = 'products' | 'memberships' | 'users' | 'logs';

interface AdminSessionState {
  checked: boolean;
  hasPassphrase: boolean;
  passphraseUpdatedAt: string | null;
  unlocked: boolean;
  explicitlyLocked: boolean;
  reauthFresh: boolean;
  authTime: number | null;
  revokedAt: string | null;
}

const ROLE_PRESETS: Record<AdminRole, AdminPermissions> = {
  super_admin: {
    permEditApps: true,
    permAddApps: true,
    permDeleteApps: true,
    permUploadMedia: true,
    permManageUsers: true,
    permViewAnalytics: true,
    permManageContent: true,
    permManageAi: true,
  },
  admin: {
    permEditApps: true,
    permAddApps: true,
    permDeleteApps: true,
    permUploadMedia: true,
    permManageUsers: true,
    permViewAnalytics: true,
    permManageContent: true,
    permManageAi: true,
  },
  content_manager: {
    permEditApps: false,
    permAddApps: false,
    permDeleteApps: false,
    permUploadMedia: true,
    permManageUsers: false,
    permViewAnalytics: true,
    permManageContent: true,
    permManageAi: false,
  },
  app_manager: {
    permEditApps: true,
    permAddApps: true,
    permDeleteApps: false,
    permUploadMedia: true,
    permManageUsers: false,
    permViewAnalytics: true,
    permManageContent: false,
    permManageAi: false,
  },
  viewer: {
    permEditApps: false,
    permAddApps: false,
    permDeleteApps: false,
    permUploadMedia: false,
    permManageUsers: false,
    permViewAnalytics: true,
    permManageContent: false,
    permManageAi: false,
  },
};

const ROLE_LABELS: Record<UserRole, string> = {
  user: 'Standard User',
  viewer: 'Viewer',
  app_manager: 'App Manager',
  content_manager: 'Content Manager',
  admin: 'Administrator',
  super_admin: 'Super Admin',
};

function slugifyName(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function getAdminHeaders(token: string, includeJson = false): Record<string, string> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };
  const sessionToken = sessionStorage.getItem('av_admin_session');
  if (sessionToken) {
    headers['X-Admin-Session'] = sessionToken;
  }
  if (includeJson) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
}

export default function AdminPage() {
  const {
    firebaseUser,
    isAdmin,
    isSuperAdmin,
    permissions,
    loading: authLoading,
    signInWithGoogle,
    reauthenticateWithGoogle,
    signOut,
    getIdToken,
  } = useAuth();
  const {
    products,
    siteContent,
    aiConfig,
    saveProduct,
    removeProduct,
    saveSiteContent,
    saveAiConfig,
    writeAuditLog,
  } = useCatalog();

  const [sessionState, setSessionState] = useState<AdminSessionState>({
    checked: false,
    hasPassphrase: false,
    passphraseUpdatedAt: null,
    unlocked: false,
    explicitlyLocked: false,
    reauthFresh: false,
    authTime: null,
    revokedAt: null,
  });

  const [unlockPassphrase, setUnlockPassphrase] = useState('');
  const [lockResetMode, setLockResetMode] = useState(false);
  const [securityError, setSecurityError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AdminTab>('products');
  const [statusBanner, setStatusBanner] = useState<string | null>(null);

  // Security & Passphrase Reset state
  const [newPassphrase, setNewPassphrase] = useState('');
  const [confirmPassphrase, setConfirmPassphrase] = useState('');
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [securityBusy, setSecurityBusy] = useState(false);
  const [confirmRevokeAll, setConfirmRevokeAll] = useState(false);

  // Products editor state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [customImageTouched, setCustomImageTouched] = useState(false);
  const [previewTouched, setPreviewTouched] = useState(false);
  const [savingProduct, setSavingProduct] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [testingPreview, setTestingPreview] = useState<Product | null>(null);
  const [togglingProductId, setTogglingProductId] = useState<string | null>(null);

  // Users & Roles state
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [adminRecords, setAdminRecords] = useState<AdminRecord[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [assignEmail, setAssignEmail] = useState('');
  const [assignRole, setAssignRole] = useState<AdminRole>('app_manager');
  const [assignPerms, setAssignPerms] = useState<AdminPermissions>(ROLE_PRESETS.app_manager);
  const [confirmRemoveAdminUid, setConfirmRemoveAdminUid] = useState<string | null>(null);
  const [updatingRoleUid, setUpdatingRoleUid] = useState<string | null>(null);

  // Website CMS state
  const [cmsDraft, setCmsDraft] = useState(siteContent);

  // AI CMS state
  const [aiDraft, setAiDraft] = useState(aiConfig);

  // Database & Audit state
  const [memberships, setMemberships] = useState<MembershipRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [dbSection, setDbSection] = useState<DbSection>('products');
  const [dbSearch, setDbSearch] = useState('');

  useEffect(() => {
    setCmsDraft(siteContent);
  }, [siteContent]);

  useEffect(() => {
    setAiDraft(aiConfig);
  }, [aiConfig]);

  const checkAdminSession = useCallback(
    async (overrideToken?: string) => {
      if (!firebaseUser || !isAdmin) {
        setSessionState({
          checked: true,
          hasPassphrase: false,
          passphraseUpdatedAt: null,
          unlocked: false,
          explicitlyLocked: false,
          reauthFresh: false,
          authTime: null,
          revokedAt: null,
        });
        return;
      }
      const token = overrideToken || (await getIdToken());
      if (!token) return;
      const res = await fetch('/api/admin/session', {
        headers: getAdminHeaders(token),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.sessionToken) {
          sessionStorage.setItem('av_admin_session', data.sessionToken);
        } else if (data.explicitlyLocked) {
          sessionStorage.removeItem('av_admin_session');
        }
        setSessionState({
          checked: true,
          hasPassphrase: Boolean(data.hasPassphrase),
          passphraseUpdatedAt: data.passphraseUpdatedAt || null,
          unlocked: Boolean(data.unlocked),
          explicitlyLocked: Boolean(data.explicitlyLocked),
          reauthFresh: Boolean(data.reauthFresh),
          authTime: typeof data.authTime === 'number' ? data.authTime : null,
          revokedAt: data.revokedAt || null,
        });
      } else {
        setSessionState((s) => ({ ...s, checked: true, unlocked: false }));
      }
    },
    [firebaseUser, isAdmin, getIdToken]
  );

  useEffect(() => {
    if (!authLoading) {
      checkAdminSession();
    }
  }, [authLoading, checkAdminSession]);

  const loadAdminDatasets = useCallback(async () => {
    if (!sessionState.unlocked || !firebaseUser) return;

    if (permissions.permManageUsers || isSuperAdmin) {
      const uSnap = await getDocs(collection(db, 'users')).catch(() => null);
      if (uSnap) {
        setUsersList(
          uSnap.docs.map((d) => {
            const x = d.data();
            return {
              uid: x.uid,
              email: x.email,
              displayName: x.displayName,
              username: x.username,
              avatarUrl: x.avatarUrl,
              role: x.role,
              status: x.status,
              emailVerified: Boolean(x.emailVerified),
              membershipStatus: x.membershipStatus || 'none',
              themePreference: x.themePreference || 'system',
              language: x.language || 'English',
              notificationsEnabled: Boolean(x.notificationsEnabled),
              privacyAnalyticsOptOut: Boolean(x.privacyAnalyticsOptOut),
              privacyProfileVisible: Boolean(x.privacyProfileVisible),
              adminSetupCompleted: Boolean(x.adminSetupCompleted),
              createdAt: x.createdAt?.toDate?.()?.toISOString?.() || '',
              updatedAt: x.updatedAt?.toDate?.()?.toISOString?.() || '',
            };
          })
        );
      }

      const aSnap = await getDocs(collection(db, 'admins')).catch(() => null);
      if (aSnap) {
        setAdminRecords(
          aSnap.docs.map((d) => ({ ...(d.data() as AdminRecord), uid: d.id }))
        );
      }
    }

    const mSnap = await getDocs(collection(db, 'memberships')).catch(() => null);
    if (mSnap) {
      setMemberships(
        mSnap.docs.map((d) => {
          const x = d.data();
          return {
            id: d.id,
            email: x.email,
            fullName: x.fullName,
            preferredUsername: x.preferredUsername,
            interests: Array.isArray(x.interests) ? x.interests : [],
            message: x.message || '',
            consentAccepted: Boolean(x.consentAccepted),
            createdAt: x.createdAt?.toDate?.()?.toISOString?.() || '',
          };
        })
      );
    }

    const lSnap = await getDocs(
      query(collection(db, 'auditLogs'), orderBy('createdAt', 'desc'), limit(60))
    ).catch(() => null);
    if (lSnap) {
      setAuditLogs(
        lSnap.docs.map((d) => {
          const x = d.data();
          return {
            id: d.id,
            actorUid: x.actorUid,
            actorEmail: x.actorEmail,
            action: x.action,
            targetType: x.targetType,
            targetId: x.targetId,
            summary: x.summary,
            createdAt: x.createdAt?.toDate?.()?.toISOString?.() || '',
          };
        })
      );
    }
  }, [sessionState.unlocked, firebaseUser, permissions.permManageUsers, isSuperAdmin]);

  useEffect(() => {
    loadAdminDatasets();
  }, [loadAdminDatasets]);

  // Helper: obtain a fresh Google-verified ID token for sensitive security operations
  const ensureFreshGoogleToken = async (): Promise<string> => {
    if (sessionState.reauthFresh) {
      const existing = await getIdToken(true);
      if (existing) return existing;
    }
    const freshToken = await reauthenticateWithGoogle();
    return freshToken;
  };

  const handleUnlockSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityError(null);
    setSecurityBusy(true);
    try {
      const token = await getIdToken();
      if (!token) return;

      const res = await fetch('/api/admin/unlock', {
        method: 'POST',
        headers: getAdminHeaders(token, true),
        body: JSON.stringify({ passphrase: unlockPassphrase }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSecurityError(data.error || 'Incorrect administrative passphrase.');
        return;
      }
      if (data.sessionToken) {
        sessionStorage.setItem('av_admin_session', data.sessionToken);
      }
      setUnlockPassphrase('');
      setLockResetMode(false);
      await checkAdminSession(token);
    } finally {
      setSecurityBusy(false);
    }
  };

  const handleLockSession = async () => {
    sessionStorage.removeItem('av_admin_session');
    await fetch('/api/admin/lock', { method: 'POST' });
    setLockResetMode(false);
    await checkAdminSession();
  };

  const handleVerifyGoogleIdentity = async () => {
    setSecurityError(null);
    setSecurityBusy(true);
    try {
      const freshToken = await reauthenticateWithGoogle();
      await checkAdminSession(freshToken);
      setStatusBanner('Google identity freshly re-authenticated for sensitive security actions.');
    } catch (err: any) {
      setSecurityError(err?.message || 'Google re-authentication could not be completed.');
    } finally {
      setSecurityBusy(false);
    }
  };

  const handleResetPassphrase = async (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityError(null);

    if (newPassphrase.length < 8 || newPassphrase.length > 128) {
      setSecurityError('Admin passphrase must be between 8 and 128 characters.');
      return;
    }
    if (newPassphrase !== confirmPassphrase) {
      setSecurityError('Passphrase confirmation does not match.');
      return;
    }

    setSecurityBusy(true);
    try {
      let token = await ensureFreshGoogleToken();
      let res = await fetch('/api/admin/reset-passphrase', {
        method: 'POST',
        headers: getAdminHeaders(token, true),
        body: JSON.stringify({ newPassphrase }),
      });
      let data = await res.json();

      // If server requires fresher Google re-auth (<5m), prompt re-auth and retry once
      if (res.status === 403 && data.requiresReauth) {
        token = await reauthenticateWithGoogle();
        res = await fetch('/api/admin/reset-passphrase', {
          method: 'POST',
          headers: getAdminHeaders(token, true),
          body: JSON.stringify({ newPassphrase }),
        });
        data = await res.json();
      }

      if (!res.ok) {
        setSecurityError(data.error || 'Unable to reset admin passphrase.');
        return;
      }

      if (data.sessionToken) {
        sessionStorage.setItem('av_admin_session', data.sessionToken);
      }

      if (firebaseUser) {
        await updateDoc(doc(db, 'users', firebaseUser.uid), {
          adminSetupCompleted: true,
          updatedAt: serverTimestamp(),
        }).catch(() => null);

        const adminRef = doc(db, 'admins', firebaseUser.uid);
        const adminSnap = await getDoc(adminRef).catch(() => null);
        if (adminSnap && adminSnap.exists()) {
          await updateDoc(adminRef, {
            passphraseConfigured: true,
            updatedAt: serverTimestamp(),
          }).catch(() => null);
        }
      }

      await writeAuditLog(
        'Reset admin passphrase',
        'security',
        'Updated administrative passphrase following Google re-authentication',
        firebaseUser?.uid
      ).catch(() => null);

      setNewPassphrase('');
      setConfirmPassphrase('');
      setLockResetMode(false);
      await checkAdminSession(token);
      setStatusBanner('Admin passphrase updated securely with Google re-authentication.');
      await loadAdminDatasets();
    } catch (err: any) {
      setSecurityError(err?.message || 'Unable to complete passphrase reset.');
    } finally {
      setSecurityBusy(false);
    }
  };

  const handleClearPassphrase = async () => {
    setSecurityError(null);
    setSecurityBusy(true);
    try {
      let token = await ensureFreshGoogleToken();
      let res = await fetch('/api/admin/clear-passphrase', {
        method: 'POST',
        headers: getAdminHeaders(token, true),
      });
      let data = await res.json();

      if (res.status === 403 && data.requiresReauth) {
        token = await reauthenticateWithGoogle();
        res = await fetch('/api/admin/clear-passphrase', {
          method: 'POST',
          headers: getAdminHeaders(token, true),
        });
        data = await res.json();
      }

      if (!res.ok) {
        setSecurityError(data.error || 'Unable to clear admin passphrase.');
        return;
      }

      if (data.sessionToken) {
        sessionStorage.setItem('av_admin_session', data.sessionToken);
      }

      if (firebaseUser) {
        await updateDoc(doc(db, 'users', firebaseUser.uid), {
          adminSetupCompleted: false,
          updatedAt: serverTimestamp(),
        }).catch(() => null);

        const adminRef = doc(db, 'admins', firebaseUser.uid);
        const adminSnap = await getDoc(adminRef).catch(() => null);
        if (adminSnap && adminSnap.exists()) {
          await updateDoc(adminRef, {
            passphraseConfigured: false,
            updatedAt: serverTimestamp(),
          }).catch(() => null);
        }
      }

      await writeAuditLog(
        'Cleared admin passphrase',
        'security',
        'Removed optional passphrase lock (direct verified Google Auth active)',
        firebaseUser?.uid
      ).catch(() => null);

      setLockResetMode(false);
      await checkAdminSession(token);
      setStatusBanner('Optional passphrase lock cleared. Admin console uses direct Google Auth.');
      await loadAdminDatasets();
    } catch (err: any) {
      setSecurityError(err?.message || 'Unable to clear admin passphrase.');
    } finally {
      setSecurityBusy(false);
    }
  };

  const handleRevokeAllSessions = async () => {
    setSecurityError(null);
    setSecurityBusy(true);
    try {
      let token = await ensureFreshGoogleToken();
      // Record audit log while current Firebase token is still valid
      await writeAuditLog(
        'Revoked all admin sessions',
        'security',
        'Rotated signing secret and revoked Firebase refresh tokens across all devices',
        firebaseUser?.uid
      ).catch(() => null);

      let res = await fetch('/api/admin/revoke-sessions', {
        method: 'POST',
        headers: getAdminHeaders(token, true),
      });
      let data = await res.json();

      if (res.status === 403 && data.requiresReauth) {
        token = await reauthenticateWithGoogle();
        res = await fetch('/api/admin/revoke-sessions', {
          method: 'POST',
          headers: getAdminHeaders(token, true),
        });
        data = await res.json();
      }

      if (!res.ok) {
        setSecurityError(data.error || 'Unable to revoke active sessions.');
        return;
      }

      sessionStorage.removeItem('av_admin_session');
      setConfirmRevokeAll(false);
      await signOut();
    } catch (err: any) {
      setSecurityError(err?.message || 'Unable to complete session revocation.');
    } finally {
      setSecurityBusy(false);
    }
  };

  const handleUploadAsset = async (
    file: File,
    kind: 'media' | 'build',
    onSuccess: (url: string) => void
  ) => {
    setUploadingFile(true);
    setStatusBanner(null);
    try {
      const token = await getIdToken();
      if (!token) throw new Error('Not authenticated');
      const arrayBuf = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuf);
      let binary = '';
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const dataBase64 = btoa(binary);

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: getAdminHeaders(token, true),
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          dataBase64,
          kind,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed.');
      onSuccess(data.url);
      setStatusBanner(`Uploaded ${file.name} securely.`);
    } catch (err: any) {
      setStatusBanner(err?.message || 'File upload failed.');
    } finally {
      setUploadingFile(false);
    }
  };

  // Unified 1-click user role / admin promotion or revocation helper
  const applyUserRole = async (
    target: { uid: string; email: string; displayName?: string },
    nextRole: UserRole,
    customPerms?: AdminPermissions
  ) => {
    if (!isSuperAdmin || !firebaseUser) return;
    if (target.email.toLowerCase() === OWNER_EMAIL || target.uid === firebaseUser.uid) {
      setStatusBanner('Cannot alter the bootstrapped owner or your active admin role.');
      return;
    }

    setUpdatingRoleUid(target.uid);
    try {
      const adminRef = doc(db, 'admins', target.uid);
      if (nextRole === 'user') {
        const existingAdmin = await getDoc(adminRef).catch(() => null);
        if (existingAdmin && existingAdmin.exists()) {
          await deleteDoc(adminRef).catch((err) =>
            handleFirestoreError(err, OperationType.DELETE, `admins/${target.uid}`)
          );
        }
        await updateDoc(doc(db, 'users', target.uid), {
          role: 'user',
          updatedAt: serverTimestamp(),
        }).catch((err) =>
          handleFirestoreError(err, OperationType.UPDATE, `users/${target.uid}`)
        );
        await writeAuditLog(
          'Revoked admin role',
          'admin',
          `Set ${target.email} back to Standard User`,
          target.uid
        );
        setStatusBanner(`Revoked admin privileges for ${target.email}.`);
      } else {
        const perms = customPerms || ROLE_PRESETS[nextRole];
        const existingSnap = await getDoc(adminRef).catch(() => null);
        if (existingSnap && existingSnap.exists()) {
          await updateDoc(adminRef, {
            role: nextRole,
            ...perms,
            assignedBy: firebaseUser.uid,
            updatedAt: serverTimestamp(),
          }).catch((err) =>
            handleFirestoreError(err, OperationType.UPDATE, `admins/${target.uid}`)
          );
        } else {
          await setDoc(adminRef, {
            uid: target.uid,
            email: target.email,
            role: nextRole,
            ...perms,
            assignedBy: firebaseUser.uid,
            passphraseConfigured: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          }).catch((err) =>
            handleFirestoreError(err, OperationType.CREATE, `admins/${target.uid}`)
          );
        }

        await updateDoc(doc(db, 'users', target.uid), {
          role: nextRole,
          updatedAt: serverTimestamp(),
        }).catch(() => null);

        await writeAuditLog(
          existingSnap?.exists() ? 'Updated admin role' : 'Promoted user to admin',
          'admin',
          `Assigned ${ROLE_LABELS[nextRole]} role to ${target.email}`,
          target.uid
        );
        setStatusBanner(`Updated ${target.email} to ${ROLE_LABELS[nextRole]}.`);
      }
      await loadAdminDatasets();
    } finally {
      setUpdatingRoleUid(null);
    }
  };

  const handleAssignAdminByEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSuperAdmin || !firebaseUser) return;
    const targetEmail = assignEmail.trim().toLowerCase();
    const matchedUser = usersList.find((u) => u.email.toLowerCase() === targetEmail);
    if (!matchedUser) {
      setStatusBanner(
        'Only existing users who have signed in with a verified Google account at least once can be promoted to admin.'
      );
      return;
    }
    if (!matchedUser.emailVerified) {
      setStatusBanner('Selected user does not have a verified Google email.');
      return;
    }

    await applyUserRole(matchedUser, assignRole, assignPerms);
    setAssignEmail('');
  };

  const handleRemoveAdmin = async (admin: AdminRecord) => {
    if (!isSuperAdmin || !firebaseUser) return;
    if (admin.email.toLowerCase() === OWNER_EMAIL || admin.uid === firebaseUser.uid) {
      setStatusBanner('Cannot remove the bootstrapped owner or your active admin session.');
      return;
    }
    await applyUserRole({ uid: admin.uid, email: admin.email }, 'user');
    setConfirmRemoveAdminUid(null);
  };

  const handleToggleUserStatus = async (target: UserProfile) => {
    const nextStatus = target.status === 'active' ? 'suspended' : 'active';
    await updateDoc(doc(db, 'users', target.uid), {
      status: nextStatus,
      updatedAt: serverTimestamp(),
    }).catch((err) => handleFirestoreError(err, OperationType.UPDATE, `users/${target.uid}`));

    await writeAuditLog(
      nextStatus === 'suspended' ? 'Suspended user' : 'Restored user',
      'user',
      `${nextStatus} account ${target.email}`,
      target.uid
    );
    setStatusBanner(
      `${nextStatus === 'suspended' ? 'Suspended' : 'Restored'} account ${target.email}.`
    );
    await loadAdminDatasets();
  };

  const handleQuickToggleProduct = async (
    product: Product,
    field: 'published' | 'featured'
  ) => {
    if (!permissions.permEditApps) return;
    setTogglingProductId(product.id);
    try {
      const updated = { ...product, [field]: !product[field] };
      await saveProduct(updated, false);
      setStatusBanner(
        field === 'published'
          ? `${updated.name} is now ${updated.published ? 'Published live' : 'Unpublished (Draft)'}.`
          : `${updated.name} ${updated.featured ? 'pinned as Featured' : 'removed from Featured'}.`
      );
    } catch (err: any) {
      setStatusBanner(err?.message || 'Unable to update application status.');
    } finally {
      setTogglingProductId(null);
    }
  };

  const handleDeleteMembership = async (member: MembershipRecord) => {
    if (!isSuperAdmin) return;
    await deleteDoc(doc(db, 'memberships', member.id)).catch((err) =>
      handleFirestoreError(err, OperationType.DELETE, `memberships/${member.id}`)
    );
    await writeAuditLog(
      'Deleted membership record',
      'membership',
      `Removed membership signup for ${member.email}`,
      member.id
    );
    setStatusBanner(`Removed membership record for ${member.email}.`);
    await loadAdminDatasets();
  };

  const exportJsonFile = (filename: string, data: unknown) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Gate 1: Auth loading
  if (authLoading || !sessionState.checked) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 space-y-4 animate-pulse">
        <div className="h-10 w-60 rounded-xl bg-slate-200 dark:bg-slate-800" />
        <div className="h-64 rounded-2xl bg-slate-200 dark:bg-slate-800" />
      </div>
    );
  }

  // Gate 2: Must sign in and hold an authorized admin role
  if (!firebaseUser) {
    return (
      <div className="max-w-md mx-auto px-4 sm:px-6 py-20">
        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-[#f8f9fa] dark:bg-[#12151c] p-8 text-center space-y-5">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-violet-600 text-white flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h1 className="font-display text-xl font-bold text-[#0b0c10] dark:text-white">
              Administrator Authentication Required
            </h1>
            <p className="text-xs text-[#4b5563] dark:text-slate-400">
              Sign in with your authorized Astra Vesper administrator Google account to open the console directly.
            </p>
          </div>
          <button
            type="button"
            onClick={() => signInWithGoogle().catch(() => null)}
            className="w-full min-h-[44px] px-5 py-2.5 rounded-xl bg-[#0b0c10] dark:bg-white text-white dark:text-[#0b0c10] text-sm font-semibold"
          >
            Continue with Google
          </button>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto px-4 sm:px-6 py-20">
        <div className="rounded-2xl border border-red-500/30 bg-red-500/8 p-8 text-center space-y-3">
          <ShieldAlert className="w-8 h-8 mx-auto text-red-600 dark:text-red-400" />
          <h1 className="font-display text-xl font-bold text-[#0b0c10] dark:text-white">
            Restricted Administration Area
          </h1>
          <p className="text-xs text-[#4b5563] dark:text-slate-300">
            This account ({firebaseUser.email}) does not hold an authorized Astra Vesper administrator role.
          </p>
        </div>
      </div>
    );
  }

  // Gate 3: Shown ONLY if the administrator manually clicked "Lock Session"
  if (!sessionState.unlocked && sessionState.explicitlyLocked) {
    return (
      <div className="max-w-md mx-auto px-4 sm:px-6 py-16">
        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-[#f8f9fa] dark:bg-[#12151c] p-8 space-y-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-600/15 text-violet-700 dark:text-violet-400 flex items-center justify-center">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-display text-lg font-bold text-[#0b0c10] dark:text-white">
                {lockResetMode ? 'Reset Passphrase via Google Re-Auth' : 'Admin Console Locked'}
              </h1>
              <p className="text-xs text-[#4b5563] dark:text-slate-400">
                {firebaseUser.email}
              </p>
            </div>
          </div>

          {securityError && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-700 dark:text-red-300">
              {securityError}
            </div>
          )}

          {!lockResetMode ? (
            <form onSubmit={handleUnlockSession} className="space-y-4">
              {sessionState.hasPassphrase ? (
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-[#0b0c10] dark:text-slate-200">
                    Administrator Passphrase
                  </label>
                  <input
                    type="password"
                    required
                    value={unlockPassphrase}
                    onChange={(e) => setUnlockPassphrase(e.target.value)}
                    placeholder="Enter your admin passphrase"
                    className="w-full min-h-[44px] px-3.5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#181c26] text-sm text-[#0b0c10] dark:text-white"
                  />
                </div>
              ) : (
                <p className="text-xs text-[#4b5563] dark:text-slate-300 leading-relaxed">
                  Your admin session was manually locked. Click below to unlock directly with your verified Google session.
                </p>
              )}

              <button
                type="submit"
                disabled={securityBusy}
                className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 disabled:opacity-50"
              >
                <Unlock className="w-4 h-4" />
                {securityBusy ? 'Verifying...' : 'Unlock Admin Console'}
              </button>

              {sessionState.hasPassphrase && (
                <button
                  type="button"
                  onClick={() => {
                    setSecurityError(null);
                    setLockResetMode(true);
                  }}
                  className="w-full min-h-[40px] text-xs font-semibold text-violet-700 dark:text-violet-400 hover:underline"
                >
                  Forgot Passphrase? Re-verify Google &amp; Reset
                </button>
              )}
            </form>
          ) : (
            <form onSubmit={handleResetPassphrase} className="space-y-4">
              <p className="text-xs text-[#4b5563] dark:text-slate-300 leading-relaxed">
                Confirm your Google account via popup to establish a new admin passphrase or switch back to direct Google Auth.
              </p>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#0b0c10] dark:text-slate-200">
                  New Admin Passphrase (8+ chars)
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  maxLength={128}
                  value={newPassphrase}
                  onChange={(e) => setNewPassphrase(e.target.value)}
                  placeholder="Enter new passphrase"
                  className="w-full min-h-[44px] px-3.5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#181c26] text-sm text-[#0b0c10] dark:text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-[#0b0c10] dark:text-slate-200">
                  Confirm New Passphrase
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  maxLength={128}
                  value={confirmPassphrase}
                  onChange={(e) => setConfirmPassphrase(e.target.value)}
                  placeholder="Re-enter new passphrase"
                  className="w-full min-h-[44px] px-3.5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#181c26] text-sm text-[#0b0c10] dark:text-white"
                />
              </div>

              <button
                type="submit"
                disabled={securityBusy}
                className="w-full min-h-[44px] rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 disabled:opacity-50"
              >
                {securityBusy ? 'Re-authenticating Google...' : 'Verify Google & Save Passphrase'}
              </button>

              <div className="flex items-center justify-between gap-2 pt-1">
                <button
                  type="button"
                  disabled={securityBusy}
                  onClick={handleClearPassphrase}
                  className="text-xs font-semibold text-red-600 dark:text-red-400 hover:underline"
                >
                  Clear Passphrase &amp; Unlock
                </button>
                <button
                  type="button"
                  onClick={() => setLockResetMode(false)}
                  className="text-xs text-[#4b5563] dark:text-slate-400 hover:underline"
                >
                  Back to Unlock
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  }

  const startNewProduct = () => {
    const id = `app_${Date.now()}`;
    const defaultCategory: ProductCategory = 'Productivity';
    const autoPreview = getAutoPreviewForCategory(defaultCategory);
    setSlugTouched(false);
    setCustomImageTouched(false);
    setPreviewTouched(false);
    setEditingProduct({
      id,
      slug: `app-${Date.now().toString().slice(-5)}`,
      name: '',
      tagline: '',
      description: '',
      category: defaultCategory,
      status: 'Available',
      published: true,
      featured: true,
      version: '1.0.0',
      platforms: ['Web Application'],
      websiteUrl: '',
      previewUrl: '',
      iconKey: 'apps',
      heroImageUrl: autoPreview.imageUrl,
      screenshots: [autoPreview.imageUrl],
      availableFeatures: ['Direct web application access'],
      plannedFeatures: [],
      releaseNotes: '',
      changelog: [],
      downloadUrl: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  };

  const startEditProduct = (p: Product) => {
    setSlugTouched(true);
    setCustomImageTouched(Boolean(p.heroImageUrl));
    setPreviewTouched(Boolean(p.previewUrl && p.previewUrl !== p.websiteUrl));
    setEditingProduct({
      ...p,
      heroImageUrl: p.heroImageUrl || getAutoPreviewForCategory(p.category).imageUrl,
    });
  };

  const isEditingNew = editingProduct
    ? !products.some((p) => p.id === editingProduct.id)
    : false;

  const eligibleUsersToPromote = usersList.filter(
    (u) =>
      u.emailVerified &&
      u.email.toLowerCase() !== OWNER_EMAIL &&
      !adminRecords.some((a) => a.uid === u.uid)
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6 sm:space-y-8">
      {/* Admin Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-black/8 dark:border-white/10">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-violet-700 dark:text-violet-400">
            Astra Vesper Administration · {isSuperAdmin ? 'Super Administrator' : 'Administrator'}
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0b0c10] dark:text-white">
            Platform Control Center
          </h1>
          <p className="text-xs text-[#4b5563] dark:text-slate-400 font-mono-tabular">
            {firebaseUser.email} · Google Auth Verified ·{' '}
            {sessionState.hasPassphrase ? 'Optional Passphrase Active' : 'Direct Open Session'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start">
          <button
            type="button"
            onClick={() => {
              loadAdminDatasets();
              checkAdminSession();
            }}
            className="min-h-[40px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-black/10 dark:border-white/15 text-xs font-medium text-[#0b0c10] dark:text-white hover:bg-black/5 dark:hover:bg-white/10"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className="min-h-[40px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-black/10 dark:border-white/15 text-xs font-medium text-[#0b0c10] dark:text-white hover:bg-black/5 dark:hover:bg-white/10"
          >
            <KeyRound className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
            Security &amp; Reset
          </button>
          <button
            type="button"
            onClick={handleLockSession}
            className="min-h-[40px] inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-black/10 dark:border-white/15 text-xs font-medium text-[#0b0c10] dark:text-white hover:bg-black/5 dark:hover:bg-white/10"
          >
            <Lock className="w-3.5 h-3.5" />
            Lock Session
          </button>
        </div>
      </div>

      {statusBanner && (
        <div className="rounded-xl border border-violet-500/30 bg-violet-600/10 px-4 py-3 text-xs font-medium text-violet-800 dark:text-violet-200 flex items-center justify-between gap-4">
          <span>{statusBanner}</span>
          <button type="button" onClick={() => setStatusBanner(null)} className="underline shrink-0">
            Dismiss
          </button>
        </div>
      )}

      {/* Admin Navigation Tabs (Single Row, Horizontal Swipe on Mobile) */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
        {(
          [
            { id: 'products', label: 'Products & Apps', icon: Package },
            { id: 'users', label: 'Admins & Users', icon: Users },
            { id: 'website', label: 'Website CMS', icon: FileEdit },
            { id: 'database', label: 'Database Manager', icon: Database },
            { id: 'security', label: 'Security & Reset', icon: KeyRound },
            { id: 'ai', label: 'Viora AI', icon: Bot },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`min-h-[44px] inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                active
                  ? 'bg-violet-600 text-white'
                  : 'bg-[#f8f9fa] dark:bg-[#12151c] text-[#4b5563] dark:text-slate-300 border border-black/10 dark:border-white/10 hover:border-violet-500/40'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: PRODUCT MANAGEMENT + AUTOMATED PREVIEW GENERATION */}
      {activeTab === 'products' && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-lg font-bold text-[#0b0c10] dark:text-white">
                Application Catalog ({products.length})
              </h2>
              <p className="text-xs text-[#4b5563] dark:text-slate-400">
                Add new applications with description and app link — Astra Vesper automatically connects live previews, studio visuals, and 1-click publish toggles.
              </p>
            </div>
            {permissions.permAddApps && (
              <button
                type="button"
                onClick={startNewProduct}
                className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700"
              >
                <Plus className="w-4 h-4" />
                Add New Application
              </button>
            )}
          </div>

          {editingProduct && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setSavingProduct(true);
                setStatusBanner(null);
                try {
                  const autoVisual = getAutoPreviewForCategory(editingProduct.category).imageUrl;
                  const finalProduct: Product = {
                    ...editingProduct,
                    tagline:
                      editingProduct.tagline.trim() ||
                      editingProduct.description.slice(0, 140),
                    websiteUrl: (editingProduct.websiteUrl || '').trim(),
                    previewUrl:
                      (editingProduct.previewUrl || '').trim() ||
                      (editingProduct.websiteUrl || '').trim(),
                    heroImageUrl: editingProduct.heroImageUrl || autoVisual,
                    screenshots:
                      editingProduct.screenshots && editingProduct.screenshots.length > 0
                        ? editingProduct.screenshots
                        : [editingProduct.heroImageUrl || autoVisual],
                    platforms:
                      editingProduct.platforms.length > 0
                        ? editingProduct.platforms
                        : ['Web Application'],
                  };
                  await saveProduct(finalProduct, isEditingNew);
                  setEditingProduct(null);
                  setStatusBanner(
                    `Saved "${finalProduct.name}" to Firebase Firestore${
                      finalProduct.published ? ' and published live on Astra Vesper.' : ' as draft.'
                    }`
                  );
                } catch (err: any) {
                  setStatusBanner(err?.message || 'Unable to save product.');
                } finally {
                  setSavingProduct(false);
                }
              }}
              className="rounded-2xl border border-violet-500/30 bg-[#f8f9fa] dark:bg-[#12151c] p-5 sm:p-6 space-y-5"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                  <h3 className="font-display text-base font-bold text-[#0b0c10] dark:text-white">
                    {isEditingNew ? 'Add New Application' : `Edit ${editingProduct.name}`}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="text-xs text-[#4b5563] dark:text-slate-400 underline"
                >
                  Cancel
                </button>
              </div>

              {/* Core Identity + Direct App Link */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[#4b5563] dark:text-slate-400">
                    Application Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Viora Studio"
                    value={editingProduct.name}
                    onChange={(e) => {
                      const nextName = e.target.value;
                      setEditingProduct((prev) => {
                        if (!prev) return prev;
                        const nextSlug =
                          !slugTouched && isEditingNew
                            ? slugifyName(nextName) || prev.slug
                            : prev.slug;
                        return { ...prev, name: nextName, slug: nextSlug };
                      });
                    }}
                    className="w-full min-h-[44px] px-3 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#181c26] text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[#4b5563] dark:text-slate-400">
                    URL Slug
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="slug-name"
                    pattern="^[a-z0-9-]+$"
                    value={editingProduct.slug}
                    onChange={(e) => {
                      setSlugTouched(true);
                      setEditingProduct({
                        ...editingProduct,
                        slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
                      });
                    }}
                    className="w-full min-h-[44px] px-3 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#181c26] text-sm font-mono-tabular"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[#4b5563] dark:text-slate-400">
                    Version
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="1.0.0"
                    value={editingProduct.version}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, version: e.target.value })
                    }
                    className="w-full min-h-[44px] px-3 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#181c26] text-sm font-mono-tabular"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[#4b5563] dark:text-slate-400">
                    Category (Auto-Matches Preview)
                  </label>
                  <select
                    value={editingProduct.category}
                    onChange={(e) => {
                      const nextCat = e.target.value as ProductCategory;
                      const autoOpt = getAutoPreviewForCategory(nextCat);
                      setEditingProduct((prev) =>
                        prev
                          ? {
                              ...prev,
                              category: nextCat,
                              heroImageUrl: !customImageTouched
                                ? autoOpt.imageUrl
                                : prev.heroImageUrl,
                              screenshots: !customImageTouched
                                ? [autoOpt.imageUrl]
                                : prev.screenshots,
                            }
                          : prev
                      );
                    }}
                    className="w-full min-h-[44px] px-3 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#181c26] text-sm"
                  >
                    {PRODUCT_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[#4b5563] dark:text-slate-400">
                    Release Status
                  </label>
                  <select
                    value={editingProduct.status}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        status: e.target.value as ProductStatus,
                      })
                    }
                    className="w-full min-h-[44px] px-3 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#181c26] text-sm"
                  >
                    <option value="Available">Available</option>
                    <option value="Beta">Beta</option>
                    <option value="In Development">In Development</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[#4b5563] dark:text-slate-400">
                    App Icon
                  </label>
                  <select
                    value={editingProduct.iconKey || 'apps'}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, iconKey: e.target.value })
                    }
                    className="w-full min-h-[44px] px-3 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#181c26] text-sm"
                  >
                    <option value="music">Icon: Music</option>
                    <option value="workflow">Icon: Workflow</option>
                    <option value="ai">Icon: AI</option>
                    <option value="creative">Icon: Creative</option>
                    <option value="compute">Icon: Compute</option>
                    <option value="future">Icon: Future</option>
                    <option value="apps">Icon: Default</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[#4b5563] dark:text-slate-400">
                    Connected App Link (Website URL)
                  </label>
                  <input
                    type="url"
                    required
                    placeholder="https://your-app.vercel.app/"
                    value={editingProduct.websiteUrl || ''}
                    onChange={(e) => {
                      const nextUrl = e.target.value;
                      setEditingProduct((prev) =>
                        prev
                          ? {
                              ...prev,
                              websiteUrl: nextUrl,
                              previewUrl: !previewTouched ? nextUrl : prev.previewUrl,
                            }
                          : prev
                      );
                    }}
                    className="w-full min-h-[44px] px-3 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#181c26] text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-[#4b5563] dark:text-slate-400">
                    Live Preview Endpoint (Auto-Linked)
                  </label>
                  <input
                    type="url"
                    placeholder="Auto-connected to App Link"
                    value={editingProduct.previewUrl || ''}
                    onChange={(e) => {
                      setPreviewTouched(true);
                      setEditingProduct({ ...editingProduct, previewUrl: e.target.value });
                    }}
                    className="w-full min-h-[44px] px-3 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#181c26] text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  required
                  placeholder="Short Tagline (e.g. Next-gen workspace automation)"
                  value={editingProduct.tagline}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, tagline: e.target.value })
                  }
                  className="w-full min-h-[44px] px-3 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#181c26] text-sm"
                />
                <input
                  type="text"
                  placeholder="Platforms (comma-separated, e.g. Web Application, Android)"
                  value={editingProduct.platforms.join(', ')}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      platforms: e.target.value
                        .split(',')
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  className="w-full min-h-[44px] px-3 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#181c26] text-sm"
                />
              </div>

              <textarea
                rows={3}
                required
                placeholder="Application Description"
                value={editingProduct.description}
                onChange={(e) =>
                  setEditingProduct({ ...editingProduct, description: e.target.value })
                }
                className="w-full p-3 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#181c26] text-sm"
              />

              {/* Automated Pre-Developed Studio Preview Generator */}
              <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#161b24] p-4 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                    <div>
                      <p className="text-xs font-bold text-[#0b0c10] dark:text-white">
                        Automated Pre-Developed Studio Preview
                      </p>
                      <p className="text-[11px] text-[#4b5563] dark:text-slate-400">
                        Automatically matched to {editingProduct.category} or select any modern-classic studio visual below.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const autoOpt = getAutoPreviewForCategory(editingProduct.category);
                        setCustomImageTouched(false);
                        setEditingProduct({
                          ...editingProduct,
                          heroImageUrl: autoOpt.imageUrl,
                          screenshots: [autoOpt.imageUrl],
                        });
                      }}
                      className="min-h-[36px] px-3 py-1 rounded-lg border border-black/10 dark:border-white/15 text-[11px] font-semibold hover:border-violet-500/40"
                    >
                      Auto-Match Preview
                    </button>
                    {(editingProduct.previewUrl || editingProduct.websiteUrl) && (
                      <button
                        type="button"
                        onClick={() => setTestingPreview(editingProduct)}
                        className="min-h-[36px] inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-violet-600 text-white text-[11px] font-semibold hover:bg-violet-700"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Run Live Preview
                      </button>
                    )}
                  </div>
                </div>

                {/* Live Generated Card Preview + Curated Gallery Grid */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                  <div className="md:col-span-5 rounded-xl overflow-hidden border border-black/10 dark:border-white/10 bg-[#0b0c10]">
                    <div className="relative aspect-[16/9]">
                      <img
                        src={resolveAssetUrl(
                          editingProduct.heroImageUrl ||
                            getAutoPreviewForCategory(editingProduct.category).imageUrl
                        )}
                        alt="Generated application preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
                      <div className="absolute bottom-2.5 left-3 right-3 text-white">
                        <p className="text-[10px] text-white/75">
                          {editingProduct.category} · {editingProduct.status}
                        </p>
                        <p className="font-display text-sm font-semibold truncate">
                          {editingProduct.name || 'New Application Preview'}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {PREDEVELOPED_PREVIEWS.map((opt) => {
                      const active =
                        resolveAssetUrl(editingProduct.heroImageUrl) === opt.imageUrl;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            setCustomImageTouched(true);
                            setEditingProduct({
                              ...editingProduct,
                              heroImageUrl: opt.imageUrl,
                              screenshots: [opt.imageUrl],
                            });
                          }}
                          className={`group rounded-xl overflow-hidden border text-left transition-all ${
                            active
                              ? 'border-violet-600 ring-2 ring-violet-500/30'
                              : 'border-black/10 dark:border-white/10 opacity-80 hover:opacity-100'
                          }`}
                        >
                          <div className="aspect-[16/9] bg-[#0b0c10]">
                            <img
                              src={opt.imageUrl}
                              alt={opt.label}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="p-1.5">
                            <p className="text-[10px] font-semibold text-[#0b0c10] dark:text-white truncate">
                              {opt.label}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <textarea
                  rows={3}
                  placeholder="Available Features (one per line)"
                  value={editingProduct.availableFeatures.join('\n')}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      availableFeatures: e.target.value
                        .split('\n')
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  className="p-3 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#181c26] text-xs"
                />
                <textarea
                  rows={3}
                  placeholder="Planned Features (one per line)"
                  value={editingProduct.plannedFeatures.join('\n')}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      plannedFeatures: e.target.value
                        .split('\n')
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  className="p-3 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#181c26] text-xs"
                />
              </div>

              {/* Secure Media & Downloadable Build Uploads */}
              {permissions.permUploadMedia && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-black/8 dark:border-white/10">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium flex items-center gap-1.5">
                      <Upload className="w-3.5 h-3.5" />
                      Optional Custom Image Upload
                    </label>
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg,.webp"
                      disabled={uploadingFile}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) {
                          setCustomImageTouched(true);
                          handleUploadAsset(f, 'media', (url) =>
                            setEditingProduct((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    heroImageUrl: url,
                                    screenshots: [url, ...(prev.screenshots || [])].slice(0, 6),
                                  }
                                : prev
                            )
                          );
                        }
                      }}
                      className="text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium flex items-center gap-1.5">
                      <Upload className="w-3.5 h-3.5" />
                      Optional Downloadable Build (.zip, .exe, .dmg, .apk)
                    </label>
                    <input
                      type="file"
                      accept=".zip,.exe,.dmg,.apk,.appimage"
                      disabled={uploadingFile}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) {
                          handleUploadAsset(f, 'build', (url) =>
                            setEditingProduct((prev) =>
                              prev ? { ...prev, downloadUrl: url } : prev
                            )
                          );
                        }
                      }}
                      className="text-xs"
                    />
                    {editingProduct.downloadUrl && (
                      <p className="text-[11px] font-mono-tabular text-emerald-600 dark:text-emerald-400 truncate">
                        Hosted build: {editingProduct.downloadUrl}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-6">
                <label className="inline-flex items-center gap-2 text-xs font-medium">
                  <input
                    type="checkbox"
                    checked={editingProduct.published}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, published: e.target.checked })
                    }
                  />
                  Publish Immediately to Live Website
                </label>
                <label className="inline-flex items-center gap-2 text-xs font-medium">
                  <input
                    type="checkbox"
                    checked={editingProduct.featured}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, featured: e.target.checked })
                    }
                  />
                  Featured on Homepage
                </label>
              </div>

              <button
                type="submit"
                disabled={uploadingFile || savingProduct}
                className="min-h-[44px] px-6 py-2.5 rounded-xl bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 disabled:opacity-50"
              >
                {savingProduct ? 'Saving to Firebase...' : 'Save & Publish Application'}
              </button>
            </form>
          )}

          <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#12151c] divide-y divide-black/8 dark:divide-white/10">
            {products.map((p) => {
              const busyRow = togglingProductId === p.id;
              return (
                <div
                  key={p.id}
                  className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {p.heroImageUrl && (
                      <img
                        src={resolveAssetUrl(p.heroImageUrl)}
                        alt={p.name}
                        className="w-16 h-10 rounded-lg object-cover border border-black/10 dark:border-white/10 shrink-0"
                      />
                    )}
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-display font-semibold text-[#0b0c10] dark:text-white truncate">
                          {p.name}
                        </span>
                        <span className="text-xs font-mono-tabular text-[#4b5563] dark:text-slate-400">
                          v{p.version} · {p.published ? 'Published' : 'Draft'}
                          {p.featured ? ' · Featured' : ''}
                        </span>
                      </div>
                      <p className="text-xs text-[#4b5563] dark:text-slate-400 truncate">
                        {p.category} · {p.status} {p.websiteUrl ? `· ${p.websiteUrl}` : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {permissions.permEditApps && (
                      <>
                        <button
                          type="button"
                          disabled={busyRow}
                          onClick={() => handleQuickToggleProduct(p, 'published')}
                          className={`min-h-[36px] px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors disabled:opacity-50 ${
                            p.published
                              ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                              : 'border-black/10 dark:border-white/15 text-[#4b5563] dark:text-slate-300'
                          }`}
                        >
                          {p.published ? 'Published' : 'Publish'}
                        </button>
                        <button
                          type="button"
                          disabled={busyRow}
                          onClick={() => handleQuickToggleProduct(p, 'featured')}
                          className={`min-h-[36px] px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors disabled:opacity-50 ${
                            p.featured
                              ? 'border-violet-500/35 bg-violet-500/10 text-violet-700 dark:text-violet-300'
                              : 'border-black/10 dark:border-white/15 text-[#4b5563] dark:text-slate-300'
                          }`}
                        >
                          {p.featured ? 'Featured' : 'Feature'}
                        </button>
                      </>
                    )}
                    {(p.previewUrl || p.websiteUrl) && (
                      <button
                        type="button"
                        onClick={() => setTestingPreview(p)}
                        className="min-h-[36px] inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-black/10 dark:border-white/15 text-xs font-medium hover:border-violet-500/40"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Preview
                      </button>
                    )}
                    {p.websiteUrl && (
                      <a
                        href={p.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="min-h-[36px] inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-black/10 dark:border-white/15 text-xs font-medium hover:border-violet-500/40"
                      >
                        Open
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                    {permissions.permEditApps && (
                      <button
                        type="button"
                        onClick={() => startEditProduct(p)}
                        className="min-h-[36px] px-3 py-1.5 rounded-xl border border-black/10 dark:border-white/15 text-xs font-medium hover:bg-black/5 dark:hover:bg-white/10"
                      >
                        Edit
                      </button>
                    )}
                    {permissions.permDeleteApps && (
                      <button
                        type="button"
                        onClick={() => removeProduct(p.id, p.name)}
                        className="min-h-[36px] min-w-[36px] inline-flex items-center justify-center rounded-xl border border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/10"
                        aria-label={`Delete ${p.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: ADMINS & USER MANAGEMENT (1-CLICK ROLE CONTROLS) */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {!permissions.permManageUsers && !isSuperAdmin ? (
            <p className="text-sm text-[#4b5563] dark:text-slate-400">
              You do not have user management permissions.
            </p>
          ) : (
            <>
              {/* Active Administrators Directory with 1-Click Role Switcher & Remove */}
              {isSuperAdmin && (
                <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#12151c] p-6 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h2 className="font-display text-base font-bold text-[#0b0c10] dark:text-white">
                        Active Administrators ({adminRecords.length})
                      </h2>
                      <p className="text-xs text-[#4b5563] dark:text-slate-400">
                        Switch administrative roles in one click or revoke admin privileges cleanly.
                      </p>
                    </div>
                  </div>

                  {adminRecords.length === 0 ? (
                    <p className="text-xs text-[#4b5563] dark:text-slate-400">
                      Only the bootstrapped owner record is currently active.
                    </p>
                  ) : (
                    <div className="divide-y divide-black/8 dark:divide-white/10">
                      {adminRecords.map((adm) => {
                        const isOwnerAccount = adm.email.toLowerCase() === OWNER_EMAIL;
                        const isSelf = adm.uid === firebaseUser.uid;
                        const confirming = confirmRemoveAdminUid === adm.uid;
                        const rowBusy = updatingRoleUid === adm.uid;

                        return (
                          <div
                            key={adm.uid}
                            className="py-3.5 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div className="space-y-0.5">
                              <p className="text-sm font-semibold text-[#0b0c10] dark:text-white">
                                {adm.email}{' '}
                                <span className="text-xs font-normal text-violet-700 dark:text-violet-400">
                                  · {ROLE_LABELS[adm.role]}
                                  {isOwnerAccount ? ' (Primary Owner)' : ''}
                                </span>
                              </p>
                              <p className="text-[11px] text-[#4b5563] dark:text-slate-400">
                                Permissions:{' '}
                                {[
                                  adm.permAddApps && 'Add Apps',
                                  adm.permEditApps && 'Edit Apps',
                                  adm.permDeleteApps && 'Delete Apps',
                                  adm.permManageUsers && 'Users',
                                  adm.permManageContent && 'CMS',
                                  adm.permManageAi && 'Viora AI',
                                ]
                                  .filter(Boolean)
                                  .join(' · ') || 'Read-only Viewer'}
                              </p>
                            </div>

                            {!isOwnerAccount && !isSelf && (
                              <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
                                <select
                                  aria-label={`Role for ${adm.email}`}
                                  disabled={rowBusy}
                                  value={adm.role}
                                  onChange={(e) =>
                                    applyUserRole(
                                      { uid: adm.uid, email: adm.email },
                                      e.target.value as AdminRole
                                    )
                                  }
                                  className="min-h-[36px] px-3 rounded-xl border border-black/10 dark:border-white/15 bg-[#f8f9fa] dark:bg-[#181c26] text-xs font-medium"
                                >
                                  <option value="super_admin">Super Admin</option>
                                  <option value="admin">Administrator</option>
                                  <option value="app_manager">App Manager</option>
                                  <option value="content_manager">Content Manager</option>
                                  <option value="viewer">Viewer</option>
                                </select>

                                {!confirming ? (
                                  <button
                                    type="button"
                                    disabled={rowBusy}
                                    onClick={() => setConfirmRemoveAdminUid(adm.uid)}
                                    className="min-h-[36px] inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-semibold hover:bg-red-500/10"
                                  >
                                    <UserMinus className="w-3.5 h-3.5" />
                                    Remove
                                  </button>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      disabled={rowBusy}
                                      onClick={() => handleRemoveAdmin(adm)}
                                      className="min-h-[36px] px-3.5 py-1.5 rounded-xl bg-red-600 text-white text-xs font-semibold"
                                    >
                                      Confirm Revoke
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setConfirmRemoveAdminUid(null)}
                                      className="min-h-[36px] px-2.5 py-1.5 text-xs text-[#4b5563] dark:text-slate-400"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Custom Granular Promotion Form */}
              {isSuperAdmin && (
                <form
                  onSubmit={handleAssignAdminByEmail}
                  className="rounded-2xl border border-black/10 dark:border-white/10 bg-[#f8f9fa] dark:bg-[#12151c] p-6 space-y-4"
                >
                  <div className="space-y-1">
                    <h2 className="font-display text-base font-bold text-[#0b0c10] dark:text-white flex items-center gap-2">
                      <UserPlus className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                      Custom Admin Role &amp; Permission Assignment
                    </h2>
                    <p className="text-xs text-[#4b5563] dark:text-slate-400">
                      Only verified Google accounts that have signed in at least once appear below.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium text-[#4b5563] dark:text-slate-400">
                        Select or Enter Signed-In Account Email
                      </label>
                      <input
                        type="email"
                        required
                        list="signed-in-users-datalist"
                        placeholder="Verified user email address"
                        value={assignEmail}
                        onChange={(e) => setAssignEmail(e.target.value)}
                        className="w-full min-h-[44px] px-3.5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#181c26] text-sm"
                      />
                      <datalist id="signed-in-users-datalist">
                        {eligibleUsersToPromote.map((u) => (
                          <option key={u.uid} value={u.email}>
                            {u.displayName}
                          </option>
                        ))}
                      </datalist>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-medium text-[#4b5563] dark:text-slate-400">
                        Administrative Role
                      </label>
                      <select
                        value={assignRole}
                        onChange={(e) => {
                          const r = e.target.value as AdminRole;
                          setAssignRole(r);
                          setAssignPerms(ROLE_PRESETS[r]);
                        }}
                        className="w-full min-h-[44px] px-3.5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#181c26] text-sm"
                      >
                        <option value="super_admin">Super Administrator</option>
                        <option value="admin">Administrator</option>
                        <option value="content_manager">Content Manager</option>
                        <option value="app_manager">Application Manager</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    {(Object.keys(assignPerms) as (keyof AdminPermissions)[]).map((perm) => (
                      <label key={perm} className="inline-flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={assignPerms[perm]}
                          onChange={(e) =>
                            setAssignPerms((prev) => ({ ...prev, [perm]: e.target.checked }))
                          }
                        />
                        <span>{perm.replace('perm', '')}</span>
                      </label>
                    ))}
                  </div>

                  <button
                    type="submit"
                    className="min-h-[42px] px-4 py-2 rounded-xl bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700"
                  >
                    Assign Admin Role &amp; Permissions
                  </button>
                </form>
              )}

              {/* Signed-In User Directory with 1-Click Role Controls */}
              <div className="space-y-3">
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search signed-in accounts by name or email..."
                  className="w-full max-w-md min-h-[44px] px-3.5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#12151c] text-sm"
                />
                <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#12151c] divide-y divide-black/8 dark:divide-white/10">
                  {usersList
                    .filter(
                      (u) =>
                        !userSearch.trim() ||
                        u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
                        u.displayName.toLowerCase().includes(userSearch.toLowerCase())
                    )
                    .map((u) => {
                      const adminMeta = adminRecords.find((a) => a.uid === u.uid);
                      const effectiveRole: UserRole = adminMeta?.role || u.role || 'user';
                      const isOwnerUser = u.email.toLowerCase() === OWNER_EMAIL;
                      const isSelfUser = u.uid === firebaseUser.uid;
                      const canModify =
                        isSuperAdmin && !isOwnerUser && !isSelfUser && u.emailVerified;
                      const rowBusy = updatingRoleUid === u.uid;

                      return (
                        <div
                          key={u.uid}
                          className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3"
                        >
                          <div>
                            <p className="text-sm font-semibold text-[#0b0c10] dark:text-white">
                              {u.displayName}{' '}
                              <span className="text-xs font-normal text-[#4b5563] dark:text-slate-400">
                                ({u.email})
                              </span>
                            </p>
                            <p className="text-xs text-[#4b5563] dark:text-slate-400">
                              Role: {ROLE_LABELS[effectiveRole]} · Status: {u.status}
                              {!u.emailVerified ? ' · Unverified' : ''}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 self-start lg:self-center">
                            {canModify && (
                              <>
                                <select
                                  aria-label={`Change role for ${u.email}`}
                                  disabled={rowBusy}
                                  value={effectiveRole}
                                  onChange={(e) =>
                                    applyUserRole(
                                      { uid: u.uid, email: u.email, displayName: u.displayName },
                                      e.target.value as UserRole
                                    )
                                  }
                                  className="min-h-[36px] px-3 rounded-xl border border-black/10 dark:border-white/15 bg-[#f8f9fa] dark:bg-[#181c26] text-xs font-medium"
                                >
                                  <option value="user">Standard User</option>
                                  <option value="viewer">Viewer</option>
                                  <option value="app_manager">App Manager</option>
                                  <option value="content_manager">Content Manager</option>
                                  <option value="admin">Administrator</option>
                                  <option value="super_admin">Super Admin</option>
                                </select>

                                {!adminMeta && (
                                  <button
                                    type="button"
                                    disabled={rowBusy}
                                    onClick={() =>
                                      applyUserRole(
                                        { uid: u.uid, email: u.email, displayName: u.displayName },
                                        'admin'
                                      )
                                    }
                                    className="min-h-[36px] inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-violet-600/12 text-violet-700 dark:text-violet-300 text-xs font-semibold hover:bg-violet-600/20"
                                  >
                                    <UserPlus className="w-3.5 h-3.5" />
                                    Make Admin
                                  </button>
                                )}
                              </>
                            )}

                            {!isSelfUser && !isOwnerUser && (
                              <button
                                type="button"
                                onClick={() => handleToggleUserStatus(u)}
                                className={`min-h-[36px] px-3.5 py-1.5 rounded-xl border text-xs font-medium ${
                                  u.status === 'active'
                                    ? 'border-black/10 dark:border-white/15 hover:border-red-500/40'
                                    : 'border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
                                }`}
                              >
                                {u.status === 'active' ? 'Suspend' : 'Restore'}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 3: WEBSITE CMS */}
      {activeTab === 'website' && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await saveSiteContent(cmsDraft);
            setStatusBanner('Website content updated.');
          }}
          className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#12151c] p-6 space-y-4"
        >
          <h2 className="font-display text-lg font-bold text-[#0b0c10] dark:text-white">
            Homepage &amp; Ecosystem Content
          </h2>
          {!permissions.permManageContent ? (
            <p className="text-sm text-[#4b5563] dark:text-slate-400">
              Content Manager permissions required to edit website copy.
            </p>
          ) : (
            <>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Hero Headline</label>
                <input
                  type="text"
                  value={cmsDraft.heroHeadline}
                  onChange={(e) => setCmsDraft({ ...cmsDraft, heroHeadline: e.target.value })}
                  className="w-full min-h-[44px] px-3.5 rounded-xl border border-black/10 dark:border-white/10 bg-[#f8f9fa] dark:bg-[#181c26] text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Hero Description</label>
                <textarea
                  rows={2}
                  value={cmsDraft.heroDescription}
                  onChange={(e) => setCmsDraft({ ...cmsDraft, heroDescription: e.target.value })}
                  className="w-full p-3 rounded-xl border border-black/10 dark:border-white/10 bg-[#f8f9fa] dark:bg-[#181c26] text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Announcement Banner</label>
                <input
                  type="text"
                  value={cmsDraft.announcementBanner}
                  onChange={(e) =>
                    setCmsDraft({ ...cmsDraft, announcementBanner: e.target.value })
                  }
                  className="w-full min-h-[44px] px-3.5 rounded-xl border border-black/10 dark:border-white/10 bg-[#f8f9fa] dark:bg-[#181c26] text-sm"
                />
                <label className="inline-flex items-center gap-2 text-xs pt-1">
                  <input
                    type="checkbox"
                    checked={cmsDraft.announcementVisible}
                    onChange={(e) =>
                      setCmsDraft({ ...cmsDraft, announcementVisible: e.target.checked })
                    }
                  />
                  Show announcement banner on homepage
                </label>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Company Description</label>
                <textarea
                  rows={2}
                  value={cmsDraft.companyDescription}
                  onChange={(e) =>
                    setCmsDraft({ ...cmsDraft, companyDescription: e.target.value })
                  }
                  className="w-full p-3 rounded-xl border border-black/10 dark:border-white/10 bg-[#f8f9fa] dark:bg-[#181c26] text-sm"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Membership Headline</label>
                  <input
                    type="text"
                    value={cmsDraft.membershipHeadline}
                    onChange={(e) =>
                      setCmsDraft({ ...cmsDraft, membershipHeadline: e.target.value })
                    }
                    className="w-full min-h-[44px] px-3.5 rounded-xl border border-black/10 dark:border-white/10 bg-[#f8f9fa] dark:bg-[#181c26] text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Contact Email</label>
                  <input
                    type="email"
                    value={cmsDraft.footerContactEmail}
                    onChange={(e) =>
                      setCmsDraft({ ...cmsDraft, footerContactEmail: e.target.value })
                    }
                    className="w-full min-h-[44px] px-3.5 rounded-xl border border-black/10 dark:border-white/10 bg-[#f8f9fa] dark:bg-[#181c26] text-sm"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Membership Description</label>
                <textarea
                  rows={2}
                  value={cmsDraft.membershipDescription}
                  onChange={(e) =>
                    setCmsDraft({ ...cmsDraft, membershipDescription: e.target.value })
                  }
                  className="w-full p-3 rounded-xl border border-black/10 dark:border-white/10 bg-[#f8f9fa] dark:bg-[#181c26] text-sm"
                />
              </div>
              <button
                type="submit"
                className="min-h-[44px] px-5 py-2 rounded-xl bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700"
              >
                Save Website Content
              </button>
            </>
          )}
        </form>
      )}

      {/* TAB 4: DATABASE MANAGEMENT & AUDIT LOGS */}
      {activeTab === 'database' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#12151c] p-5">
              <p className="text-xs text-[#4b5563] dark:text-slate-400">Products</p>
              <p className="font-display text-2xl font-bold font-mono-tabular">{products.length}</p>
            </div>
            <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#12151c] p-5">
              <p className="text-xs text-[#4b5563] dark:text-slate-400">Signed-In Users</p>
              <p className="font-display text-2xl font-bold font-mono-tabular">{usersList.length}</p>
            </div>
            <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#12151c] p-5">
              <p className="text-xs text-[#4b5563] dark:text-slate-400">Memberships</p>
              <p className="font-display text-2xl font-bold font-mono-tabular">{memberships.length}</p>
            </div>
            <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#12151c] p-5">
              <p className="text-xs text-[#4b5563] dark:text-slate-400">Audit Entries</p>
              <p className="font-display text-2xl font-bold font-mono-tabular">{auditLogs.length}</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {(
                [
                  { id: 'products', label: 'Catalog Records' },
                  { id: 'memberships', label: 'Memberships' },
                  { id: 'users', label: 'Users & Admins' },
                  { id: 'logs', label: 'Audit Logs' },
                ] as const
              ).map((sec) => (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => setDbSection(sec.id)}
                  className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap ${
                    dbSection === sec.id
                      ? 'bg-[#0b0c10] dark:bg-white text-white dark:text-[#0b0c10]'
                      : 'bg-[#f8f9fa] dark:bg-[#12151c] text-[#4b5563] dark:text-slate-300 border border-black/10 dark:border-white/10'
                  }`}
                >
                  {sec.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={dbSearch}
                onChange={(e) => setDbSearch(e.target.value)}
                placeholder="Filter database records..."
                className="min-h-[40px] px-3 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#12151c] text-xs"
              />
              <button
                type="button"
                onClick={() => {
                  const exportMap = {
                    products,
                    memberships,
                    users: usersList,
                    logs: auditLogs,
                  };
                  exportJsonFile(`astra-vesper-${dbSection}.json`, exportMap[dbSection]);
                }}
                className="min-h-[40px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-black/10 dark:border-white/15 text-xs font-medium whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5" />
                Export JSON
              </button>
            </div>
          </div>

          {dbSection === 'products' && (
            <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#12151c] divide-y divide-black/8 dark:divide-white/10">
              {products
                .filter(
                  (p) =>
                    !dbSearch.trim() ||
                    p.name.toLowerCase().includes(dbSearch.toLowerCase()) ||
                    p.category.toLowerCase().includes(dbSearch.toLowerCase())
                )
                .map((p) => (
                  <div
                    key={p.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <p className="font-semibold text-sm text-[#0b0c10] dark:text-white">
                        {p.name}{' '}
                        <span className="font-mono-tabular font-normal text-[#4b5563] dark:text-slate-400">
                          ({p.id})
                        </span>
                      </p>
                      <p className="text-[#4b5563] dark:text-slate-400">
                        {p.category} · {p.status} · {p.published ? 'Live' : 'Draft'} ·{' '}
                        {p.websiteUrl || 'No external link'}
                      </p>
                    </div>
                    <span className="font-mono-tabular text-[#4b5563] dark:text-slate-400">
                      Updated {new Date(p.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
            </div>
          )}

          {dbSection === 'memberships' && (
            <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#12151c] divide-y divide-black/8 dark:divide-white/10">
              {memberships.length === 0 ? (
                <p className="p-6 text-xs text-[#4b5563] dark:text-slate-400">
                  No membership records stored yet.
                </p>
              ) : (
                memberships
                  .filter(
                    (m) =>
                      !dbSearch.trim() ||
                      m.email.toLowerCase().includes(dbSearch.toLowerCase()) ||
                      m.fullName.toLowerCase().includes(dbSearch.toLowerCase())
                  )
                  .map((m) => (
                    <div
                      key={m.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-0.5">
                        <p className="font-semibold text-sm text-[#0b0c10] dark:text-white">
                          {m.fullName} (@{m.preferredUsername})
                        </p>
                        <p className="text-[#4b5563] dark:text-slate-400">
                          {m.email} · Interests: {m.interests.join(', ')}
                        </p>
                        {m.message && (
                          <p className="text-[#4b5563] dark:text-slate-300 italic">
                            &ldquo;{m.message}&rdquo;
                          </p>
                        )}
                      </div>
                      {isSuperAdmin && (
                        <button
                          type="button"
                          onClick={() => handleDeleteMembership(m)}
                          className="min-h-[36px] inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/10 self-start sm:self-center"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </button>
                      )}
                    </div>
                  ))
              )}
            </div>
          )}

          {dbSection === 'users' && (
            <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#12151c] divide-y divide-black/8 dark:divide-white/10">
              {usersList.length === 0 ? (
                <p className="p-6 text-xs text-[#4b5563] dark:text-slate-400">
                  No user directory records available for this role.
                </p>
              ) : (
                usersList
                  .filter(
                    (u) =>
                      !dbSearch.trim() ||
                      u.email.toLowerCase().includes(dbSearch.toLowerCase()) ||
                      u.displayName.toLowerCase().includes(dbSearch.toLowerCase())
                  )
                  .map((u) => (
                    <div
                      key={u.uid}
                      className="p-4 flex flex-wrap items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <p className="font-semibold text-sm text-[#0b0c10] dark:text-white">
                          {u.displayName} ({u.email})
                        </p>
                        <p className="text-[#4b5563] dark:text-slate-400 font-mono-tabular">
                          UID: {u.uid} · Role: {u.role} · Status: {u.status}
                        </p>
                      </div>
                      <span className="font-mono-tabular text-[#4b5563] dark:text-slate-400">
                        Joined {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : ''}
                      </span>
                    </div>
                  ))
              )}
            </div>
          )}

          {dbSection === 'logs' && (
            <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#12151c] p-6 space-y-3">
              <h2 className="font-display text-base font-bold text-[#0b0c10] dark:text-white">
                Administrative Audit Logs
              </h2>
              {auditLogs.length === 0 ? (
                <p className="text-xs text-[#4b5563] dark:text-slate-400">
                  No audit events recorded yet.
                </p>
              ) : (
                <div className="divide-y divide-black/8 dark:divide-white/10">
                  {auditLogs
                    .filter(
                      (log) =>
                        !dbSearch.trim() ||
                        log.action.toLowerCase().includes(dbSearch.toLowerCase()) ||
                        log.summary.toLowerCase().includes(dbSearch.toLowerCase()) ||
                        log.actorEmail.toLowerCase().includes(dbSearch.toLowerCase())
                    )
                    .map((log) => (
                      <div
                        key={log.id}
                        className="py-2.5 flex flex-wrap justify-between gap-2 text-xs"
                      >
                        <div>
                          <span className="font-semibold text-[#0b0c10] dark:text-white">
                            {log.action}
                          </span>{' '}
                          <span className="text-[#4b5563] dark:text-slate-400">
                            · {log.summary} ({log.actorEmail})
                          </span>
                        </div>
                        <span className="font-mono-tabular text-[#4b5563] dark:text-slate-400">
                          {log.createdAt ? new Date(log.createdAt).toLocaleString() : ''}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: SECURITY, GOOGLE RE-AUTH & ADMIN PASSPHRASE RESET */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          {/* Live Security Status Summary */}
          <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#12151c] p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-600/12 text-violet-700 dark:text-violet-400 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-display text-base font-bold text-[#0b0c10] dark:text-white">
                    Administrator Security Posture
                  </h2>
                  <p className="text-xs text-[#4b5563] dark:text-slate-400">
                    Direct Google Auth is active for opening the console. Sensitive credential resets require a fresh Google re-authentication within 5 minutes.
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={securityBusy}
                onClick={handleVerifyGoogleIdentity}
                className="min-h-[42px] inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#0b0c10] dark:bg-white text-white dark:text-[#0b0c10] text-xs font-semibold shrink-0 disabled:opacity-50"
              >
                <UserCheck className="w-4 h-4" />
                {securityBusy ? 'Verifying...' : 'Verify Google Identity'}
              </button>
            </div>

            {securityError && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-700 dark:text-red-300">
                {securityError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
              <div className="rounded-xl border border-black/8 dark:border-white/10 bg-[#f8f9fa] dark:bg-[#161b24] p-4 space-y-1">
                <p className="text-[11px] text-[#4b5563] dark:text-slate-400">Admin Identity</p>
                <p className="text-xs font-semibold text-[#0b0c10] dark:text-white truncate">
                  {firebaseUser.email}
                </p>
              </div>
              <div className="rounded-xl border border-black/8 dark:border-white/10 bg-[#f8f9fa] dark:bg-[#161b24] p-4 space-y-1">
                <p className="text-[11px] text-[#4b5563] dark:text-slate-400">Passphrase Lock</p>
                <p className="text-xs font-semibold text-[#0b0c10] dark:text-white">
                  {sessionState.hasPassphrase ? 'Configured' : 'Off (Google Auth Only)'}
                </p>
                {sessionState.passphraseUpdatedAt && (
                  <p className="text-[10px] font-mono-tabular text-[#4b5563] dark:text-slate-400">
                    Updated {new Date(sessionState.passphraseUpdatedAt).toLocaleDateString()}
                  </p>
                )}
              </div>
              <div className="rounded-xl border border-black/8 dark:border-white/10 bg-[#f8f9fa] dark:bg-[#161b24] p-4 space-y-1">
                <p className="text-[11px] text-[#4b5563] dark:text-slate-400">Google Re-Auth Window</p>
                <p className="text-xs font-semibold flex items-center gap-1.5 text-[#0b0c10] dark:text-white">
                  {sessionState.reauthFresh ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      Fresh (&lt; 5 min)
                    </>
                  ) : (
                    'Will Prompt on Reset'
                  )}
                </p>
              </div>
              <div className="rounded-xl border border-black/8 dark:border-white/10 bg-[#f8f9fa] dark:bg-[#161b24] p-4 space-y-1">
                <p className="text-[11px] text-[#4b5563] dark:text-slate-400">Last Session Revocation</p>
                <p className="text-xs font-semibold font-mono-tabular text-[#0b0c10] dark:text-white">
                  {sessionState.revokedAt
                    ? new Date(sessionState.revokedAt).toLocaleString()
                    : 'None recorded'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Admin Passphrase Reset Form */}
            <form
              onSubmit={handleResetPassphrase}
              className="lg:col-span-7 rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#12151c] p-6 space-y-4"
            >
              <div className="space-y-1">
                <h3 className="font-display text-base font-bold text-[#0b0c10] dark:text-white">
                  {sessionState.hasPassphrase
                    ? 'Reset Administrator Passphrase'
                    : 'Set Optional Admin Lock Passphrase'}
                </h3>
                <p className="text-xs text-[#4b5563] dark:text-slate-400">
                  Protected with scrypt key derivation and mandatory Google re-authentication before changes apply.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">New Passphrase (8–128 chars)</label>
                  <div className="relative">
                    <input
                      type={showPassphrase ? 'text' : 'password'}
                      required
                      minLength={8}
                      maxLength={128}
                      value={newPassphrase}
                      onChange={(e) => setNewPassphrase(e.target.value)}
                      placeholder="Enter new passphrase"
                      className="w-full min-h-[44px] pl-3.5 pr-10 rounded-xl border border-black/10 dark:border-white/10 bg-[#f8f9fa] dark:bg-[#181c26] text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassphrase((v) => !v)}
                      aria-label={showPassphrase ? 'Hide passphrase' : 'Show passphrase'}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 inline-flex items-center justify-center text-[#4b5563] dark:text-slate-400"
                    >
                      {showPassphrase ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Confirm New Passphrase</label>
                  <input
                    type={showPassphrase ? 'text' : 'password'}
                    required
                    minLength={8}
                    maxLength={128}
                    value={confirmPassphrase}
                    onChange={(e) => setConfirmPassphrase(e.target.value)}
                    placeholder="Confirm new passphrase"
                    className="w-full min-h-[44px] px-3.5 rounded-xl border border-black/10 dark:border-white/10 bg-[#f8f9fa] dark:bg-[#181c26] text-sm"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="submit"
                  disabled={securityBusy}
                  className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700 disabled:opacity-50"
                >
                  <KeyRound className="w-4 h-4" />
                  {securityBusy
                    ? 'Verifying Google & Saving...'
                    : sessionState.hasPassphrase
                    ? 'Reset Admin Passphrase'
                    : 'Set Admin Passphrase'}
                </button>

                {sessionState.hasPassphrase && (
                  <button
                    type="button"
                    disabled={securityBusy}
                    onClick={handleClearPassphrase}
                    className="min-h-[44px] px-4 py-2 rounded-xl border border-black/10 dark:border-white/15 text-xs font-semibold text-[#0b0c10] dark:text-white hover:border-red-500/40 disabled:opacity-50"
                  >
                    Clear Passphrase Lock (Google Auth Only)
                  </button>
                )}
              </div>
            </form>

            {/* Quick Lock & Emergency Session Revocation */}
            <div className="lg:col-span-5 rounded-2xl border border-black/10 dark:border-white/10 bg-[#f8f9fa] dark:bg-[#12151c] p-6 space-y-5">
              <div className="space-y-1">
                <h3 className="font-display text-base font-bold text-[#0b0c10] dark:text-white">
                  Session Lock &amp; Emergency Revocation
                </h3>
                <p className="text-xs text-[#4b5563] dark:text-slate-400">
                  Lock this screen immediately or invalidate all active admin tokens across every device.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  type="button"
                  onClick={handleLockSession}
                  className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-black/10 dark:border-white/15 bg-white dark:bg-[#181c26] text-xs font-semibold text-[#0b0c10] dark:text-white hover:border-violet-500/40"
                >
                  <Lock className="w-4 h-4" />
                  Lock Admin Console Now
                </button>

                {!confirmRevokeAll ? (
                  <button
                    type="button"
                    disabled={securityBusy}
                    onClick={() => setConfirmRevokeAll(true)}
                    className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-red-500/30 bg-red-500/8 text-xs font-semibold text-red-700 dark:text-red-300 hover:bg-red-500/15 disabled:opacity-50"
                  >
                    <LogOut className="w-4 h-4" />
                    Revoke All Sessions &amp; Rotate Signing Secret
                  </button>
                ) : (
                  <div className="rounded-xl border border-red-500/35 bg-red-500/10 p-3.5 space-y-2.5">
                    <p className="text-xs text-red-800 dark:text-red-200 leading-relaxed">
                      This will verify your Google identity, rotate the server signing secret, revoke Firebase refresh tokens, and sign you out.
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={securityBusy}
                        onClick={handleRevokeAllSessions}
                        className="min-h-[38px] px-3.5 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold disabled:opacity-50"
                      >
                        {securityBusy ? 'Revoking...' : 'Confirm Revoke All'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmRevokeAll(false)}
                        className="min-h-[38px] px-3 py-1.5 text-xs text-[#4b5563] dark:text-slate-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: VIORA AI MANAGEMENT */}
      {activeTab === 'ai' && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await saveAiConfig(aiDraft);
            setStatusBanner('Viora AI configuration saved.');
          }}
          className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#12151c] p-6 space-y-4"
        >
          <h2 className="font-display text-lg font-bold text-[#0b0c10] dark:text-white">
            Viora AI Governance
          </h2>
          {!permissions.permManageAi ? (
            <p className="text-sm text-[#4b5563] dark:text-slate-400">
              AI Management permission is required to modify Viora AI configuration.
            </p>
          ) : (
            <>
              <label className="inline-flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={aiDraft.enabled}
                  onChange={(e) => setAiDraft({ ...aiDraft, enabled: e.target.checked })}
                />
                Enable Viora AI Assistant across Astra Vesper
              </label>

              <div className="space-y-1.5">
                <label className="text-xs font-medium">System Instructions</label>
                <textarea
                  rows={4}
                  value={aiDraft.systemInstructions}
                  onChange={(e) =>
                    setAiDraft({ ...aiDraft, systemInstructions: e.target.value })
                  }
                  className="w-full p-3 rounded-xl border border-black/10 dark:border-white/10 bg-[#f8f9fa] dark:bg-[#181c26] text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium">Verified Knowledge Sources</label>
                <textarea
                  rows={4}
                  value={aiDraft.knowledgeNotes}
                  onChange={(e) => setAiDraft({ ...aiDraft, knowledgeNotes: e.target.value })}
                  className="w-full p-3 rounded-xl border border-black/10 dark:border-white/10 bg-[#f8f9fa] dark:bg-[#181c26] text-sm"
                />
              </div>

              <button
                type="submit"
                className="min-h-[44px] px-5 py-2 rounded-xl bg-violet-600 text-white text-xs font-semibold hover:bg-violet-700"
              >
                Save Viora AI Config
              </button>
            </>
          )}
        </form>
      )}

      {/* Test Live Preview Modal from Admin Console */}
      <PreviewModal
        product={testingPreview}
        onClose={() => setTestingPreview(null)}
      />
    </div>
  );
}
