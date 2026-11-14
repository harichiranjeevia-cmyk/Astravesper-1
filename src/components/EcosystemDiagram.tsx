import { Link } from 'react-router-dom';
import { ArrowDown, Layers, Music2, Sparkles, Workflow } from 'lucide-react';

export function EcosystemDiagram() {
  return (
    <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-[#f8f9fa] dark:bg-[#12151c] p-6 sm:p-10 space-y-6">
      {/* Tier 1: Parent Ecosystem */}
      <div className="max-w-xl mx-auto rounded-2xl border border-violet-600/30 bg-white dark:bg-[#171b24] p-5 text-center space-y-1.5">
        <p className="text-xs font-medium text-violet-700 dark:text-violet-400">
          Primary Parent Brand &amp; Platform
        </p>
        <h3 className="font-display text-xl font-bold text-[#0b0c10] dark:text-white">
          ASTRA VESPER
        </h3>
        <p className="text-xs text-[#4b5563] dark:text-slate-400">
          Owns, presents, manages, and distributes all ecosystem applications, accounts, and digital services.
        </p>
      </div>

      <div className="flex justify-center">
        <ArrowDown className="w-5 h-5 text-[#4b5563] dark:text-slate-400" />
      </div>

      {/* Tier 2: Product Studio */}
      <div className="max-w-xl mx-auto rounded-2xl border border-blue-600/30 bg-white dark:bg-[#171b24] p-5 text-center space-y-1.5">
        <div className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 dark:text-blue-400">
          <Layers className="w-3.5 h-3.5" />
          <span>Product &amp; Software Studio</span>
        </div>
        <h4 className="font-display text-lg font-bold text-[#0b0c10] dark:text-white">
          VIORATUNDRA
        </h4>
        <p className="text-xs text-[#4b5563] dark:text-slate-400">
          Develops and operates digital applications, productivity workspaces, and user services within Astra Vesper.
        </p>
      </div>

      <div className="flex justify-center">
        <ArrowDown className="w-5 h-5 text-[#4b5563] dark:text-slate-400" />
      </div>

      {/* Tier 3: Featured Products & Intelligence */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/products/viora-music"
          className="rounded-2xl border border-black/8 dark:border-white/10 bg-white dark:bg-[#171b24] p-5 space-y-2 hover:border-violet-500/40 transition-colors"
        >
          <div className="w-9 h-9 rounded-xl bg-violet-600/10 text-violet-700 dark:text-violet-400 flex items-center justify-center">
            <Music2 className="w-4 h-4" />
          </div>
          <h5 className="font-display text-base font-semibold text-[#0b0c10] dark:text-white">
            Viora+ Music
          </h5>
          <p className="text-xs text-[#4b5563] dark:text-slate-400 leading-relaxed">
            Smart music discovery, synced lyrics, and AI Radio desktop streaming experience.
          </p>
        </Link>

        <Link
          to="/products/vioraflow"
          className="rounded-2xl border border-black/8 dark:border-white/10 bg-white dark:bg-[#171b24] p-5 space-y-2 hover:border-blue-500/40 transition-colors"
        >
          <div className="w-9 h-9 rounded-xl bg-blue-600/10 text-blue-700 dark:text-blue-400 flex items-center justify-center">
            <Workflow className="w-4 h-4" />
          </div>
          <h5 className="font-display text-base font-semibold text-[#0b0c10] dark:text-white">
            VioraFlow
          </h5>
          <p className="text-xs text-[#4b5563] dark:text-slate-400 leading-relaxed">
            Streamlined business management and organized digital workflow platform.
          </p>
        </Link>

        <div className="rounded-2xl border border-black/8 dark:border-white/10 bg-white dark:bg-[#171b24] p-5 space-y-2">
          <div className="w-9 h-9 rounded-xl bg-violet-600/10 text-violet-700 dark:text-violet-400 flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <h5 className="font-display text-base font-semibold text-[#0b0c10] dark:text-white">
            Viora AI
          </h5>
          <p className="text-xs text-[#4b5563] dark:text-slate-400 leading-relaxed">
            Gemini-powered conversational assistant integrated across the entire Astra Vesper platform.
          </p>
        </div>
      </div>
    </div>
  );
}
