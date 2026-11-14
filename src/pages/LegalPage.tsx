import { Link, useParams } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { useCatalog } from '../context/CatalogContext';

interface PolicySection {
  heading: string;
  content: string;
}

interface LegalTopicContent {
  title: string;
  subtitle: string;
  updated: string;
  sections: PolicySection[];
}

export default function LegalPage() {
  const { topic } = useParams<{ topic: string }>();
  const { siteContent } = useCatalog();

  const contentMap: Record<string, LegalTopicContent> = {
    safety: {
      title: 'Safety & Security Standards',
      subtitle:
        'How Astra Vesper safeguards identity, background ecosystem continuity, admin controls, and live previews.',
      updated: 'Updated November 2026',
      sections: [
        {
          heading: '1. Optional Open Storefront & Verified Google Auth',
          content:
            'Browsing applications, reading release documentation, and inspecting previews remain open without a mandatory login gate. Whenever you choose to create an account or sign in, Astra Vesper authenticates solely through verified Google Sign-In via Firebase Authentication—storing zero raw passwords.',
        },
        {
          heading: '2. Database Isolation & Direct Admin Verification',
          content:
            'Cloud Firestore enforces strict default-deny security rules. User profiles, activity history, downloads, and connected applications are isolated strictly to their verified owner. Verified administrators open Admin Console directly via Google identity and may enable an optional scrypt-hashed passphrase lock; resetting or clearing admin passphrases and revoking active sessions always requires fresh Google re-authentication (within 5 minutes).',
        },
        {
          heading: '3. Background Ecosystem Continuity Tokens',
          content:
            'When you launch or switch across Vioratundra applications, Astra Vesper uses a lightweight background continuity bridge. Authenticated handoffs generate short-lived HMAC-signed non-PII tokens containing only a one-way user digest, target product ID, and UI theme preference—never exposing raw email addresses or account secrets.',
        },
        {
          heading: '4. Safe Live Application Previews & Viora AI Isolation',
          content:
            'Live previews enforce public HTTPS targets, block private/loopback network ranges, and apply sandboxed iframe rules alongside X-Frame-Options and Content-Security-Policy probes. Viora AI runs server-side on Gemini with per-minute rate limiting and never injects personal account records into public prompts.',
        },
      ],
    },
    privacy: {
      title: 'Privacy Policy',
      subtitle:
        'How Astra Vesper and Vioratundra collect, sync in the background, and let you control your personal data.',
      updated: 'Updated November 2026',
      sections: [
        {
          heading: '1. Information We Collect When Signed In',
          content:
            'If you browse without signing in, only essential local preferences (theme, language, layout density, and local catalog cache for fast loading) are stored in your browser. When you sign in or create an account with Google, Astra Vesper stores your verified email, display name, optional username, avatar URL, bio, and membership status.',
        },
        {
          heading: '2. Background Ecosystem & Connected Application Sync',
          content:
            'Astra Vesper quietly syncs your theme, language, and connected Vioratundra application states across open tabs and authenticated app launches in the background so your experience stays seamless. You can view, connect, or revoke access for any individual application at any time from Account > My Applications.',
        },
        {
          heading: '3. Activity Logging, AI Privacy & Cache Control',
          content:
            'Signed-in members can pause application launch logging with one toggle under Account > Privacy & Security. Viora AI operates on our server endpoint using verified catalog context and instant local lookups without transmitting private user account PII into AI model prompts.',
        },
        {
          heading: '4. Full Data Ownership, Export & Deletion',
          content:
            'You retain full ownership of your data. At any point in your Vioratundra Account Dashboard or Settings, you can export a complete JSON archive of your profile, connected apps, download history, and activity, or permanently delete your account and associated subcollections.',
        },
        {
          heading: '5. Independent Brand Entities',
          content:
            'External showcases linked from Astra Vesper—including Solis Vexen (solisvexen.vercel.app), an independent watch brand in progress—operate on separate HTTPS deployments with their own independent availability timelines.',
        },
      ],
    },
    terms: {
      title: 'Terms of Service',
      subtitle:
        'Guidelines for using the Astra Vesper application store, Vioratundra software, and linked brand showcases.',
      updated: 'Updated November 2026',
      sections: [
        {
          heading: '1. Ecosystem Scope & Brand Distinction',
          content:
            'Astra Vesper is the parent digital ecosystem and application store presenting software developed by Vioratundra (including Viora+ Music and VioraFlow), alongside separate showcased entities such as the Solis Vexen horology development preview.',
        },
        {
          heading: '2. Honest Availability & Direct Portals',
          content:
            'Application badges (Available, Beta, In Development) accurately reflect current release status. Download buttons appear only where verified installer packages exist; web-first products link cleanly to their official HTTPS portals.',
        },
        {
          heading: '3. Account Integrity & Acceptable Use',
          content:
            'Automated scraping, unauthorized privilege escalation attempts, malicious uploads, or abusive traffic against Viora AI and administrative APIs are strictly prohibited and subject to rate limiting or account suspension.',
        },
      ],
    },
    help: {
      title: 'Help Center',
      subtitle: 'Guidance for using Astra Vesper, Vioratundra apps, Solis Vexen previews, and Viora AI.',
      updated: 'Updated November 2026',
      sections: [
        {
          heading: 'Fast & Optional Google Sign-In',
          content:
            'You can explore every product and live preview without signing in. Whenever you are ready to sync connected applications, downloads, or membership status, click Account > Continue with Google.',
        },
        {
          heading: 'Using Viora AI',
          content:
            'Open Viora AI from the top navigation bar or bottom-right button for instant catalog shortcuts or fast streaming answers about Viora+ Music, VioraFlow, Solis Vexen, and ecosystem policies. Click Stop anytime to interrupt a long reply.',
        },
        {
          heading: 'Auto-Sensing Previews & Direct Launch',
          content:
            'Live Preview automatically detects mobile or desktop screen sizes and checks remote frame policies safely. If a target app restricts iframe embedding for security, click Open Application to launch it in a dedicated tab with background ecosystem sync.',
        },
      ],
    },
    contact: {
      title: 'Contact Astra Vesper',
      subtitle: 'Reach the Astra Vesper & Vioratundra team.',
      updated: 'Updated November 2026',
      sections: [
        {
          heading: 'Direct Inquiries',
          content: `For ecosystem inquiries, security disclosures, privacy requests, partnership questions, or application feedback, contact ${siteContent.footerContactEmail}.`,
        },
        {
          heading: 'Community Membership',
          content:
            'Community members can also share interests and stay informed on upcoming releases through the Join Astra Vesper membership portal.',
        },
      ],
    },
  };

  const activeKey = topic && contentMap[topic] ? topic : 'help';
  const docData = contentMap[activeKey];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-8">
      <div className="space-y-3 border-b border-black/8 dark:border-white/10 pb-6">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-semibold text-violet-700 dark:text-violet-400">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            Astra Vesper Policy &amp; Documentation
          </span>
          <span className="font-mono-tabular text-[#4b5563] dark:text-slate-400">
            {docData.updated}
          </span>
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#0b0c10] dark:text-white">
          {docData.title}
        </h1>
        <p className="text-sm text-[#4b5563] dark:text-slate-400">{docData.subtitle}</p>
      </div>

      <div className="space-y-4">
        {docData.sections.map((section) => (
          <section
            key={section.heading}
            className="rounded-2xl border border-black/8 dark:border-white/10 bg-[#f8f9fa] dark:bg-[#12151c] p-5 sm:p-6 space-y-2"
          >
            <h2 className="font-display text-base font-bold text-[#0b0c10] dark:text-white">
              {section.heading}
            </h2>
            <p className="text-sm leading-relaxed text-[#4b5563] dark:text-slate-300">
              {section.content}
            </p>
          </section>
        ))}
      </div>

      <div className="pt-4 border-t border-black/8 dark:border-white/10 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium">
        <Link to="/support/safety" className="min-h-[44px] inline-flex items-center text-violet-700 dark:text-violet-400 hover:underline">
          Safety &amp; Security
        </Link>
        <Link to="/support/privacy" className="min-h-[44px] inline-flex items-center text-violet-700 dark:text-violet-400 hover:underline">
          Privacy Policy
        </Link>
        <Link to="/support/terms" className="min-h-[44px] inline-flex items-center text-violet-700 dark:text-violet-400 hover:underline">
          Terms of Service
        </Link>
        <Link to="/services#faqs" className="min-h-[44px] inline-flex items-center text-violet-700 dark:text-violet-400 hover:underline">
          View FAQs
        </Link>
        <Link to="/account" className="min-h-[44px] inline-flex items-center text-violet-700 dark:text-violet-400 hover:underline">
          Manage Account
        </Link>
        <Link to="/" className="min-h-[44px] inline-flex items-center text-[#4b5563] dark:text-slate-400 hover:underline ml-auto">
          Return Home
        </Link>
      </div>
    </div>
  );
}
