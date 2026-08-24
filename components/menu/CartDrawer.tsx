'use client';

import { useRef, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import { ConciergeBell, X, Coffee, Info, Minus, Plus } from 'lucide-react';
import type { Product } from '@/lib/firebase';
import type { Translator } from '@/lib/translator';

interface CartDrawerProps {
  isOpen: boolean;
  cart: Record<string, number>;
  products: Product[];
  totalCartPrice: number;
  getProductName: (prod: Product) => string;
  t: Translator;
  onClose: () => void;
  onDecrement: (productId: string) => void;
  onIncrement: (productId: string, e?: React.MouseEvent) => void;
}

export function CartDrawer({
  isOpen,
  cart,
  products,
  totalCartPrice,
  getProductName,
  t,
  onClose,
  onDecrement,
  onIncrement,
}: CartDrawerProps) {
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
    return () => document.removeEventListener('keydown', handleTab);
  }, [isOpen]);

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
            <div className="p-4 sm:p-5 border-b border-[#E6DFD5] bg-[#FDFBF7] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ConciergeBell className="w-5 h-5 text-[#C09E6D]" />
                <h3 className="font-display font-bold text-xl text-[#231913] uppercase tracking-wide">
                  {t('cart')}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-[#8E7A68] hover:text-[#3E2F26] transition-colors rounded-full"
                aria-label="Close cart"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              <div className="bg-[#FDFBF7] border border-[#C09E6D] p-3.5 rounded-2xl flex gap-3 premium-shadow">
                <Info className="w-5 h-5 text-[#C09E6D] shrink-0 mt-0.5" />
                <p className="text-sm text-[#3E2F26] leading-relaxed font-medium">
                  {t('cartNotice')}
                </p>
              </div>

              {Object.keys(cart).length === 0 ? (
                <div className="py-16 text-center text-sm text-[#8E7A68] space-y-2">
                  <Coffee className="w-8 h-8 text-[#E6DFD5] mx-auto" />
                  <p className="text-base">{t('emptyCart')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(cart).map(([id, qty]) => {
                    const prod = products.find((p) => p.id === id);
                    if (!prod) return null;

                    return (
                      <div
                        key={id}
                        className="bg-[#FDFBF7] border border-[#E6DFD5] p-3.5 rounded-2xl flex gap-3 items-center justify-between premium-shadow"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative w-16 aspect-[4/3] overflow-hidden rounded-xl border border-[#E6DFD5] shrink-0">
                            <Image
                              src={prod.photo}
                              alt={prod.nameUk}
                              fill
                              className="object-cover"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-display font-bold text-lg text-[#231913] truncate leading-snug">
                              {getProductName(prod)}
                            </h4>
                            <p className="text-sm text-[#8E7A68] font-bold mt-0.5">
                              {prod.price} {t('priceCurrency')}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center bg-[#F1ECE3] border border-[#E6DFD5] rounded-full overflow-hidden shrink-0 h-10 shadow-sm">
                          <button
                            onClick={() => onDecrement(prod.id)}
                            className="w-9 h-10 flex items-center justify-center text-[#3E2F26] hover:bg-[#E6DFD5] active:scale-95 transition-all"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="w-7 text-center font-bold text-sm text-[#231913] select-none">
                            {qty}
                          </span>
                          <button
                            onClick={() => onIncrement(prod.id)}
                            className="w-9 h-10 flex items-center justify-center text-[#3E2F26] hover:bg-[#E6DFD5] active:scale-95 transition-all"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {Object.keys(cart).length > 0 && (
              <div className="p-4 sm:p-5 border-t border-[#E6DFD5] bg-[#FDFBF7] space-y-4">
                <div className="flex items-center justify-between font-display text-[#231913]">
                  <span className="text-sm uppercase tracking-wider text-[#8E7A68] font-bold">
                    {t('total')}
                  </span>
                  <span className="text-2xl font-bold text-[#3E2F26]">
                    {totalCartPrice} {t('priceCurrency')}
                  </span>
                </div>

                <button
                  onClick={onClose}
                  className="w-full py-3.5 bg-[#3E2F26] text-[#FAF6EE] text-sm uppercase tracking-widest font-bold hover:bg-[#231913] active:scale-[0.99] transition-all text-center block rounded-xl shadow-md"
                >
                  {t('backToMenu')}
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}