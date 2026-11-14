import {
  AiConfig,
  FaqItem,
  PredevelopedPreviewOption,
  Product,
  ProductCategory,
  ServiceItem,
  SiteContentConfig,
  SolisVexenSlide,
} from '../types';

import heroStarfieldImg from '../assets/images/astra_hero_starfield_1794583672272.jpg';
import vioraMusicImg from '../assets/images/viora_music_showcase_1794583672576.jpg';
import vioraFlowImg from '../assets/images/vioraflow_workspace_1794583672976.jpg';
import ecosystemRingsImg from '../assets/images/vioratundra_ecosystem_visual_1794583673277.jpg';
import previewAiStudioImg from '../assets/images/preview_ai_studio_1794585991570.jpg';
import previewCreativeStudioImg from '../assets/images/preview_creative_studio_1794585991901.jpg';
import previewFutureTechImg from '../assets/images/preview_future_tech_1794585992245.jpg';
import solisChrono01Img from '../assets/images/solis_vexen_dial_01_1794617136213.jpg';
import solisChrono02Img from '../assets/images/solis_vexen_dial_02_1794617136364.jpg';
import solisChrono03Img from '../assets/images/solis_vexen_dial_03_1794617137212.jpg';
import solisChrono04Img from '../assets/images/solis_vexen_dial_04_1794617136591.jpg';

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  'Productivity',
  'Artificial Intelligence',
  'Music & Entertainment',
  'Business Management',
  'Creative Tools',
  'Future Technologies',
];

export const GENERATED_ASSETS = {
  heroStarfield: heroStarfieldImg,
  vioraMusic: vioraMusicImg,
  vioraFlow: vioraFlowImg,
  ecosystemRings: ecosystemRingsImg,
  previewAiStudio: previewAiStudioImg,
  previewCreativeStudio: previewCreativeStudioImg,
  previewFutureTech: previewFutureTechImg,
  solisChrono01: solisChrono01Img,
  solisChrono02: solisChrono02Img,
  solisChrono03: solisChrono03Img,
  solisChrono04: solisChrono04Img,
};

const LEGACY_ASSET_MAP: Record<string, string> = {
  '/src/assets/images/astra_hero_starfield_1794583672272.jpg': heroStarfieldImg,
  '/src/assets/images/viora_music_showcase_1794583672576.jpg': vioraMusicImg,
  '/src/assets/images/vioraflow_workspace_1794583672976.jpg': vioraFlowImg,
  '/src/assets/images/vioratundra_ecosystem_visual_1794583673277.jpg': ecosystemRingsImg,
  '/src/assets/images/preview_ai_studio_1794585991570.jpg': previewAiStudioImg,
  '/src/assets/images/preview_creative_studio_1794585991901.jpg': previewCreativeStudioImg,
  '/src/assets/images/preview_future_tech_1794585992245.jpg': previewFutureTechImg,
  '/src/assets/images/solis_vexen_chrono_01_1794585990624.jpg': solisChrono01Img,
  '/src/assets/images/solis_vexen_chrono_02_1794585990481.jpg': solisChrono02Img,
  '/src/assets/images/solis_vexen_chrono_03_1794585990659.jpg': solisChrono03Img,
  '/src/assets/images/solis_vexen_chrono_04_1794585991083.jpg': solisChrono04Img,
  '/src/assets/images/solis_vexen_dial_01_1794617136213.jpg': solisChrono01Img,
  '/src/assets/images/solis_vexen_dial_02_1794617136364.jpg': solisChrono02Img,
  '/src/assets/images/solis_vexen_dial_03_1794617137212.jpg': solisChrono03Img,
  '/src/assets/images/solis_vexen_dial_04_1794617136591.jpg': solisChrono04Img,
};

export function resolveAssetUrl(url?: string): string {
  if (!url) return '';
  return LEGACY_ASSET_MAP[url] || url;
}

