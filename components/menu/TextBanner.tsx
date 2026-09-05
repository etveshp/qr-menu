'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { TextBanner as TextBannerData, Product } from '@/lib/supabase';
import type { Translator } from '@/lib/translator';

interface TextBannerProps {
  banner: TextBannerData;
  products: Product[];
  headerHeight: number;
  onOpenProduct: (product: Product) => void;
  t: Translator;
}

export function TextBanner({
  banner,
  products,
  headerHeight,
  onOpenProduct,
  t,
}: TextBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  const product = products.find(p => p.id === banner.productId);

  if (!banner.enabled || !banner.text || dismissed) return null;

  const openLink = () => {
    if (product) onOpenProduct(product);
  };

  return (
    <motion.div
      key="text-banner"
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: 'auto', opacity: 1 }}
      transition={{ duration: 0.25, ease: 'easeInOut' }}
      className="sticky z-30 w-full border-b border-[#E6DFD5]"
      style={{ top: Math.max(0, headerHeight - 1) }}
    >
      <button
        type="button"
        onClick={product ? openLink : undefined}
        className={`relative w-full flex items-center justify-center gap-2 px-14 sm:px-16 bg-[#F1ECE3] hover:bg-[#EAE3D8] transition-colors ${product ? 'cursor-pointer' : 'cursor-default'}`}
        style={{ minHeight: Math.max(30, Math.round(headerHeight / 2)) }}
      >
        <span className="text-sm sm:text-base font-semibold text-[#231913] leading-snug truncate">
          {banner.text}
        </span>

        {/* Close button (right, does not affect centering) */}
        <span
          role="button"
          tabIndex={0}
          aria-label={t('textBannerClose')}
          onClick={(e) => { e.stopPropagation(); setDismissed(true); }}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); setDismissed(true); } }}
          className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/50 hover:bg-white text-[#8E7A68] hover:text-[#231913] flex items-center justify-center transition-colors cursor-pointer shrink-0"
        >
          <X className="w-4 h-4" />
        </span>
      </button>
    </motion.div>
  );
}
