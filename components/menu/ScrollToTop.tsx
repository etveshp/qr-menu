'use client';

import { motion, AnimatePresence } from 'motion/react';
import { ChevronUp } from 'lucide-react';

interface ScrollToTopProps {
  visible: boolean;
  label: string;
  onClick: () => void;
}

export function ScrollToTop({ visible, label, onClick }: ScrollToTopProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          type="button"
          onClick={onClick}
          initial={{ opacity: 0, y: 16, scale: 0.85 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.85 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          whileHover={{ scale: 1.05, y: -2 }}
          whileTap={{ scale: 0.94 }}
          className="fixed bottom-5 right-4 sm:bottom-6 sm:right-6 z-40 flex items-center gap-1.5 px-3.5 py-2.5 bg-[#3E2F26]/95 hover:bg-[#231913] text-[#FAF6EE] backdrop-blur-md rounded-full shadow-xl border border-[#C09E6D]/50 hover:border-[#C09E6D] transition-all cursor-pointer group select-none active:shadow-md"
          aria-label={label}
        >
          <ChevronUp className="w-4 h-4 text-[#C09E6D] group-hover:text-white transition-colors stroke-[2.5]" />
          <span className="text-xs font-semibold uppercase tracking-wider pr-0.5">
            {label}
          </span>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
