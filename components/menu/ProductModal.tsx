'use client';

import { type RefObject, useEffect, useRef, useState } from 'react';
import { computeTitleFloat, type TitleFloatState } from '@/lib/title-float';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Minus, Plus, ConciergeBell } from 'lucide-react';
import type { Product } from '@/lib/supabase';
import type { Translator } from '@/lib/translator';
import { productBadgeById, PRODUCT_BADGE_KEYS } from '@/lib/badges';
import { useMediaQuery } from '@/hooks/use-media-query';

interface ProductModalProps {
  product: Product | null;
  headerHeight: number;
  cartButtonRect: { top: number; right: number; width: number; height: number } | null;
  cartToast: { id: number; message: string; qty: number } | null;
  modalQty: number;
  isJustAdded: boolean;
  recommendedProducts: Product[];
  recIsDragging: boolean;
  recScrollRef: RefObject<HTMLDivElement | null>;
  totalCartItemsCount: number;
  bouncingCart: boolean;
  getProductName: (prod: Product) => string;
  getProductDesc: (prod: Product) => string;
  getProductIngredients: (prod: Product) => string[];
  t: Translator;
  onClose: () => void;
  onDecrementQty: () => void;
  onIncrementQty: () => void;
  onAddToCart: (e?: React.MouseEvent) => void;
  onOpenProduct: (product: Product) => void;
  onOpenCart: () => void;
  onRecPointerDown: (e: React.PointerEvent) => void;
  onRecPointerUp: (e: React.PointerEvent) => void;
  onRecPointerMove: (e: React.PointerEvent) => void;
}

