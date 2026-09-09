'use client';

import Image from 'next/image';
import { motion } from 'motion/react';
import { Plus } from 'lucide-react';
import type { Product } from '@/lib/supabase';
import type { Translator } from '@/lib/translator';
import { productBadgeById, PRODUCT_BADGE_KEYS } from '@/lib/badges';

interface ProductCardProps {
  product: Product;
  qty: number;
  index: number;
  name: string;
  priceCurrency: string;
  onOpen: (product: Product) => void;
  t: Translator;
  logoUrl?: string;
}

export function ProductCard({ product, qty, index, name, priceCurrency, onOpen, t, logoUrl }: ProductCardProps) {
  const badgeDef = productBadgeById(product.badge);
  return (
    <motion.div
      initial={{ opacity: 0, y: 28, scale: 0.97 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.15, margin: '0px 0px -30px 0px' }}
      transition={{
        duration: 0.45,
        delay: (index % 2) * 0.08,
        ease: [0.215, 0.61, 0.355, 1]
      }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onOpen(product)}
      className="bg-[#FDFBF7] border border-[#E6DFD5] rounded-2xl premium-shadow flex flex-col overflow-hidden transition-all duration-300 hover:border-[#C09E6D] hover:shadow-md cursor-pointer group select-none"
    >
      <div className="relative w-full aspect-[4/3] overflow-hidden bg-[#F1ECE3] shrink-0 border-b border-[#E6DFD5]/40">
        {product.photo ? (
          <Image
            src={product.photo}
            alt={name}
            fill
            sizes="(max-width: 640px) 46vw, 424px"
            className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
            referrerPolicy="no-referrer"
          />
        ) : logoUrl ? (
          <div className="absolute inset-0 flex items-center justify-center p-8">
            <Image
              src={logoUrl}
              alt=""
              fill
              className="object-contain opacity-30"
              sizes="(max-width: 640px) 46vw, 424px"
              referrerPolicy="no-referrer"
            />
          </div>
        ) : null}
        {badgeDef && (
          <span className={`absolute top-2 left-2 sm:top-2.5 sm:left-2.5 z-10 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider shadow-md ${badgeDef.className}`}>
            {t(PRODUCT_BADGE_KEYS[badgeDef.id])}
          </span>
        )}
        {qty > 0 && (
          <div className="absolute top-2 right-2 bg-[#3E2F26] text-[#FAF6EE] text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shadow-md border border-[#E6DFD5]">
            {qty}
          </div>
        )}
      </div>

      <div className="p-3 sm:p-4 flex-1 flex flex-col justify-between">
        <h4 className="font-display font-bold text-xl md:text-2xl lg:text-[26px] text-[#231913] leading-snug line-clamp-2 group-hover:text-[#8E7A68] transition-colors">
          {name}
        </h4>

        <div className="flex items-center justify-between gap-1.5 mt-2.5 pt-2 border-t border-[#E6DFD5]/40">
          <span className="font-bold text-lg md:text-xl lg:text-2xl text-[#3E2F26] whitespace-nowrap">
            {product.price} {priceCurrency}
          </span>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpen(product);
            }}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#3E2F26] text-[#FAF6EE] flex items-center justify-center hover:bg-[#C09E6D] active:scale-90 transition-all shadow-sm shrink-0"
            aria-label={t('addToCart')}
          >
            <Plus className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
