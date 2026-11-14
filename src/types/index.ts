export type ProductCategory =
  | 'Productivity'
  | 'Artificial Intelligence'
  | 'Music & Entertainment'
  | 'Business Management'
  | 'Creative Tools'
  | 'Future Technologies';

export type ProductStatus = 'Available' | 'Beta' | 'In Development' | 'Archived';

export type AdminRole =
  | 'super_admin'
  | 'admin'
  | 'content_manager'
  | 'app_manager'
  | 'viewer';

export type UserRole = 'user' | AdminRole;

export type ThemePreference = 'system' | 'light' | 'dark';

export interface ChangelogEntry {
  version: string;
  date: string;
  notes: string[];
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  category: ProductCategory;
  status: ProductStatus;
  published: boolean;
  featured: boolean;
  version: string;
  platforms: string[];
  websiteUrl?: string;
  previewUrl?: string;
  iconKey?: string;
  heroImageUrl?: string;
  screenshots?: string[];
  availableFeatures: string[];
  plannedFeatures: string[];
  releaseNotes?: string;
  changelog?: ChangelogEntry[];
  downloadUrl?: string;
  ownerUid?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  username?: string;
  avatarUrl?: string;
  bio?: string;
  role: UserRole;
  status: 'active' | 'suspended';
  emailVerified: boolean;
  membershipStatus: 'none' | 'member' | 'early_access';
  themePreference: ThemePreference;
  language: string;
  notificationsEnabled: boolean;
  privacyAnalyticsOptOut: boolean;
  privacyProfileVisible: boolean;
  adminSetupCompleted?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminPermissions {
  permEditApps: boolean;
  permAddApps: boolean;
  permDeleteApps: boolean;
  permUploadMedia: boolean;
  permManageUsers: boolean;
  permViewAnalytics: boolean;
  permManageContent: boolean;
  permManageAi: boolean;
}

export interface AdminRecord extends AdminPermissions {
  uid: string;
  email: string;
  role: AdminRole;
  assignedBy?: string;
  passphraseConfigured?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserActivityItem {
  id: string;
  userId: string;
  action: string;
  targetName: string;
  category: 'launch' | 'download' | 'account' | 'membership' | 'security';
  createdAt: string;
}

export interface UserDownloadItem {
  id: string;
  userId: string;
  productId: string;
  productName: string;
  version: string;
  platform: string;
  downloadUrl: string;
  createdAt: string;
}

export interface ConnectedAppItem {
  id: string;
  userId: string;
  productId: string;
  productName: string;
  status: 'connected' | 'revoked';
  connectedAt: string;
  updatedAt: string;
}

export interface MembershipRecord {
  id: string;
  email: string;
  fullName: string;
  preferredUsername: string;
  interests: string[];
  message?: string;
  consentAccepted: boolean;
  userId?: string;
  createdAt: string;
}

export interface SiteContentConfig {
  heroHeadline: string;
  heroDescription: string;
  announcementBanner: string;
  announcementVisible: boolean;
  companyDescription: string;
  membershipHeadline: string;
  membershipDescription: string;
  footerContactEmail: string;
  updatedBy?: string;
  updatedAt: string;
}

export interface AiConfig {
  enabled: boolean;
  systemInstructions: string;
  knowledgeNotes: string;
  totalQueries: number;
  updatedBy?: string;
  updatedAt: string;
}

export interface AuditLogItem {
  id: string;
  actorUid: string;
  actorEmail: string;
  action: string;
  targetType: string;
  targetId?: string;
  summary: string;
  createdAt: string;
}

export interface ServiceItem {
  id: string;
  number: string;
  title: string;
  summary: string;
  capabilities: string[];
  status: 'Active' | 'In Rollout';
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export interface PredevelopedPreviewOption {
  id: string;
  label: string;
  category: ProductCategory;
  imageUrl: string;
  styleNote: string;
}

export interface SolisVexenSlide {
  id: string;
  code: string;
  title: string;
  subtitle: string;
  materialNote: string;
  developmentNote: string;
  imageUrl: string;
}

