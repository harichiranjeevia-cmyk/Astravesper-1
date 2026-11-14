import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useCatalog } from '../context/CatalogContext';
import { GENERATED_ASSETS } from '../data/catalog';
import { EcosystemDiagram } from '../components/EcosystemDiagram';

export default function AboutPage() {
  const { siteContent } = useCatalog();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* Intro Split */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
        <div className="lg:col-span-7 flex flex-col justify-center space-y-5">
          <p className="text-xs font-semibold tracking-[0.16em] text-violet-700 dark:text-violet-400">
            ABOUT ASTRA VESPER
          </p>
          <h1
            className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-[#0b0c10] dark:text-white leading-tight"
            style={{ textWrap: 'balance' }}
          >
            An Independent Digital Ecosystem Built for Clarity and Longevity.
          </h1>
          <p className="text-base text-[#4b5563] dark:text-slate-300 leading-relaxed">
            {siteContent.companyDescription}
          </p>
          <div className="space-y-3 text-sm text-[#4b5563] dark:text-slate-300 leading-relaxed border-t border-black/8 dark:border-white/10 pt-5">
            <p>
              <strong className="text-[#0b0c10] dark:text-white">ASTRA VESPER</strong> is the primary parent brand and central digital ecosystem that presents, governs, and distributes products and services.
            </p>
            <p>
              <strong className="text-[#0b0c10] dark:text-white">VIORATUNDRA</strong> develops and operates digital applications within Astra Vesper, including Viora+ Music and VioraFlow.
            </p>
            <p>
              <strong className="text-[#0b0c10] dark:text-white">VIORA AI</strong> is the Gemini-powered intelligent assistant woven seamlessly throughout the platform to help visitors explore verified capabilities.
            </p>
          </div>
          <div className="pt-2">
            <Link
              to="/products"
              className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-semibold hover:bg-violet-700 transition-colors"
            >
              Explore Vioratundra Products
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        <div className="lg:col-span-5 flex">
          <div className="w-full min-h-[260px] lg:h-full rounded-3xl overflow-hidden border border-black/10 dark:border-white/10 bg-[#12151c]">
            <img
              src={GENERATED_ASSETS.ecosystemRings}
              alt="Interlocking titanium and frosted glass rings representing Astra Vesper and Vioratundra"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* Ecosystem Visual Diagram */}
      <section id="ecosystem" className="space-y-6">
        <div className="space-y-2">
          <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">
            Ecosystem Architecture
          </p>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#0b0c10] dark:text-white">
            Brand &amp; Product Hierarchy
          </h2>
        </div>

        <EcosystemDiagram />
      </section>

      {/* Credits */}
      <section className="pt-8 border-t border-black/8 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#4b5563] dark:text-slate-400">
        <p>Parent Ecosystem: Astra Vesper · Applications &amp; Services: Vioratundra</p>
        <div className="flex flex-wrap items-center gap-3">
          <span>Crafted by Hari Chiranjeevi</span>
          <span aria-hidden="true">·</span>
          <span>Crafted by Tundra Viora</span>
        </div>
      </section>
    </div>
  );
}
