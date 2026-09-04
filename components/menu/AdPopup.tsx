'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';
import { motion } from 'motion/react';
import { subscribeAdvertising, type Advertising, type Product } from '@/lib/supabase';
import type { Translator } from '@/lib/translator';

const DEFAULT_AD: Advertising = { photo: '', delaySeconds: 5, enabled: false };

// The photo banner shows while `showUntil` is empty (no limit) or today <= showUntil.
const isWithinShowWindow = (ad: Advertising): boolean => {
  if (!ad.showUntil) return true;
  if (typeof window === 'undefined') return true;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const limit = new Date(`${ad.showUntil}T00:00:00`);
  if (Number.isNaN(limit.getTime())) return true;
  return today.getTime() <= limit.getTime();
};

interface AdPopupProps {
  products: Product[];
  onOpenProduct: (product: Product) => void;
  t: Translator;
  /** Fresh photo-banner settings from SSR (menu caching); skips the initial fetch. */
  initialAd?: Advertising;
}

export function AdPopup({ products, onOpenProduct, t, initialAd }: AdPopupProps) {
  const [ad, setAd] = useState<Advertising>(initialAd ?? DEFAULT_AD);
  const [visible, setVisible] = useState(false);
  const wasShownRef = useRef(false);
  // Captured once on mount so the effect (empty deps) does not resubscribe when
  // props change; also lets us schedule the SSR-provided banner immediately.
  const initialAdRef = useRef(initialAd);

  // Show the photo banner once per page load, after the configured delay, once the ad
  // is enabled and has a photo (and is still within its "show until" window).
  // Realtime updates refresh the settings, but the banner is never re-shown
  // after it was already displayed.
  useEffect(() => {
    let cancelled = false;
    // Timer is local to this effect run: under React StrictMode (dev) the
    // effect runs twice, and a stale run's callback must not be able to clear
    // the live run's pending timer via a shared ref.
    let timer: ReturnType<typeof setTimeout> | null = null;

    const schedule = (next: Advertising) => {
      if (timer) clearTimeout(timer);
      if (!next.enabled || !next.photo || !isWithinShowWindow(next) || wasShownRef.current || cancelled) return;
      timer = setTimeout(() => {
        if (cancelled || wasShownRef.current) return;
        wasShownRef.current = true;
        setVisible(true);
      }, Math.max(0, (next.delaySeconds ?? 5) * 1000));
    };

    const skipInitial = initialAdRef.current !== undefined;
    if (skipInitial && initialAdRef.current) {
      schedule(initialAdRef.current);
    }
    subscribeAdvertising((next) => {
      setAd(next);
      schedule(next);
    }, { skipInitial });

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, []);

  const close = () => setVisible(false);

  const product = products.find((p) => p.id === ad.productId);

  const openLinkedProduct = () => {
    if (!product) return;
    setVisible(false);
    onOpenProduct(product);
  };

  return (
    <>
      {visible && ad.photo && (
        <motion.div
          key="ad-popup"
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 sm:p-6 sm:items-end sm:justify-end sm:bg-transparent sm:backdrop-blur-none sm:pointer-events-none bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          role="dialog"
          aria-modal="true"
          aria-label={t('advertising')}
        >
          {/* 9:16 photo banner with small outer margins (not full screen) */}
          <motion.div
            className={`relative w-full max-w-[320px] aspect-[9/16] rounded-3xl overflow-hidden shadow-2xl border border-white/20 sm:w-[240px] sm:max-w-none sm:pointer-events-auto sm:mb-2 sm:mr-2 ${product ? 'cursor-pointer' : ''}`}
            initial={{ opacity: 0, scale: 0.9, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 26 }}
          >
            <Image
              src={ad.photo}
              alt={t('advertising')}
              fill
              sizes="(min-width: 640px) 240px, 320px"
              className="object-cover"
              referrerPolicy="no-referrer"
              unoptimized={ad.photo.startsWith('data:')}
            />

            {/* Whole photo banner opens the linked dish (click-through area) */}
            {product && (
              <button
                type="button"
                onClick={openLinkedProduct}
                aria-label={`${t('adOpenProduct')}: ${product.nameUk}`}
                className="absolute inset-0 z-10"
              />
            )}

            {/* Close button in the top right corner */}
            <button
              type="button"
              onClick={close}
              aria-label={t('adClose')}
              className="absolute top-3 right-3 z-20 w-10 h-10 rounded-full bg-black/60 hover:bg-red-700/90 text-white/90 hover:text-white backdrop-blur-md border border-white/25 flex items-center justify-center transition-all shadow-md active:scale-90 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        </motion.div>
      )}
    </>
  );
}
