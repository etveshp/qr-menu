'use client';

import { type RefObject } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { Coffee, Key, Check, ConciergeBell } from 'lucide-react';
import { LanguageSelector } from '@/components/LanguageSelector';
import type { CafeInfo } from '@/lib/firebase';
import type { Language } from '@/lib/translations';
import type { Translator } from '@/lib/translator';

interface HeaderProps {
  headerRef: RefObject<HTMLElement | null>;
  cafeInfo: CafeInfo | null;
  cartToast: { id: number; message: string; qty: number } | null;
  selectedProductModal: unknown;
  isAdminLoggedIn: boolean;
  lang: Language;
  changeLanguage: (lang: Language) => void;
  totalCartItemsCount: number;
  bouncingCart: boolean;
  cartButtonRef: RefObject<HTMLButtonElement | null>;
  onOpenCart: () => void;
  t: Translator;
}

export function Header({
  headerRef,
  cafeInfo,
  cartToast,
  selectedProductModal,
  isAdminLoggedIn,
  lang,
  changeLanguage,
  totalCartItemsCount,
  bouncingCart,
  cartButtonRef,
  onOpenCart,
  t,
}: HeaderProps) {
  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-30 bg-[#FAF6EE]/90 backdrop-blur-md border-b border-[#E6DFD5] py-2 sm:py-2.5"
    >
      <div className="max-w-4xl mx-auto w-full px-4 flex items-center justify-between">
        {/* Logo area */}
        <div className="flex items-center justify-start">
          {cafeInfo?.logo ? (
            <div className="relative h-14 sm:h-16 w-44 sm:w-60 overflow-hidden shrink-0 flex items-center justify-start">
              <Image
                src={cafeInfo.logo}
                alt={cafeInfo?.name || 'Logo'}
                fill
                className="object-contain !object-left"
                style={{
                  objectPosition: cafeInfo.logoX !== undefined ? `${cafeInfo.logoX}% ${cafeInfo.logoY ?? 50}%` : 'left center',
                  transform: `scale(${cafeInfo.logoScale || 1})`,
                  transformOrigin: 'left center'
                }}
                referrerPolicy="no-referrer"
              />
            </div>
          ) : (
            <div className="h-14 sm:h-16 flex items-center justify-start shrink-0">
              <Coffee className="w-8 h-8 text-[#3E2F26]" />
            </div>
          )}
        </div>

        {/* Right Action Icons */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Cart Toast Message */}
          <AnimatePresence>
            {cartToast && !selectedProductModal && (
              <motion.div
                key={cartToast.id}
                initial={{ opacity: 0, x: 20, scale: 0.9 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 15, scale: 0.92, transition: { duration: 0.2, ease: 'easeIn' } }}
                transition={{ type: 'spring', damping: 24, stiffness: 350 }}
                onClick={onOpenCart}
                className="flex items-center gap-2 py-1 px-3 bg-[#231913]/95 hover:bg-[#3E2F26] border border-[#C09E6D]/60 rounded-full text-[#FAF6EE] shadow-2xl shadow-black/40 backdrop-blur-md cursor-pointer select-none transition-colors active:scale-95"
              >
                <div className="w-4.5 h-4.5 rounded-full bg-[#C09E6D] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Check className="w-3 h-3 stroke-[3]" />
                </div>
                <span className="font-sans font-medium text-[11px] sm:text-xs text-[#FAF6EE] whitespace-nowrap">
                  {cartToast.message}
                </span>
                {cartToast.qty > 1 && (
                  <span className="font-sans font-bold text-[10px] bg-[#C09E6D]/30 border border-[#C09E6D]/50 text-[#FAF6EE] px-1.5 py-0.2 rounded-full leading-tight">
                    +{cartToast.qty}
                  </span>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Admin Key */}
          {isAdminLoggedIn && (
            <Link
              href="/admin"
              className="flex items-center justify-center w-11 h-11 rounded-full bg-[#3E2F26] hover:bg-[#231913] text-[#C09E6D] shadow-xs active:scale-95 transition-all cursor-pointer shrink-0"
              title={t('adminCabinet')}
            >
              <Key className="w-5 h-5 text-[#C09E6D]" />
            </Link>
          )}

          <LanguageSelector currentLang={lang} onChange={changeLanguage} />

          {/* Cart Order Button */}
          <motion.button
            ref={cartButtonRef}
            onClick={onOpenCart}
            animate={bouncingCart
              ? { scale: [1, 1.25, 0.92, 1.12, 1], rotate: [0, -8, 8, -4, 0] }
              : { scale: 1, rotate: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="relative flex items-center justify-center w-11 h-11 rounded-full bg-[#C09E6D] hover:bg-[#ad8b5b] text-white shadow-md active:scale-90 transition-all cursor-pointer border border-[#FAF6EE]/40 shrink-0"
            aria-label={t('cart')}
          >
            <ConciergeBell className="w-[22px] h-[22px] text-white stroke-[2.2]" />
            {totalCartItemsCount > 0 && (
              <motion.span
                key={totalCartItemsCount}
                initial={{ scale: 0.4 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 bg-white text-[#231913] text-[11px] font-black min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center shadow-md border border-[#E6DFD5]"
              >
                {totalCartItemsCount}
              </motion.span>
            )}
          </motion.button>
        </div>
      </div>
    </header>
  );
}