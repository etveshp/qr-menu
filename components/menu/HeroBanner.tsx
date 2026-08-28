'use client';

import Image from 'next/image';
import { motion } from 'motion/react';
import { Sparkles, Instagram } from 'lucide-react';
import type { CafeInfo } from '@/lib/supabase';

interface HeroBannerProps {
  cafeInfo: CafeInfo | null;
  tableNumber: string | null;
  t: (key: keyof typeof import('@/lib/translations').TRANSLATIONS['uk']) => string;
}

export function HeroBanner({ cafeInfo, tableNumber, t }: HeroBannerProps) {
  return (
    <section className="max-w-4xl mx-auto relative w-full aspect-[16/9] max-h-80 overflow-hidden border-b border-[#E6DFD5] bg-[#3E2F26] rounded-b-3xl shadow-md" style={{ aspectRatio: '16 / 9' }}>
      {cafeInfo?.banner && (
        <Image
          src={cafeInfo.banner}
          alt="Cafe Banner"
          fill
          className="object-cover opacity-100"
          priority
          referrerPolicy="no-referrer"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-[#231913]/90 via-[#231913]/50 to-transparent flex flex-col justify-end p-6">
        <div className="max-w-4xl w-full mx-auto flex items-end justify-between gap-4">
          <div className="flex-1 min-w-0">
            {tableNumber && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-1.5 bg-[#C09E6D] text-[#FAF6EE] text-xs uppercase tracking-widest font-bold px-3.5 py-1.5 mb-3 shadow-md rounded-full"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {t('tableGreeting').replace('{number}', tableNumber)}
              </motion.div>
            )}

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-medium text-white tracking-wide truncate">
              {cafeInfo?.name || t('appName')}
            </h2>
            <p className="text-sm sm:text-base text-[#E6DFD5] mt-1.5 max-w-xl font-light leading-relaxed line-clamp-2">
              {cafeInfo?.description || t('welcomeDesc')}
            </p>
          </div>

          {cafeInfo?.instagram && (
            <a
              href={cafeInfo.instagram}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center w-11 h-11 rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-md active:scale-90 transition-all shrink-0 mb-0.5"
              aria-label="Instagram"
              title="Instagram"
            >
              <Instagram className="w-5.5 h-5.5 text-white" />
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