export const PREDEVELOPED_PREVIEWS: PredevelopedPreviewOption[] = [
  {
    id: 'preview-productivity',
    label: 'Modular Workspace Canvas',
    category: 'Productivity',
    imageUrl: vioraFlowImg,
    styleNote: 'Architectural slate & soft silver workspace frame',
  },
  {
    id: 'preview-ai',
    label: 'Neural Intelligence Studio',
    category: 'Artificial Intelligence',
    imageUrl: previewAiStudioImg,
    styleNote: 'Minimalist obsidian & electric violet AI display',
  },
  {
    id: 'preview-music',
    label: 'Acoustics & Audio Console',
    category: 'Music & Entertainment',
    imageUrl: vioraMusicImg,
    styleNote: 'Studio acoustic wave & monochrome media deck',
  },
  {
    id: 'preview-business',
    label: 'Executive Operations Grid',
    category: 'Business Management',
    imageUrl: vioraFlowImg,
    styleNote: 'Clean structured corporate operations surface',
  },
  {
    id: 'preview-creative',
    label: 'Precision Creative Canvas',
    category: 'Creative Tools',
    imageUrl: previewCreativeStudioImg,
    styleNote: 'Brushed aluminum creative studio hardware view',
  },
  {
    id: 'preview-future',
    label: 'Next-Gen Spatial Hardware',
    category: 'Future Technologies',
    imageUrl: previewFutureTechImg,
    styleNote: 'Titanium & silver monolithic future tech study',
  },
];

export function getAutoPreviewForCategory(category: ProductCategory): PredevelopedPreviewOption {
  return (
    PREDEVELOPED_PREVIEWS.find((item) => item.category === category) ||
    PREDEVELOPED_PREVIEWS[0]
  );
}

export const SOLIS_VEXEN_DATA: {
  name: string;
  entityLabel: string;
  stageLabel: string;
  websiteUrl: string;
  headline: string;
  description: string;
  disclaimer: string;
  highlights: string[];
  slides: SolisVexenSlide[];
} = {
  name: 'Solis Vexen',
  entityLabel: 'Separate Watch Brand Entity',
  stageLabel: 'Under Progress & Development Stage',
  websiteUrl: 'https://solisvexen.vercel.app/',
  headline: 'Precision Horology in Active Development.',
  description:
    'Solis Vexen is an independent watch brand entity showcased alongside Astra Vesper. Built around minimalist brushed silver chronometer engineering, Solis Vexen is currently under progress and development stage as its initial timepiece studies, dial architecture, and digital storefront evolve.',
  disclaimer:
    'Solis Vexen operates as a separate horology brand entity from Vioratundra software applications. Specifications and previews shown below represent active development prototypes.',
  highlights: [
    'Minimalist 316L brushed stainless steel & satin silver chronometer dial language',
    'Circular radial index geometry with sapphire-crystal optical clarity studies',
    'Independent digital showcase hosted at solisvexen.vercel.app',
  ],
  slides: [
    {
      id: 'sv-01',
      code: 'SV-01',
      title: 'Brushed Silver Monolith Dial',
      subtitle: 'Primary Three-Hand Chronometer Study',
      materialNote: 'Vertical satin-brushed steel bezel · Matte obsidian chapter ring',
      developmentNote: 'Prototype Phase · Dial balance & typography calibration under progress',
      imageUrl: solisChrono01Img,
    },
    {
      id: 'sv-02',
      code: 'SV-02',
      title: 'Architectural Bezel & Crown Profile',
      subtitle: 'Chamfered Case & Knurled Crown Geometry',
      materialNote: '9.2mm slim brushed stainless case · Anti-reflective domed sapphire',
      developmentNote: 'CAD & Ergonomics Review · Case curvature refinement in progress',
      imageUrl: solisChrono02Img,
    },
    {
      id: 'sv-03',
      code: 'SV-03',
      title: 'Concentric Sub-Dial Chronometer',
      subtitle: 'Precision Telemetry & Sector Dial Layout',
      materialNote: 'Sunburst silver sub-registers · Polished rhodium baton hands',
      developmentNote: 'Movement & Dial Testing · Sub-dial legibility validation ongoing',
      imageUrl: solisChrono03Img,
    },
    {
      id: 'sv-04',
      code: 'SV-04',
      title: 'Integrated Satin Steel Bracelet',
      subtitle: 'Full Wrist Architecture & Clasp Assembly',
      materialNote: 'Micro-brushed tapered links · Hidden butterfly deployant profile',
      developmentNote: 'Industrial Tooling Stage · Bracelet articulation prototype active',
      imageUrl: solisChrono04Img,
    },
  ],
};

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'viora-music',
    slug: 'viora-music',
    name: 'Viora+ Music',
    tagline: 'Intelligent music discovery and desktop streaming powered by AI Radio.',
    description:
      'Experience music in a smarter way with Viora+ Music. Discover music, enjoy immersive playback, explore personalized recommendations, and experience intelligent music discovery.',
    category: 'Music & Entertainment',
    status: 'Available',
    published: true,
    featured: true,
    version: '1.4.0',
    platforms: ['Windows Desktop', 'Web Portal'],
    websiteUrl: 'https://vioramusic.vercel.app/',
    previewUrl: 'https://vioramusic.vercel.app/',
    iconKey: 'music',
    heroImageUrl: vioraMusicImg,
    screenshots: [vioraMusicImg],
    availableFeatures: [
      'Music discovery & on-demand catalog streaming',
      'Interactive desktop music player with local library',
      'Personalized listening history, liked songs & playlists',
      'Synced real-time word-by-word lyrics display',
      'Smart AI Radio autoplay when queues finish',
      'Offline track caching and customizable dark themes',
    ],
    plannedFeatures: [
      'Cross-device Vioratundra library synchronization',
      'Native Android mobile companion experience',
    ],
    releaseNotes:
      'Current release focuses on responsive desktop playback, real-time synced lyrics, and intelligent AI Radio queue continuation without subscription paywalls.',
    changelog: [
      {
        version: '1.4.0',
        date: '2026-09-18',
        notes: [
          'Improved AI Radio queue continuation for similar tracks.',
          'Refined real-time synced lyrics timing and dark theme contrast.',
          'Enhanced local playlist and liked tracks caching.',
        ],
      },
      {
        version: '1.2.0',
        date: '2026-06-10',
        notes: [
          'Introduced offline track caching and audio output device switching.',
          'Added personalized local listening history.',
        ],
      },
    ],
    downloadUrl: '',
    createdAt: '2026-06-10T00:00:00.000Z',
    updatedAt: '2026-09-18T00:00:00.000Z',
  },
  {
    id: 'vioraflow',
    slug: 'vioraflow',
    name: 'VioraFlow',
    tagline: 'Structured business operations and workflow coordination workspace.',
    description:
      'VioraFlow is an intelligent business management platform designed to simplify workflows, organize business operations, and provide a streamlined management experience.',
    category: 'Business Management',
    status: 'Beta',
    published: true,
    featured: true,
    version: '0.9.2',
    platforms: ['Web Application'],
    websiteUrl: 'https://vioraflow.vercel.app/',
    previewUrl: 'https://vioraflow.vercel.app/',
    iconKey: 'workflow',
    heroImageUrl: vioraFlowImg,
    screenshots: [vioraFlowImg],
    availableFeatures: [
      'Business management dashboard interface',
      'Workflow organization and task structuring',
      'Core productivity tools for daily coordination',
      'Streamlined business operations view',
      'Organized digital workspace layout',
    ],
    plannedFeatures: [
      'Unified Vioratundra account single sign-on',
      'Automated cross-team notifications and approvals',
      'Mobile companion workflow monitor',
    ],
    releaseNotes:
      'VioraFlow is actively evolving in public web preview. Core workspace organization is accessible online, while unified ecosystem authentication is scheduled on the roadmap.',
    changelog: [
      {
        version: '0.9.2',
        date: '2026-10-02',
        notes: [
          'Streamlined operations dashboard navigation and workspace modularity.',
          'Refined responsive layout for tablet and desktop viewports.',
        ],
      },
    ],
    downloadUrl: '',
    createdAt: '2026-08-14T00:00:00.000Z',
    updatedAt: '2026-10-02T00:00:00.000Z',
  },
];

