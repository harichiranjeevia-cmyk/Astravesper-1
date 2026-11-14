import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  User,
  onAuthStateChanged,
  reauthenticateWithPopup,
  signInWithPopup,
  signOut as firebaseSignOut,
  deleteUser,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  limit,
} from 'firebase/firestore';
import {
  auth,
  db,
  googleAuthProvider,
  handleFirestoreError,
  OperationType,
} from '../lib/firebase';
import { publishEcosystemBroadcast, updateEcosystemState } from '../lib/ecosystem';
import {
  AdminPermissions,
  AdminRecord,
  ConnectedAppItem,
  UserActivityItem,
  UserDownloadItem,
  UserProfile,
} from '../types';

export const OWNER_EMAIL = 'mimoto3939@gmail.com';

interface AuthContextValue {
  firebaseUser: User | null;
  profile: UserProfile | null;
  adminRecord: AdminRecord | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  permissions: AdminPermissions;
  loading: boolean;
  authError: string | null;
  activity: UserActivityItem[];
  downloads: UserDownloadItem[];
  connectedApps: ConnectedAppItem[];
  signInWithGoogle: () => Promise<void>;
  reauthenticateWithGoogle: () => Promise<string>;
  signOut: () => Promise<void>;
  getIdToken: (forceRefresh?: boolean) => Promise<string | null>;
  updateProfileData: (updates: Partial<UserProfile>) => Promise<void>;
  logActivity: (
    action: string,
    targetName: string,
    category: UserActivityItem['category']
  ) => Promise<void>;
  recordDownload: (params: {
    productId: string;
    productName: string;
    version: string;
    platform: string;
    downloadUrl: string;
  }) => Promise<void>;
  toggleConnectedApp: (productId: string, productName: string) => Promise<void>;
  exportAccountData: () => Promise<Record<string, unknown>>;
  deleteAccount: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const DEFAULT_PERMS: AdminPermissions = {
  permEditApps: false,
  permAddApps: false,
  permDeleteApps: false,
  permUploadMedia: false,
  permManageUsers: false,
  permViewAnalytics: false,
  permManageContent: false,
  permManageAi: false,
};

const FULL_PERMS: AdminPermissions = {
  permEditApps: true,
  permAddApps: true,
  permDeleteApps: true,
  permUploadMedia: true,
  permManageUsers: true,
  permViewAnalytics: true,
  permManageContent: true,
  permManageAi: true,
};

function tsToIso(val: unknown): string {
  if (val instanceof Timestamp) return val.toDate().toISOString();
  if (typeof val === 'string') return val;
  return new Date().toISOString();
}

function mapFirebaseAuthError(err: any): string {
  const code = err?.code || '';
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
    return 'Google verification was closed before completion. Click Continue with Google to retry.';
  }
  if (code === 'auth/popup-blocked') {
    return 'Your browser blocked the Google Sign-In popup. Allow popups for this site and click Continue with Google.';
  }
  if (code === 'auth/network-request-failed') {
    return 'Network connection interrupted during Google verification. Check your connection and retry.';
  }
  if (code === 'auth/account-exists-with-different-credential') {
    return 'An account already exists with this verified email. Sign in with the associated Google identity.';
  }
  if (code === 'auth/unauthorized-domain') {
    return 'Google authentication is not yet authorized for this preview hostname. Open from your primary Astra Vesper domain or add the domain in Firebase Auth settings.';
  }
  if (code === 'auth/user-mismatch') {
    return 'Please verify using the same Google account that is currently signed in.';
  }
  return err?.message || 'Google authentication could not be completed. Please retry.';
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [adminRecord, setAdminRecord] = useState<AdminRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const [activity, setActivity] = useState<UserActivityItem[]>([]);
  const [downloads, setDownloads] = useState<UserDownloadItem[]>([]);
  const [connectedApps, setConnectedApps] = useState<ConnectedAppItem[]>([]);

