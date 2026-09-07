'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import { Category, Product, Advertising, getCafeName, getCafeCustomerGreeting, getRandomGreeting, subscribeTextBanner, TextBanner as TextBannerData } from '@/lib/supabase';
import {
  playStepperSound,
  triggerStepperHaptic,
  triggerHapticFeedback,
} from '@/lib/sound';
import Link from 'next/link';
import { ArrowLeft, Coffee } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '@/hooks/use-language';
import { useAuth } from '@/hooks/use-auth';
import { useMenuData } from '@/hooks/use-menu-data';
import { useCart } from '@/hooks/use-cart';
import { Header } from '@/components/menu/Header';
import { HeroBanner } from '@/components/menu/HeroBanner';
import { CategoryCard } from '@/components/menu/CategoryCard';
import { ProductCard } from '@/components/menu/ProductCard';
import { ProductModal } from '@/components/menu/ProductModal';
import { CartDrawer } from '@/components/menu/CartDrawer';
import { ScrollToTop } from '@/components/menu/ScrollToTop';
import { AdPopup } from '@/components/menu/AdPopup';
import { TextBanner } from '@/components/menu/TextBanner';
import { NotAdminModal } from '@/components/NotAdminModal';
import { useToast } from '@/components/Toast';

export interface MenuContainerProps {
  initialData?: {
    cafeInfo: Record<string, unknown> | null;
    categories: Record<string, unknown>[];
    products: Record<string, unknown>[];
    textBanner?: Record<string, unknown> | null;
    advertising?: Record<string, unknown> | null;
  } | null;
}