export const DEFAULT_SITE_CONTENT: SiteContentConfig = {
  heroHeadline: 'Explore Beyond. Experience Innovation.',
  heroDescription:
    'One ecosystem. Endless possibilities. Discover powerful applications, intelligent services, and next-generation digital experiences developed by Vioratundra.',
  announcementBanner:
    'Astra Vesper Ecosystem 2026 — Explore Viora+ Music, VioraFlow, Solis Vexen in development, and our Gemini-powered Viora AI assistant.',
  announcementVisible: false,
  companyDescription:
    'An independent technology ecosystem focused on building innovative digital products, intelligent applications, and next-generation experiences.',
  membershipHeadline: 'Become Part of Something Greater.',
  membershipDescription:
    'Join the Astra Vesper ecosystem and stay connected with the latest innovations, products, updates, and exclusive experiences.',
  footerContactEmail: 'contact@astravesper.org',
  updatedAt: '2026-11-01T00:00:00.000Z',
};

export const DEFAULT_AI_CONFIG: AiConfig = {
  enabled: true,
  systemInstructions:
    'Assist visitors in discovering Astra Vesper, Vioratundra applications, brand privacy, safety standards, terms of service, and the Solis Vexen horology preview accurately and concisely. Never claim features or downloads exist unless listed in the verified catalog, and never expose private user data or internal secrets.',
  knowledgeNotes:
    'Astra Vesper is the parent brand and central application store. Vioratundra develops software applications within Astra Vesper including Viora+ Music and VioraFlow. Solis Vexen (https://solisvexen.vercel.app/) is a separate watch brand entity currently under progress and development stage featuring a minimalist brushed silver chronometer aesthetic. Browsing stays open without mandatory sign-in; accounts use verified Google Sign-In via Firebase Auth with strict Firestore isolation, one-click connected app control, JSON export, permanent deletion, and non-PII background continuity tokens. Viora AI runs server-side on Gemini without sending personal user PII into prompts.',
  totalQueries: 0,
  updatedAt: '2026-11-13T00:00:00.000Z',
};

