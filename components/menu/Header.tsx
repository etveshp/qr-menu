'use client';

import { type RefObject } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'motion/react';
import { Coffee, Key, ConciergeBell } from 'lucide-react';
import { LanguageSelector } from '@/components/LanguageSelector';
import type { CafeInfo } from '@/lib/supabase';
import { getCafeName } from '@/lib/supabase';
import type { Language } from '@/lib/translations';
import type { Translator } from '@/lib/translator';

interface HeaderProps {
  headerRef: RefObject<HTMLElement | null>;
  cafeInfo: CafeInfo | null;
  isAdminLoggedIn: boolean;
  lang: Language;
  changeLanguage: (lang: Language) => void;
  totalCartItemsCount: number;
  bouncingCart: boolean;
  cartButtonRef: RefObject<HTMLButtonElement | null>;
  onOpenCart: () => void;
  t: Translator;
  tableNumber: string | null;
}

export function Header({
  headerRef,
  cafeInfo,
  isAdminLoggedIn,
  lang,
  changeLanguage,
  totalCartItemsCount,
  bouncingCart,
  cartButtonRef,
  onOpenCart,
  t,
  tableNumber,
}: HeaderProps) {
  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-40 bg-[#FAF6EE] border-b border-[#E6DFD5] py-2 sm:py-2.5"
    >
      <div className="max-w-4xl mx-auto w-full px-4 flex items-center justify-between">
        {/* Logo area */}
        <div className="flex items-center justify-start">
          {cafeInfo?.logo ? (
            <div className="relative h-14 sm:h-16 w-44 sm:w-60 overflow-hidden shrink-0 flex items-center justify-start">
              <Image
                src={cafeInfo.logo}
                alt={getCafeName(cafeInfo, lang) || 'Logo'}
                fill
                sizes="(min-width: 640px) 240px, 176px"
                className="object-contain !object-left"
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
          {cafeInfo?.showTableNumber && tableNumber && (
            <span className="hidden sm:inline-flex items-center px-3 h-9 rounded-full bg-[#F1ECE3] border border-[#E6DFD5] text-[11px] font-bold uppercase tracking-wider text-[#3E2F26] whitespace-nowrap">
              {t('headerTableChip').replace('{number}', tableNumber)}
            </span>
          )}
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