import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

export type ToastVariant = 'success' | 'info' | 'warning' | 'error';

export interface ToastInput {
  variant?: ToastVariant;
  title: string;
  description?: string;
  durationMs?: number;
}

interface ToastItem extends Required<Pick<ToastInput, 'variant' | 'title'>> {
  id: string;
  description?: string;
}

interface ToastContextValue {
  toast: (input: ToastInput) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const VARIANT_META: Record<
  ToastVariant,
  {
    icon: React.ComponentType<{ className?: string }>;
    iconClass: string;
    borderClass: string;
    label: string;
  }
> = {
  success: {
    icon: CheckCircle2,
    iconClass: 'text-emerald-600 dark:text-emerald-400',
    borderClass: 'border-emerald-500/25',
    label: 'Confirmed',
  },
  info: {
    icon: Info,
    iconClass: 'text-violet-600 dark:text-violet-400',
    borderClass: 'border-violet-500/25',
    label: 'Update',
  },
  warning: {
    icon: AlertTriangle,
    iconClass: 'text-amber-600 dark:text-amber-400',
    borderClass: 'border-amber-500/30',
    label: 'Notice',
  },
  error: {
    icon: AlertCircle,
    iconClass: 'text-red-600 dark:text-red-400',
    borderClass: 'border-red-500/30',
    label: 'Error',
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timersRef = useRef<Map<string, number>>(new Map());

  const dismissToast = useCallback((id: string) => {
    const existingTimer = timersRef.current.get(id);
    if (existingTimer) {
      window.clearTimeout(existingTimer);
      timersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    ({ variant = 'info', title, description, durationMs = 3400 }: ToastInput) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const item: ToastItem = { id, variant, title, description };

      setToasts((prev) => {
        const next = [...prev, item];
        if (next.length > 3) {
          const evicted = next.slice(0, next.length - 3);
          for (const old of evicted) {
            const oldTimer = timersRef.current.get(old.id);
            if (oldTimer) {
              window.clearTimeout(oldTimer);
              timersRef.current.delete(old.id);
            }
          }
          return next.slice(-3);
        }
        return next;
      });

      const timer = window.setTimeout(() => {
        dismissToast(id);
      }, Math.max(1500, durationMs));
      timersRef.current.set(id, timer);
    },
    [dismissToast]
  );

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
      timers.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={{ toast, dismissToast }}>
      {children}

      {/* Non-blocking Global Toast Viewport (positioned below sticky header, clear of bottom-right Viora AI button) */}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed top-[64px] sm:top-[74px] right-4 left-4 sm:left-auto sm:w-[360px] z-50 flex flex-col gap-2"
      >
        <AnimatePresence initial={false}>
          {toasts.map((item) => {
            const meta = VARIANT_META[item.variant];
            const Icon = meta.icon;
            return (
              <motion.div
                key={item.id}
                role="status"
                initial={{ opacity: 0, y: -10, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.96 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                className={`pointer-events-auto rounded-2xl border ${meta.borderClass} bg-white/95 dark:bg-[#151922]/95 backdrop-blur-md shadow-lg px-3.5 py-3 flex items-start gap-2.5 will-change-transform`}
              >
                <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${meta.iconClass}`} />
                <div className="min-w-0 flex-1 space-y-0.5">
                  <p className="text-xs font-semibold text-[#0b0c10] dark:text-white leading-snug">
                    {item.title}
                  </p>
                  {item.description && (
                    <p className="text-[11px] text-[#4b5563] dark:text-slate-400 leading-snug">
                      {item.description}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => dismissToast(item.id)}
                  aria-label="Dismiss notification"
                  className="min-h-[28px] min-w-[28px] -mr-1 -mt-0.5 inline-flex items-center justify-center rounded-lg text-[#4b5563] dark:text-slate-400 hover:bg-black/5 dark:hover:bg-white/10 transition-colors shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
