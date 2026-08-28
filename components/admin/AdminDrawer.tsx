'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface AdminDrawerProps {
  isOpen: boolean;
  title: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
}

export function AdminDrawer({
  isOpen,
  title,
  subtitle,
  headerAction,
  onClose,
  children,
}: AdminDrawerProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen || !panelRef.current) return;
    const focusables = panelRef.current.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    first?.focus();

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !focusables.length) return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener('keydown', handleTab);

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);

    return () => {
      document.removeEventListener('keydown', handleTab);
      document.removeEventListener('keydown', handleKey);
    };
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-sm flex justify-end"
        >
          <div className="absolute inset-0 cursor-pointer" onClick={onClose} />

          <motion.div
            ref={panelRef}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="relative w-full max-w-md bg-[#FAF6EE] h-full flex flex-col shadow-2xl z-10 border-l border-[#E6DFD5]"
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-[#E6DFD5] bg-[#FDFBF7] flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-display font-bold text-xl text-[#231913] uppercase tracking-wide leading-tight">
                  {title}
                </h3>
                {subtitle && <p className="text-[11px] text-[#8E7A68]">{subtitle}</p>}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {headerAction}
                <button
                  type="button"
                  onClick={onClose}
                  className="p-1.5 text-[#8E7A68] hover:text-[#3E2F26] transition-colors rounded-full cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
