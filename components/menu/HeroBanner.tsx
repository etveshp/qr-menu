'use client';

import Image from 'next/image';
import { Instagram } from 'lucide-react';
import type { CafeInfo } from '@/lib/supabase';
import { getCafeName, getCafeDescription } from '@/lib/supabase';

interface HeroBannerProps {
  cafeInfo: CafeInfo | null;
  lang: string;
  t: (key: keyof typeof import('@/lib/translations').TRANSLATIONS['uk']) => string;
}

export function HeroBanner({ cafeInfo, lang, t }: HeroBannerProps) {
  return (
    <section className="max-w-4xl mx-auto relative w-full aspect-[16/9] max-h-80 overflow-hidden border-b border-[#E6DFD5] bg-[#3E2F26] rounded-b-3xl shadow-md" style={{ aspectRatio: '16 / 9' }}>
      {cafeInfo?.banner && (
        <Image
          src={cafeInfo.banner}
          alt="Cafe Banner"
          fill
          sizes="(min-width: 928px) 896px, 100vw"
          className="object-cover opacity-100"
          priority
          referrerPolicy="no-referrer"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-[#231913]/90 via-[#231913]/50 to-transparent flex flex-col justify-end p-6">
        <div className="max-w-4xl w-full mx-auto flex items-end justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-display font-medium text-white tracking-wide truncate">
              {getCafeName(cafeInfo, lang) || t('appName')}
            </h2>
            <p className="text-sm sm:text-base text-[#E6DFD5] mt-1.5 max-w-xl font-light leading-relaxed line-clamp-2">
              {getCafeDescription(cafeInfo, lang) || t('welcomeDesc')}
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
