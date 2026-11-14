import { useState } from 'react';
import { ChevronDown, CheckCircle2 } from 'lucide-react';
import { ECOSYSTEM_FAQS, ECOSYSTEM_SERVICES } from '../data/catalog';

export default function ServicesPage() {
  const [openFaqId, setOpenFaqId] = useState<string>(ECOSYSTEM_FAQS[0]?.id || '');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      <section className="space-y-3 max-w-3xl">
        <p className="text-xs font-semibold text-violet-700 dark:text-violet-400">
          Astra Vesper Services
        </p>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-[#0b0c10] dark:text-white">
          Intelligent Digital Services &amp; Ecosystem Capabilities
        </h1>
        <p className="text-sm sm:text-base text-[#4b5563] dark:text-slate-300 leading-relaxed">
          Beyond individual applications, Astra Vesper provides the unified identity, discovery, preview, and AI assistance infrastructure connecting Vioratundra software.
        </p>
      </section>

      {/* Services List */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {ECOSYSTEM_SERVICES.map((svc) => (
          <article
            key={svc.id}
            className="rounded-2xl border border-black/10 dark:border-white/10 bg-[#f8f9fa] dark:bg-[#12151c] p-6 sm:p-8 space-y-4"
          >
            <div className="flex items-center justify-between gap-4">
              <span className="font-mono-tabular text-xs font-semibold text-violet-700 dark:text-violet-400">
                {svc.number}. Service
              </span>
              <span className="text-xs font-medium text-[#4b5563] dark:text-slate-400">
                {svc.status}
              </span>
            </div>
            <h2 className="font-display text-xl font-bold text-[#0b0c10] dark:text-white">
              {svc.title}
            </h2>
            <p className="text-sm text-[#4b5563] dark:text-slate-300 leading-relaxed">
              {svc.summary}
            </p>
            <ul className="space-y-2 pt-2 border-t border-black/8 dark:border-white/10">
              {svc.capabilities.map((cap) => (
                <li
                  key={cap}
                  className="flex items-start gap-2 text-xs sm:text-sm text-[#0b0c10] dark:text-slate-200"
                >
                  <CheckCircle2 className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0 mt-0.5" />
                  <span>{cap}</span>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      {/* FAQs */}
      <section id="faqs" className="space-y-6 max-w-4xl">
        <div className="space-y-1.5">
          <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">
            Support &amp; Documentation
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#0b0c10] dark:text-white">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="divide-y divide-black/10 dark:divide-white/10 rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#12151c]">
          {ECOSYSTEM_FAQS.map((faq) => {
            const isOpen = openFaqId === faq.id;
            return (
              <div key={faq.id} className="p-5 sm:p-6">
                <button
                  type="button"
                  onClick={() => setOpenFaqId(isOpen ? '' : faq.id)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center justify-between gap-4 text-left"
                >
                  <span className="font-display text-base font-semibold text-[#0b0c10] dark:text-white">
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-[#4b5563] dark:text-slate-400 shrink-0 transition-transform duration-200 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <p className="mt-3 text-sm leading-relaxed text-[#4b5563] dark:text-slate-300">
                    {faq.answer}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
