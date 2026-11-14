import { Sparkles } from 'lucide-react';
import { useCatalog } from '../context/CatalogContext';
import { MembershipForm } from '../components/MembershipForm';

const BENEFITS = [
  'Unified member profile inside your Vioratundra Account',
  'Priority product announcements and release notes',
  'Early access invitations to upcoming Vioratundra betas',
  'Exclusive ecosystem dispatches and feature previews',
  'Direct community access and launch notifications',
];

export default function MembershipPage() {
  const { siteContent } = useCatalog();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        <div className="lg:col-span-5 space-y-5">
          <p className="text-xs font-semibold text-violet-700 dark:text-violet-400">
            Astra Vesper Membership
          </p>
          <h1
            className="font-display text-3xl sm:text-4xl font-bold text-[#0b0c10] dark:text-white"
            style={{ textWrap: 'balance' }}
          >
            {siteContent.membershipHeadline}
          </h1>
          <p className="text-sm sm:text-base text-[#4b5563] dark:text-slate-300 leading-relaxed">
            {siteContent.membershipDescription}
          </p>

          <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-[#f8f9fa] dark:bg-[#12151c] p-6 space-y-3">
            <h2 className="font-display text-sm font-semibold text-[#0b0c10] dark:text-white">
              Included Member Benefits
            </h2>
            <ul className="space-y-2.5">
              {BENEFITS.map((b) => (
                <li
                  key={b}
                  className="flex items-start gap-2.5 text-sm text-[#4b5563] dark:text-slate-300"
                >
                  <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0 mt-0.5" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="lg:col-span-7">
          <MembershipForm />
        </div>
      </div>
    </div>
  );
}