export const ECOSYSTEM_SERVICES: ServiceItem[] = [
  {
    id: 'vioratundra-account-identity',
    number: '01',
    title: 'Vioratundra Unified Identity',
    summary:
      'Single Google-verified identity layer connecting profile preferences, privacy controls, and ecosystem membership.',
    capabilities: [
      'Verified Google Sign-In session management',
      'Granular privacy & analytics opt-out controls',
      'Self-service JSON data export and account deletion',
    ],
    status: 'Active',
  },
  {
    id: 'app-distribution-preview',
    number: '02',
    title: 'Application Discovery & Live Preview',
    summary:
      'Interactive showcase allowing users to inspect Vioratundra software across desktop and mobile viewports before launching.',
    capabilities: [
      'Responsive Desktop, Mobile, and Fullscreen preview frames',
      'Automatic frame-policy detection with direct launch fallback',
      'Automated studio visual previews and verified build distribution',
    ],
    status: 'Active',
  },
  {
    id: 'viora-ai-intelligence',
    number: '03',
    title: 'Viora AI Guided Assistance',
    summary:
      'Context-aware conversational intelligence powered by Gemini to help visitors explore verified product capabilities and ecosystem updates.',
    capabilities: [
      'Grounded strictly in live Astra Vesper catalog records & Solis Vexen updates',
      'Streaming responses with direct in-app navigation links',
      'Administrator-managed instructions and availability controls',
    ],
    status: 'Active',
  },
  {
    id: 'early-access-program',
    number: '04',
    title: 'Astra Vesper Membership & Early Access',
    summary:
      'Community channel connecting early adopters with upcoming Vioratundra releases, beta previews, and release notes.',
    capabilities: [
      'Interest-tailored product launch notifications',
      'Early beta feedback channels for upcoming builds',
      'Member profile badge synced to your Vioratundra account',
    ],
    status: 'In Rollout',
  },
];

export const ECOSYSTEM_FAQS: FaqItem[] = [
  {
    id: 'faq-relationship',
    category: 'Ecosystem',
    question: 'What is the relationship between Astra Vesper and Vioratundra?',
    answer:
      'Astra Vesper is the primary parent brand, corporate platform, and central digital application store. Vioratundra is the product development studio inside Astra Vesper that builds and operates applications such as Viora+ Music and VioraFlow.',
  },
  {
    id: 'faq-solis-vexen',
    category: 'Solis Vexen',
    question: 'What is Solis Vexen and why does it have its own tab?',
    answer:
      'Solis Vexen is a separate watch brand entity currently under progress and development stage, showcasing a minimalist brushed silver chronometer aesthetic. It maintains its own dedicated tab and external showcase at solisvexen.vercel.app.',
  },
  {
    id: 'faq-downloads',
    category: 'Applications',
    question: 'Why do some applications show "Open Application" instead of a Download button?',
    answer:
      'Astra Vesper only displays a Download button when a verified binary or installer package is hosted for direct download. Web-first experiences or applications distributed through dedicated release portals link directly to their official application URLs.',
  },
  {
    id: 'faq-viora-ai',
    category: 'Viora AI',
    question: 'How does Viora AI work and how is my data handled?',
    answer:
      'Viora AI runs through a secure server-side Gemini integration. Conversations are grounded in the verified Astra Vesper product catalog and never expose private account credentials or API keys to your browser.',
  },
  {
    id: 'faq-safety-privacy',
    category: 'Safety & Privacy',
    question: 'How does Astra Vesper protect my Google account and personal data?',
    answer:
      'All sign-ins use verified Firebase Google Authentication, PII is isolated by strict Firestore security rules, and embedded live previews run inside sandboxed HTTPS checks. You can export or delete your data anytime from Account > Privacy & Security.',
  },
  {
    id: 'faq-preview-fallback',
    category: 'Applications',
    question: 'Why do some live previews show a fallback card instead of an embedded page?',
    answer:
      'Some external web hosts enforce X-Frame-Options or Content-Security-Policy headers that prevent third-party iframe embedding for security. Astra Vesper automatically detects this and provides a clean preview card with an Open Application button.',
  },
];
