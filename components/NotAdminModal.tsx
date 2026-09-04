'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import { Coffee } from 'lucide-react';

interface NotAdminModalProps {
  isOpen: boolean;
  logo?: string | null;
  title: string;
  text: string;
  okLabel?: string;
  onOk: () => void;
}

export function NotAdminModal({ isOpen, logo, title, text, okLabel = 'ОК', onOk }: NotAdminModalProps) {
  const okRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    okRef.current?.focus();
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOk();
    };
    window.addEventListener('keydown', handleKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onOk]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            className="relative w-full max-w-md bg-[#FDFBF7] rounded-3xl border border-[#C09E6D]/40 shadow-2xl p-7 sm:p-8 text-center overflow-hidden"
            initial={{ scale: 0.85, y: 24, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 12, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          >
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#C09E6D] via-[#E8D5B3] to-[#C09E6D]" />
            {logo ? (
              <div className="relative w-32 h-32 mx-auto mb-2 flex items-center justify-center">
                <Image
                  src={logo}
                  alt="Logo"
                  fill
                  sizes="128px"
                  className="object-contain"
                  unoptimized={logo.startsWith('data:')}
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-[#FAF6EE] border border-[#C09E6D]/50 text-[#C09E6D] flex items-center justify-center mx-auto mb-2 shadow-sm">
                <Coffee className="w-8 h-8" strokeWidth={1.75} />
              </div>
            )}
            <h3 className="font-display font-semibold text-2xl text-[#231913] mb-3 tracking-wide">{title}</h3>
            <p className="text-base text-[#8E7A68] leading-relaxed mb-7">{text}</p>
            <button
              ref={okRef}
              type="button"
              onClick={onOk}
              className="w-full py-3.5 px-6 bg-[#3E2F26] hover:bg-[#231913] text-[#FAF6EE] text-xs font-bold uppercase tracking-widest rounded-full shadow-md transition-all active:scale-[0.98] cursor-pointer focus:outline-none"
            >
              {okLabel}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
