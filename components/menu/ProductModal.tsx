'use client';

import { type RefObject, useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Minus, Plus, ConciergeBell } from 'lucide-react';
import type { Product } from '@/lib/firebase';
import type { Translator } from '@/lib/translator';

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
  }, [product]);

  if (!product) return null;

  const ingredients = getProductIngredients(product);

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
                  className="pointer-events-auto flex items-center gap-2 py-1 px-3 bg-[#231913]/95 hover:bg-[#3E2F26] border border-[#C09E6D]/60 rounded-full text-[#FAF6EE] shadow-2xl shadow-black/40 backdrop-blur-md cursor-pointer select-none transition-colors active:scale-95"
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

        {/* Modal Dialog */}
        <AnimatePresence mode="popLayout">
          <motion.div
            key={product.id}
            ref={dialogRef}
            initial={{ y: '100%', opacity: 0.5 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            style={{ height: `calc(100dvh - ${headerHeight + 10}px)` }}
            className="relative w-full max-w-lg bg-[#FAF6EE] rounded-t-3xl flex flex-col overflow-hidden shadow-2xl border-t border-x border-[#E6DFD5] z-10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Photo Banner with Close Button */}
            <div className="relative w-full aspect-[4/3] bg-[#F1ECE3] shrink-0">
              <Image
                src={product.photo}
                alt={getProductName(product)}
                fill
                className="object-cover"
                referrerPolicy="no-referrer"
              />
              <button
                onClick={onClose}
                className="absolute top-3.5 right-3.5 z-10 w-9 h-9 rounded-full bg-black/50 text-white backdrop-blur-md flex items-center justify-center hover:bg-black/70 active:scale-95 transition-all shadow-lg border border-white/10"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-display font-bold text-2xl sm:text-3xl text-[#231913] leading-tight">
                  {getProductName(product)}
                </h3>
                <span className="font-bold text-2xl sm:text-3xl text-[#C09E6D] shrink-0 tracking-tight">
                  {product.price} {t('priceCurrency')}
                </span>
              </div>

              {getProductDesc(product) && (
                <div>
                  <p className="text-[#4A3B32] text-sm sm:text-base leading-relaxed">
                    {getProductDesc(product)}
                  </p>
                </div>
              )}

              {ingredients.length > 0 && (
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
              )}

              {recommendedProducts.length > 0 && (
                <div className="pt-3 border-t border-[#E6DFD5]/60">
                  <span className="block font-bold uppercase tracking-wider text-[#8E7A68] text-xs mb-2.5">
                    {t('recommendedWith')}
                  </span>
                  <div
                    ref={recScrollRef}
                    onPointerDown={onRecPointerDown}
                    onPointerLeave={onRecPointerUp}
                    onPointerUp={onRecPointerUp}
                    onPointerMove={onRecPointerMove}
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
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-4 sm:p-5 border-t border-[#E6DFD5] bg-[#FDFBF7] flex items-center gap-3">
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
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </AnimatePresence>
  );
}