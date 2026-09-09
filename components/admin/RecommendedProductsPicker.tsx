'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, ChevronLeft } from 'lucide-react';
import type { Category, Product } from '@/lib/supabase';
import type { TRANSLATIONS } from '@/lib/translations';

interface RecommendedProductsPickerProps {
  isOpen: boolean;
  categories: Category[];
  products: Product[];
  selectedIds: string[];
  lang: string;
  excludeId?: string;
  max?: number;
  onClose: () => void;
  onConfirm: (ids: string[]) => void;
  t: (key: keyof typeof TRANSLATIONS['uk']) => string;
  logoUrl?: string;
}

const MAX = 5;

export function RecommendedProductsPicker({
  isOpen,
  categories,
  products,
  selectedIds,
  lang,
  excludeId = '',
  max = MAX,
  onClose,
  onConfirm,
  t,
  logoUrl,
}: RecommendedProductsPickerProps) {
  const [step, setStep] = useState<'category' | 'product'>('category');
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [draftId, setDraftId] = useState<string | null>(null);

  const catName = (cat: Category) => (lang === 'hu' ? cat.nameHu : lang === 'en' ? cat.nameEn : cat.nameUk);
  const prodName = (p: Product) => (lang === 'hu' ? p.nameHu : lang === 'en' ? p.nameEn : p.nameUk);

  const activeProducts = activeCategoryId
    ? products.filter((p) => p.categoryId === activeCategoryId && p.id !== excludeId)
    : [];

  const toggleProduct = (id: string) => {
    setDraftId(prev => (prev === id ? null : id));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[80] bg-black/40 backdrop-blur-sm flex justify-end"
        >
          <div className="absolute inset-0 cursor-pointer" onClick={onClose} />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="relative w-full max-w-md bg-[#FAF6EE] h-full flex flex-col shadow-2xl z-10 border-l border-[#E6DFD5]"
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-[#E6DFD5] bg-[#FDFBF7] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-1 min-w-0">
                {step === 'product' && (
                  <button
                    type="button"
                    onClick={() => { setStep('category'); setActiveCategoryId(null); }}
                    className="p-1.5 -ml-1.5 text-[#8E7A68] hover:text-[#3E2F26] transition-colors rounded-full cursor-pointer"
                    aria-label={t('back')}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}
                <h3 className="font-display font-bold text-xl text-[#231913] uppercase tracking-wide leading-tight truncate">
                  {activeCategoryId ? catName(categories.find(c => c.id === activeCategoryId)!) : t('chooseProductCategory')}
                </h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-[#8E7A68] hover:text-[#3E2F26] transition-colors rounded-full shrink-0 cursor-pointer"
                aria-label="Close"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5">
              {step === 'category' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {categories.map((cat) => (
                    <div
                      key={cat.id}
                      onClick={() => { setActiveCategoryId(cat.id); setStep('product'); }}
                      className="relative flex items-center overflow-hidden border border-[#E6DFD5] bg-[#FAF6EE] rounded-2xl cursor-pointer active:scale-[0.99] transition-transform"
                    >
                      <div className="relative w-20 aspect-[4/3] shrink-0 overflow-hidden bg-[#F1ECE3]">
                        {/* eslint-disable-next-line @next/next/no-img-element -- admin preview, already optimized inline */}
                        {cat.photo ? (
                          <img src={cat.photo} alt={cat.nameUk} className="absolute inset-0 w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : logoUrl ? (
                          <img src={logoUrl} alt="" className="absolute inset-0 w-full h-full object-contain opacity-30 p-3" referrerPolicy="no-referrer" />
                        ) : null}
                      </div>
                      <div className="p-3">
                        <p className="font-semibold text-sm text-[#231913] leading-tight">{catName(cat)}</p>
                      </div>
                    </div>
                  ))}
                  {categories.length === 0 && (
                    <p className="col-span-full text-sm text-[#8E7A68] py-4 text-center">{t('noCategories')}</p>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activeProducts.map((prod) => {
                    const selected = draftId === prod.id;
                    const alreadyAdded = selectedIds.includes(prod.id);
                    const disabled = alreadyAdded || (selectedIds.length >= max && !selected);
                    return (
                      <div
                        key={prod.id}
                        onClick={() => !disabled && toggleProduct(prod.id)}
                        className={`relative flex items-center overflow-hidden border rounded-2xl transition-transform bg-[#FAF6EE] border-[#E6DFD5] ${
                          disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer active:scale-[0.99]'
                        }`}
                      >
                        <div className="relative w-20 aspect-[4/3] shrink-0 overflow-hidden bg-[#F1ECE3]">
                          {/* eslint-disable-next-line @next/next/no-img-element -- admin preview, already optimized inline */}
                          {prod.photo ? (
                            <img src={prod.photo} alt={prod.nameUk} className="absolute inset-0 w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : logoUrl ? (
                            <img src={logoUrl} alt="" className="absolute inset-0 w-full h-full object-contain opacity-30 p-3" referrerPolicy="no-referrer" />
                          ) : null}
                        </div>
                        <div className="p-3">
                          <p className="font-semibold text-sm text-[#231913] leading-tight">{prodName(prod)}</p>
                        </div>

                        {selected && (
                          <div className="absolute inset-0 bg-[#3E2F26]/45 flex items-center justify-center">
                            <div className="w-10 h-10 rounded-full bg-[#3E2F26] border-2 border-[#C09E6D] flex items-center justify-center shadow-lg">
                              <Check className="w-5 h-5 text-[#FAF6EE]" strokeWidth={3} />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {activeProducts.length === 0 && (
                    <p className="col-span-full text-sm text-[#8E7A68] py-4 text-center">{t('recommendedProductsEmpty')}</p>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 sm:p-5 border-t border-[#E6DFD5] bg-[#FDFBF7] shrink-0">
              <button
                type="button"
                disabled={!draftId}
                onClick={() => { if (draftId) { onConfirm([draftId]); onClose(); } }}
                className={`w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-xs uppercase tracking-widest font-semibold rounded-xl transition-all cursor-pointer ${
                  draftId
                    ? 'bg-[#3E2F26] hover:bg-[#231913] text-[#FAF6EE] shadow-md active:scale-[0.98]'
                    : 'bg-[#E6DFD5] text-[#8E7A68] cursor-not-allowed'
                }`}
              >
                <span>{t('add')}</span>
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default RecommendedProductsPicker;