  const loadUserSubcollections = useCallback(async (uid: string) => {
    try {
      const actQ = query(
        collection(db, 'users', uid, 'activity'),
        where('userId', '==', uid),
        orderBy('createdAt', 'desc'),
        limit(30)
      );
      const dlQ = query(
        collection(db, 'users', uid, 'downloads'),
        where('userId', '==', uid),
        orderBy('createdAt', 'desc'),
        limit(30)
      );
      const appQ = query(
        collection(db, 'users', uid, 'connectedApps'),
        where('userId', '==', uid)
      );

      const [actSnap, dlSnap, appSnap] = await Promise.all([
        getDocs(actQ).catch((e) =>
          handleFirestoreError(e, OperationType.LIST, `users/${uid}/activity`)
        ),
        getDocs(dlQ).catch((e) =>
          handleFirestoreError(e, OperationType.LIST, `users/${uid}/downloads`)
        ),
        getDocs(appQ).catch((e) =>
          handleFirestoreError(e, OperationType.LIST, `users/${uid}/connectedApps`)
        ),
      ]);

      setActivity(
        actSnap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            userId: data.userId,
            action: data.action,
            targetName: data.targetName,
            category: data.category,
            createdAt: tsToIso(data.createdAt),
          };
        })
      );

      setDownloads(
        dlSnap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            userId: data.userId,
            productId: data.productId,
            productName: data.productName,
            version: data.version,
            platform: data.platform,
            downloadUrl: data.downloadUrl,
            createdAt: tsToIso(data.createdAt),
          };
        })
      );

      const mappedApps = appSnap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          userId: data.userId,
          productId: data.productId,
          productName: data.productName,
          status: data.status,
          connectedAt: tsToIso(data.connectedAt),
          updatedAt: tsToIso(data.updatedAt),
        } as ConnectedAppItem;
      });
      setConnectedApps(mappedApps);

      const activeIds = mappedApps.filter((a) => a.status === 'connected').map((a) => a.productId);
      updateEcosystemState({ signedIn: true, connectedProductIds: activeIds });
      publishEcosystemBroadcast({ type: 'AUTH_SYNC', signedIn: true, connectedProductIds: activeIds });
    } catch (err) {
      console.error('Failed to load user subcollections:', err);
    }
  }, []);

  const syncUserDocument = useCallback(
    async (user: User) => {
      const userRef = doc(db, 'users', user.uid);
      const adminRef = doc(db, 'admins', user.uid);
      const isBootstrappedOwner =
        Boolean(user.emailVerified) && (user.email || '').toLowerCase() === OWNER_EMAIL;

      const [existingSnap, adminSnap] = await Promise.all([
        getDoc(userRef).catch((e) =>
          handleFirestoreError(e, OperationType.GET, `users/${user.uid}`)
        ),
        getDoc(adminRef).catch(() => null),
      ]);

      let isNewlyCreated = false;

      if (!existingSnap.exists()) {
        isNewlyCreated = true;
        const nowIso = new Date().toISOString();
        const defaultName = (
          user.displayName ||
          user.email?.split('@')[0] ||
          'Vioratundra Member'
        ).slice(0, 100);
        const cleanUsernameRaw = (user.email?.split('@')[0] || 'member')
          .replace(/[^a-zA-Z0-9_.-]/g, '')
          .slice(0, 32);
        const cleanUsername = cleanUsernameRaw.length >= 2 ? cleanUsernameRaw : 'member';
        const avatarUrl = (user.photoURL || '').slice(0, 500);

        const payload = {
          uid: user.uid,
          email: user.email || '',
          displayName: defaultName,
          username: cleanUsername,
          avatarUrl,
          bio: '',
          role: 'user' as const,
          status: 'active' as const,
          emailVerified: Boolean(user.emailVerified),
          membershipStatus: 'none' as const,
          themePreference: 'system' as const,
          language: 'English',
          notificationsEnabled: true,
          privacyAnalyticsOptOut: false,
          privacyProfileVisible: false,
          adminSetupCompleted: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        };

        await setDoc(userRef, payload).catch((e) =>
          handleFirestoreError(e, OperationType.CREATE, `users/${user.uid}`)
        );

        // Hydrate profile immediately in state without a redundant round-trip getDoc
        setProfile({
          uid: user.uid,
          email: payload.email,
          displayName: payload.displayName,
          username: payload.username,
          avatarUrl: payload.avatarUrl,
          bio: '',
          role: isBootstrappedOwner ? 'super_admin' : 'user',
          status: 'active',
          emailVerified: payload.emailVerified,
          membershipStatus: 'none',
          themePreference: 'system',
          language: 'English',
          notificationsEnabled: true,
          privacyAnalyticsOptOut: false,
          privacyProfileVisible: false,
          adminSetupCompleted: false,
          createdAt: nowIso,
          updatedAt: nowIso,
        });

        if (isBootstrappedOwner) {
          void updateDoc(userRef, {
            role: 'super_admin',
            updatedAt: serverTimestamp(),
          }).catch(() => null);
        }
      } else {
        const d = existingSnap.data();
        setProfile({
          uid: d.uid,
          email: d.email,
          displayName: d.displayName,
          username: d.username,
          avatarUrl: d.avatarUrl,
          bio: d.bio,
          role: isBootstrappedOwner ? 'super_admin' : d.role,
          status: d.status,
          emailVerified: d.emailVerified,
          membershipStatus: d.membershipStatus || 'none',
          themePreference: d.themePreference || 'system',
          language: d.language || 'English',
          notificationsEnabled: Boolean(d.notificationsEnabled),
          privacyAnalyticsOptOut: Boolean(d.privacyAnalyticsOptOut),
          privacyProfileVisible: Boolean(d.privacyProfileVisible),
          adminSetupCompleted: Boolean(d.adminSetupCompleted),
          createdAt: tsToIso(d.createdAt),
          updatedAt: tsToIso(d.updatedAt),
        });
      }

      if (adminSnap && adminSnap.exists()) {
        const ad = adminSnap.data();
        setAdminRecord({
          uid: ad.uid,
          email: ad.email,
          role: ad.role,
          permEditApps: Boolean(ad.permEditApps),
          permAddApps: Boolean(ad.permAddApps),
          permDeleteApps: Boolean(ad.permDeleteApps),
          permUploadMedia: Boolean(ad.permUploadMedia),
          permManageUsers: Boolean(ad.permManageUsers),
          permViewAnalytics: Boolean(ad.permViewAnalytics),
          permManageContent: Boolean(ad.permManageContent),
          permManageAi: Boolean(ad.permManageAi),
          assignedBy: ad.assignedBy,
          passphraseConfigured: Boolean(ad.passphraseConfigured),
          createdAt: tsToIso(ad.createdAt),
          updatedAt: tsToIso(ad.updatedAt),
        });
      } else if (isBootstrappedOwner) {
        const nowIso = new Date().toISOString();
        setAdminRecord({
          uid: user.uid,
          email: user.email || OWNER_EMAIL,
          role: 'super_admin',
          ...FULL_PERMS,
          assignedBy: 'system_bootstrap',
          passphraseConfigured: false,
          createdAt: nowIso,
          updatedAt: nowIso,
        });
        void setDoc(adminRef, {
          uid: user.uid,
          email: user.email || OWNER_EMAIL,
          role: 'super_admin',
          ...FULL_PERMS,
          assignedBy: 'system_bootstrap',
          passphraseConfigured: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }).catch(() => null);
      } else {
        setAdminRecord(null);
      }

      updateEcosystemState({ signedIn: true });

      if (isNewlyCreated) {
        setActivity([]);
        setDownloads([]);
        setConnectedApps([]);
      } else {
        // Non-blocking parallel load so account dashboard renders immediately
        void loadUserSubcollections(user.uid);
      }
    },
    [loadUserSubcollections]
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      setAuthError(null);
      setFirebaseUser(user);
      if (user) {
        try {
          await syncUserDocument(user);
        } catch (err: any) {
          setAuthError(err?.message || 'Unable to load account profile.');
        }
      } else {
        setProfile(null);
        setAdminRecord(null);
        setActivity([]);
        setDownloads([]);
        setConnectedApps([]);
        updateEcosystemState({ signedIn: false, connectedProductIds: [] });
        publishEcosystemBroadcast({
          type: 'AUTH_SYNC',
          signedIn: false,
          connectedProductIds: [],
        });
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, [syncUserDocument]);

  const signInWithGoogle = async () => {
    setAuthError(null);
    try {
      googleAuthProvider.setCustomParameters({ prompt: 'select_account' });
      const cred = await signInWithPopup(auth, googleAuthProvider);
      if (cred.user && !cred.user.emailVerified) {
        setAuthError('A Google account with a verified email address is required.');
      }
    } catch (err: any) {
      setAuthError(mapFirebaseAuthError(err));
      throw err;
    }
  };

  const reauthenticateWithGoogle = async (): Promise<string> => {
    setAuthError(null);
    if (!auth.currentUser) {
      throw new Error('Sign in with Google first.');
    }
    try {
      googleAuthProvider.setCustomParameters({ prompt: 'select_account' });
      const cred = await reauthenticateWithPopup(auth.currentUser, googleAuthProvider);
      if (!cred.user.emailVerified) {
        throw new Error('Verified Google email identity is required.');
      }
      return await cred.user.getIdToken(true);
    } catch (err: any) {
      const friendly = mapFirebaseAuthError(err);
      setAuthError(friendly);
      throw new Error(friendly);
    }
  };

  const signOut = async () => {
    setAuthError(null);
    sessionStorage.removeItem('av_admin_session');
    await fetch('/api/admin/lock', { method: 'POST' }).catch(() => null);
    await firebaseSignOut(auth);
  };

  const getIdToken = async (forceRefresh = false) => {
    if (!auth.currentUser) return null;
    return auth.currentUser.getIdToken(forceRefresh);
  };

  const updateProfileData = async (updates: Partial<UserProfile>) => {
    if (!firebaseUser) throw new Error('Not authenticated');
    const userRef = doc(db, 'users', firebaseUser.uid);
    const allowedPayload: Record<string, unknown> = {
      updatedAt: serverTimestamp(),
    };
    const safeKeys: (keyof UserProfile)[] = [
      'displayName',
      'username',
      'avatarUrl',
      'bio',
      'membershipStatus',
      'themePreference',
      'language',
      'notificationsEnabled',
      'privacyAnalyticsOptOut',
      'privacyProfileVisible',
    ];
    for (const k of safeKeys) {
      if (updates[k] !== undefined) {
        allowedPayload[k] = updates[k];
      }
    }

    await updateDoc(userRef, allowedPayload).catch((e) =>
      handleFirestoreError(e, OperationType.UPDATE, `users/${firebaseUser.uid}`)
    );

    setProfile((prev) =>
      prev ? { ...prev, ...updates, updatedAt: new Date().toISOString() } : prev
    );
  };

  const logActivity = async (
    action: string,
    targetName: string,
    category: UserActivityItem['category']
  ) => {
    if (!firebaseUser || profile?.privacyAnalyticsOptOut) return;
    const id = `act_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const actRef = doc(db, 'users', firebaseUser.uid, 'activity', id);
    await setDoc(actRef, {
      userId: firebaseUser.uid,
      action: action.slice(0, 120),
      targetName: targetName.slice(0, 120),
      category,
      createdAt: serverTimestamp(),
    }).catch((e) =>
      handleFirestoreError(e, OperationType.CREATE, `users/${firebaseUser.uid}/activity/${id}`)
    );

    setActivity((prev) => [
      {
        id,
        userId: firebaseUser.uid,
        action,
        targetName,
        category,
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
  };

  const recordDownload = async (params: {
    productId: string;
    productName: string;
    version: string;
    platform: string;
    downloadUrl: string;
  }) => {
    if (!firebaseUser) return;
    const id = `dl_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const dlRef = doc(db, 'users', firebaseUser.uid, 'downloads', id);
    await setDoc(dlRef, {
      userId: firebaseUser.uid,
      productId: params.productId,
      productName: params.productName.slice(0, 120),
      version: params.version.slice(0, 40),
      platform: params.platform.slice(0, 60),
      downloadUrl: params.downloadUrl.slice(0, 500),
      createdAt: serverTimestamp(),
    }).catch((e) =>
      handleFirestoreError(e, OperationType.CREATE, `users/${firebaseUser.uid}/downloads/${id}`)
    );

    setDownloads((prev) => [
      {
        id,
        userId: firebaseUser.uid,
        ...params,
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ]);
    await logActivity('Downloaded build', `${params.productName} v${params.version}`, 'download');
  };

  const toggleConnectedApp = async (productId: string, productName: string) => {
    if (!firebaseUser) throw new Error('Sign in required to connect applications.');
    const existing = connectedApps.find((a) => a.productId === productId);
    const appRef = doc(db, 'users', firebaseUser.uid, 'connectedApps', productId);

    if (!existing) {
      await setDoc(appRef, {
        userId: firebaseUser.uid,
        productId,
        productName: productName.slice(0, 120),
        status: 'connected',
        connectedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }).catch((e) =>
        handleFirestoreError(
          e,
          OperationType.CREATE,
          `users/${firebaseUser.uid}/connectedApps/${productId}`
        )
      );
      const nextApps: ConnectedAppItem[] = [
        ...connectedApps,
        {
          id: productId,
          userId: firebaseUser.uid,
          productId,
          productName,
          status: 'connected',
          connectedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ];
      setConnectedApps(nextApps);
      const activeIds = nextApps.filter((a) => a.status === 'connected').map((a) => a.productId);
      updateEcosystemState({ connectedProductIds: activeIds });
      publishEcosystemBroadcast({ type: 'CONNECTED_APPS_SYNC', connectedProductIds: activeIds });
      void logActivity('Connected application', productName, 'account');
    } else {
      const nextStatus: ConnectedAppItem['status'] =
        existing.status === 'connected' ? 'revoked' : 'connected';
      await updateDoc(appRef, {
        status: nextStatus,
        updatedAt: serverTimestamp(),
      }).catch((e) =>
        handleFirestoreError(
          e,
          OperationType.UPDATE,
          `users/${firebaseUser.uid}/connectedApps/${productId}`
        )
      );
      const nextApps: ConnectedAppItem[] = connectedApps.map((item) =>
        item.productId === productId
          ? { ...item, status: nextStatus, updatedAt: new Date().toISOString() }
          : item
      );
      setConnectedApps(nextApps);
      const activeIds = nextApps.filter((a) => a.status === 'connected').map((a) => a.productId);
      updateEcosystemState({ connectedProductIds: activeIds });
      publishEcosystemBroadcast({ type: 'CONNECTED_APPS_SYNC', connectedProductIds: activeIds });
      void logActivity(
        nextStatus === 'connected' ? 'Reconnected application' : 'Revoked application access',
        productName,
        'security'
      );
    }
  };

  const exportAccountData = async () => {
    if (!firebaseUser || !profile) throw new Error('Sign in required.');
    await logActivity('Requested account data export', 'JSON Archive', 'security');
    return {
      exportedAt: new Date().toISOString(),
      ecosystem: 'Astra Vesper / Vioratundra',
      profile,
      connectedApps,
      downloads,
      activity,
    };
  };

  const deleteAccount = async () => {
    if (!firebaseUser) throw new Error('Sign in required.');
    const uid = firebaseUser.uid;

    await Promise.all([
      ...activity.map((item) =>
        deleteDoc(doc(db, 'users', uid, 'activity', item.id)).catch(() => null)
      ),
      ...downloads.map((item) =>
        deleteDoc(doc(db, 'users', uid, 'downloads', item.id)).catch(() => null)
      ),
      ...connectedApps.map((item) =>
        deleteDoc(doc(db, 'users', uid, 'connectedApps', item.id)).catch(() => null)
      ),
    ]);

    await deleteDoc(doc(db, 'users', uid)).catch((e) =>
      handleFirestoreError(e, OperationType.DELETE, `users/${uid}`)
    );

    try {
      await deleteUser(firebaseUser);
    } catch {
      await signOut();
    }
  };

  const isBootstrappedOwner =
    Boolean(firebaseUser?.emailVerified) &&
    (firebaseUser?.email || '').toLowerCase() === OWNER_EMAIL;

  const isSuperAdmin = isBootstrappedOwner || adminRecord?.role === 'super_admin';
  const isAdmin = isBootstrappedOwner || Boolean(adminRecord);

  const permissions: AdminPermissions =
    isSuperAdmin || adminRecord?.role === 'admin'
      ? FULL_PERMS
      : adminRecord
      ? {
          permEditApps: adminRecord.permEditApps,
          permAddApps: adminRecord.permAddApps,
          permDeleteApps: adminRecord.permDeleteApps,
          permUploadMedia: adminRecord.permUploadMedia,
          permManageUsers: adminRecord.permManageUsers,
          permViewAnalytics: adminRecord.permViewAnalytics,
          permManageContent: adminRecord.permManageContent,
          permManageAi: adminRecord.permManageAi,
        }
      : DEFAULT_PERMS;

  const refreshUserData = async () => {
    if (firebaseUser) {
      await syncUserDocument(firebaseUser);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        firebaseUser,
        profile,
        adminRecord,
        isAdmin,
        isSuperAdmin,
        permissions,
        loading,
        authError,
        activity,
        downloads,
        connectedApps,
        signInWithGoogle,
        reauthenticateWithGoogle,
        signOut,
        getIdToken,
        updateProfileData,
        logActivity,
        recordDownload,
        toggleConnectedApp,
        exportAccountData,
        deleteAccount,
        refreshUserData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
