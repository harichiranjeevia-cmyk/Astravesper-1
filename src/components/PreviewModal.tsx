import { useEffect } from 'react';
import { AnimatePresence, motion, PanInfo, useDragControls } from 'motion/react';
import { X } from 'lucide-react';
import { Product } from '../types';
import { LivePreviewFrame } from './LivePreviewFrame';

export function PreviewModal({
  product,
  onClose,
  onVisit,
}: {
  product: Product | null;
  onClose: () => void;
  onVisit?: (product: Product) => void;
}) {
  const dragControls = useDragControls();

  useEffect(() => {
    if (!product) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [product, onClose]);

  const handleDragEnd = (
    _: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    if (info.offset.y > 90 || info.velocity.y > 420) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {product && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={`${product.name} preview`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px] flex items-end sm:items-center justify-center sm:p-6"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 48, opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            drag="y"
            dragControls={dragControls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.04, bottom: 0.35 }}
            onDragEnd={handleDragEnd}
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-5xl max-h-[92dvh] flex flex-col rounded-t-3xl sm:rounded-3xl bg-white dark:bg-[#12151c] border border-black/10 dark:border-white/15 overflow-hidden shadow-2xl will-change-transform"
          >
            {/* Mobile Drag Handle */}
            <div
              onPointerDown={(e) => dragControls.start(e)}
              className="sm:hidden pt-3 pb-1.5 flex justify-center touch-none cursor-grab active:cursor-grabbing"
            >
              <div className="w-10 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
            </div>

            <div
              onPointerDown={(e) => {
                if (window.innerWidth < 640 && !(e.target as HTMLElement).closest('button')) {
                  dragControls.start(e);
                }
              }}
              className="flex items-center justify-between px-4 py-2.5 sm:py-3 border-b border-black/8 dark:border-white/10"
            >
              <p className="font-display text-sm font-semibold text-[#0b0c10] dark:text-white truncate">
                {product.name} · Live Application Preview
              </p>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close preview"
                className="min-h-[40px] min-w-[40px] inline-flex items-center justify-center rounded-xl text-[#4b5563] dark:text-slate-300 hover:bg-black/5 dark:hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-2.5 sm:p-4 overflow-y-auto">
              <LivePreviewFrame
                product={product}
                onVisit={() => onVisit?.(product)}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