export function MenuContainer({ initialData }: MenuContainerProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tableNumber = searchParams ? searchParams.get('table') : null;
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    // Suppress the OS long-press haptic / text-selection gesture so the only
    // vibration is the one we fire at the moment of navigation.
    e.preventDefault();
    longPressTimerRef.current = setTimeout(() => {
      triggerHapticFeedback([20, 40, 30]);
      router.push('/admin');
    }, 3000);
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const { lang, changeLanguage, t } = useLanguage();
  const [showNotAdminPopup, setShowNotAdminPopup] = useState(false);
  const { currentUser, isAdmin: isAdminLoggedIn } = useAuth(() => setShowNotAdminPopup(true));

  // Customer greeting: shown once per session as a greeting toast when the cafe
  // enabled a customer greeting. A random greeting is picked from the DB list.
  const greetingPopupRef = useRef(false);
  const CUSTOMER_GREETING_SHOWN_KEY = 'svk_customer_greeting_shown';
  const { showGreetingToast } = useToast();

  const { cafeInfo, categories, products, loading } = useMenuData(initialData ?? undefined);

  useEffect(() => {
    if (isAdminLoggedIn || !cafeInfo?.greetingCustomerEnabled) return;
    if (greetingPopupRef.current) return;
    greetingPopupRef.current = true;
    if (typeof window !== 'undefined' && sessionStorage.getItem(CUSTOMER_GREETING_SHOWN_KEY) === 'true') return;
    const random = getRandomGreeting(getCafeCustomerGreeting(cafeInfo, lang));
    if (!random) return;
    const withTable = cafeInfo?.showTableNumber && tableNumber
      ? `${random}\n${t('greetingTableLine').replace('{number}', tableNumber)}`
      : random;
    showGreetingToast(t('greetingPopupTitle'), withTable, 'customer');
    try {
      sessionStorage.setItem(CUSTOMER_GREETING_SHOWN_KEY, 'true');
    } catch {
      // ignore
    }
  }, [cafeInfo, isAdminLoggedIn, lang, showGreetingToast, t, tableNumber]);

  const headerRef = useRef<HTMLElement>(null);
  const cartButtonRef = useRef<HTMLButtonElement>(null);
  const [headerHeight, setHeaderHeight] = useState<number>(65);
  const [cartButtonRect, setCartButtonRect] = useState<{ top: number; right: number; width: number; height: number } | null>(null);

  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState<boolean>(false);
  const [selectedProductModal, setSelectedProductModal] = useState<Product | null>(null);
  const [modalQty, setModalQty] = useState<number>(1);
  const [isJustAdded, setIsJustAdded] = useState<boolean>(false);

  // Text banner (sticky bar under the header). Seeded from SSR (Variant 1) so
  // the subscription only listens for realtime changes instead of re-fetching.
  const hasInitialBannerRef = useRef(initialData?.textBanner != null);
  const [textBanner, setTextBanner] = useState<TextBannerData>(() => {
    if (initialData?.textBanner) {
      return initialData.textBanner as unknown as TextBannerData;
    }
    return { text: '', enabled: false };
  });
  useEffect(() => {
    const unsubscribe = subscribeTextBanner((banner) => setTextBanner(banner), { skipInitial: hasInitialBannerRef.current });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const updateHeaderHeight = () => {
      if (headerRef.current) {
        setHeaderHeight(headerRef.current.offsetHeight);
      }
      if (cartButtonRef.current) {
        const rect = cartButtonRef.current.getBoundingClientRect();
        setCartButtonRect({
          top: rect.top,
          right: window.innerWidth - rect.right,
          width: rect.width,
          height: rect.height,
        });
      }
    };
    updateHeaderHeight();
    window.addEventListener('resize', updateHeaderHeight);
    window.addEventListener('scroll', updateHeaderHeight);
    return () => {
      window.removeEventListener('resize', updateHeaderHeight);
      window.removeEventListener('scroll', updateHeaderHeight);
    };
  }, [selectedProductModal]);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 280);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const [bouncingCart, setBouncingCart] = useState<boolean>(false);
  const [floaters, setFloaters] = useState<Array<{ id: number; x: number; y: number }>>([]);

  const recommendedProducts = useMemo(() => {
    if (!selectedProductModal) return [];
    const others = products.filter(p => p.id !== selectedProductModal.id);
    const storedIds = selectedProductModal.recommendedIds ?? [];
    if (storedIds.length > 0) {
      const byStored = storedIds
        .map(id => others.find(p => p.id === id))
        .filter((p): p is Product => Boolean(p));
      if (byStored.length > 0) return byStored.slice(0, 8);
    }
    const fromOtherCategories = others.filter(p => p.categoryId !== selectedProductModal.categoryId);
    const fromSameCategory = others.filter(p => p.categoryId === selectedProductModal.categoryId);
    return [...fromOtherCategories, ...fromSameCategory].slice(0, 5);
  }, [selectedProductModal, products]);

  const recScrollRef = useRef<HTMLDivElement>(null);
  const [recIsMouseDown, setRecIsMouseDown] = useState(false);
  const [recStartX, setRecStartX] = useState(0);
  const [recScrollLeftState, setRecScrollLeftState] = useState(0);
  const [recIsDragging, setRecIsDragging] = useState(false);

  const handleRecPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'touch' || !recScrollRef.current) return;
    setRecIsMouseDown(true);
    setRecIsDragging(false);
    setRecStartX(e.clientX - recScrollRef.current.offsetLeft);
    setRecScrollLeftState(recScrollRef.current.scrollLeft);
  };

  const handleRecPointerUp = (e: React.PointerEvent) => {
    if (e.pointerType === 'touch') return;
    setRecIsMouseDown(false);
    setTimeout(() => setRecIsDragging(false), 50);
  };

  const handleRecPointerMove = (e: React.PointerEvent) => {
    if (e.pointerType === 'touch' || !recIsMouseDown || !recScrollRef.current) return;
    const x = e.clientX - recScrollRef.current.offsetLeft;
    const walk = (x - recStartX) * 1.5;
    if (Math.abs(x - recStartX) > 5) setRecIsDragging(true);
    recScrollRef.current.scrollLeft = recScrollLeftState - walk;
  };

  const [cartToast, setCartToast] = useState<{ id: number; message: string; qty: number } | null>(null);
  const cartToastTimerRef = useRef<NodeJS.Timeout | null>(null);

  const triggerCartToast = (qty: number = 1) => {
    if (cartToastTimerRef.current) clearTimeout(cartToastTimerRef.current);
    setCartToast({ id: Date.now(), message: t('addedToOrderToast'), qty });
    cartToastTimerRef.current = setTimeout(() => setCartToast(null), 2800);
  };

  useEffect(() => {
    return () => {
      if (cartToastTimerRef.current) clearTimeout(cartToastTimerRef.current);
    };
  }, []);

  const { cart, addItem, setQty, incrementItem, decrementItem, removeItem, getQty, itemsCount: totalCartItemsCount, totalPrice: totalCartPrice } = useCart(products);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);

  // Close modals on Escape key + lock body scroll while a modal is open
  useEffect(() => {
    const modalOpen = Boolean(selectedProductModal) || isCartOpen;
    if (modalOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [selectedProductModal, isCartOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (selectedProductModal) setSelectedProductModal(null);
      if (isCartOpen) setIsCartOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedProductModal, isCartOpen]);

  // Apply the cafe's default language unless the guest already picked one.
  useEffect(() => {
    const dl = cafeInfo?.defaultLang;
    if (dl !== 'uk' && dl !== 'hu' && dl !== 'en') return;
    if (typeof window !== 'undefined' && localStorage.getItem('aura_lang')) return;
    if (lang === dl) return;
    changeLanguage(dl as 'uk' | 'hu' | 'en');
  }, [cafeInfo?.defaultLang, lang, changeLanguage]);

  const openProductModal = (prod: Product) => {
    setSelectedProductModal(prod);
    setModalQty(getQty(prod.id) > 0 ? getQty(prod.id) : 1);
    setIsJustAdded(false);
    triggerStepperHaptic();
  };

  const handleModalIncrement = () => {
    setModalQty(prev => prev + 1);
    playStepperSound();
  };

  const handleModalDecrement = () => {
    if (modalQty <= 1) return;
    setModalQty(prev => prev - 1);
    playStepperSound();
  };

  const handleAddModalToCart = (e?: React.MouseEvent) => {
    if (!selectedProductModal) return;
    const prodId = selectedProductModal.id;
    const targetQty = modalQty;
    setQty(prodId, targetQty);
    playStepperSound();
    setBouncingCart(true);
    setTimeout(() => setBouncingCart(false), 300);
    setIsJustAdded(true);
    setTimeout(() => setIsJustAdded(false), 1400);
    triggerCartToast(targetQty);
    if (e) {
      const id = Date.now();
      setFloaters(prev => [...prev, { id, x: e.clientX, y: e.clientY }]);
      setTimeout(() => setFloaters(prev => prev.filter(f => f.id !== id)), 800);
    }
  };

  const handleAddToCart = (productId: string, e?: React.MouseEvent) => {
    addItem(productId);
    playStepperSound();
    setBouncingCart(true);
    setTimeout(() => setBouncingCart(false), 300);
    triggerCartToast(1);
    if (e) {
      const id = Date.now();
      setFloaters(prev => [...prev, { id, x: e.clientX, y: e.clientY }]);
      setTimeout(() => setFloaters(prev => prev.filter(f => f.id !== id)), 800);
    }
  };

  const handleIncrementCart = (productId: string, e?: React.MouseEvent) => {
    incrementItem(productId);
    playStepperSound();
    if (e) {
      const id = Date.now();
      setFloaters(prev => [...prev, { id, x: e.clientX, y: e.clientY }]);
      setTimeout(() => setFloaters(prev => prev.filter(f => f.id !== id)), 800);
    }
  };

  const handleDecrementCart = (productId: string) => {
    decrementItem(productId);
    playStepperSound();
  };

  const handleRemoveFromCart = (productId: string) => {
    removeItem(productId);
    playStepperSound();
  };

  const getProductQty = (id: string) => getQty(id);

  const filteredProducts = activeCategory
    ? products.filter(p => p.categoryId === activeCategory)
    : products;

  const getCategoryName = (cat: Category) => {
    if (lang === 'hu') return cat.nameHu;
    if (lang === 'en') return cat.nameEn;
    return cat.nameUk;
  };

  const getProductName = (prod: Product) => {
    if (lang === 'hu') return prod.nameHu;
    if (lang === 'en') return prod.nameEn;
    return prod.nameUk;
  };

  const getProductDesc = (prod: Product) => {
    if (lang === 'hu') return prod.descriptionHu;
    if (lang === 'en') return prod.descriptionEn;
    return prod.descriptionUk;
  };

  const getProductIngredients = (prod: Product) => {
    const raw = lang === 'hu' ? prod.ingredientsHu : lang === 'en' ? prod.ingredientsEn : prod.ingredientsUk;
    if (!raw) return [];
    return raw.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF6EE] text-[#4A3B32]">
        <div className="w-12 h-12 border-2 border-[#C09E6D] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-display tracking-widest text-sm uppercase">Світ Кави QR Меню</p>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-[#FAF6EE] font-sans overflow-x-clip">
      {floaters.map(f => (
        <motion.div
          key={f.id}
          initial={{ opacity: 1, scale: 1, x: f.x - 20, y: f.y - 20 }}
          animate={{ opacity: 0, scale: 1.8, y: f.y - 120, x: f.x - 10 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="fixed pointer-events-none z-50 text-[#C09E6D] font-bold text-lg"
        >
          ☕ +1
        </motion.div>
      ))}

      <Header
        headerRef={headerRef}
        cafeInfo={cafeInfo}
        isAdminLoggedIn={isAdminLoggedIn}
        lang={lang}
        changeLanguage={changeLanguage}
        totalCartItemsCount={totalCartItemsCount}
        bouncingCart={bouncingCart}
        cartButtonRef={cartButtonRef}
        onOpenCart={() => setIsCartOpen(true)}
        t={t}
        tableNumber={tableNumber}
      />

      <TextBanner
        banner={textBanner}
        products={products}
        headerHeight={headerHeight}
        onOpenProduct={openProductModal}
        t={t}
      />

      <HeroBanner cafeInfo={cafeInfo} lang={lang} t={t} />

      <main className="w-full max-w-4xl mx-auto px-4 py-8 flex-1">
        <AnimatePresence mode="wait">
          {!activeCategory ? (
            <motion.div
              key="categories-grid"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
            >
              <div className="flex justify-center mb-8">
                <span className="inline-flex items-center px-4 py-2 text-sm sm:text-base uppercase tracking-wider font-bold text-[#FAF6EE] bg-[#C09E6D] rounded-full shadow-sm">
                  {t('menuHeaderTitle')}
                </span>
              </div>
              {categories.length === 0 ? (
                <div className="py-14 text-center flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-[#F1ECE3] border border-[#E6DFD5] flex items-center justify-center">
                    <Coffee className="w-8 h-8 text-[#C09E6D]" strokeWidth={1.6} />
                  </div>
                  <p className="font-display text-lg sm:text-xl font-semibold text-[#4A3B32]">{t('menuComingSoon')}</p>
                  <p className="text-sm text-[#8E7A68] max-w-xs leading-relaxed">{t('menuComingSoonHint')}</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3.5 sm:gap-4">
                  {categories.map((cat, catIndex) => (
                    <CategoryCard
                      key={cat.id}
                      category={cat}
                      index={catIndex}
                      name={getCategoryName(cat)}
                      onSelect={setActiveCategory}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="products-view"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
            >
              <div className="flex flex-col gap-3 pb-4 border-b border-[#E6DFD5]">
                <button
                  onClick={() => setActiveCategory(null)}
                  className="inline-flex items-center gap-2.5 text-sm sm:text-base uppercase tracking-wider font-bold text-[#FAF6EE] bg-[#C09E6D] hover:bg-[#ad8b5b] px-4 py-2 rounded-full shadow-sm active:scale-95 transition-all self-center cursor-pointer"
                >
                  <ArrowLeft className="w-4.5 h-4.5 stroke-[2.5]" />
                  <span>{t('backToCategories')}</span>
                </button>
                <div className="flex items-center justify-between gap-3 w-full">
                  <div className="flex items-center gap-3">
                    {categories.find(c => c.id === activeCategory)?.photo && (
                      <div className="relative w-9 h-9 rounded-full overflow-hidden border border-[#E6DFD5] shrink-0">
                        <Image
                          src={categories.find(c => c.id === activeCategory)!.photo}
                          alt="Category Mini"
                          fill
                          sizes="36px"
                          className="object-cover"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}
                    <h3 className="font-display font-semibold text-xl sm:text-2xl text-[#231913] uppercase tracking-wider">
                      {getCategoryName(categories.find(c => c.id === activeCategory)!)}
                    </h3>
                  </div>
                  <h3 className="font-display font-semibold text-xl sm:text-2xl text-[#231913] uppercase tracking-wider lining-nums">
                    {filteredProducts.length}
                  </h3>
                </div>
              </div>

              {filteredProducts.length === 0 ? (
                <div className="py-16 text-center flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-[#F1ECE3] border border-[#E6DFD5] flex items-center justify-center">
                    <Coffee className="w-8 h-8 text-[#C09E6D]" strokeWidth={1.6} />
                  </div>
                  <p className="font-display text-lg sm:text-xl font-semibold text-[#4A3B32]">{t('dishesEmpty')}</p>
                  <p className="text-sm text-[#8E7A68] max-w-xs leading-relaxed">{t('dishesEmptyHint')}</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-5">
                  {filteredProducts.map((prod, index) => (
                    <ProductCard
                      key={prod.id}
                      product={prod}
                      qty={getProductQty(prod.id)}
                      index={index}
                      name={getProductName(prod)}
                      priceCurrency={t('priceCurrency')}
                      onOpen={openProductModal}
                      t={t}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <ProductModal
        product={selectedProductModal}
        headerHeight={headerHeight}
        cartButtonRect={cartButtonRect}
        cartToast={cartToast}
        modalQty={modalQty}
        isJustAdded={isJustAdded}
        recommendedProducts={recommendedProducts}
        recIsDragging={recIsDragging}
        recScrollRef={recScrollRef}
        totalCartItemsCount={totalCartItemsCount}
        bouncingCart={bouncingCart}
        getProductName={getProductName}
        getProductDesc={getProductDesc}
        getProductIngredients={getProductIngredients}
        t={t}
        onClose={() => setSelectedProductModal(null)}
        onDecrementQty={handleModalDecrement}
        onIncrementQty={handleModalIncrement}
        onAddToCart={handleAddModalToCart}
        onOpenProduct={openProductModal}
        onOpenCart={() => setIsCartOpen(true)}
        onRecPointerDown={handleRecPointerDown}
        onRecPointerUp={handleRecPointerUp}
        onRecPointerMove={handleRecPointerMove}
      />

      <CartDrawer
        isOpen={isCartOpen}
        cart={cart}
        products={products}
        totalCartPrice={totalCartPrice}
        getProductName={getProductName}
        t={t}
        onClose={() => setIsCartOpen(false)}
        onDecrement={handleDecrementCart}
        onIncrement={handleIncrementCart}
        onRemove={handleRemoveFromCart}
      />

      <footer className="mt-8 py-6 border-t border-[#E6DFD5] text-center bg-[#FDFBF7]">
        <p
          onMouseDown={handleTouchStart}
          onMouseUp={handleTouchEnd}
          onMouseLeave={handleTouchEnd}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onContextMenu={(e) => e.preventDefault()}
          className="text-xs sm:text-sm text-[#8E7A68] tracking-widest uppercase font-medium cursor-default select-none [-webkit-touch-callout:none] touch-manipulation"
        >
          &copy; {new Date().getFullYear()} {getCafeName(cafeInfo, lang) || t('appName')}
        </p>
      </footer>

      <ScrollToTop visible={showScrollTop} label={t('scrollToTop')} onClick={scrollToTop} />

      <AdPopup
        products={products}
        onOpenProduct={openProductModal}
        initialAd={initialData?.advertising ? (initialData.advertising as unknown as Advertising) : undefined}
        t={t}
      />

      <NotAdminModal
        isOpen={showNotAdminPopup}
        logo={cafeInfo?.logo ?? null}
        title={t('notAdminPopupTitle')}
        text={t('notAdminPopupText')}
        okLabel={t('notAdminOk')}
        onOk={() => setShowNotAdminPopup(false)}
      />
    </div>
  );
}