export function ProductModal({
  product,
  headerHeight,
  cartButtonRect,
  cartToast,
  modalQty,
  isJustAdded,
  recommendedProducts,
  recIsDragging,
  recScrollRef,
  totalCartItemsCount,
  bouncingCart,
  getProductName,
  getProductDesc,
  getProductIngredients,
  t,
  onClose,
  onDecrementQty,
  onIncrementQty,
  onAddToCart,
  onOpenProduct,
  onOpenCart,
  onRecPointerDown,
  onRecPointerUp,
  onRecPointerMove,
}: ProductModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const titleRowRef = useRef<HTMLDivElement>(null);

  // Desktop / tablet-landscape (≥1024px) use the horizontal layout. SSR and the
  // first client render always report `false` (hydration-safe); after hydration
  // the real breakpoint value is applied.
  const isWide = useMediaQuery('(min-width: 1024px)');

  const [float, setFloat] = useState<TitleFloatState>(() =>
    computeTitleFloat({ scrollTop: 0, paddingTop: 20, rowHeight: 60 })
  );
  const [cloneLayout, setCloneLayout] = useState({ left: 20, width: 0, height: 60 });
  const [recPage, setRecPage] = useState(0);
  const [recPages, setRecPages] = useState(1);

  const updateRecDots = (el: HTMLDivElement) => {
    const { scrollLeft, clientWidth, scrollWidth } = el;
    if (clientWidth <= 0 || scrollWidth <= clientWidth) {
      setRecPages(1);
      setRecPage(0);
      return;
    }
    const pages = Math.max(1, Math.ceil(scrollWidth / clientWidth));
    const ratio = Math.min(1, Math.max(0, scrollLeft / (scrollWidth - clientWidth)));
    setRecPages(pages);
    setRecPage(Math.round(ratio * (pages - 1)));
  };

  const renderRecDots = () =>
    recPages > 1 ? (
      <div className="flex justify-center items-center gap-1.5 pt-2">
        {Array.from({ length: recPages }).map((_, i) => (
          <span
            key={i}
            className={`h-1.5 rounded-full transition-all ${i === recPage ? 'w-5 bg-[#C09E6D]' : 'w-1.5 bg-[#E6DFD5]'}`}
          />
        ))}
      </div>
    ) : null;

  // Initialize/refresh the scroll dots after the rail mounts or its content
  // changes (scroll events only fire once the user actually scrolls).
  useEffect(() => {
    const update = () => {
      if (recScrollRef.current) updateRecDots(recScrollRef.current);
    };
    const raf = requestAnimationFrame(update);
    const timer = setTimeout(update, 120);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [recommendedProducts, recScrollRef]);

  // Vertical ("title floats over the photo while scrolling") behavior is only
  // used by the mobile bottom-sheet layout.
  useEffect(() => {
    if (isWide) return;
    const content = contentRef.current;
    const row = titleRowRef.current;
    if (!product || !content || !row) return;

    let paddingTop = 20;
    let rowHeight = Math.max(1, row.offsetHeight);

    const measure = () => {
      const cs = getComputedStyle(content);
      paddingTop = parseFloat(cs.paddingTop) || 20;
      rowHeight = Math.max(1, row.offsetHeight);
      const padLeft = parseFloat(cs.paddingLeft) || 20;
      const padRight = parseFloat(cs.paddingRight) || 20;
      const width = content.clientWidth - padLeft - padRight;
      setCloneLayout({ left: padLeft, width: Math.max(0, width), height: rowHeight });
    };

    const update = () => {
      setFloat(computeTitleFloat({ scrollTop: content.scrollTop, paddingTop, rowHeight }));
    };

    measure();
    update();
    content.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', measure);
    const ro = new ResizeObserver(() => {
      measure();
      update();
    });
    ro.observe(row);
    document.fonts?.ready?.then(() => {
      measure();
      update();
    }).catch(() => {});

    return () => {
      content.removeEventListener('scroll', update);
      window.removeEventListener('resize', measure);
      ro.disconnect();
    };
  }, [product, isWide]);

  useEffect(() => {
    if (!product || !dialogRef.current) return;
    const focusables = dialogRef.current.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
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
  }, [product, isWide]);

  if (!product) return null;

  const ingredients = getProductIngredients(product);
  const badgeDef = productBadgeById(product.badge);

  const renderDescription = () =>
    getProductDesc(product) ? (
      <div>
        <p className="text-[#4A3B32] text-sm sm:text-base leading-relaxed">
          {getProductDesc(product)}
        </p>
      </div>
    ) : null;

  const renderIngredients = () =>
    ingredients.length > 0 ? (
      <div className="pt-2">
        <span className="block font-bold uppercase tracking-wider text-[#8E7A68] text-xs mb-2">
          {t('ingredients')}
        </span>
        <ul className="space-y-1.5 pl-0.5">
          {ingredients.map((ingredient, idx) => (
            <li
              key={idx}
              className="flex items-start gap-2.5 text-[#4A3B32] text-sm sm:text-base leading-relaxed"
            >
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#C09E6D] mt-2 shrink-0" />
              <span>{ingredient}</span>
            </li>
          ))}
        </ul>
      </div>
    ) : null;

  const renderRecommended = () =>
    recommendedProducts.length > 0 ? (
      <div className="pt-3 border-t border-[#E6DFD5]/60">
        <span className="block font-bold uppercase tracking-wider text-[#8E7A68] text-sm mb-2.5">
          {t('recommendedWith')}
        </span>
        <div
          ref={(node) => { if (node) recScrollRef.current = node; }}
          onPointerDown={onRecPointerDown}
          onPointerLeave={onRecPointerUp}
          onPointerUp={onRecPointerUp}
          onPointerMove={onRecPointerMove}
          onScroll={(e) => updateRecDots(e.currentTarget)}
          className="flex gap-3 overflow-x-auto pb-1 no-scrollbar -mx-1 px-1 touch-pan-x overscroll-x-contain select-none cursor-grab active:cursor-grabbing"
        >
          {recommendedProducts.map((rec) => (
            <button
              key={rec.id}
              onClick={() => {
                if (!recIsDragging) {
                  onOpenProduct(rec);
                }
              }}
              className="flex-shrink-0 w-28 bg-[#FDFBF7] hover:bg-[#F5EFE6] border border-[#E6DFD5] rounded-xl overflow-hidden text-left transition-all hover:shadow-md active:scale-95 group cursor-pointer flex flex-col justify-start select-none"
            >
              <div className="relative w-full aspect-[4/3] overflow-hidden bg-[#F1ECE3] border-b border-[#E6DFD5]/50 pointer-events-none">
                <Image
                  src={rec.photo}
                  alt={getProductName(rec)}
                  fill
                  sizes="112px"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="p-2 w-full">
                <h4 className="font-sans font-medium text-xs text-[#231913] leading-snug line-clamp-2 pointer-events-none">
                  {getProductName(rec)}
                </h4>
              </div>
            </button>
          ))}
        </div>
        {renderRecDots()}
      </div>
    ) : null;

  const renderFooter = () => (
    <>
      <div className="flex items-center bg-[#F1ECE3] border border-[#E6DFD5] rounded-full overflow-hidden shrink-0 h-12 shadow-sm">
        <button
          onClick={onDecrementQty}
          disabled={modalQty <= 1}
          className={`w-10 h-12 flex items-center justify-center text-[#3E2F26] transition-all ${
            modalQty <= 1 ? 'opacity-30 cursor-not-allowed' : 'hover:bg-[#E6DFD5] active:scale-95'
          }`}
          aria-label="Decrease quantity"
        >
          <Minus className="w-4 h-4" />
        </button>
        <span className="w-8 text-center font-bold text-base text-[#231913] select-none lining-nums">
          {modalQty}
        </span>
        <button
          onClick={onIncrementQty}
          className="w-10 h-12 flex items-center justify-center text-[#3E2F26] hover:bg-[#E6DFD5] active:scale-95 transition-all"
          aria-label="Increase quantity"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <motion.button
        onClick={onAddToCart}
        whileTap={{ scale: 0.97 }}
        className={`flex-1 h-12 text-sm uppercase tracking-wider font-bold transition-all flex items-center justify-center gap-2 rounded-full shadow-md ${
          isJustAdded ? 'bg-[#C09E6D] text-white' : 'bg-[#3E2F26] text-[#FAF6EE] hover:bg-[#231913]'
        }`}
      >
        {isJustAdded ? (
          <>
            <Check className="w-4.5 h-4.5 stroke-[2.5]" />
            <span>{t('addedToCart')}</span>
          </>
        ) : (
          <>
            <ConciergeBell className="w-4.5 h-4.5" />
            <span>{t('addToCart')}</span>
          </>
        )}
      </motion.button>
    </>
  );

  // ---------------------------------------------------------------------------
  // Desktop / tablet-landscape (≥1024px): horizontal card — photo left,
  // sticky title+price at the top of the right column, scrollable content,
  // quantity/add-to-cart footer pinned to the bottom of the right column.
  // ---------------------------------------------------------------------------
  if (isWide) {
    return (
      <AnimatePresence>
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Cart Order Button & Toast positioned above backdrop */}
          {cartButtonRect && (
            <div
              style={{
                top: cartButtonRect.top,
                right: cartButtonRect.right,
                height: cartButtonRect.height
              }}
              className="fixed z-[60] flex items-center justify-end gap-2 sm:gap-2.5 pointer-events-none"
            >
              <AnimatePresence>
                {cartToast && (
                  <motion.div
                    key={cartToast.id}
                    initial={{ opacity: 0, x: 20, scale: 0.9 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: 15, scale: 0.92, transition: { duration: 0.2, ease: 'easeIn' } }}
                    transition={{ type: 'spring', damping: 24, stiffness: 350 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenCart();
                    }}
                    className="pointer-events-auto flex items-center gap-2.5 h-11 px-4 bg-[#231913]/95 hover:bg-[#3E2F26] border border-[#C09E6D]/60 rounded-full text-[#FAF6EE] shadow-2xl shadow-black/40 backdrop-blur-md cursor-pointer select-none transition-colors active:scale-95"
                  >
                    <div className="w-5 h-5 rounded-full bg-[#C09E6D] text-white flex items-center justify-center shrink-0 shadow-xs">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                    <span className="font-sans font-medium text-xs sm:text-sm text-[#FAF6EE] whitespace-nowrap">
                      {cartToast.message}
                    </span>
                    {cartToast.qty > 1 && (
                      <span className="font-sans font-bold text-xs bg-[#C09E6D]/30 border border-[#C09E6D]/50 text-[#FAF6EE] px-2 py-1 rounded-full leading-tight">
                        +{cartToast.qty}
                      </span>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenCart();
                }}
                animate={bouncingCart
                  ? { scale: [1, 1.25, 0.92, 1.12, 1], rotate: [0, -8, 8, -4, 0] }
                  : { scale: 1, rotate: 0 }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
                className="pointer-events-auto relative flex items-center justify-center w-10 h-10 rounded-full bg-[#C09E6D] hover:bg-[#ad8b5b] text-white shadow-md active:scale-90 transition-all cursor-pointer border border-[#FAF6EE]/40 shrink-0"
                aria-label={t('cart')}
              >
                <ConciergeBell className="w-5 h-5 text-white stroke-[2.2]" />
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
          )}

          {/* Horizontal Modal Card */}
          <AnimatePresence mode="popLayout">
            <motion.div
              key={product.id}
              ref={dialogRef}
              initial={{ opacity: 0, y: 80 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40, transition: { duration: 0.2, ease: 'easeIn' } }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="relative w-full max-w-4xl h-[476px] bg-[#FAF6EE] rounded-3xl shadow-2xl flex overflow-hidden z-10"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Left column: photo flush to the top-left corner (rounded tl + br), recommended rail below */}
              <div className="relative w-[46%] shrink-0 bg-[#F1ECE3]/70 flex flex-col overflow-hidden">
                <div className="relative aspect-[4/3] overflow-hidden shrink-0 mr-4 rounded-tl-[24px] rounded-br-[24px]">
                  <Image
                    src={product.photo}
                    alt={getProductName(product)}
                    fill
                    priority
                    sizes="(max-width: 1280px) 45vw, 460px"
                    className="object-cover"
                    referrerPolicy="no-referrer"
                  />
                  {badgeDef && (
                    <span className={`absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-md ${badgeDef.className}`}>
                      {t(PRODUCT_BADGE_KEYS[badgeDef.id])}
                    </span>
                  )}
                </div>

                {recommendedProducts.length > 0 && (
                  <div className="w-full mt-3 px-4 pb-2 min-h-0">
                    <span className="block font-bold uppercase tracking-wider text-[#8E7A68] text-[13px] mb-2">
                      {t('recommendedWith')}
                    </span>
                    <div
                      ref={(node) => { if (node) recScrollRef.current = node; }}
                      onPointerDown={onRecPointerDown}
                      onPointerLeave={onRecPointerUp}
                      onPointerUp={onRecPointerUp}
                      onPointerMove={onRecPointerMove}
                      onScroll={(e) => updateRecDots(e.currentTarget)}
                      className="flex gap-2 overflow-x-auto pb-1 no-scrollbar -mx-1 px-1 touch-pan-x overscroll-x-contain select-none cursor-grab active:cursor-grabbing"
                    >
                      {recommendedProducts.map((rec) => (
                        <button
                          key={rec.id}
                          onClick={() => {
                            if (!recIsDragging) {
                              onOpenProduct(rec);
                            }
                          }}
                          className="flex-shrink-0 w-24 bg-[#FDFBF7] hover:bg-[#F5EFE6] border border-[#E6DFD5] rounded-xl overflow-hidden text-left transition-all hover:shadow-md active:scale-95 group cursor-pointer flex flex-col justify-start select-none"
                        >
                          <div className="relative w-full aspect-[4/3] overflow-hidden bg-[#F1ECE3] border-b border-[#E6DFD5]/50 pointer-events-none">
                            <Image
                              src={rec.photo}
                              alt={getProductName(rec)}
                              fill
                              sizes="96px"
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                          <div className="p-1.5 w-full">
                            <h4 className="font-sans font-medium text-[11px] text-[#231913] leading-snug line-clamp-2 pointer-events-none">
                              {getProductName(rec)}
                            </h4>
                          </div>
                        </button>
                      ))}
                    </div>
                    {renderRecDots()}
                  </div>
                )}
              </div>

              {/* Right column: sticky title + scrollable content + pinned footer */}
              <div className="flex flex-col flex-1 min-w-0 bg-[#FAF6EE]">
                <div className="shrink-0 flex items-start justify-between gap-4 px-7 pr-16 pt-5 pb-3.5 border-b border-[#E6DFD5]/70 bg-[#FAF6EE]">
                  <h3 className="font-display font-bold text-3xl text-[#231913] leading-tight">
                    {getProductName(product)}
                  </h3>
                  <span className="font-bold text-3xl text-[#C09E6D] shrink-0 tracking-tight">
                    {product.price} {t('priceCurrency')}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto px-7 py-4 space-y-4 min-h-0">
                  {renderDescription()}
                  {renderIngredients()}
                </div>

                <div className="shrink-0 px-7 py-4 border-t border-[#E6DFD5] bg-[#FDFBF7] flex items-center gap-3">
                  {renderFooter()}
                </div>
              </div>

              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-[#3E2F26]/80 text-white backdrop-blur-md flex items-center justify-center hover:bg-[#3E2F26] active:scale-95 transition-all shadow-lg border border-white/10"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
          </motion.div>
          </AnimatePresence>
        </div>
      </AnimatePresence>
    );
  }

  // ---------------------------------------------------------------------------
  // Mobile (<1024px): bottom-sheet card — photo on top (4:3), the title/price
  // floats over the photo while scrolling, scrollable content, footer pinned.
  // ---------------------------------------------------------------------------
  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end justify-center p-0">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Cart Order Button & Toast positioned above backdrop */}
        {cartButtonRect && (
          <div
            style={{
              top: cartButtonRect.top,
              right: cartButtonRect.right,
              height: cartButtonRect.height
            }}
            className="fixed z-[60] flex items-center justify-end gap-2 sm:gap-2.5 pointer-events-none"
          >
            <AnimatePresence>
              {cartToast && (
                <motion.div
                  key={cartToast.id}
                  initial={{ opacity: 0, x: 20, scale: 0.9 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 15, scale: 0.92, transition: { duration: 0.2, ease: 'easeIn' } }}
                  transition={{ type: 'spring', damping: 24, stiffness: 350 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenCart();
                  }}
                  className="pointer-events-auto flex items-center gap-2.5 h-11 px-4 bg-[#231913]/95 hover:bg-[#3E2F26] border border-[#C09E6D]/60 rounded-full text-[#FAF6EE] shadow-2xl shadow-black/40 backdrop-blur-md cursor-pointer select-none transition-colors active:scale-95"
                >
                  <div className="w-5 h-5 rounded-full bg-[#C09E6D] text-white flex items-center justify-center shrink-0 shadow-xs">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                  <span className="font-sans font-medium text-xs sm:text-sm text-[#FAF6EE] whitespace-nowrap">
                    {cartToast.message}
                  </span>
                  {cartToast.qty > 1 && (
                    <span className="font-sans font-bold text-xs bg-[#C09E6D]/30 border border-[#C09E6D]/50 text-[#FAF6EE] px-2 py-1 rounded-full leading-tight">
                      +{cartToast.qty}
                    </span>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              onClick={(e) => {
                e.stopPropagation();
                onOpenCart();
              }}
              animate={bouncingCart
                ? { scale: [1, 1.25, 0.92, 1.12, 1], rotate: [0, -8, 8, -4, 0] }
                : { scale: 1, rotate: 0 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              className="pointer-events-auto relative flex items-center justify-center w-10 h-10 rounded-full bg-[#C09E6D] hover:bg-[#ad8b5b] text-white shadow-md active:scale-90 transition-all cursor-pointer border border-[#FAF6EE]/40 shrink-0"
              aria-label={t('cart')}
            >
              <ConciergeBell className="w-5 h-5 text-white stroke-[2.2]" />
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
        )}

        {/* Modal Dialog (mobile bottom sheet) */}
        <AnimatePresence mode="popLayout">
          <motion.div
            key={product.id}
            ref={dialogRef}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ opacity: 0, y: 60, transition: { duration: 0.16, ease: 'easeIn' } }}
            transition={{ duration: 0.45, ease: [0.32, 0.72, 0.25, 1] }}
            style={{ height: `calc(100dvh - ${headerHeight + 10}px)`, willChange: 'transform' }}
            className="relative w-full max-w-lg bg-[#FAF6EE] rounded-t-3xl flex flex-col overflow-hidden shadow-2xl border-t border-x border-[#E6DFD5] z-10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Photo Banner with Close Button */}
            <div className="relative w-full aspect-[4/3] bg-[#F1ECE3] shrink-0 overflow-hidden">
              <Image
                src={product.photo}
                alt={getProductName(product)}
                fill
                priority
                sizes="(max-width: 512px) 100vw, 512px"
                className="object-cover"
                referrerPolicy="no-referrer"
              />
              {badgeDef && (
                <span className={`absolute top-3 left-3 sm:top-3.5 sm:left-3.5 z-[6] px-3 py-1.5 rounded-full text-sm font-bold uppercase tracking-wider shadow-md ${badgeDef.className}`}>
                  {t(PRODUCT_BADGE_KEYS[badgeDef.id])}
                </span>
              )}

              {/* Title float overlay: gradient + light copy of the title/price rising over the photo */}
              <div className="absolute inset-0 z-[5] overflow-hidden pointer-events-none" aria-hidden="true">
                <div
                  className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/45 to-transparent"
                  style={{ height: float.gradientHeight, opacity: float.gradientOpacity }}
                />
                <div
                  className="absolute flex items-start justify-between gap-3"
                  style={{
                    left: cloneLayout.left,
                    width: cloneLayout.width,
                    height: cloneLayout.height,
                    bottom: float.cloneBottom,
                    opacity: float.cloneOpacity,
                  }}
                >
                  <h3 className="font-display font-bold text-2xl sm:text-3xl text-[#FAF6EE] leading-tight drop-shadow-[0_1px_3px_rgba(0,0,0,0.45)]">
                    {getProductName(product)}
                  </h3>
                  <span className="font-bold text-2xl sm:text-3xl text-[#E9C78E] shrink-0 tracking-tight drop-shadow-[0_1px_3px_rgba(0,0,0,0.45)]">
                    {product.price} {t('priceCurrency')}
                  </span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="absolute top-3.5 right-3.5 z-10 w-9 h-9 rounded-full bg-black/50 text-white backdrop-blur-md flex items-center justify-center hover:bg-black/70 active:scale-95 transition-all shadow-lg border border-white/10"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div ref={contentRef} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              <div ref={titleRowRef} className="flex items-start justify-between gap-3" style={{ opacity: float.inFlowOpacity }}>
                <h3 className="font-display font-bold text-2xl sm:text-3xl text-[#231913] leading-tight">
                  {getProductName(product)}
                </h3>
                <span className="font-bold text-2xl sm:text-3xl text-[#C09E6D] shrink-0 tracking-tight">
                  {product.price} {t('priceCurrency')}
                </span>
              </div>

              {renderDescription()}
              {renderIngredients()}
              {renderRecommended()}
            </div>

            {/* Footer Actions */}
            <div className="p-4 sm:p-5 border-t border-[#E6DFD5] bg-[#FDFBF7] flex items-center gap-3">
              {renderFooter()}
            </div>
        </motion.div>
        </AnimatePresence>
      </div>
    </AnimatePresence>
  );
}
