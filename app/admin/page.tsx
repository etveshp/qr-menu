'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Cropper from 'react-easy-crop';
import {
  getCafeInfo, 
  updateCafeInfo, 
  getCategories, 
  saveCategory, 
  deleteCategory, 
  reorderCategories,
  getProducts, 
  saveProduct, 
  deleteProduct,
  reorderProducts,
  getAdvertising,
  saveAdvertising,
  getTextBanner,
  saveTextBanner,
  subscribeToAuth,
  loginWithEmail,
  loginWithGoogle,
  resetUserPassword,
  logoutUser,
  isUserAdmin,
  hasAdminAccess,
  handleRecoveryToken,
  supabase,
  CafeInfo,
  Category,
  Product,
  Advertising,
  TextBanner,
  getCafeName,
  getCafeOwnerName,
  getCafeAdminGreeting,
  getRandomGreeting
} from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import { TRANSLATIONS, ADVERTISING_FEATURES, TEXT_BANNER_FEATURES } from '@/lib/translations';
import { useToast } from '@/components/Toast';
import { 
  Coffee, 
  Settings, 
  Grid, 
  ShoppingBag, 
  QrCode, 
  LogOut, 
  Plus, 
  Trash2, 
  Edit2, 
  ArrowLeft, 
  Save, 
  Upload, 
  AlertCircle,
  Camera,
  Utensils,
  X,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  Check,
  Loader2,
  MoreVertical,
  Megaphone,
} from 'lucide-react';
import QRCode from 'qrcode';
import { LanguageSelector } from '@/components/LanguageSelector';
import { ImageCropModal } from '@/components/admin/ImageCropModal';
import { DatePicker } from '@/components/admin/DatePicker';
import { ConfirmModal } from '@/components/admin/ConfirmModal';
import { QrGenerator } from '@/components/admin/QrGenerator';
import { AdminDrawer } from '@/components/admin/AdminDrawer';
import { ActionCard } from '@/components/admin/ActionCard';
import { SortableActionCardGrid } from '@/components/admin/SortableActionCardGrid';
import { RecommendedProductsPicker } from '@/components/admin/RecommendedProductsPicker';
import { useLanguage } from '@/hooks/use-language';
import { getFriendlyErrorMessage } from '@/lib/errors';
import { NotAdminModal } from '@/components/NotAdminModal';

const LANG_CODE: Record<string, string> = { uk: 'UA', hu: 'HU', en: 'EN' };

const WELCOME_KEYS = ['welcomeMsg1', 'welcomeMsg2', 'welcomeMsg3', 'welcomeMsg4', 'welcomeMsg5'] as const;

export default function AdminPage() {
  const { showToast } = useToast();
  const { lang, changeLanguage, t } = useLanguage();
  const router = useRouter();

  const [showNotAdminPopup, setShowNotAdminPopup] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPasswordInput, setCurrentPasswordInput] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [changePassLoading, setChangePassLoading] = useState(false);
  const [changePassError, setChangePassError] = useState('');
  // Fields highlighted after a "required field" validation miss: 'current' | 'new' | 'confirm'
  const [changePassInvalidFields, setChangePassInvalidFields] = useState<string[]>([]);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<'signin' | 'reset'>('signin');
  const [emailInput, setEmailInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [showPasswordToggle, setShowPasswordToggle] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [googleLoading, setGoogleLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string>('');
  const [authSuccess, setAuthSuccess] = useState<string>('');

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  // True once the persisted "admin session" flag has been restored from
  // storage. Until then we render a spinner instead of the login form so a
  // signed-in admin never sees the login view flash on refresh.
  const [authRestored, setAuthRestored] = useState<boolean>(false);

  // Restore the persisted "admin session" flag only after mount to avoid
  // server/client hydration mismatch (server always renders the spinner).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored =
      sessionStorage.getItem('aura_admin_auth') === 'true' ||
      localStorage.getItem('aura_admin_auth') === 'true';
    if (stored) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsAuthenticated(true);
    }
    setAuthRestored(true);
  }, []);

  // Welcome popup: shown once per session when the admin enters the cabinet.
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeMsgKey, setWelcomeMsgKey] = useState<typeof WELCOME_KEYS[number]>('welcomeMsg1');
  const hasShownWelcomeRef = useRef(false);

  // Marks an in-flight email/password sign-in so the auto-detected (e.g.
  // Google) non-admin path does not override the password-flow modal.
  const isEmailAuthRef = useRef(false);

  // Shared auth handling. Admins open the cabinet; non-admins are signed out.
  // Non-admins who arrive via OAuth (e.g. Google) are silently bounced back
  // to the menu, while the email/password flow shows its own modal.
  const handleAuthUser = useCallback(async (user: User | null) => {
    setCurrentUser(user);
    const admin = user && (await hasAdminAccess(user));
    if (admin) {
      setIsAuthenticated(true);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('aura_admin_auth', 'true');
        localStorage.setItem('aura_admin_auth', 'true');
        // Очищаємо залишки токенів/параметрів сесії з URL (напр. після OAuth
        // redirect). Інакше supabase при наступних завантаженнях знову парсить
        // стару URL-сесію і логує "Session as retrieved from URL was issued
        // over 120s ago, URL could be stale".
        const cleanUrl = window.location.pathname + window.location.search;
        if (window.location.hash) window.history.replaceState({}, '', cleanUrl);
      }
      isEmailAuthRef.current = false;
    } else {
      setIsAuthenticated(false);
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('aura_admin_auth');
        localStorage.removeItem('aura_admin_auth');
      }
      // Non-admins must not keep a session: sign them out immediately.
      if (user) {
        await logoutUser();
        if (!isEmailAuthRef.current) router.replace('/');
      }
    }
  }, [router]);

  // Subscribe to Supabase Auth
  useEffect(() => {
    const unsubscribe = subscribeToAuth(handleAuthUser);
    return () => unsubscribe();
  }, [handleAuthUser]);

  // On first load (e.g. a fresh Google OAuth redirect) recover the session
  // explicitly so admins land in the cabinet and non-admins are dropped back
  // to the menu, even if the auth subscription does not emit initially.
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      void handleAuthUser(data.session?.user ?? null);
    });
  }, [handleAuthUser]);

  // Password recovery: when the admin arrives via the reset link, show the
  // change-password form instead of the login/cabinet screen.
  useEffect(() => {
    handleRecoveryToken().then((isRecovery) => {
      if (isRecovery) setShowChangePassword(true);
    });
  }, []);

  // App Data State
  const [cafeInfo, setCafeInfo] = useState<CafeInfo | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);  const [loading, setLoading] = useState<boolean>(true);

  // Active Admin Tab
  const [activeTab, setActiveTab] = useState<'cafe' | 'categories' | 'products' | 'qr' | 'advertising'>('cafe');

  // Form states - Cafe Info
  const [cafeForm, setCafeForm] = useState<CafeInfo>({
    ownerNameUk: '',
    ownerNameHu: '',
    ownerNameEn: '',
    nameUk: '',
    nameHu: '',
    nameEn: '',
    descriptionUk: '',
    descriptionHu: '',
    descriptionEn: '',
    banner: '',
    logo: '',
    instagram: '',
    bannerScale: 1,
    bannerX: 50,
    bannerY: 50,
    logoScale: 1,
    logoX: 50,
    logoY: 50
  });

  // Load cached cafe info after mount to avoid SSR hydration mismatch.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const cached = localStorage.getItem('cafeInfo');
      if (cached) {
        const parsed = JSON.parse(cached) as CafeInfo;
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCafeInfo(parsed);
        setCafeForm(prev => ({ ...prev, ...parsed }));
      }
    } catch (e) {
      // ignore invalid cache
    }
  }, []);

  // Welcome popup: shown once per session when the admin enters the cabinet,
  // but only when the admin greeting toggle is enabled in cafe settings.
  useEffect(() => {
    if (!isAuthenticated || !currentUser || hasShownWelcomeRef.current) return;
    if (!cafeInfo?.greetingAdminEnabled) return;
    hasShownWelcomeRef.current = true;
    if (typeof window !== 'undefined' && sessionStorage.getItem('aura_admin_welcome_shown') === 'true') {
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setWelcomeMsgKey(WELCOME_KEYS[Math.floor(Math.random() * WELCOME_KEYS.length)]);
    setShowWelcome(true);
    try {
      sessionStorage.setItem('aura_admin_welcome_shown', 'true');
    } catch {
      // ignore
    }
  }, [isAuthenticated, currentUser, cafeInfo?.greetingAdminEnabled]);

  // Form states - Category
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isCatDrawerOpen, setIsCatDrawerOpen] = useState<boolean>(false);
  const [catForm, setCatForm] = useState<{
    id: string;
    nameUk: string;
    nameHu: string;
    nameEn: string;
    photo: string;
    photoX: number;
    photoY: number;
    photoScale: number;
    photoOriginal: string;
  }>({
    id: '',
    nameUk: '',
    nameHu: '',
    nameEn: '',
    photo: '',
    photoX: 50,
    photoY: 50,
    photoScale: 1,
    photoOriginal: ''
  });

  // Form states - Product
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isProdDrawerOpen, setIsProdDrawerOpen] = useState<boolean>(false);

  // Category filter for the Menu (products) tab
  const [menuFilterCategoryId, setMenuFilterCategoryId] = useState<string>('all');

  // For the "all" view, group products by category in menu order (categories
  // already sorted by sort_order); inside each category products keep sort_order.
  const sortedAllProducts = useMemo(() => {
    const byCategory = new Map<string, Product[]>();
    for (const p of products) {
      const arr = byCategory.get(p.categoryId) ?? [];
      arr.push(p);
      byCategory.set(p.categoryId, arr);
    }
    const sortByOrder = (a: Product, b: Product) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
    const result: Product[] = [];
    for (const cat of categories) {
      const group = byCategory.get(cat.id) ?? [];
      group.sort(sortByOrder);
      result.push(...group);
    }
    const included = new Set(result.map((p) => p.id));
    for (const p of products) {
      if (!included.has(p.id)) result.push(p);
    }
    return result;
  }, [categories, products]);

  const filteredMenuProducts = menuFilterCategoryId === 'all'
    ? sortedAllProducts
    : products
        .filter((p) => p.categoryId === menuFilterCategoryId)
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));

  // Reorder categories (drag & drop) — optimistic update + persist.
  const handleReorderCategories = async (orderedIds: string[]) => {
    const prev = categories;
    const byId = new Map(prev.map((c) => [c.id, c]));
    const next: Category[] = [];
    orderedIds.forEach((id, i) => {
      const cat = byId.get(id);
      if (cat) next.push({ ...cat, sortOrder: i });
    });
    setCategories(next);
    try {
      await reorderCategories(orderedIds);
    } catch (err) {
      setCategories(prev);
      showToast(err instanceof Error ? err.message : t('reorderError'), 'error');
    }
  };

  // Reorder products within one category (drag & drop) — optimistic + persist.
  const handleReorderProducts = async (orderedIds: string[]) => {
    const prev = products;
    const byId = new Map(prev.map((p) => [p.id, p]));
    const positions = new Map(orderedIds.map((id, i) => [id, i]));
    const next = prev.map((p) =>
      positions.has(p.id) ? { ...p, sortOrder: positions.get(p.id)! } : p
    );
    setProducts(next);
    try {
      await reorderProducts(orderedIds);
    } catch (err) {
      setProducts(prev);
      showToast(err instanceof Error ? err.message : t('reorderError'), 'error');
    }
  };

  // Recommended products picker (drawer for choosing products for "Ідеально смакує разом")
  const [isRecPickerOpen, setIsRecPickerOpen] = useState<boolean>(false);
  const [recPickerSession, setRecPickerSession] = useState<number>(0);

  const openRecPicker = () => {
    setRecPickerSession(s => s + 1);
    setIsRecPickerOpen(true);
  };

  // Drag-to-scroll state for the category filter pills (mouse drag; touch uses native swipe)
  const pillsScrollRef = useRef<HTMLDivElement>(null);
  const [pillsIsMouseDown, setPillsIsMouseDown] = useState(false);
  const [pillsStartX, setPillsStartX] = useState(0);
  const [pillsScrollLeft, setPillsScrollLeft] = useState(0);
  const [pillsIsDragging, setPillsIsDragging] = useState(false);

  const handlePillsPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'touch' || !pillsScrollRef.current) return;
    setPillsIsMouseDown(true);
    setPillsIsDragging(false);
    setPillsStartX(e.clientX - pillsScrollRef.current.offsetLeft);
    setPillsScrollLeft(pillsScrollRef.current.scrollLeft);
  };

  const handlePillsPointerUp = () => {
    setPillsIsMouseDown(false);
    setTimeout(() => setPillsIsDragging(false), 50);
  };

  const handlePillsPointerMove = (e: React.PointerEvent) => {
    if (e.pointerType === 'touch' || !pillsIsMouseDown || !pillsScrollRef.current) return;
    const x = e.clientX - pillsScrollRef.current.offsetLeft;
    const walk = (x - pillsStartX) * 1.5;
    if (Math.abs(x - pillsStartX) > 5) setPillsIsDragging(true);
    pillsScrollRef.current.scrollLeft = pillsScrollLeft - walk;
  };

  // Kebab card actions
  const [openActionsId, setOpenActionsId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ kind: 'category' | 'product'; id: string; name: string; productsCount?: number } | null>(null);
  const [prodForm, setProdForm] = useState<{
    id: string;
    categoryId: string;
    nameUk: string;
    nameHu: string;
    nameEn: string;
    descriptionUk: string;
    descriptionHu: string;
    descriptionEn: string;
    ingredientsUk: string;
    ingredientsHu: string;
    ingredientsEn: string;
    price: number;
    photo: string;
    photoOriginal: string;
    recommendedIds: string[];
  }>({
    id: '',
    categoryId: '',
    nameUk: '',
    nameHu: '',
    nameEn: '',
    descriptionUk: '',
    descriptionHu: '',
    descriptionEn: '',
    ingredientsUk: '',
    ingredientsHu: '',
    ingredientsEn: '',
    price: 0,
    photo: '',
    photoOriginal: '',
    recommendedIds: []
  });

  // QR Code generator states
  const [qrTableNumber, setQrTableNumber] = useState<string>('1');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  // Advertising form state
  const [adForm, setAdForm] = useState<Advertising>({ photo: '', delaySeconds: 5, enabled: false });

  // Save button action animation states
  const [cafeSaveStatus, setCafeSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [catSaveStatus, setCatSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [prodSaveStatus, setProdSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [cropBannerStatus, setCropBannerStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [cropLogoStatus, setCropLogoStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [adSaveStatus, setAdSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [isAdDrawerOpen, setIsAdDrawerOpen] = useState<boolean>(false);

  // Text banner form + drawer state
  const [textBannerForm, setTextBannerForm] = useState<TextBanner>({ text: '', categoryId: '', productId: '', enabled: false });
  const [textBannerSaveStatus, setTextBannerSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [isTextBannerDrawerOpen, setIsTextBannerDrawerOpen] = useState<boolean>(false);

  // Refs for hidden file inputs
  const bannerFileInputRef = useRef<HTMLInputElement>(null);
  const logoFileInputRef = useRef<HTMLInputElement>(null);
  const catFileInputRef = useRef<HTMLInputElement>(null);
  const prodFileInputRef = useRef<HTMLInputElement>(null);
  const adFileInputRef = useRef<HTMLInputElement>(null);

  // react-easy-crop states for Banner
  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(1);
  const [tempBannerImg, setTempBannerImg] = useState<string | null>(null);
  const [isBannerCropModalOpen, setIsBannerCropModalOpen] = useState<boolean>(false);
  const [isDeleteBannerModalOpen, setIsDeleteBannerModalOpen] = useState<boolean>(false);
  const [pendingCropData, setPendingCropData] = useState<{ pixels: { x: number; y: number; width: number; height: number } | null }>({ pixels: null });

  // react-easy-crop states for Logo
  const [logoCrop, setLogoCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [logoZoom, setLogoZoom] = useState<number>(1);
  const [tempLogoImg, setTempLogoImg] = useState<string | null>(null);
  const [isLogoCropModalOpen, setIsLogoCropModalOpen] = useState<boolean>(false);
  const [isDeleteLogoModalOpen, setIsDeleteLogoModalOpen] = useState<boolean>(false);
  const [pendingLogoCropData, setPendingLogoCropData] = useState<{ pixels: { x: number; y: number; width: number; height: number } | null }>({ pixels: null });

  // react-easy-crop states for Category photo (4:3)
  const [catCrop, setCatCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [catZoom, setCatZoom] = useState<number>(1);
  const [tempCatImg, setTempCatImg] = useState<string | null>(null);
  const [isCatCropModalOpen, setIsCatCropModalOpen] = useState<boolean>(false);
  const [isDeleteCatPhotoModalOpen, setIsDeleteCatPhotoModalOpen] = useState<boolean>(false);
  const [pendingCatCropData, setPendingCatCropData] = useState<{ pixels: { x: number; y: number; width: number; height: number } | null }>({ pixels: null });

  // react-easy-crop states for Advertising photo (9:16)
  const [adCrop, setAdCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [adZoom, setAdZoom] = useState<number>(1);
  const [tempAdImg, setTempAdImg] = useState<string | null>(null);
  const [isAdCropModalOpen, setIsAdCropModalOpen] = useState<boolean>(false);
  const [isDeleteAdPhotoModalOpen, setIsDeleteAdPhotoModalOpen] = useState<boolean>(false);
  const [pendingAdCropData, setPendingAdCropData] = useState<{ pixels: { x: number; y: number; width: number; height: number } | null }>({ pixels: null });

  // react-easy-crop states for Product photo (4:3)
  const [prodCrop, setProdCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [prodZoom, setProdZoom] = useState<number>(1);
  const [tempProdImg, setTempProdImg] = useState<string | null>(null);
  const [isProdCropModalOpen, setIsProdCropModalOpen] = useState<boolean>(false);
  const [isDeleteProdPhotoModalOpen, setIsDeleteProdPhotoModalOpen] = useState<boolean>(false);
  const [pendingProdCropData, setPendingProdCropData] = useState<{ pixels: { x: number; y: number; width: number; height: number } | null }>({ pixels: null });

  const onCropChange = (newCrop: { x: number; y: number }) => {
    setCrop(newCrop);
  };

  const onZoomChange = (newZoom: number) => {
    setZoom(newZoom);
  };

  const onCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
    if (croppedAreaPixels) {
      setPendingCropData({ pixels: croppedAreaPixels });
    }
  };

  const openBannerCropModal = (imageSrc?: string) => {
    // Re-open the full pre-crop image at default scale so the admin can adjust
    // the crop again from the original, not from the already-cropped result.
    const srcToUse = imageSrc || cafeForm.bannerOriginal || cafeForm.banner;
    if (!srcToUse) return;
    setTempBannerImg(srcToUse);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setPendingCropData({ pixels: null });
    setIsBannerCropModalOpen(true);
  };

  const applyBannerCrop = async () => {
    if (tempBannerImg && pendingCropData.pixels) {
      const cropped = await cropImageToWebP(tempBannerImg, pendingCropData.pixels, 16 / 9, 0.75);
      if (cropped) {
        setCafeForm(prev => ({
          ...prev,
          banner: cropped,
          bannerX: 50,
          bannerY: 50,
          bannerScale: 1
        }));
      }
    }
    setIsBannerCropModalOpen(false);
  };

  const onLogoCropChange = (newCrop: { x: number; y: number }) => {
    setLogoCrop(newCrop);
  };

  const onLogoZoomChange = (newZoom: number) => {
    setLogoZoom(newZoom);
  };

  const onLogoCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
    if (croppedAreaPixels) {
      setPendingLogoCropData({ pixels: croppedAreaPixels });
    }
  };

  const openLogoCropModal = (imageSrc?: string) => {
    const srcToUse = imageSrc || cafeForm.logoOriginal || cafeForm.logo;
    if (!srcToUse) return;
    setTempLogoImg(srcToUse);
    setLogoCrop({ x: 0, y: 0 });
    setLogoZoom(1);
    setPendingLogoCropData({ pixels: null });
    setIsLogoCropModalOpen(true);
  };

  const applyLogoCrop = async () => {
    if (tempLogoImg && pendingLogoCropData.pixels) {
      const cropped = await cropImageToWebP(tempLogoImg, pendingLogoCropData.pixels, 16 / 9, 0.85);
      if (cropped) {
        setCafeForm(prev => ({
          ...prev,
          logo: cropped,
          logoX: 50,
          logoY: 50,
          logoScale: 1
        }));
      }
    }
    setIsLogoCropModalOpen(false);
  };

  // Category photo crop handlers
  const onCatCropChange = (newCrop: { x: number; y: number }) => {
    setCatCrop(newCrop);
  };

  const onCatZoomChange = (newZoom: number) => {
    setCatZoom(newZoom);
  };

  const onCatCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
    if (croppedAreaPixels) {
      setPendingCatCropData({ pixels: croppedAreaPixels });
    }
  };

  const openCatCropModal = (imageSrc?: string) => {
    const srcToUse = imageSrc || catForm.photoOriginal || catForm.photo;
    if (!srcToUse) return;
    setTempCatImg(srcToUse);
    setCatCrop({ x: 0, y: 0 });
    setCatZoom(1);
    setPendingCatCropData({ pixels: null });
    setIsCatCropModalOpen(true);
  };

  const applyCatCrop = async () => {
    if (tempCatImg && pendingCatCropData.pixels) {
      const cropped = await cropImageToWebP(tempCatImg, pendingCatCropData.pixels, 4 / 3, 0.75);
      if (cropped) {
        setCatForm(prev => ({
          ...prev,
          photo: cropped,
          photoX: 50,
          photoY: 50,
          photoScale: 1
        }));
      }
    }
    setIsCatCropModalOpen(false);
  };

  // Advertising photo crop handlers (9:16)
  const onAdCropChange = (newCrop: { x: number; y: number }) => {
    setAdCrop(newCrop);
  };

  const onAdZoomChange = (newZoom: number) => {
    setAdZoom(newZoom);
  };

  const onAdCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
    if (croppedAreaPixels) {
      setPendingAdCropData({ pixels: croppedAreaPixels });
    }
  };

  const openAdCropModal = (imageSrc?: string) => {
    const srcToUse = imageSrc || adForm.photoOriginal || adForm.photo;
    if (!srcToUse) return;
    setTempAdImg(srcToUse);
    setAdCrop({ x: 0, y: 0 });
    setAdZoom(1);
    setPendingAdCropData({ pixels: null });
    setIsAdCropModalOpen(true);
  };

  const applyAdCrop = async () => {
    if (tempAdImg && pendingAdCropData.pixels) {
      const cropped = await cropImageToWebP(tempAdImg, pendingAdCropData.pixels, 9 / 16, 0.8);
      if (cropped) {
        setAdForm(prev => ({ ...prev, photo: cropped }));
      }
    }
    setIsAdCropModalOpen(false);
  };

  // Product photo crop handlers (4:3)
  const onProdCropChange = (newCrop: { x: number; y: number }) => {
    setProdCrop(newCrop);
  };

  const onProdZoomChange = (newZoom: number) => {
    setProdZoom(newZoom);
  };

  const onProdCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
    if (croppedAreaPixels) {
      setPendingProdCropData({ pixels: croppedAreaPixels });
    }
  };

  const openProdCropModal = (imageSrc?: string) => {
    const srcToUse = imageSrc || prodForm.photoOriginal || prodForm.photo;
    if (!srcToUse) return;
    setTempProdImg(srcToUse);
    setProdCrop({ x: 0, y: 0 });
    setProdZoom(1);
    setPendingProdCropData({ pixels: null });
    setIsProdCropModalOpen(true);
  };

  const applyProdCrop = async () => {
    if (tempProdImg && pendingProdCropData.pixels) {
      const cropped = await cropImageToWebP(tempProdImg, pendingProdCropData.pixels, 4 / 3, 0.75);
      if (cropped) {
        setProdForm(prev => ({ ...prev, photo: cropped }));
      }
    }
    setIsProdCropModalOpen(false);
  };

  // Declared as classic hoisted function to avoid access-before-declaration issues
  async function fetchData() {
    setLoading(true);
    try {
      const info = await getCafeInfo();
      const cats = await getCategories();
      const prods = await getProducts();
      const ad = await getAdvertising();
      const banner = await getTextBanner();
      
      setCafeInfo(info);
      setCafeForm(info);
      if (info) {
        setCrop({ x: 0, y: 0 });
        setZoom(info.bannerScale ?? 1);
      }
      setCategories(cats);
      setProducts(prods);
      setAdForm(ad);
      setTextBannerForm(banner);

      if (cats.length > 0 && !prodForm.categoryId) {
        setProdForm(prev => ({ ...prev, categoryId: cats[0].id }));
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  // Load data on mount
  useEffect(() => {
    setTimeout(() => {
      fetchData();
    }, 0);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps


  // Generate QR code
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const baseUrl = window.location.origin;
      const url = `${baseUrl}?table=${qrTableNumber}`;
      QRCode.toDataURL(url, {
        width: 300,
        margin: 2,
        color: {
          dark: '#3E2F26', // Brand dark
          light: '#FAF6EE' // Brand ivory
        }
      })
      .then(url => {
        setQrCodeDataUrl(url);
      })
      .catch(err => {
        console.error(err);
      });
    }
  }, [qrTableNumber]);

  // Google Sign-In Handler
  // After OAuth, Supabase redirects straight to /admin where getSession()
  // restores the session and opens the cabinet (see handleAuthUser).
  const handleGoogleLogin = async () => {
    setAuthError('');
    setAuthSuccess('');
    try {
      setGoogleLoading(true);
      await loginWithGoogle();
    } catch (err: any) {
      setAuthError(getFriendlyErrorMessage(err, lang));
      showToast(getFriendlyErrorMessage(err, lang), 'error');
    } finally {
      setGoogleLoading(false);
    }
  };

  // Email / Password / Reset Handler
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    if (!emailInput || !emailInput.includes('@')) {
      setAuthError(t('invalidEmail'));
      return;
    }

    if (authMode === 'reset') {
      try {
        setAuthLoading(true);
        await resetUserPassword(emailInput);
        setAuthSuccess(t('resetEmailSent'));
        showToast(t('resetEmailSent'), 'success');
      } catch (err: any) {
        setAuthError(getFriendlyErrorMessage(err, lang));
      } finally {
        setAuthLoading(false);
      }
      return;
    }

    if (!passwordInput || passwordInput.length < 6) {
      setAuthError(t('weakPassword'));
      return;
    }

    // Sign in
    try {
      isEmailAuthRef.current = true;
      setAuthLoading(true);
      const user = await loginWithEmail(emailInput, passwordInput);
      setCurrentUser(user);
      if (await hasAdminAccess(user)) {
        setIsAuthenticated(true);
        sessionStorage.setItem('aura_admin_auth', 'true');
        localStorage.setItem('aura_admin_auth', 'true');
        showToast(t('loginSuccess'), 'success');
      } else {
        await logoutUser();
        setShowNotAdminPopup(true);
      }
    } catch (err: any) {
      if (err?.code === 'invalid_credentials') {
        // Distinguish a wrong password (email is registered) from an
        // unregistered email. Supabase hides this by default, so we ask
        // the server-side RPC for the answer.
        let registered: boolean | null = null;
        if (supabase) {
          const res = await supabase.rpc('email_registered', { p_email: emailInput });
          registered = res.data ?? null;
        }
        if (registered === true) {
          setAuthError(t('wrongPassword'));
          showToast(t('wrongPassword'), 'error');
        } else if (registered === false) {
          setShowNotAdminPopup(true);
        } else {
          const friendly = getFriendlyErrorMessage(err, lang);
          setAuthError(friendly);
          showToast(friendly, 'error');
        }
      } else {
        const friendly = getFriendlyErrorMessage(err, lang);
        setAuthError(friendly);
        showToast(friendly, 'error');
      }
    } finally {
      isEmailAuthRef.current = false;
      setAuthLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangePassError('');
    if (!newPasswordInput || !confirmPasswordInput) {
      setChangePassInvalidFields([!newPasswordInput && 'new', !confirmPasswordInput && 'confirm'].filter(Boolean) as string[]);
      return;
    }
    setChangePassInvalidFields([]);
    if (!newPasswordInput || newPasswordInput.length < 6) {
      setChangePassError(t('passwordTooShort'));
      return;
    }
    if (newPasswordInput !== confirmPasswordInput) {
      setChangePassError(t('passwordsDoNotMatch'));
      return;
    }
    if (!supabase) {
      setChangePassError(getFriendlyErrorMessage({ message: 'Supabase not configured' }, lang));
      return;
    }
    try {
      setChangePassLoading(true);
      await supabase.auth.updateUser({ password: newPasswordInput });
      showToast(t('passwordUpdatedSuccess'), 'success');
      setNewPasswordInput('');
      setConfirmPasswordInput('');
      setShowChangePassword(false);
    } catch (err: any) {
      setChangePassError(getFriendlyErrorMessage(err, lang));
    } finally {
      setChangePassLoading(false);
    }
  };

  const handleChangePasswordSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangePassError('');
    const invalid: string[] = [!currentPasswordInput && 'current', !newPasswordInput && 'new', !confirmPasswordInput && 'confirm'].filter(Boolean) as string[];
    if (invalid.length > 0) {
      setChangePassInvalidFields(invalid);
      return;
    }
    setChangePassInvalidFields([]);
    if (!currentPasswordInput) {
      setChangePassError(t('currentPasswordIncorrect'));
      return;
    }
    if (!newPasswordInput || newPasswordInput.length < 6) {
      setChangePassError(t('passwordTooShort'));
      return;
    }
    if (newPasswordInput !== confirmPasswordInput) {
      setChangePassError(t('passwordsDoNotMatch'));
      return;
    }
    if (!supabase) {
      setChangePassError(getFriendlyErrorMessage({ message: 'Supabase not configured' }, lang));
      return;
    }
    try {
      setChangePassLoading(true);
      // Verify the current password by re-authenticating before allowing a change.
      const email = currentUser?.email;
      if (!email) {
        setChangePassError(t('currentPasswordIncorrect'));
        return;
      }
      const { error: verr } = await supabase.auth.signInWithPassword({ email, password: currentPasswordInput });
      if (verr) {
        setChangePassError(t('currentPasswordIncorrect'));
        return;
      }
      await supabase.auth.updateUser({ password: newPasswordInput });
      showToast(t('passwordUpdatedSuccess'), 'success');
      setCurrentPasswordInput('');
      setNewPasswordInput('');
      setConfirmPasswordInput('');
    } catch (err: any) {
      setChangePassError(getFriendlyErrorMessage(err, lang));
    } finally {
      setChangePassLoading(false);
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    setCurrentUser(null);
    setIsAuthenticated(false);
    sessionStorage.removeItem('aura_admin_auth');
    sessionStorage.removeItem('aura_admin_welcome_shown');
    localStorage.removeItem('aura_admin_auth');
    localStorage.removeItem('isAdmin');
    showToast(t('logoutSuccess'), 'info');
  };

  // Compress and convert image to WebP format to save storage space
  const compressAndConvertToWebP = (
    file: File,
    maxWidth: number,
    maxHeight: number,
    quality: number = 0.8
  ): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new window.Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calculate new dimensions maintaining aspect ratio
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(event.target?.result as string);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          
          // Generate WebP with specific quality
          const webpDataUrl = canvas.toDataURL('image/webp', quality);
          resolve(webpDataUrl);
        };
        img.onerror = () => {
          resolve(event.target?.result as string); // fallback to original data url on error
        };
        img.src = event.target?.result as string;
      };
      reader.onerror = () => {
        resolve('');
      };
      reader.readAsDataURL(file);
    });
  };

  // Crop the given image to a specific pixel area and return a WebP data URL.
  // `aspect` (width / height) is enforced on the output so the result always
  // has the exact ratio used in the crop modal (identical on every screen).
  const cropImageToWebP = (
    imageSrc: string,
    pixels: { x: number; y: number; width: number; height: number },
    aspect: number,
    quality: number = 0.8
  ): Promise<string> => {
    return new Promise((resolve) => {
      const img = new window.Image();
      // Loading a cross-origin (non-data:) image without CORS taints the
      // canvas, so export via toDataURL() is blocked. Request the image with
      // anonymous CORS so remote photos (e.g. Supabase Storage URLs) can be
      // re-drawn and exported; if the host does not allow CORS the image fails
      // to load and we fall back to the original source below.
      if (!imageSrc.startsWith('data:')) {
        img.crossOrigin = 'anonymous';
      }
      img.onload = () => {
        const canvas = document.createElement('canvas');

        // Derive the crop rect so its ratio matches `aspect` exactly
        let srcX = pixels.x;
        let srcY = pixels.y;
        let srcW = pixels.width;
        let srcH = pixels.height;

        if (srcW / srcH > aspect) {
          srcW = Math.round(srcH * aspect);
        } else {
          srcH = Math.round(srcW / aspect);
        }
        // Center the crop rect within the given pixels area
        srcX += Math.round((pixels.width - srcW) / 2);
        srcY += Math.round((pixels.height - srcH) / 2);

        // Clamp to the source image bounds
        srcW = Math.max(1, Math.min(srcW, img.width - srcX));
        srcH = Math.max(1, Math.min(srcH, img.height - srcY));

        const outW = Math.max(1, Math.round(srcW));
        const outH = Math.max(1, Math.round(outW / aspect));
        canvas.width = outW;
        canvas.height = outH;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(imageSrc);
          return;
        }
        ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, outW, outH);
        resolve(canvas.toDataURL('image/webp', quality));
      };
      img.onerror = () => {
        resolve(imageSrc);
      };
      img.src = imageSrc;
    });
  };

  // Image base64 conversion & compression utility
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'cafeBanner' | 'cafeLogo' | 'category' | 'product' | 'advertising') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input value so re-selecting same file triggers onChange
    e.target.value = '';

    // Define compression settings depending on image purpose to optimize storage size
    let maxWidth = 800;
    let maxHeight = 800;
    let quality = 0.8;

    if (target === 'cafeBanner') {
      maxWidth = 1200;
      maxHeight = 675; // 16:9 ratio
      quality = 0.75;
    } else if (target === 'cafeLogo') {
      maxWidth = 250;
      maxHeight = 250;
      quality = 0.85;
    } else if (target === 'category') {
      maxWidth = 600;
      maxHeight = 450; // 4:3 ratio
      quality = 0.75;
    } else if (target === 'product') {
      maxWidth = 600;
      maxHeight = 600;
      quality = 0.75;
    } else if (target === 'advertising') {
      maxWidth = 540;
      maxHeight = 960; // 9:16 ratio
      quality = 0.8;
    }

    try {
      const compressedBase64 = await compressAndConvertToWebP(file, maxWidth, maxHeight, quality);
      if (!compressedBase64) return;

      if (target === 'cafeBanner') {
        setCafeForm(prev => ({ ...prev, bannerOriginal: compressedBase64 }));
        openBannerCropModal(compressedBase64);
      } else if (target === 'cafeLogo') {
        setCafeForm(prev => ({ ...prev, logoOriginal: compressedBase64 }));
        openLogoCropModal(compressedBase64);
      } else if (target === 'category') {
        setCatForm(prev => ({ ...prev, photoOriginal: compressedBase64 }));
        openCatCropModal(compressedBase64);
      } else if (target === 'product') {
        setProdForm(prev => ({ ...prev, photoOriginal: compressedBase64 }));
        openProdCropModal(compressedBase64);
      } else if (target === 'advertising') {
        setAdForm(prev => ({ ...prev, photoOriginal: compressedBase64 }));
        openAdCropModal(compressedBase64);
      }
    } catch (err) {
      console.error("Error compressing image:", err);
    }
  };

  // Save Cafe Info
  const handleSaveCafe = async (e: React.FormEvent) => {
    e.preventDefault();
    setCafeSaveStatus('saving');
    try {
      await updateCafeInfo(cafeForm);
      await fetchData();
      setCafeSaveStatus('saved');
      showToast(t('updateSuccess'), 'success');
      setTimeout(() => {
        setCafeSaveStatus('idle');
      }, 2200);
    } catch (err: any) {
      setCafeSaveStatus('idle');
      showToast(err?.message || t('saveSettingsError'), 'error');
    }
  };

  // Advertising Actions
  const handleSaveAdvertising = async (e: React.FormEvent) => {
    e.preventDefault();
    if (adForm.enabled && !adForm.photo) {
      showToast(t('adRequiredPhoto'), 'error');
      return;
    }
    setAdSaveStatus('saving');
    try {
      await saveAdvertising(adForm);
      setAdSaveStatus('saved');
      showToast(t('adSaveSuccess'), 'success');
      setTimeout(() => {
        setAdSaveStatus('idle');
      }, 2200);
    } catch (err: any) {
      setAdSaveStatus('idle');
      showToast(err?.message || t('adSaveError'), 'error');
    }
  };

  // Advertising drawer open/close
  const openAdDrawer = async () => {
    setAdSaveStatus('idle');
    try {
      const ad = await getAdvertising();
      setAdForm(ad);
    } catch {
      // keep current form
    }
    setIsAdDrawerOpen(true);
  };

  const closeAdDrawer = () => {
    setIsAdDrawerOpen(false);
  };

  // Text banner drawer handlers
  const openTextBannerDrawer = async () => {
    setTextBannerSaveStatus('idle');
    try {
      const banner = await getTextBanner();
      setTextBannerForm(banner);
    } catch {
      // keep current form
    }
    setIsTextBannerDrawerOpen(true);
  };

  const closeTextBannerDrawer = () => {
    setIsTextBannerDrawerOpen(false);
  };

  const handleSaveTextBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textBannerForm.text.trim()) {
      showToast(t('textBannerRequiredText'), 'error');
      return;
    }
    setTextBannerSaveStatus('saving');
    try {
      await saveTextBanner(textBannerForm);
      setTextBannerSaveStatus('saved');
      showToast(t('textBannerSaveSuccess'), 'success');
      setTimeout(() => {
        setTextBannerSaveStatus('idle');
      }, 2200);
    } catch (err: any) {
      setTextBannerSaveStatus('idle');
      showToast(err?.message || t('textBannerSaveError'), 'error');
    }
  };

  // Category Actions
  const resetCatForm = () => {
    setEditingCategory(null);
    setCatForm({ id: '', nameUk: '', nameHu: '', nameEn: '', photo: '', photoX: 50, photoY: 50, photoScale: 1, photoOriginal: '' });
    setCatSaveStatus('idle');
    setIsCatDrawerOpen(false);
  };

  const openAddCategoryDrawer = () => {
    setEditingCategory(null);
    setCatForm({ id: '', nameUk: '', nameHu: '', nameEn: '', photo: '', photoX: 50, photoY: 50, photoScale: 1, photoOriginal: '' });
    setCatSaveStatus('idle');
    setIsCatDrawerOpen(true);
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catForm.nameUk || !catForm.photo) {
      showToast(t('requiredField'), 'error');
      return;
    }

    const id = editingCategory ? editingCategory.id : 'cat-' + Date.now();
    const newCat: Category = {
      id,
      nameUk: catForm.nameUk,
      nameHu: catForm.nameHu || catForm.nameUk,
      nameEn: catForm.nameEn || catForm.nameUk,
      photo: catForm.photo,
      photoX: catForm.photoX,
      photoY: catForm.photoY,
      photoScale: catForm.photoScale,
      photoOriginal: catForm.photoOriginal
    };

    setCatSaveStatus('saving');
    try {
      await saveCategory(newCat);
      setCatSaveStatus('saved');
      showToast(editingCategory ? t('categoryUpdatedSuccess') : t('addSuccess'), 'success');
      setTimeout(() => {
        resetCatForm();
      }, 1200);
      await fetchData();
    } catch (err: any) {
      setCatSaveStatus('idle');
      showToast(err?.message || t('saveCategoryError'), 'error');
    }
  };

  const handleEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setCatForm({
      id: cat.id,
      nameUk: cat.nameUk,
      nameHu: cat.nameHu,
      nameEn: cat.nameEn,
      photo: cat.photo,
      photoX: cat.photoX ?? 50,
      photoY: cat.photoY ?? 50,
      photoScale: cat.photoScale ?? 1,
      photoOriginal: cat.photoOriginal ?? ''
    });
    setCatSaveStatus('idle');
    setIsCatDrawerOpen(true);
  };

  const performDeleteCategory = async (id: string) => {
    try {
      await deleteCategory(id);
      await fetchData();
      showToast(t('categoryDeletedSuccess'), 'success');
    } catch (err: any) {
      showToast(err?.message || t('deleteCategoryError'), 'error');
    }
  };

  // Product Actions
  const resetProdForm = () => {
    setEditingProduct(null);
    setProdForm({
      id: '',
      categoryId: categories[0]?.id || '',
      nameUk: '',
      nameHu: '',
      nameEn: '',
      descriptionUk: '',
      descriptionHu: '',
      descriptionEn: '',
      ingredientsUk: '',
      ingredientsHu: '',
      ingredientsEn: '',
      price: 0,
      photo: '',
      photoOriginal: '',
      recommendedIds: []
    });
    setProdSaveStatus('idle');
    setIsProdDrawerOpen(false);
  };

  const openAddProductDrawer = () => {
    setEditingProduct(null);
    setProdForm({
      id: '',
      categoryId: categories[0]?.id || '',
      nameUk: '',
      nameHu: '',
      nameEn: '',
      descriptionUk: '',
      descriptionHu: '',
      descriptionEn: '',
      ingredientsUk: '',
      ingredientsHu: '',
      ingredientsEn: '',
      price: 0,
      photo: '',
      photoOriginal: '',
      recommendedIds: []
    });
    setProdSaveStatus('idle');
    setIsProdDrawerOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prodForm.nameUk || !prodForm.categoryId || !prodForm.photo) {
      showToast(t('requiredField'), 'error');
      return;
    }

    const id = editingProduct ? editingProduct.id : 'prod-' + Date.now();
    const newProd: Product = {
      id,
      categoryId: prodForm.categoryId,
      nameUk: prodForm.nameUk,
      nameHu: prodForm.nameHu || prodForm.nameUk,
      nameEn: prodForm.nameEn || prodForm.nameUk,
      descriptionUk: prodForm.descriptionUk,
      descriptionHu: prodForm.descriptionHu || prodForm.descriptionUk,
      descriptionEn: prodForm.descriptionEn || prodForm.descriptionUk,
      ingredientsUk: prodForm.ingredientsUk,
      ingredientsHu: prodForm.ingredientsHu || prodForm.ingredientsUk,
      ingredientsEn: prodForm.ingredientsEn || prodForm.ingredientsUk,
      price: Number(prodForm.price) || 0,
      photo: prodForm.photo,
      photoOriginal: prodForm.photoOriginal,
      recommendedIds: prodForm.recommendedIds
    };

    setProdSaveStatus('saving');
    try {
      await saveProduct(newProd);
      setProdSaveStatus('saved');
      showToast(editingProduct ? t('productUpdatedSuccess') : t('addSuccess'), 'success');
      setTimeout(() => {
        resetProdForm();
      }, 1200);
      await fetchData();
    } catch (err: any) {
      setProdSaveStatus('idle');
      showToast(err?.message || t('saveProductError'), 'error');
    }
  };

  const handleEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setProdForm({
      id: prod.id,
      categoryId: prod.categoryId,
      nameUk: prod.nameUk,
      nameHu: prod.nameHu,
      nameEn: prod.nameEn,
      descriptionUk: prod.descriptionUk,
      descriptionHu: prod.descriptionHu,
      descriptionEn: prod.descriptionEn,
      ingredientsUk: prod.ingredientsUk,
      ingredientsHu: prod.ingredientsHu,
      ingredientsEn: prod.ingredientsEn,
      price: prod.price,
      photo: prod.photo,
      photoOriginal: prod.photoOriginal ?? '',
      recommendedIds: prod.recommendedIds ?? []
    });
    setProdSaveStatus('idle');
    setIsProdDrawerOpen(true);
  };

  const performDeleteProduct = async (id: string) => {
    try {
      await deleteProduct(id);
      await fetchData();
      showToast(t('productDeletedSuccess'), 'success');
    } catch (err: any) {
      showToast(err?.message || t('deleteProductError'), 'error');
    }
  };

  if (showChangePassword) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-[#FAF6EE] px-4 py-12 font-sans text-[#4A3B32]">
        <div className="w-full max-w-md p-6 sm:p-8 bg-[#FDFBF7] rounded-3xl border border-[#E6DFD5] shadow-xl text-center">
          <div className="w-14 h-14 bg-[#3E2F26] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
            <Lock className="w-7 h-7 text-[#FAF6EE]" />
          </div>
          <h2 className="text-xl sm:text-2xl font-display font-medium tracking-wide mb-1 text-[#231913]">
            {t('changePasswordTitle')}
          </h2>
          <p className="text-[11px] sm:text-xs text-[#8E7A68] tracking-widest uppercase mb-4 font-semibold">
            {t('adminCabinet')}
          </p>
          <p className="text-xs text-[#7A6B63] mb-5 leading-relaxed text-left">{t('changePasswordDesc')}</p>

          {changePassError && (
            <div className="mb-4 p-3 bg-red-50/90 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2 text-left">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{changePassError}</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4 text-left">
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#8E7A68] mb-1.5 font-semibold">
                {t('newPasswordLabel')}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#A09084] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={newPasswordInput}
                  onChange={(e) => { setNewPasswordInput(e.target.value); if (changePassInvalidFields.length) setChangePassInvalidFields([]); }}
                  onFocus={() => { if (changePassInvalidFields.length) setChangePassInvalidFields([]); }}
                  placeholder={changePassInvalidFields.includes('new') ? t('requiredField') : t('newPasswordPlaceholder')}
                  className={`w-full pl-10 pr-4 py-2.5 bg-[#FAF6EE] border border-[#E6DFD5] text-[#231913] focus:outline-none focus:border-[#C09E6D] text-xs sm:text-sm rounded-xl ${changePassInvalidFields.includes('new') ? 'border-rose-300 placeholder:text-rose-600' : ''}`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-[#8E7A68] mb-1.5 font-semibold">
                {t('confirmNewPasswordLabel')}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#A09084] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={confirmPasswordInput}
                  onChange={(e) => { setConfirmPasswordInput(e.target.value); if (changePassInvalidFields.length) setChangePassInvalidFields([]); }}
                  onFocus={() => { if (changePassInvalidFields.length) setChangePassInvalidFields([]); }}
                  placeholder={changePassInvalidFields.includes('confirm') ? t('requiredField') : t('confirmNewPasswordPlaceholder')}
                  className={`w-full pl-10 pr-4 py-2.5 bg-[#FAF6EE] border border-[#E6DFD5] text-[#231913] focus:outline-none focus:border-[#C09E6D] text-xs sm:text-sm rounded-xl ${changePassInvalidFields.includes('confirm') ? 'border-rose-300 placeholder:text-rose-600' : ''}`}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={changePassLoading}
              className="w-full py-3 bg-[#3E2F26] text-[#FAF6EE] uppercase text-xs tracking-widest font-semibold hover:bg-[#231913] transition-colors rounded-xl disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              {changePassLoading && <Loader2 className="w-4 h-4 animate-spin text-[#C09E6D]" />}
              <span>{t('updatePasswordBtn')}</span>
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-[#E6DFD5] flex items-center justify-between">
            <Link href="/" className="inline-flex items-center gap-2 text-xs text-[#C09E6D] hover:text-[#3E2F26] tracking-wider uppercase font-semibold">
              <ArrowLeft className="w-4 h-4" />
              {t('backToMenu')}
            </Link>
            <LanguageSelector currentLang={lang} onChange={changeLanguage} />
          </div>
        </div>
      </main>
    );
  }

  // While restoring the persisted session flag, show a spinner so a
  // signed-in admin never sees the login form flash on refresh.
  if (!authRestored) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-[#FAF6EE] font-sans text-[#4A3B32]">
        <div className="w-12 h-12 border-2 border-[#C09E6D] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-display tracking-widest text-sm uppercase">Світ Кави QR Меню</p>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-[#FAF6EE] px-4 py-12 font-sans text-[#4A3B32]">
        <div className="w-full max-w-md p-6 sm:p-8 bg-[#FDFBF7] rounded-3xl border border-[#E6DFD5] shadow-xl text-center">
          {/* Logo & Cafe Name */}
          {cafeInfo?.logo ? (
            <div className="relative w-44 sm:w-52 h-16 sm:h-20 flex items-center justify-center mx-auto mb-4 overflow-hidden">
              <Image 
                src={cafeInfo.logo} 
                alt={getCafeName(cafeInfo, lang) || "Logo"} 
                fill 
                sizes="(min-width: 640px) 208px, 176px"
                className="object-contain" 
                referrerPolicy="no-referrer"
                unoptimized={cafeInfo.logo.startsWith('data:')}
              />
            </div>
          ) : (
            <div className="w-44 sm:w-52 h-16 sm:h-20 mx-auto mb-4" aria-hidden="true" />
          )}
          
          <h2 className="text-xl sm:text-2xl font-display font-medium tracking-wide mb-1 text-[#231913]">
            {cafeInfo ? (getCafeName(cafeInfo, lang) || t('appName')) : ''}
          </h2>
          <p className="text-[11px] sm:text-xs text-[#8E7A68] tracking-widest uppercase mb-6 font-semibold">
            {t('adminCabinet')}
          </p>

          {/* Error & Success Messages */}
          {authError && (
            <div className="mb-4 p-3 bg-red-50/90 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2 text-left">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{authError}</span>
            </div>
          )}
          {authSuccess && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-start gap-2 text-left">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{authSuccess}</span>
            </div>
          )}

          {/* Email / Password Forms */}
          {authMode === 'reset' ? (
            <form onSubmit={handleEmailAuth} className="space-y-4 text-left mb-4">
              <p className="text-xs text-[#7A6B63] mb-2 leading-relaxed">
                {t('resetPasswordDesc')}
              </p>
              <div>
                <label className="block text-xs uppercase tracking-wider text-[#8E7A68] mb-1.5 font-semibold">
                  {t('emailLabel')}
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-[#A09084] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#FAF6EE] border border-[#E6DFD5] text-[#231913] focus:outline-none focus:border-[#C09E6D] text-xs sm:text-sm rounded-xl"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3 bg-[#3E2F26] text-[#FAF6EE] uppercase text-xs tracking-widest font-semibold hover:bg-[#231913] transition-colors rounded-xl disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                {authLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{t('sendResetLink')}</span>
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode('signin'); setAuthError(''); setAuthSuccess(''); }}
                className="w-full text-center text-xs text-[#C09E6D] hover:underline font-semibold cursor-pointer"
              >
                {t('backToLogin')}
              </button>
            </form>
          ) : (
            <div className="space-y-4 text-left">
              <form onSubmit={handleEmailAuth} className="space-y-4">
                <div>
                  <label className="block text-xs uppercase tracking-wider text-[#8E7A68] mb-1.5 font-semibold">
                    {t('emailLabel')}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-[#A09084] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-[#FAF6EE] border border-[#E6DFD5] text-[#231913] focus:outline-none focus:border-[#C09E6D] text-xs sm:text-sm rounded-xl"
                      required
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs uppercase tracking-wider text-[#8E7A68] font-semibold">
                      {t('passwordLabel')}
                    </label>
                    <button
                      type="button"
                      onClick={() => { setAuthMode('reset'); setAuthError(''); setAuthSuccess(''); }}
                      className="text-[11px] text-[#C09E6D] hover:underline font-semibold cursor-pointer"
                    >
                      {t('forgotPassword')}
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-[#A09084] absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPasswordToggle ? 'text' : 'password'}
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 bg-[#FAF6EE] border border-[#E6DFD5] text-[#231913] focus:outline-none focus:border-[#C09E6D] text-xs sm:text-sm rounded-xl"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswordToggle(!showPasswordToggle)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A09084] hover:text-[#231913] p-1 cursor-pointer"
                    >
                      {showPasswordToggle ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={authLoading || googleLoading}
                  className="w-full py-3 bg-[#3E2F26] text-[#FAF6EE] uppercase text-xs tracking-widest font-semibold hover:bg-[#231913] transition-colors rounded-xl disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                >
                  {authLoading && <Loader2 className="w-4 h-4 animate-spin text-[#C09E6D]" />}
                  <span>{t('loginBtn')}</span>
                </button>
              </form>

              {/* Google Sign In Button Under Login */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={googleLoading || authLoading}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white hover:bg-[#FAF6EE] text-[#231913] border border-[#D5CBBF] hover:border-[#C09E6D] rounded-xl text-xs sm:text-sm font-semibold tracking-wide shadow-xs transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer"
              >
                {googleLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[#C09E6D]" />
                ) : (
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                )}
                <span>{t('loginWithGoogle')}</span>
              </button>
            </div>
          )}

          {/* Back to Menu */}
          <div className="mt-6 pt-5 border-t border-[#E6DFD5] flex items-center justify-between">
            <Link href="/" className="inline-flex items-center gap-2 text-xs text-[#C09E6D] hover:text-[#3E2F26] tracking-wider uppercase font-semibold">
              <ArrowLeft className="w-4 h-4" />
              {t('backToMenu')}
            </Link>
            <LanguageSelector currentLang={lang} onChange={changeLanguage} />
          </div>
        </div>

        <NotAdminModal
          isOpen={showNotAdminPopup}
          logo={cafeInfo?.logo ?? null}
          title={t('notAdminPopupTitle')}
          text={t('notAdminPopupText')}
          okLabel={t('notAdminOk')}
          onOk={() => {
            setShowNotAdminPopup(false);
            router.replace('/');
          }}
        />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FAF6EE] text-[#4A3B32] font-sans pb-16">
      {/* Upper Navigation Header */}
      <header className="sticky top-0 z-40 bg-[#FDFBF7] border-b border-[#E6DFD5] premium-shadow">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3 md:px-8">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-xl font-display font-medium text-[#231913] tracking-wide">{getCafeName(cafeInfo, lang) || t('adminCabinet')}</h1>
              {getCafeName(cafeInfo, lang) && (
                <p className="text-[10px] uppercase tracking-widest text-[#8E7A68]">{t('adminCabinet')}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Authenticated User Badge */}
            {currentUser && (
              <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 bg-[#FAF6EE] border border-[#E6DFD5] rounded-full">
                <div className="w-6 h-6 rounded-full bg-[#3E2F26] text-[#C09E6D] flex items-center justify-center font-serif font-bold text-[11px] overflow-hidden relative">
                  {currentUser.user_metadata?.avatar_url ? (
                    <Image
                      src={currentUser.user_metadata.avatar_url}
                      alt="User"
                      fill
                      sizes="24px"
                      className="object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span>
                      {currentUser.user_metadata?.full_name ? currentUser.user_metadata.full_name[0].toUpperCase() : currentUser.email ? currentUser.email[0].toUpperCase() : 'A'}
                    </span>
                  )}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-[#231913] leading-none">
                    {currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0]}
                  </span>
                  <span className="text-[9px] text-[#C09E6D] font-semibold uppercase tracking-wider">
                    {isUserAdmin(currentUser) ? t('roleAdmin') : t('roleCustomer')}
                  </span>
                </div>
              </div>
            )}

            <Link 
              href="/"
              className="w-10 h-10 flex items-center justify-center rounded-full bg-[#3E2F26] hover:bg-[#231913] text-[#FAF6EE] border border-[#3E2F26] shadow-xs active:scale-95 transition-all cursor-pointer shrink-0"
              title={t('backToMenu')}
            >
              <Utensils className="w-4 h-4 text-[#C09E6D]" />
            </Link>

            {/* Elegant Language Selector */}
            <LanguageSelector currentLang={lang} onChange={changeLanguage} />

            <button 
              onClick={handleLogout}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-[#F1ECE3] hover:bg-red-50 text-[#8E7A68] hover:text-red-700 border border-[#E6DFD5] transition-all active:scale-95 cursor-pointer shrink-0"
              title={t('logoutBtn')}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 md:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Side Tab Navigation */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-[#FDFBF7] p-5 border border-[#E6DFD5] premium-shadow rounded-2xl">
            <h3 className="text-xs uppercase tracking-widest text-[#8E7A68] font-bold mb-4">{t('adminNav')}</h3>
            <div className="space-y-1">
              <button 
                onClick={() => setActiveTab('cafe')}
                className={`w-full flex items-center gap-3 px-4 py-3 text-xs uppercase tracking-wider font-semibold transition-all rounded-xl ${activeTab === 'cafe' ? 'bg-[#3E2F26] text-[#FAF6EE]' : 'text-[#4A3B32] hover:bg-[#F1ECE3]'}`}
              >
                <Settings className="w-4 h-4 shrink-0" />
                {t('editCafeInfo')}
              </button>
              <button 
                onClick={() => setActiveTab('categories')}
                className={`w-full flex items-center gap-3 px-4 py-3 text-xs uppercase tracking-wider font-semibold transition-all rounded-xl ${activeTab === 'categories' ? 'bg-[#3E2F26] text-[#FAF6EE]' : 'text-[#4A3B32] hover:bg-[#F1ECE3]'}`}
              >
                <Grid className="w-4 h-4 shrink-0" />
                {t('categories')}
              </button>
              <button 
                onClick={() => setActiveTab('products')}
                className={`w-full flex items-center gap-3 px-4 py-3 text-xs uppercase tracking-wider font-semibold transition-all rounded-xl ${activeTab === 'products' ? 'bg-[#3E2F26] text-[#FAF6EE]' : 'text-[#4A3B32] hover:bg-[#F1ECE3]'}`}
              >
                <ShoppingBag className="w-4 h-4 shrink-0" />
                {t('menu')}
              </button>
              <button 
                onClick={() => setActiveTab('qr')}
                className={`w-full flex items-center gap-3 px-4 py-3 text-xs uppercase tracking-wider font-semibold transition-all rounded-xl ${activeTab === 'qr' ? 'bg-[#3E2F26] text-[#FAF6EE]' : 'text-[#4A3B32] hover:bg-[#F1ECE3]'}`}
              >
                <QrCode className="w-4 h-4 shrink-0" />
                {t('qrGenerator')}
              </button>
              <button 
                onClick={() => setActiveTab('advertising')}
                className={`w-full flex items-center gap-3 px-4 py-3 text-xs uppercase tracking-wider font-semibold transition-all rounded-xl ${activeTab === 'advertising' ? 'bg-[#3E2F26] text-[#FAF6EE]' : 'text-[#4A3B32] hover:bg-[#F1ECE3]'}`}
              >
                <Megaphone className="w-4 h-4 shrink-0" />
                {t('advertisingNav')}
              </button>
            </div>
          </div>


        </div>

        {/* Right Side Working Canvas */}
        <div className="lg:col-span-9 space-y-6">
          
          {/* TAB 1: CAFE DETAILS */}
          {activeTab === 'cafe' && (
            <div className="space-y-6">
              {/* Cafe Details Card */}
              <div className="bg-[#FDFBF7] p-6 md:p-8 border border-[#E6DFD5] premium-shadow rounded-2xl">
                <h2 className="text-2xl font-display font-medium text-[#231913] mb-6 tracking-wide pb-2 border-b border-[#E6DFD5]">
                  {t('editCafeInfo')}
                </h2>

                <form onSubmit={handleSaveCafe} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <label className="block text-xs uppercase tracking-wider text-[#8E7A68] font-semibold">{t('cafeName')}</label>
                        <span className="text-[10px] bg-[#C09E6D]/15 text-[#3E2F26] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                          {LANG_CODE[lang] ?? lang.toUpperCase()}
                        </span>
                      </div>
                      {lang === 'uk' && (
                        <input
                          type="text"
                          value={cafeForm.nameUk}
                          onChange={(e) => setCafeForm({...cafeForm, nameUk: e.target.value})}
                          className="w-full px-4 py-2.5 bg-[#FAF6EE] border border-[#E6DFD5] text-[#231913] focus:outline-none focus:border-[#C09E6D] text-sm rounded-xl"
                          required
                        />
                      )}
                      {lang === 'hu' && (
                        <input
                          type="text"
                          value={cafeForm.nameHu}
                          onChange={(e) => setCafeForm({...cafeForm, nameHu: e.target.value})}
                          className="w-full px-4 py-2.5 bg-[#FAF6EE] border border-[#E6DFD5] text-[#231913] focus:outline-none focus:border-[#C09E6D] text-sm rounded-xl"
                        />
                      )}
                      {lang === 'en' && (
                        <input
                          type="text"
                          value={cafeForm.nameEn}
                          onChange={(e) => setCafeForm({...cafeForm, nameEn: e.target.value})}
                          className="w-full px-4 py-2.5 bg-[#FAF6EE] border border-[#E6DFD5] text-[#231913] focus:outline-none focus:border-[#C09E6D] text-sm rounded-xl"
                        />
                      )}
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-xs uppercase tracking-wider text-[#8E7A68] font-semibold">{t('cafeDescription')}</label>
                        <span className="text-[10px] font-bold text-[#C09E6D]">
                          {(lang === 'uk' ? cafeForm.descriptionUk : lang === 'hu' ? cafeForm.descriptionHu : cafeForm.descriptionEn).length} / 40
                        </span>
                      </div>
                      {lang === 'uk' && (
                        <input
                          type="text"
                          value={cafeForm.descriptionUk}
                          onChange={(e) => setCafeForm({...cafeForm, descriptionUk: e.target.value.slice(0, 40)})}
                          className="w-full px-4 py-2.5 bg-[#FAF6EE] border border-[#E6DFD5] text-[#231913] focus:outline-none focus:border-[#C09E6D] text-sm rounded-xl"
                          maxLength={40}
                          required
                        />
                      )}
                      {lang === 'hu' && (
                        <input
                          type="text"
                          value={cafeForm.descriptionHu}
                          onChange={(e) => setCafeForm({...cafeForm, descriptionHu: e.target.value.slice(0, 40)})}
                          className="w-full px-4 py-2.5 bg-[#FAF6EE] border border-[#E6DFD5] text-[#231913] focus:outline-none focus:border-[#C09E6D] text-sm rounded-xl"
                          maxLength={40}
                        />
                      )}
                      {lang === 'en' && (
                        <input
                          type="text"
                          value={cafeForm.descriptionEn}
                          onChange={(e) => setCafeForm({...cafeForm, descriptionEn: e.target.value.slice(0, 40)})}
                          className="w-full px-4 py-2.5 bg-[#FAF6EE] border border-[#E6DFD5] text-[#231913] focus:outline-none focus:border-[#C09E6D] text-sm rounded-xl"
                          maxLength={40}
                        />
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <label className="block text-xs uppercase tracking-wider text-[#8E7A68] font-semibold">{t('cafeInstagram')}</label>
                        <span className="text-[10px] bg-transparent px-2.5 py-1 rounded-full font-bold uppercase tracking-wider invisible">
                          {LANG_CODE[lang] ?? lang.toUpperCase()}
                        </span>
                      </div>
                      <input
                        type="text"
                        value={cafeForm.instagram}
                        onChange={(e) => setCafeForm({...cafeForm, instagram: e.target.value})}
                        className="w-full px-4 py-2.5 bg-[#FAF6EE] border border-[#E6DFD5] text-[#231913] focus:outline-none focus:border-[#C09E6D] text-sm rounded-xl"
                      />
                    </div>
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <label className="block text-xs uppercase tracking-wider text-[#8E7A68] font-semibold">{t('cafeOwnerName')}</label>
                        <span className="text-[10px] bg-[#C09E6D]/15 text-[#3E2F26] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                          {LANG_CODE[lang] ?? lang.toUpperCase()}
                        </span>
                      </div>
                      {lang === 'uk' && (
                        <input
                          type="text"
                          value={cafeForm.ownerNameUk}
                          onChange={(e) => setCafeForm({...cafeForm, ownerNameUk: e.target.value})}
                          className="w-full px-4 py-2.5 bg-[#FAF6EE] border border-[#E6DFD5] text-[#231913] focus:outline-none focus:border-[#C09E6D] text-sm rounded-xl"
                        />
                      )}
                      {lang === 'hu' && (
                        <input
                          type="text"
                          value={cafeForm.ownerNameHu}
                          onChange={(e) => setCafeForm({...cafeForm, ownerNameHu: e.target.value})}
                          className="w-full px-4 py-2.5 bg-[#FAF6EE] border border-[#E6DFD5] text-[#231913] focus:outline-none focus:border-[#C09E6D] text-sm rounded-xl"
                        />
                      )}
                      {lang === 'en' && (
                        <input
                          type="text"
                          value={cafeForm.ownerNameEn}
                          onChange={(e) => setCafeForm({...cafeForm, ownerNameEn: e.target.value})}
                          className="w-full px-4 py-2.5 bg-[#FAF6EE] border border-[#E6DFD5] text-[#231913] focus:outline-none focus:border-[#C09E6D] text-sm rounded-xl"
                        />
                      )}
                    </div>
                  </div>

                   {/* Banner Upload & Positioning */}
                   <div className="space-y-3 pt-4 border-t border-[#E6DFD5]">
                     <label className="block text-xs uppercase tracking-wider text-[#8E7A68] font-semibold">{t('cafeBanner')}</label>

                     {/* Hidden File Input for Banner */}
                     <input 
                       ref={bannerFileInputRef}
                       id="cafe-banner-file-input"
                       type="file" 
                       accept="image/*" 
                       onChange={(e) => handleImageUpload(e, 'cafeBanner')}
                       className="hidden"
                     />
                     
                     {/* Banner tap card with translucent overlay icon */}
                     <div 
                       onClick={() => bannerFileInputRef.current?.click()}
                       className="group relative w-full aspect-[16/9] border-2 border-[#E6DFD5] hover:border-[#C09E6D] bg-white rounded-2xl overflow-hidden shadow-sm select-none cursor-pointer transition-all active:scale-[0.99]"
                       style={{ aspectRatio: '16 / 9' }}
                     >
                       {cafeForm.banner ? (
                         <>
                          <Image 
                            src={cafeForm.banner} 
                            alt="Cafe Banner Preview" 
                            fill 
                            loading="eager"
                            sizes="(max-width: 768px) 100vw, 768px"
                            className="object-cover transition-transform duration-300 group-hover:scale-105" 
                            referrerPolicy="no-referrer"
                            unoptimized={cafeForm.banner.startsWith('data:')}
                          />

                           {/* Semi-transparent replace photo overlay icon */}
                           <div className="absolute inset-0 bg-black/25 group-hover:bg-black/35 flex items-center justify-center transition-colors">
                             <div className="w-14 h-14 rounded-full bg-black/50 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 active:scale-95">
                               <Camera className="w-7 h-7 text-white drop-shadow-sm" />
                             </div>
                           </div>

                           {/* Delete banner button in top right corner */}
                           <button
                             type="button"
                             onClick={(e) => {
                               e.stopPropagation();
                               setIsDeleteBannerModalOpen(true);
                             }}
                             title={t('deletePhoto')}
                             className="absolute top-3 right-3 z-20 w-10 h-10 rounded-full bg-black/60 hover:bg-red-700/90 text-white/90 hover:text-white backdrop-blur-md border border-white/25 flex items-center justify-center transition-all shadow-md active:scale-90 cursor-pointer"
                           >
                             <Trash2 className="w-4.5 h-4.5" />
                           </button>

                           {/* Edit banner button in bottom right corner */}
                           <button
                             type="button"
                             onClick={(e) => {
                               e.stopPropagation();
                               openBannerCropModal();
                             }}
                             title={t('editPhoto')}
                             className="absolute bottom-3 right-3 z-20 w-10 h-10 rounded-full bg-black/60 hover:bg-[#C09E6D] text-white/90 hover:text-white backdrop-blur-md border border-white/25 flex items-center justify-center transition-all shadow-md active:scale-90 cursor-pointer"
                           >
                             <Edit2 className="w-4.5 h-4.5" />
                           </button>
                         </>
                       ) : (
                         <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-white">
                           <div className="w-14 h-14 rounded-full bg-[#FAF6EE] border border-[#E6DFD5] flex items-center justify-center mb-3">
                             <Upload className="w-7 h-7 text-[#C09E6D]" />
                           </div>
                           <span className="text-sm text-[#3E2F26] font-semibold mb-1">{t('cafeBannerClick')}</span>
                           <span className="text-xs text-[#8E7A68]">{t('cafeBannerRatio')}</span>
                         </div>
                       )}
                     </div>
                     {cafeForm.banner && (
<p className="text-xs text-[#8E7A68]">
                          {t('cafeBannerHint')}
                        </p>
                     )}
                   </div>

                  {/* Logo Upload & Positioning */}
                  <div className="space-y-3 pt-4 border-t border-[#E6DFD5]">
                    <label className="block text-xs uppercase tracking-wider text-[#8E7A68] font-semibold">{t('cafeLogo')}</label>
                    
                    {/* Hidden File Input for Logo */}
                    <input 
                      ref={logoFileInputRef}
                      id="cafe-logo-file-input"
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => handleImageUpload(e, 'cafeLogo')}
                      className="hidden"
                    />

                    {/* Logo rectangular tap card */}
                    <div 
                      onClick={() => logoFileInputRef.current?.click()}
                       className="group relative w-full aspect-[16/9] border-2 border-[#E6DFD5] hover:border-[#C09E6D] bg-white rounded-2xl overflow-hidden shadow-sm select-none cursor-pointer transition-all active:scale-[0.99]"
                       style={{ aspectRatio: '16 / 9' }}
                     >
                      {cafeForm.logo ? (
                        <>
                          <Image 
                            src={cafeForm.logo} 
                            alt="Cafe Logo Preview" 
                            fill 
                            loading="eager"
                            sizes="(max-width: 768px) 100vw, 768px"
                            className="object-cover transition-transform duration-300 group-hover:scale-105" 
                            referrerPolicy="no-referrer"
                            unoptimized={cafeForm.logo.startsWith('data:')}
                          />

                          {/* Semi-transparent replace photo overlay icon */}
                          <div className="absolute inset-0 bg-black/25 group-hover:bg-black/35 flex items-center justify-center transition-colors">
                            <div className="w-14 h-14 rounded-full bg-black/50 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 active:scale-95">
                              <Camera className="w-7 h-7 text-white drop-shadow-sm" />
                            </div>
                          </div>

                          {/* Delete logo button in top right corner */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setIsDeleteLogoModalOpen(true);
                            }}
                            title={t('deleteLogo')}
                            className="absolute top-3 right-3 z-20 w-10 h-10 rounded-full bg-black/60 hover:bg-red-700/90 text-white/90 hover:text-white backdrop-blur-md border border-white/25 flex items-center justify-center transition-all shadow-md active:scale-90 cursor-pointer"
                          >
                            <Trash2 className="w-4.5 h-4.5" />
                          </button>

                          {/* Edit logo button in bottom right corner */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openLogoCropModal();
                            }}
                            title={t('editPhoto')}
                            className="absolute bottom-3 right-3 z-20 w-10 h-10 rounded-full bg-black/60 hover:bg-[#C09E6D] text-white/90 hover:text-white backdrop-blur-md border border-white/25 flex items-center justify-center transition-all shadow-md active:scale-90 cursor-pointer"
                          >
                            <Edit2 className="w-4.5 h-4.5" />
                          </button>
                        </>
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-white">
                          <div className="w-14 h-14 rounded-full bg-[#FAF6EE] border border-[#E6DFD5] flex items-center justify-center mb-3">
                            <Upload className="w-7 h-7 text-[#C09E6D]" />
                          </div>
                          <span className="text-sm text-[#3E2F26] font-semibold mb-1">{t('cafeLogoClick')}</span>
                          <span className="text-xs text-[#8E7A68]">{t('cafeLogoRatio')}</span>
                        </div>
                      )}
                    </div>
                    {cafeForm.logo && (
                      <p className="text-xs text-[#8E7A68]">
                        {t('cafeLogoHint')}
                      </p>
                    )}
                  </div>

                  <div className="pt-4 border-t border-[#E6DFD5]">
                    <button 
                      type="submit" 
                      disabled={cafeSaveStatus === 'saving'}
                      className={`relative overflow-hidden w-full flex justify-center items-center gap-2.5 px-6 py-3.5 text-xs uppercase tracking-widest font-semibold rounded-xl transition-all duration-300 shadow-md active:scale-[0.98] cursor-pointer ${
                        cafeSaveStatus === 'saving'
                          ? 'bg-[#2A1F18] text-[#FAF6EE] ring-2 ring-[#C09E6D]/50 shadow-inner'
                          : cafeSaveStatus === 'saved'
                          ? 'bg-[#231913] text-[#FAF6EE] ring-2 ring-[#C09E6D] shadow-md animate-btn-pop'
                          : 'bg-[#3E2F26] text-[#FAF6EE] hover:bg-[#231913] hover:shadow-lg'
                      }`}
                    >
                      {cafeSaveStatus === 'saving' && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent animate-btn-shimmer pointer-events-none" />
                      )}
                      {cafeSaveStatus === 'saving' ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-[#C09E6D]" />
                          <span>{t('saving')}</span>
                        </>
                      ) : cafeSaveStatus === 'saved' ? (
                        <>
                          <Check className="w-4 h-4 text-[#C09E6D] stroke-[3]" />
                          <span className="font-bold tracking-wider text-[#FAF6EE]">{t('saved')}</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 text-[#C09E6D]" />
                          <span>{t('saveBtn')}</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Greetings */}
              <div className="bg-[#FDFBF7] p-6 md:p-8 border border-[#E6DFD5] premium-shadow rounded-2xl">
                <h2 className="text-2xl font-display font-medium text-[#231913] mb-2 tracking-wide pb-2 border-b border-[#E6DFD5]">
                  {t('greetings')}
                </h2>
                <p className="text-xs text-[#8E7A68] mb-6 leading-relaxed">{t('greetingsSubtitle')}</p>

                <form onSubmit={handleSaveCafe} className="space-y-8">
                  {/* Customer greeting */}
                  <div>
                    <div className="flex items-center justify-between gap-4 mb-3">
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-[#231913]">{t('greetingCustomerLabel')}</h3>
                        <p className="text-[11px] text-[#8E7A68]">{t('greetingCustomerHint')}</p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={!!cafeForm.greetingCustomerEnabled}
                        aria-label={t('greetingCustomerLabel')}
                        onClick={() => setCafeForm({ ...cafeForm, greetingCustomerEnabled: !cafeForm.greetingCustomerEnabled })}
                        className={`relative inline-flex shrink-0 w-12 h-7 rounded-full transition-colors duration-200 cursor-pointer border ${
                          cafeForm.greetingCustomerEnabled
                            ? 'bg-[#C09E6D] border-[#C09E6D]'
                            : 'bg-[#E6DFD5] border-[#D5CBBF]'
                        }`}
                      >
                        <span
                          className={`absolute top-1/2 -translate-y-1/2 left-0.5 w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center transition-transform duration-200 ${
                            cafeForm.greetingCustomerEnabled ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        >
                          {cafeForm.greetingCustomerEnabled ? <Check className="w-3.5 h-3.5 text-[#3E2F26] stroke-[3]" /> : <X className="w-3.5 h-3.5 text-[#8E7A68]" />}
                        </span>
                      </button>
                    </div>

                    <div className="space-y-3">
                      {lang === 'uk' && (
                        <textarea
                          rows={4}
                          value={cafeForm.greetingCustomerUk ?? ''}
                          onChange={(e) => setCafeForm({ ...cafeForm, greetingCustomerUk: e.target.value })}
                          placeholder={t('greetingCustomerPlaceholder')}
                          className="w-full px-4 py-2.5 bg-[#FAF6EE] border border-[#E6DFD5] text-[#231913] focus:outline-none focus:border-[#C09E6D] text-sm rounded-xl resize-y"
                        />
                      )}
                      {lang === 'hu' && (
                        <textarea
                          rows={4}
                          value={cafeForm.greetingCustomerHu ?? ''}
                          onChange={(e) => setCafeForm({ ...cafeForm, greetingCustomerHu: e.target.value })}
                          placeholder={t('greetingCustomerPlaceholder')}
                          className="w-full px-4 py-2.5 bg-[#FAF6EE] border border-[#E6DFD5] text-[#231913] focus:outline-none focus:border-[#C09E6D] text-sm rounded-xl resize-y"
                        />
                      )}
                      {lang === 'en' && (
                        <textarea
                          rows={4}
                          value={cafeForm.greetingCustomerEn ?? ''}
                          onChange={(e) => setCafeForm({ ...cafeForm, greetingCustomerEn: e.target.value })}
                          placeholder={t('greetingCustomerPlaceholder')}
                          className="w-full px-4 py-2.5 bg-[#FAF6EE] border border-[#E6DFD5] text-[#231913] focus:outline-none focus:border-[#C09E6D] text-sm rounded-xl resize-y"
                        />
                      )}
                    </div>
                  </div>

                  {/* Admin greeting */}
                  <div>
                    <div className="flex items-center justify-between gap-4 mb-3">
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-[#231913]">{t('greetingAdminLabel')}</h3>
                        <p className="text-[11px] text-[#8E7A68]">{t('greetingAdminHint')}</p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={!!cafeForm.greetingAdminEnabled}
                        aria-label={t('greetingAdminLabel')}
                        onClick={() => setCafeForm({ ...cafeForm, greetingAdminEnabled: !cafeForm.greetingAdminEnabled })}
                        className={`relative inline-flex shrink-0 w-12 h-7 rounded-full transition-colors duration-200 cursor-pointer border ${
                          cafeForm.greetingAdminEnabled
                            ? 'bg-[#C09E6D] border-[#C09E6D]'
                            : 'bg-[#E6DFD5] border-[#D5CBBF]'
                        }`}
                      >
                        <span
                          className={`absolute top-1/2 -translate-y-1/2 left-0.5 w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center transition-transform duration-200 ${
                            cafeForm.greetingAdminEnabled ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        >
                          {cafeForm.greetingAdminEnabled ? <Check className="w-3.5 h-3.5 text-[#3E2F26] stroke-[3]" /> : <X className="w-3.5 h-3.5 text-[#8E7A68]" />}
                        </span>
                      </button>
                    </div>

                    <div className="space-y-3">
                      {lang === 'uk' && (
                        <textarea
                          rows={4}
                          value={cafeForm.greetingAdminUk ?? ''}
                          onChange={(e) => setCafeForm({ ...cafeForm, greetingAdminUk: e.target.value })}
                          placeholder={t('greetingAdminPlaceholder')}
                          className="w-full px-4 py-2.5 bg-[#FAF6EE] border border-[#E6DFD5] text-[#231913] focus:outline-none focus:border-[#C09E6D] text-sm rounded-xl resize-y"
                        />
                      )}
                      {lang === 'hu' && (
                        <textarea
                          rows={4}
                          value={cafeForm.greetingAdminHu ?? ''}
                          onChange={(e) => setCafeForm({ ...cafeForm, greetingAdminHu: e.target.value })}
                          placeholder={t('greetingAdminPlaceholder')}
                          className="w-full px-4 py-2.5 bg-[#FAF6EE] border border-[#E6DFD5] text-[#231913] focus:outline-none focus:border-[#C09E6D] text-sm rounded-xl resize-y"
                        />
                      )}
                      {lang === 'en' && (
                        <textarea
                          rows={4}
                          value={cafeForm.greetingAdminEn ?? ''}
                          onChange={(e) => setCafeForm({ ...cafeForm, greetingAdminEn: e.target.value })}
                          placeholder={t('greetingAdminPlaceholder')}
                          className="w-full px-4 py-2.5 bg-[#FAF6EE] border border-[#E6DFD5] text-[#231913] focus:outline-none focus:border-[#C09E6D] text-sm rounded-xl resize-y"
                        />
                      )}
                    </div>
                  </div>

                  {/* Save */}
                  <div className="pt-4 border-t border-[#E6DFD5]">
                    <button
                      type="submit"
                      disabled={cafeSaveStatus === 'saving'}
                      className={`relative overflow-hidden w-full flex justify-center items-center gap-2.5 px-6 py-3.5 text-xs uppercase tracking-widest font-semibold rounded-xl transition-all duration-300 shadow-md active:scale-[0.98] cursor-pointer ${
                        cafeSaveStatus === 'saving'
                          ? 'bg-[#2A1F18] text-[#FAF6EE] ring-2 ring-[#C09E6D]/50 shadow-inner'
                          : cafeSaveStatus === 'saved'
                          ? 'bg-[#231913] text-[#FAF6EE] ring-2 ring-[#C09E6D] shadow-md animate-btn-pop'
                          : 'bg-[#3E2F26] text-[#FAF6EE] hover:bg-[#231913] hover:shadow-lg'
                      }`}
                    >
                      {cafeSaveStatus === 'saving' && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent animate-btn-shimmer pointer-events-none" />
                      )}
                      {cafeSaveStatus === 'saving' ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-[#C09E6D]" />
                          <span>{t('saving')}</span>
                        </>
                      ) : cafeSaveStatus === 'saved' ? (
                        <>
                          <Check className="w-4 h-4 text-[#C09E6D] stroke-[3]" />
                          <span className="font-bold tracking-wider text-[#FAF6EE]">{t('saved')}</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 text-[#C09E6D]" />
                          <span>{t('saveBtn')}</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Change Login Password */}
              <div className="bg-[#FDFBF7] p-6 md:p-8 border border-[#E6DFD5] premium-shadow rounded-2xl">
                <h2 className="text-2xl font-display font-medium text-[#231913] mb-2 tracking-wide pb-2 border-b border-[#E6DFD5]">
                  {t('changePasswordTitle')}
                </h2>
                <p className="text-xs text-[#8E7A68] mb-6 leading-relaxed">{t('changePasswordDesc')}</p>

                {changePassError && (
                  <div className="mb-4 p-3 bg-red-50/90 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2 text-left">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{changePassError}</span>
                  </div>
                )}

                <form onSubmit={handleChangePasswordSettings} className="space-y-4 text-left">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-xs uppercase tracking-wider text-[#8E7A68] mb-1.5 font-semibold">
                        {t('currentPasswordLabel')}
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-[#A09084] absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="password"
                          value={currentPasswordInput}
                          onChange={(e) => { setCurrentPasswordInput(e.target.value); if (changePassInvalidFields.length) setChangePassInvalidFields([]); }}
                          onFocus={() => { if (changePassInvalidFields.length) setChangePassInvalidFields([]); }}
                          placeholder={changePassInvalidFields.includes('current') ? t('requiredField') : t('currentPasswordPlaceholder')}
                          className={`w-full pl-10 pr-4 py-2.5 bg-[#FAF6EE] border border-[#E6DFD5] text-[#231913] focus:outline-none focus:border-[#C09E6D] text-sm rounded-xl ${changePassInvalidFields.includes('current') ? 'border-rose-300 placeholder:text-rose-600' : ''}`}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-[#8E7A68] mb-1.5 font-semibold">
                        {t('newPasswordLabel')}
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-[#A09084] absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="password"
                          value={newPasswordInput}
                          onChange={(e) => { setNewPasswordInput(e.target.value); if (changePassInvalidFields.length) setChangePassInvalidFields([]); }}
                          onFocus={() => { if (changePassInvalidFields.length) setChangePassInvalidFields([]); }}
                          placeholder={changePassInvalidFields.includes('new') ? t('requiredField') : t('newPasswordPlaceholder')}
                          className={`w-full pl-10 pr-4 py-2.5 bg-[#FAF6EE] border border-[#E6DFD5] text-[#231913] focus:outline-none focus:border-[#C09E6D] text-sm rounded-xl ${changePassInvalidFields.includes('new') ? 'border-rose-300 placeholder:text-rose-600' : ''}`}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs uppercase tracking-wider text-[#8E7A68] mb-1.5 font-semibold">
                        {t('confirmNewPasswordLabel')}
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-[#A09084] absolute left-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="password"
                          value={confirmPasswordInput}
                          onChange={(e) => { setConfirmPasswordInput(e.target.value); if (changePassInvalidFields.length) setChangePassInvalidFields([]); }}
                          onFocus={() => { if (changePassInvalidFields.length) setChangePassInvalidFields([]); }}
                          placeholder={changePassInvalidFields.includes('confirm') ? t('requiredField') : t('confirmNewPasswordPlaceholder')}
                          className={`w-full pl-10 pr-4 py-2.5 bg-[#FAF6EE] border border-[#E6DFD5] text-[#231913] focus:outline-none focus:border-[#C09E6D] text-sm rounded-xl ${changePassInvalidFields.includes('confirm') ? 'border-rose-300 placeholder:text-rose-600' : ''}`}
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={changePassLoading}
                    className="w-full md:w-auto px-8 py-3 bg-[#3E2F26] text-[#FAF6EE] uppercase text-xs tracking-widest font-semibold hover:bg-[#231913] transition-colors rounded-xl disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                  >
                    {changePassLoading && <Loader2 className="w-4 h-4 animate-spin text-[#C09E6D]" />}
                    <span>{t('updatePasswordBtn')}</span>
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 2: CATEGORIES */}
          {activeTab === 'categories' && (
            <div className="space-y-6">
              {/* Categories list with Add button */}
              <div className="bg-[#FDFBF7] p-6 md:p-8 border border-[#E6DFD5] premium-shadow rounded-2xl">
                <div className="flex items-center justify-between gap-4 mb-6">
                  <h2 className="text-2xl font-display font-medium text-[#231913] tracking-wide">
                    {t('categories')}
                  </h2>
                  <button
                    type="button"
                    onClick={openAddCategoryDrawer}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#3E2F26] hover:bg-[#231913] text-[#FAF6EE] text-xs uppercase tracking-widest font-semibold rounded-xl transition-all shadow-md active:scale-[0.98] cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-[#C09E6D]" />
                    <span>{t('addCategory')}</span>
                  </button>
                </div>

                {categories.length === 0 ? (
                  <div className="py-10 text-center text-sm text-[#8E7A68] space-y-2">
                    <Coffee className="w-8 h-8 text-[#E6DFD5] mx-auto" />
                    <p className="text-base">{t('noCategories')}</p>
                  </div>
                ) : (
                  <SortableActionCardGrid<Category>
                    items={categories}
                    isOpenId={openActionsId}
                    onToggle={(id) => setOpenActionsId(openActionsId === id ? null : id)}
                    onEdit={(cat) => {
                      setOpenActionsId(null);
                      handleEditCategory(cat);
                    }}
                    onDelete={(cat) => setDeleteTarget({ kind: 'category', id: cat.id, name: cat.nameUk, productsCount: products.filter(p => p.categoryId === cat.id).length })}
                    onReorder={handleReorderCategories}
                    onDragStart={() => setOpenActionsId(null)}
                    getAlt={(cat) => cat.nameUk}
                    renderContent={(cat) => (
                      <>
                        <p className="font-semibold text-sm text-[#231913]">{cat.nameUk}</p>
                        <p className="text-[10px] text-[#8E7A68]">{cat.nameEn} • {cat.nameHu}</p>
                      </>
                    )}
                  />
                )}
              </div>
            </div>
          )}

          {/* TAB 3: PRODUCTS */}
          {activeTab === 'products' && (
            <div className="space-y-6">
              {/* Products list with Add button */}
              <div className="bg-[#FDFBF7] p-6 md:p-8 border border-[#E6DFD5] premium-shadow rounded-2xl">
                <div className="flex items-center justify-between gap-4 mb-6">
                  <h2 className="text-2xl font-display font-medium text-[#231913] tracking-wide">
                    {t('menu')}
                  </h2>
                  <button
                    type="button"
                    onClick={openAddProductDrawer}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#3E2F26] hover:bg-[#231913] text-[#FAF6EE] text-xs uppercase tracking-widest font-semibold rounded-xl transition-all shadow-md active:scale-[0.98] cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-[#C09E6D]" />
                    <span>{t('addProduct')}</span>
                  </button>
                </div>

                {/* Category filter pills */}
                <div
                  ref={pillsScrollRef}
                  onPointerDown={handlePillsPointerDown}
                  onPointerLeave={handlePillsPointerUp}
                  onPointerUp={handlePillsPointerUp}
                  onPointerMove={handlePillsPointerMove}
                  className="mb-6 -mx-1 flex gap-2 overflow-x-auto px-1 pb-1 no-scrollbar touch-pan-x overscroll-x-contain select-none cursor-grab active:cursor-grabbing"
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (!pillsIsDragging) setMenuFilterCategoryId('all');
                    }}
                    className={`shrink-0 px-4 py-2 text-xs uppercase tracking-wider font-semibold rounded-full border transition-colors cursor-pointer whitespace-nowrap ${
                      menuFilterCategoryId === 'all'
                        ? 'bg-[#3E2F26] text-[#FAF6EE] border-[#3E2F26]'
                        : 'bg-white text-[#3E2F26] border-[#E6DFD5] hover:border-[#C09E6D]'
                    }`}
                  >
                    {t('all')}
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        if (!pillsIsDragging) setMenuFilterCategoryId(cat.id);
                      }}
                      className={`shrink-0 px-4 py-2 text-xs uppercase tracking-wider font-semibold rounded-full border transition-colors cursor-pointer whitespace-nowrap ${
                        menuFilterCategoryId === cat.id
                          ? 'bg-[#3E2F26] text-[#FAF6EE] border-[#3E2F26]'
                          : 'bg-white text-[#3E2F26] border-[#E6DFD5] hover:border-[#C09E6D]'
                      }`}
                    >
                      {lang === 'hu' ? cat.nameHu : lang === 'en' ? cat.nameEn : cat.nameUk}
                    </button>
                  ))}
                </div>

                {filteredMenuProducts.length === 0 ? (
                  <div className="py-10 text-center text-sm text-[#8E7A68] space-y-2">
                    <Coffee className="w-8 h-8 text-[#E6DFD5] mx-auto" />
                    <p className="text-base">{products.length === 0 ? t('noProducts') : t('noCategoryProducts')}</p>
                  </div>
                ) : menuFilterCategoryId === 'all' ? (
                  <>
                    <p className="mb-4 text-xs text-[#8E7A68]">{t('reorderPickCategory')}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {filteredMenuProducts.map((p) => {
                        const cat = categories.find(c => c.id === p.categoryId);
                        return (
                          <ActionCard
                            key={p.id}
                            photo={p.photo}
                            alt={p.nameUk}
                            isOpen={openActionsId === p.id}
                            onToggle={() => setOpenActionsId(openActionsId === p.id ? null : p.id)}
                            onEdit={() => {
                              setOpenActionsId(null);
                              handleEditProduct(p);
                            }}
                            onDelete={() => setDeleteTarget({ kind: 'product', id: p.id, name: lang === 'hu' ? p.nameHu : lang === 'en' ? p.nameEn : p.nameUk })}
                          >
                            <p className="font-semibold text-sm text-[#231913]">
                              {lang === 'hu' ? p.nameHu : lang === 'en' ? p.nameEn : p.nameUk}
                            </p>
                            <p className="text-xs font-semibold text-[#3E2F26]">
                              {cat ? (lang === 'hu' ? cat.nameHu : lang === 'en' ? cat.nameEn : cat.nameUk) : t('noCategory')}
                            </p>
                            <p className="text-xs font-bold text-[#3E2F26]">{p.price} ₴</p>
                          </ActionCard>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <SortableActionCardGrid<Product>
                    items={filteredMenuProducts}
                    isOpenId={openActionsId}
                    onToggle={(id) => setOpenActionsId(openActionsId === id ? null : id)}
                    onEdit={(p) => {
                      setOpenActionsId(null);
                      handleEditProduct(p);
                    }}
                    onDelete={(p) => setDeleteTarget({ kind: 'product', id: p.id, name: lang === 'hu' ? p.nameHu : lang === 'en' ? p.nameEn : p.nameUk })}
                    onReorder={handleReorderProducts}
                    onDragStart={() => setOpenActionsId(null)}
                    getAlt={(p) => p.nameUk}
                    renderContent={(p) => {
                      const cat = categories.find(c => c.id === p.categoryId);
                      return (
                        <>
                          <p className="font-semibold text-sm text-[#231913]">
                            {lang === 'hu' ? p.nameHu : lang === 'en' ? p.nameEn : p.nameUk}
                          </p>
                          <p className="text-xs font-semibold text-[#3E2F26]">
                            {cat ? (lang === 'hu' ? cat.nameHu : lang === 'en' ? cat.nameEn : cat.nameUk) : t('noCategory')}
                          </p>
                          <p className="text-xs font-bold text-[#3E2F26]">{p.price} ₴</p>
                        </>
                      );
                    }}
                  />
                )}
              </div>
            </div>
          )}

          {/* TAB 4: QR GENERATOR */}
          {activeTab === 'qr' && (
            <QrGenerator
              tableNumber={qrTableNumber}
              qrCodeDataUrl={qrCodeDataUrl}
              t={t}
              onTableNumberChange={setQrTableNumber}
            />
          )}

          {/* TAB 5: ADVERTISING */}
          {activeTab === 'advertising' && (
            <div className="bg-[#FDFBF7] p-6 md:p-8 border border-[#E6DFD5] premium-shadow rounded-2xl">
              <h2 className="text-2xl font-display font-medium text-[#231913] mb-6 tracking-wide pb-2 border-b border-[#E6DFD5]">
                {t('advertisingNav')}
              </h2>

              {/* Two sections side-by-side on desktop (2 columns), stacked on mobile */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Popup in menu */}
                <div className="flex flex-col p-6 border border-[#E6DFD5] rounded-2xl bg-white">
                  <h3 className="text-xl font-display font-medium text-[#231913] mb-4 tracking-wide pb-2 border-b border-[#E6DFD5]">
                    {t('advertising')}
                  </h3>

                  <ul className="space-y-2.5 mb-8 flex-1">
                    {ADVERTISING_FEATURES[lang].map((f, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-[#4A3B32] leading-relaxed">
                        <span className="mt-2 w-1.5 h-1.5 rounded-full bg-[#C09E6D] shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    onClick={openAdDrawer}
                    className="w-full flex items-center justify-center gap-2.5 px-6 py-3.5 text-xs uppercase tracking-widest font-semibold bg-[#F1ECE3] hover:bg-[#E6DFD5] text-[#4A3B32] rounded-xl shadow-sm transition-all active:scale-[0.98] cursor-pointer mt-auto"
                  >
                    {adForm.photo ? <Edit2 className="w-4 h-4 text-[#C09E6D]" /> : <Plus className="w-4 h-4 text-[#C09E6D]" />}
                    {adForm.photo ? t('editAdPopup') : t('addAdPopup')}
                  </button>
                </div>

                {/* Text banner */}
                <div className="flex flex-col p-6 border border-[#E6DFD5] rounded-2xl bg-white">
                  <h3 className="text-xl font-display font-medium text-[#231913] mb-4 tracking-wide pb-2 border-b border-[#E6DFD5]">
                    {t('textBanner')}
                  </h3>

                  <ul className="space-y-2.5 mb-8 flex-1">
                    {TEXT_BANNER_FEATURES[lang].map((f, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-[#4A3B32] leading-relaxed">
                        <span className="mt-2 w-1.5 h-1.5 rounded-full bg-[#C09E6D] shrink-0" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    onClick={openTextBannerDrawer}
                    className="w-full flex items-center justify-center gap-2.5 px-6 py-3.5 text-xs uppercase tracking-widest font-semibold bg-[#F1ECE3] hover:bg-[#E6DFD5] text-[#4A3B32] rounded-xl shadow-sm transition-all active:scale-[0.98] cursor-pointer mt-auto"
                  >
                    {textBannerForm.text ? <Edit2 className="w-4 h-4 text-[#C09E6D]" /> : <Plus className="w-4 h-4 text-[#C09E6D]" />}
                    {textBannerForm.text ? t('editTextBanner') : t('addTextBanner')}
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* DELETE BANNER CONFIRMATION MODAL */}
      <ConfirmModal
        isOpen={isDeleteBannerModalOpen}
        title={t('deleteBannerTitle')}
        message={t('deleteBannerMessage')}
        onCancel={() => setIsDeleteBannerModalOpen(false)}
        onConfirm={() => {
          setCafeForm(prev => ({
            ...prev,
            banner: '',
            bannerX: 50,
            bannerY: 50,
            bannerScale: 1,
            bannerOriginal: ''
          }));
          if (bannerFileInputRef.current) {
            bannerFileInputRef.current.value = '';
          }
          setIsDeleteBannerModalOpen(false);
          showToast(t('bannerDeletedToast'));
        }}
      />

      {/* BANNER CROP & POSITIONING POPUP MODAL */}
      <ImageCropModal
        isOpen={isBannerCropModalOpen}
        image={tempBannerImg}
        title={t('bannerCropTitle')}
        subtitle={t('bannerCropSubtitle')}
        labels={{
          dragHint: t('cropDragHint'),
          zoom: t('cropZoom'),
          reset: t('cropReset'),
          cancel: t('cancel'),
          apply: t('cropApply'),
        }}
        crop={{ crop, zoom }}
        aspect={16 / 9}
        onCropChange={onCropChange}
        onZoomChange={onZoomChange}
        onCropComplete={onCropComplete}
        onClose={() => setIsBannerCropModalOpen(false)}
        onApply={applyBannerCrop}
      />

      {/* CONFIRM DELETE LOGO MODAL */}
      <ConfirmModal
        isOpen={isDeleteLogoModalOpen}
        title={t('deleteLogoTitle')}
        message={t('deleteLogoMessage')}
        onCancel={() => setIsDeleteLogoModalOpen(false)}
        onConfirm={() => {
          setCafeForm(prev => ({
            ...prev,
            logo: '',
            logoX: 50,
            logoY: 50,
            logoScale: 1,
            logoOriginal: ''
          }));
          if (logoFileInputRef.current) {
            logoFileInputRef.current.value = '';
          }
          setIsDeleteLogoModalOpen(false);
          showToast(t('logoDeletedToast'));
        }}
      />

      {/* LOGO CROP & POSITIONING POPUP MODAL */}
      <ImageCropModal
        isOpen={isLogoCropModalOpen}
        image={tempLogoImg}
        title={t('logoCropTitle')}
        subtitle={t('logoCropSubtitle')}
        labels={{
          dragHint: t('cropDragHint'),
          zoom: t('cropZoom'),
          reset: t('cropReset'),
          cancel: t('cancel'),
          apply: t('cropApply'),
        }}
        crop={{ crop: logoCrop, zoom: logoZoom }}
        aspect={16 / 9}
        onCropChange={onLogoCropChange}
        onZoomChange={onLogoZoomChange}
        onCropComplete={onLogoCropComplete}
        onClose={() => setIsLogoCropModalOpen(false)}
        onApply={applyLogoCrop}
      />

      {/* CATEGORY FORM DRAWER */}
      <AdminDrawer
        isOpen={isCatDrawerOpen}
        title={editingCategory ? `${t('edit')} ${t('categories').toLowerCase()}` : t('addCategory')}
        subtitle={t('categorySubtitle')}
        headerAction={<LanguageSelector currentLang={lang} onChange={changeLanguage} />}
        onClose={resetCatForm}
      >
        <form onSubmit={handleSaveCategory} className="space-y-5">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-xs uppercase tracking-wider text-[#8E7A68] font-semibold">
                {t('categoryNameMain')}
              </label>
              <span className="text-[10px] bg-[#C09E6D]/15 text-[#3E2F26] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                {LANG_CODE[lang] ?? lang.toUpperCase()}
              </span>
            </div>

            {lang === 'uk' && (
              <input 
                type="text"
                value={catForm.nameUk}
                onChange={(e) => setCatForm({...catForm, nameUk: e.target.value})}
                className="w-full px-3 py-2.5 bg-[#FDFBF7] border border-[#E6DFD5] text-[#231913] text-sm rounded-xl"
                placeholder={t('categoryNamePlaceholder')}
                required
              />
            )}

            {lang === 'hu' && (
              <input 
                type="text"
                value={catForm.nameHu}
                onChange={(e) => setCatForm({...catForm, nameHu: e.target.value})}
                className="w-full px-3 py-2.5 bg-[#FDFBF7] border border-[#E6DFD5] text-[#231913] text-sm rounded-xl"
                placeholder="Írja be a kategória nevét magyarul"
              />
            )}

            {lang === 'en' && (
              <input 
                type="text"
                value={catForm.nameEn}
                onChange={(e) => setCatForm({...catForm, nameEn: e.target.value})}
                className="w-full px-3 py-2.5 bg-[#FDFBF7] border border-[#E6DFD5] text-[#231913] text-sm rounded-xl"
                placeholder="Enter category name in English"
              />
            )}
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-[#8E7A68] font-semibold mb-1">{t('categoryPhoto')} *</label>

            {/* Hidden File Input for Category Photo */}
            <input 
              ref={catFileInputRef}
              id="category-photo-file-input"
              type="file" 
              accept="image/*" 
              onChange={(e) => handleImageUpload(e, 'category')}
              className="hidden"
            />

            {/* Category photo tap card */}
            <div 
              onClick={() => catFileInputRef.current?.click()}
              className="group relative w-full aspect-[4/3] border-2 border-[#E6DFD5] hover:border-[#C09E6D] bg-white rounded-2xl overflow-hidden shadow-sm select-none cursor-pointer transition-all active:scale-[0.99]"
              style={{ aspectRatio: '4 / 3' }}
            >
              {catForm.photo ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element -- admin preview, already optimized inline */}
                  <img 
                    src={catForm.photo} 
                    alt="Category Photo Preview" 
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                    referrerPolicy="no-referrer"
                  />

                  {/* Semi-transparent replace photo overlay icon */}
                  <div className="absolute inset-0 bg-black/25 group-hover:bg-black/35 flex items-center justify-center transition-colors">
                    <div className="w-14 h-14 rounded-full bg-black/50 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 active:scale-95">
                      <Camera className="w-7 h-7 text-white drop-shadow-sm" />
                    </div>
                  </div>

                  {/* Delete category photo button in top right corner */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsDeleteCatPhotoModalOpen(true);
                    }}
                    title={t('deletePhoto')}
                    className="absolute top-3 right-3 z-20 w-10 h-10 rounded-full bg-black/60 hover:bg-red-700/90 text-white/90 hover:text-white backdrop-blur-md border border-white/25 flex items-center justify-center transition-all shadow-md active:scale-90 cursor-pointer"
                  >
                    <Trash2 className="w-4.5 h-4.5" />
                  </button>

                  {/* Edit category photo button in bottom right corner */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openCatCropModal();
                    }}
                    title={t('editPhoto')}
                    className="absolute bottom-3 right-3 z-20 w-10 h-10 rounded-full bg-black/60 hover:bg-[#C09E6D] text-white/90 hover:text-white backdrop-blur-md border border-white/25 flex items-center justify-center transition-all shadow-md active:scale-90 cursor-pointer"
                  >
                    <Edit2 className="w-4.5 h-4.5" />
                  </button>
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-white">
                  <div className="w-14 h-14 rounded-full bg-[#FAF6EE] border border-[#E6DFD5] flex items-center justify-center mb-3">
                    <Upload className="w-7 h-7 text-[#C09E6D]" />
                  </div>
                  <span className="text-sm text-[#3E2F26] font-semibold mb-1">{t('categoryPhotoClick')}</span>
                  <span className="text-xs text-[#8E7A68]">{t('categoryPhotoRatio')}</span>
                </div>
              )}
            </div>
            {catForm.photo && (
              <p className="text-xs text-[#8E7A68] mt-2">
                {t('categoryPhotoHint')}
              </p>
            )}
          </div>

          <div className="pt-2 flex gap-3">
            <button 
              type="submit" 
              disabled={catSaveStatus === 'saving'}
              className={`flex-1 relative overflow-hidden px-6 py-3 text-xs uppercase tracking-widest font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-xs active:scale-[0.98] cursor-pointer ${
                catSaveStatus === 'saving'
                  ? 'bg-[#2A1F18] text-[#FAF6EE] ring-2 ring-[#C09E6D]/50 shadow-inner'
                  : catSaveStatus === 'saved'
                  ? 'bg-[#231913] text-[#FAF6EE] ring-2 ring-[#C09E6D] shadow-md animate-btn-pop'
                  : 'bg-[#3E2F26] text-[#FAF6EE] hover:bg-[#231913]'
              }`}
            >
              {catSaveStatus === 'saving' && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent animate-btn-shimmer pointer-events-none" />
              )}
              {catSaveStatus === 'saving' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#C09E6D]" />
                  <span>{t('saving')}</span>
                </>
              ) : catSaveStatus === 'saved' ? (
                <>
                  <Check className="w-4 h-4 text-[#C09E6D] stroke-[3]" />
                  <span className="font-bold tracking-wider text-[#FAF6EE]">{t('saved')}</span>
                </>
              ) : (
                <>
                  {editingCategory ? <Save className="w-4 h-4 text-[#C09E6D]" /> : <Plus className="w-4 h-4 text-[#C09E6D]" />}
                  <span>{editingCategory ? t('saveBtn') : t('addCategory')}</span>
                </>
              )}
            </button>
            {editingCategory && (
              <button 
                type="button" 
                onClick={resetCatForm}
                className="px-5 py-3 bg-[#E6DFD5] text-[#4A3B32] text-xs uppercase tracking-widest font-semibold hover:bg-[#FAF6EE] transition-colors rounded-xl"
              >
                {t('cancel')}
              </button>
            )}
          </div>
        </form>
      </AdminDrawer>

      {/* PRODUCT FORM DRAWER */}
      <AdminDrawer
        isOpen={isProdDrawerOpen}
        title={editingProduct ? `${t('edit')} ${t('menu').toLowerCase()}` : t('addProduct')}
        subtitle={t('productSubtitle')}
        headerAction={<LanguageSelector currentLang={lang} onChange={changeLanguage} />}
        onClose={resetProdForm}
      >
        <form onSubmit={handleSaveProduct} className="space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#8E7A68] font-semibold mb-2">{t('productCategory')} *</label>
              <select 
                value={prodForm.categoryId}
                onChange={(e) => setProdForm({...prodForm, categoryId: e.target.value})}
                className="select-field w-full px-3 py-2.5 bg-[#FDFBF7] border border-[#E6DFD5] text-[#231913] text-sm rounded-xl"
                required
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.nameUk}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#8E7A68] font-semibold mb-2">{t('productPrice')} *</label>
              <input 
                type="number"
                value={prodForm.price || ''}
                onChange={(e) => setProdForm({...prodForm, price: Number(e.target.value)})}
                className="w-full px-3 py-2.5 bg-[#FDFBF7] border border-[#E6DFD5] text-[#231913] text-sm rounded-xl"
                required
              />
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-xs uppercase tracking-wider text-[#8E7A68] font-semibold">
                {t('productNameMain')}
              </label>
              <span className="text-[10px] bg-[#C09E6D]/15 text-[#3E2F26] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                {LANG_CODE[lang] ?? lang.toUpperCase()}
              </span>
            </div>

            {lang === 'uk' && (
              <input 
                type="text"
                value={prodForm.nameUk}
                onChange={(e) => setProdForm({...prodForm, nameUk: e.target.value})}
                className="w-full px-3 py-2.5 bg-[#FDFBF7] border border-[#E6DFD5] text-[#231913] text-sm rounded-xl"
                placeholder={t('productNamePlaceholder')}
                required
              />
            )}

            {lang === 'hu' && (
              <input 
                type="text"
                value={prodForm.nameHu}
                onChange={(e) => setProdForm({...prodForm, nameHu: e.target.value})}
                className="w-full px-3 py-2.5 bg-[#FDFBF7] border border-[#E6DFD5] text-[#231913] text-sm rounded-xl"
                placeholder="Írja be a termék nevét magyarul"
              />
            )}

            {lang === 'en' && (
              <input 
                type="text"
                value={prodForm.nameEn}
                onChange={(e) => setProdForm({...prodForm, nameEn: e.target.value})}
                className="w-full px-3 py-2.5 bg-[#FDFBF7] border border-[#E6DFD5] text-[#231913] text-sm rounded-xl"
                placeholder="Enter product name in English"
              />
            )}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-xs uppercase tracking-wider text-[#8E7A68] font-semibold">
                {t('productDescMain')}
              </label>
              <span className="text-[10px] bg-[#C09E6D]/15 text-[#3E2F26] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                {LANG_CODE[lang] ?? lang.toUpperCase()}
              </span>
            </div>

            {lang === 'uk' && (
              <textarea 
                value={prodForm.descriptionUk}
                onChange={(e) => setProdForm({...prodForm, descriptionUk: e.target.value})}
                className="w-full px-3 py-2.5 bg-[#FDFBF7] border border-[#E6DFD5] text-[#231913] text-xs min-h-[80px] rounded-xl"
                placeholder={t('productDescPlaceholder')}
              />
            )}

            {lang === 'hu' && (
              <textarea 
                value={prodForm.descriptionHu}
                onChange={(e) => setProdForm({...prodForm, descriptionHu: e.target.value})}
                className="w-full px-3 py-2.5 bg-[#FDFBF7] border border-[#E6DFD5] text-[#231913] text-xs min-h-[80px] rounded-xl"
                placeholder="Termék leírása magyarul"
              />
            )}

            {lang === 'en' && (
              <textarea 
                value={prodForm.descriptionEn}
                onChange={(e) => setProdForm({...prodForm, descriptionEn: e.target.value})}
                className="w-full px-3 py-2.5 bg-[#FDFBF7] border border-[#E6DFD5] text-[#231913] text-xs min-h-[80px] rounded-xl"
                placeholder="Product description in English"
              />
            )}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="block text-xs uppercase tracking-wider text-[#8E7A68] font-semibold">
                {t('productIngredientsMain')}
              </label>
              <span className="text-[10px] bg-[#C09E6D]/15 text-[#3E2F26] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider">
                {LANG_CODE[lang] ?? lang.toUpperCase()}
              </span>
            </div>

            {lang === 'uk' && (
              <input 
                type="text"
                value={prodForm.ingredientsUk}
                onChange={(e) => setProdForm({...prodForm, ingredientsUk: e.target.value})}
                className="w-full px-3 py-2.5 bg-[#FDFBF7] border border-[#E6DFD5] text-[#231913] text-xs rounded-xl"
                placeholder={t('productIngredientsPlaceholder')}
              />
            )}

            {lang === 'hu' && (
              <input 
                type="text"
                value={prodForm.ingredientsHu}
                onChange={(e) => setProdForm({...prodForm, ingredientsHu: e.target.value})}
                className="w-full px-3 py-2.5 bg-[#FDFBF7] border border-[#E6DFD5] text-[#231913] text-xs rounded-xl"
                placeholder="pl. kávé, tej, cukor"
              />
            )}

            {lang === 'en' && (
              <input 
                type="text"
                value={prodForm.ingredientsEn}
                onChange={(e) => setProdForm({...prodForm, ingredientsEn: e.target.value})}
                className="w-full px-3 py-2.5 bg-[#FDFBF7] border border-[#E6DFD5] text-[#231913] text-xs rounded-xl"
                placeholder="e.g. coffee, milk, sugar"
              />
            )}
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-[#8E7A68] font-semibold mb-2">{t('productPhoto')} *</label>
            <input 
              ref={prodFileInputRef}
              id="product-photo-file-input"
              type="file" 
              accept="image/*" 
              onChange={(e) => handleImageUpload(e, 'product')}
              className="hidden"
            />
            <div 
              onClick={() => prodFileInputRef.current?.click()}
              className="group relative w-full aspect-[4/3] border-2 border-[#E6DFD5] hover:border-[#C09E6D] bg-white rounded-2xl overflow-hidden shadow-sm select-none cursor-pointer transition-all active:scale-[0.99]"
              style={{ aspectRatio: '4 / 3' }}
            >
              {prodForm.photo ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element -- admin preview, already optimized inline */}
                  <img 
                    src={prodForm.photo} 
                    alt="Product Photo Preview" 
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/25 group-hover:bg-black/35 flex items-center justify-center transition-colors">
                    <div className="w-14 h-14 rounded-full bg-black/50 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 active:scale-95">
                      <Camera className="w-7 h-7 text-white drop-shadow-sm" />
                    </div>
                  </div>

                  {/* Delete product photo button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsDeleteProdPhotoModalOpen(true);
                    }}
                    title={t('deletePhoto')}
                    className="absolute top-3 right-3 z-20 w-10 h-10 rounded-full bg-black/60 hover:bg-red-700/90 text-white/90 hover:text-white backdrop-blur-md border border-white/25 flex items-center justify-center transition-all shadow-md active:scale-90 cursor-pointer"
                  >
                    <Trash2 className="w-4.5 h-4.5" />
                  </button>

                  {/* Edit (crop) product photo button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openProdCropModal();
                    }}
                    title={t('editPhoto')}
                    className="absolute bottom-3 right-3 z-20 w-10 h-10 rounded-full bg-black/60 hover:bg-[#C09E6D] text-white/90 hover:text-white backdrop-blur-md border border-white/25 flex items-center justify-center transition-all shadow-md active:scale-90 cursor-pointer"
                  >
                    <Edit2 className="w-4.5 h-4.5" />
                  </button>
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-white">
                  <div className="w-14 h-14 rounded-full bg-[#FAF6EE] border border-[#E6DFD5] flex items-center justify-center mb-3">
                    <Upload className="w-7 h-7 text-[#C09E6D]" />
                  </div>
                  <span className="text-sm text-[#3E2F26] font-semibold mb-1">{t('chooseProductImage')}</span>
                  <span className="text-xs text-[#8E7A68]">JPG, PNG, WebP</span>
                </div>
              )}
            </div>
          </div>

          {/* Recommended products (Ідеально смакує разом) */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-[#8E7A68] font-semibold mb-2">
              {t('recommendedWith')}
            </label>

            {products.filter((p) => prodForm.recommendedIds.includes(p.id)).length > 0 && (
              <div className="space-y-2 mb-2">
                {products
                  .filter((p) => prodForm.recommendedIds.includes(p.id))
                  .map((rp) => (
                    <div key={rp.id} className="flex items-center overflow-hidden border border-[#E6DFD5] bg-[#FAF6EE] rounded-2xl">
                      <div className="relative w-24 aspect-[4/3] shrink-0 overflow-hidden bg-white">
                        {/* eslint-disable-next-line @next/next/no-img-element -- admin preview, already optimized inline */}
                        <img src={rp.photo} alt={rp.nameUk} className="absolute inset-0 w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                      <div className="flex flex-1 items-center justify-between gap-2 p-3 min-w-0">
                        <p className="font-semibold text-sm text-[#231913] truncate">
                          {lang === 'hu' ? rp.nameHu : lang === 'en' ? rp.nameEn : rp.nameUk}
                        </p>
                        <button
                          type="button"
                          onClick={() => setProdForm(prev => ({ ...prev, recommendedIds: prev.recommendedIds.filter(id => id !== rp.id) }))}
                          className="p-1.5 text-[#3E2F26] hover:bg-[#F1ECE3] transition-all rounded-full shrink-0 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {products.filter((p) => prodForm.recommendedIds.includes(p.id)).length < 5 && (
              <button
                type="button"
                onClick={openRecPicker}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#F1ECE3] hover:bg-[#E6DFD5] text-[#3E2F26] text-xs uppercase tracking-widest font-semibold rounded-xl border border-[#E6DFD5] transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 text-[#C09E6D]" />
                <span>{t('add')}</span>
              </button>
            )}
          </div>

          <div className="pt-2 flex gap-3">
            <button 
              type="submit" 
              disabled={prodSaveStatus === 'saving'}
              className={`flex-1 relative overflow-hidden px-6 py-3 text-xs uppercase tracking-widest font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-xs active:scale-[0.98] cursor-pointer ${
                prodSaveStatus === 'saving'
                  ? 'bg-[#2A1F18] text-[#FAF6EE] ring-2 ring-[#C09E6D]/50 shadow-inner'
                  : prodSaveStatus === 'saved'
                  ? 'bg-[#231913] text-[#FAF6EE] ring-2 ring-[#C09E6D] shadow-md animate-btn-pop'
                  : 'bg-[#3E2F26] text-[#FAF6EE] hover:bg-[#231913]'
              }`}
            >
              {prodSaveStatus === 'saving' && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent animate-btn-shimmer pointer-events-none" />
              )}
              {prodSaveStatus === 'saving' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#C09E6D]" />
                  <span>{t('saving')}</span>
                </>
              ) : prodSaveStatus === 'saved' ? (
                <>
                  <Check className="w-4 h-4 text-[#C09E6D] stroke-[3]" />
                  <span className="font-bold tracking-wider text-[#FAF6EE]">{t('saved')}</span>
                </>
              ) : (
                <>
                  {editingProduct ? <Save className="w-4 h-4 text-[#C09E6D]" /> : <Plus className="w-4 h-4 text-[#C09E6D]" />}
                  <span>{editingProduct ? t('saveBtn') : t('addProduct')}</span>
                </>
              )}
            </button>
            {editingProduct && (
              <button 
                type="button" 
                onClick={resetProdForm}
                className="px-5 py-3 bg-[#E6DFD5] text-[#4A3B32] text-xs uppercase tracking-widest font-semibold hover:bg-[#FAF6EE] transition-colors rounded-xl"
              >
                {t('cancel')}
              </button>
            )}
          </div>
        </form>
      </AdminDrawer>

      {/* ADVERTISING (Popup) DRAWER */}
      <AdminDrawer
        isOpen={isAdDrawerOpen}
        title={t('advertising')}
        subtitle={t('advertisingSubtitleShort')}
        onClose={closeAdDrawer}
      >
        <form onSubmit={handleSaveAdvertising} className="space-y-6">
          {/* Ad Photo Upload (9:16) */}
          <div className="space-y-3">
            <label className="block text-xs uppercase tracking-wider text-[#8E7A68] font-semibold">{t('adPhoto')}</label>

            <input
              ref={adFileInputRef}
              id="advertising-photo-file-input"
              type="file"
              accept="image/*"
              onChange={(e) => handleImageUpload(e, 'advertising')}
              className="hidden"
            />

            <div
              onClick={() => adFileInputRef.current?.click()}
              className="group relative w-full max-w-[280px] aspect-[9/16] border-2 border-[#E6DFD5] hover:border-[#C09E6D] bg-white rounded-2xl overflow-hidden shadow-sm select-none cursor-pointer transition-all active:scale-[0.99] mx-auto"
              style={{ aspectRatio: '9 / 16' }}
            >
              {adForm.photo ? (
                <>
                  <Image
                    src={adForm.photo}
                    alt="Ad Photo Preview"
                    fill
                    sizes="280px"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                    unoptimized={adForm.photo.startsWith('data:')}
                  />

                  {/* Semi-transparent replace photo overlay icon */}
                  <div className="absolute inset-0 bg-black/25 group-hover:bg-black/35 flex items-center justify-center transition-colors">
                    <div className="w-14 h-14 rounded-full bg-black/50 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-lg transition-transform group-hover:scale-110 active:scale-95">
                      <Camera className="w-7 h-7 text-white drop-shadow-sm" />
                    </div>
                  </div>

                  {/* Delete ad photo button in top right corner */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsDeleteAdPhotoModalOpen(true);
                    }}
                    title={t('deletePhoto')}
                    className="absolute top-3 right-3 z-20 w-10 h-10 rounded-full bg-black/60 hover:bg-red-700/90 text-white/90 hover:text-white backdrop-blur-md border border-white/25 flex items-center justify-center transition-all shadow-md active:scale-90 cursor-pointer"
                  >
                    <Trash2 className="w-4.5 h-4.5" />
                  </button>

                  {/* Edit ad photo button in bottom right corner */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openAdCropModal();
                    }}
                    title={t('editPhoto')}
                    className="absolute bottom-3 right-3 z-20 w-10 h-10 rounded-full bg-black/60 hover:bg-[#C09E6D] text-white/90 hover:text-white backdrop-blur-md border border-white/25 flex items-center justify-center transition-all shadow-md active:scale-90 cursor-pointer"
                  >
                    <Edit2 className="w-4.5 h-4.5" />
                  </button>
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-white">
                  <div className="w-14 h-14 rounded-full bg-[#FAF6EE] border border-[#E6DFD5] flex items-center justify-center mb-3">
                    <Upload className="w-7 h-7 text-[#C09E6D]" />
                  </div>
                  <span className="text-sm text-[#3E2F26] font-semibold mb-1">{t('adPhotoClick')}</span>
                  <span className="text-xs text-[#8E7A68]">{t('adPhotoRatio')}</span>
                </div>
              )}
            </div>
            {adForm.photo && (
              <p className="text-xs text-[#8E7A68] text-center">
                {t('adPhotoHint')}
              </p>
            )}
          </div>

          {/* Delay (seconds) + show until */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#8E7A68] font-semibold mb-2">
                {t('adDelayLabel')}
              </label>
              <input
                type="number"
                min={0}
                max={3600}
                value={adForm.delaySeconds || ''}
                onChange={(e) => setAdForm({ ...adForm, delaySeconds: Number(e.target.value) })}
                className="w-full px-4 py-2.5 bg-[#FAF6EE] border border-[#E6DFD5] text-[#231913] focus:outline-none focus:border-[#C09E6D] text-sm rounded-xl"
              />
              <p className="text-[11px] text-[#8E7A68] mt-1.5 leading-relaxed">{t('adDelayHint')}</p>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-[#8E7A68] font-semibold mb-2">
                {t('adShowUntilLabel')}
              </label>
              <DatePicker
                value={adForm.showUntil || ''}
                onChange={(v) => setAdForm({ ...adForm, showUntil: v })}
                lang={lang}
                placeholder={t('adShowUntilPlaceholder')}
                clearLabel={lang === 'hu' ? 'Törlés' : lang === 'en' ? 'Clear' : 'Очистити'}
              />
              <p className="text-[11px] text-[#8E7A68] mt-1.5 leading-relaxed">{t('adShowUntilHint')}</p>
            </div>
          </div>

          {/* Optional product link (category → product): clicking the popup opens the dish */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#8E7A68] font-semibold">{t('adLinkLabel')}</label>
              <p className="text-[11px] text-[#8E7A68] mt-1 leading-relaxed">{t('adLinkHint')}</p>
            </div>

            <select
              value={adForm.categoryId || ''}
              onChange={(e) => setAdForm(prev => ({ ...prev, categoryId: e.target.value, productId: '' }))}
              className="select-field w-full px-3 py-2.5 bg-[#FDFBF7] border border-[#E6DFD5] text-[#231913] text-sm rounded-xl focus:outline-none focus:border-[#C09E6D]"
            >
              <option value="">{t('adNoLink')}</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.nameUk}</option>
              ))}
            </select>

            <select
              value={adForm.productId || ''}
              onChange={(e) => setAdForm(prev => ({ ...prev, productId: e.target.value }))}
              disabled={!adForm.categoryId}
              className="select-field w-full px-3 py-2.5 bg-[#FDFBF7] border border-[#E6DFD5] text-[#231913] text-sm rounded-xl focus:outline-none focus:border-[#C09E6D] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">{t('adProductPlaceholder')}</option>
              {products
                .filter((p) => p.categoryId === adForm.categoryId)
                .map((p) => (
                  <option key={p.id} value={p.id}>{p.nameUk}</option>
                ))}
            </select>
          </div>

          {/* Enabled toggle */}
          <div className="pt-4 border-t border-[#E6DFD5]">
            <div className="flex items-center justify-between gap-4">
              <div className="text-left min-w-0">
                <span className="block text-xs uppercase tracking-wider font-semibold text-[#4A3B32]">{t('adEnabledLabel')}</span>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={adForm.enabled}
                aria-label={t('adEnabledLabel')}
                onClick={() => {
                  if (!adForm.enabled && !adForm.photo) {
                    showToast(t('adRequiredPhoto'), 'error');
                    return;
                  }
                  setAdForm(prev => ({ ...prev, enabled: !prev.enabled }));
                }}
                className={`relative inline-flex shrink-0 w-12 h-7 rounded-full transition-colors duration-200 cursor-pointer border ${
                  adForm.enabled
                    ? 'bg-[#C09E6D] border-[#C09E6D]'
                    : 'bg-[#E6DFD5] border-[#D5CBBF]'
                }`}
              >
                <span
                  className={`absolute top-1/2 -translate-y-1/2 left-0.5 w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center transition-transform duration-200 ${
                    adForm.enabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                >
                  {adForm.enabled ? <Check className="w-3.5 h-3.5 text-[#3E2F26] stroke-[3]" /> : <X className="w-3.5 h-3.5 text-[#8E7A68]" />}
                </span>
              </button>
            </div>
            <p className="text-[11px] text-[#8E7A68] mt-1.5 leading-relaxed">{t('adEnabledHint')}</p>
          </div>

          {/* Save */}
          <div className="pt-4 border-t border-[#E6DFD5]">
            <button
              type="submit"
              disabled={adSaveStatus === 'saving'}
              className={`relative overflow-hidden w-full flex justify-center items-center gap-2.5 px-6 py-3.5 text-xs uppercase tracking-widest font-semibold rounded-xl transition-all duration-300 shadow-md active:scale-[0.98] cursor-pointer ${
                adSaveStatus === 'saving'
                  ? 'bg-[#2A1F18] text-[#FAF6EE] ring-2 ring-[#C09E6D]/50 shadow-inner'
                  : adSaveStatus === 'saved'
                  ? 'bg-[#231913] text-[#FAF6EE] ring-2 ring-[#C09E6D] shadow-md animate-btn-pop'
                  : 'bg-[#3E2F26] text-[#FAF6EE] hover:bg-[#231913] hover:shadow-lg'
              }`}
            >
              {adSaveStatus === 'saving' && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent animate-btn-shimmer pointer-events-none" />
              )}
              {adSaveStatus === 'saving' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#C09E6D]" />
                  <span>{t('saving')}</span>
                </>
              ) : adSaveStatus === 'saved' ? (
                <>
                  <Check className="w-4 h-4 text-[#C09E6D] stroke-[3]" />
                  <span className="font-bold tracking-wider text-[#FAF6EE]">{t('saved')}</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 text-[#C09E6D]" />
                  <span>{t('saveBtn')}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </AdminDrawer>

      {/* TEXT BANNER DRAWER */}
      <AdminDrawer
        isOpen={isTextBannerDrawerOpen}
        title={t('textBanner')}
        onClose={closeTextBannerDrawer}
        headerAction={<LanguageSelector currentLang={lang} onChange={changeLanguage} />}
      >
        <form onSubmit={handleSaveTextBanner} className="space-y-5">
          {/* Banner text */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs uppercase tracking-wider text-[#8E7A68] font-semibold">{t('textBannerText')} *</label>
              <span className={`text-[11px] font-bold tabular-nums ${textBannerForm.text.length >= 40 ? 'text-[#C0453A]' : 'text-[#8E7A68]'}`}>
                {textBannerForm.text.length}/40
              </span>
            </div>
            <textarea
              value={textBannerForm.text}
              onChange={(e) => setTextBannerForm(prev => ({ ...prev, text: e.target.value }))}
              rows={3}
              maxLength={40}
              placeholder="☕ Акція! Знижка на всі напої"
              className="w-full px-3 py-2.5 bg-[#FDFBF7] border border-[#E6DFD5] text-[#231913] text-sm rounded-xl focus:outline-none focus:border-[#C09E6D] resize-none"
            />
            <p className="text-[11px] text-[#8E7A68] mt-1.5 leading-relaxed">{t('textBannerTextHint')}</p>
          </div>

          {/* Product link (category → product) */}
          <div>
            <label className="block text-xs uppercase tracking-wider text-[#8E7A68] font-semibold mb-2">{t('textBannerLinkLabel')}</label>

            <select
              value={textBannerForm.categoryId || ''}
              onChange={(e) => setTextBannerForm(prev => ({ ...prev, categoryId: e.target.value, productId: '' }))}
              className="select-field w-full px-3 py-2.5 bg-[#FDFBF7] border border-[#E6DFD5] text-[#231913] text-sm rounded-xl focus:outline-none focus:border-[#C09E6D] mb-2"
            >
              <option value="">{t('textBannerNoLink')}</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.nameUk}</option>
              ))}
            </select>

            <select
              value={textBannerForm.productId || ''}
              onChange={(e) => setTextBannerForm(prev => ({ ...prev, productId: e.target.value }))}
              disabled={!textBannerForm.categoryId}
              className="select-field w-full px-3 py-2.5 bg-[#FDFBF7] border border-[#E6DFD5] text-[#231913] text-sm rounded-xl focus:outline-none focus:border-[#C09E6D] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">{t('textBannerProductPlaceholder')}</option>
              {products
                .filter((p) => p.categoryId === textBannerForm.categoryId)
                .map((p) => (
                  <option key={p.id} value={p.id}>{p.nameUk}</option>
                ))}
            </select>

            <p className="text-[11px] text-[#8E7A68] mt-1.5 leading-relaxed">{t('textBannerLinkHint')}</p>
          </div>

          {/* Enabled toggle */}
          <div className="pt-4 border-t border-[#E6DFD5]">
            <div className="flex items-center justify-between gap-4">
              <div className="text-left min-w-0">
                <span className="block text-xs uppercase tracking-wider font-semibold text-[#4A3B32]">{t('textBannerEnabledLabel')}</span>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={textBannerForm.enabled}
                aria-label={t('textBannerEnabledLabel')}
                onClick={() => setTextBannerForm(prev => ({ ...prev, enabled: !prev.enabled }))}
                className={`relative inline-flex shrink-0 w-12 h-7 rounded-full transition-colors duration-200 cursor-pointer border ${
                  textBannerForm.enabled
                    ? 'bg-[#C09E6D] border-[#C09E6D]'
                    : 'bg-[#E6DFD5] border-[#D5CBBF]'
                }`}
              >
                <span
                  className={`absolute top-1/2 -translate-y-1/2 left-0.5 w-6 h-6 rounded-full bg-white shadow-md flex items-center justify-center transition-transform duration-200 ${
                    textBannerForm.enabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                >
                  {textBannerForm.enabled ? <Check className="w-3.5 h-3.5 text-[#3E2F26] stroke-[3]" /> : <X className="w-3.5 h-3.5 text-[#8E7A68]" />}
                </span>
              </button>
            </div>
            <p className="text-[11px] text-[#8E7A68] mt-1.5 leading-relaxed">{t('textBannerEnabledHint')}</p>
          </div>

          {/* Save */}
          <div className="pt-4 border-t border-[#E6DFD5]">
            <button
              type="submit"
              disabled={textBannerSaveStatus === 'saving'}
              className={`relative overflow-hidden w-full flex justify-center items-center gap-2.5 px-6 py-3.5 text-xs uppercase tracking-widest font-semibold rounded-xl transition-all duration-300 shadow-md active:scale-[0.98] cursor-pointer ${
                textBannerSaveStatus === 'saving'
                  ? 'bg-[#2A1F18] text-[#FAF6EE] ring-2 ring-[#C09E6D]/50 shadow-inner'
                  : textBannerSaveStatus === 'saved'
                  ? 'bg-[#231913] text-[#FAF6EE] ring-2 ring-[#C09E6D] shadow-md animate-btn-pop'
                  : 'bg-[#3E2F26] text-[#FAF6EE] hover:bg-[#231913] hover:shadow-lg'
              }`}
            >
              {textBannerSaveStatus === 'saving' && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent animate-btn-shimmer pointer-events-none" />
              )}
              {textBannerSaveStatus === 'saving' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#C09E6D]" />
                  <span>{t('saving')}</span>
                </>
              ) : textBannerSaveStatus === 'saved' ? (
                <>
                  <Check className="w-4 h-4 text-[#C09E6D] stroke-[3]" />
                  <span className="font-bold tracking-wider text-[#FAF6EE]">{t('saved')}</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 text-[#C09E6D]" />
                  <span>{t('saveBtn')}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </AdminDrawer>

      {/* RECOMMENDED PRODUCTS PICKER */}
      <RecommendedProductsPicker
        key={recPickerSession}
        isOpen={isRecPickerOpen}
        categories={categories}
        products={products}
        selectedIds={prodForm.recommendedIds}
        lang={lang}
        excludeId={editingProduct?.id ?? ''}
        max={5}
        onClose={() => setIsRecPickerOpen(false)}
        onConfirm={(ids) => {
          setProdForm(prev => ({
            ...prev,
            recommendedIds: [...prev.recommendedIds, ...ids.filter(id => !prev.recommendedIds.includes(id))].slice(0, 5)
          }));
          setIsRecPickerOpen(false);
        }}
        t={t}
      />

      {/* DELETE CATEGORY PHOTO CONFIRMATION MODAL */}
      <ConfirmModal
        isOpen={isDeleteCatPhotoModalOpen}
        title={t('deleteCategoryPhotoTitle')}
        message={t('deleteCategoryPhotoMessage')}
        onCancel={() => setIsDeleteCatPhotoModalOpen(false)}
        onConfirm={() => {
          setCatForm(prev => ({
            ...prev,
            photo: '',
            photoX: 50,
            photoY: 50,
            photoScale: 1,
            photoOriginal: ''
          }));
          if (catFileInputRef.current) {
            catFileInputRef.current.value = '';
          }
          setIsDeleteCatPhotoModalOpen(false);
          showToast(t('categoryPhotoDeletedToast'));
        }}
      />

      {/* DELETE CATEGORY / PRODUCT CONFIRMATION MODAL */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        title={t('deleteConfirmTitle')}
        message={deleteTarget ? `${t('deleteConfirmMessage')} "${deleteTarget.name}"?` : ''}
        warning={deleteTarget?.kind === 'category' && (deleteTarget.productsCount ?? 0) > 0
          ? t('deleteCategoryWithProductsWarning').replace('{count}', String(deleteTarget!.productsCount))
          : ''}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          const target = deleteTarget;
          setDeleteTarget(null);
          if (!target) return;
          if (target.kind === 'category') {
            performDeleteCategory(target.id);
          } else {
            performDeleteProduct(target.id);
          }
        }}
      />

      {/* CATEGORY PHOTO CROP & POSITIONING POPUP MODAL */}
      <ImageCropModal
        isOpen={isCatCropModalOpen}
        image={tempCatImg}
        title={t('categoryCropTitle')}
        subtitle={t('categoryCropSubtitle')}
        labels={{
          dragHint: t('cropDragHint'),
          zoom: t('cropZoom'),
          reset: t('cropReset'),
          cancel: t('cancel'),
          apply: t('cropApply'),
        }}
        crop={{ crop: catCrop, zoom: catZoom }}
        aspect={4 / 3}
        onCropChange={onCatCropChange}
        onZoomChange={onCatZoomChange}
        onCropComplete={onCatCropComplete}
        onClose={() => setIsCatCropModalOpen(false)}
        onApply={applyCatCrop}
      />

      {/* PRODUCT PHOTO CROP & POSITIONING POPUP MODAL */}
      <ImageCropModal
        isOpen={isProdCropModalOpen}
        image={tempProdImg}
        title={t('productCropTitle')}
        subtitle={t('productCropSubtitle')}
        labels={{
          dragHint: t('cropDragHint'),
          zoom: t('cropZoom'),
          reset: t('cropReset'),
          cancel: t('cancel'),
          apply: t('cropApply'),
        }}
        crop={{ crop: prodCrop, zoom: prodZoom }}
        aspect={4 / 3}
        onCropChange={onProdCropChange}
        onZoomChange={onProdZoomChange}
        onCropComplete={onProdCropComplete}
        onClose={() => setIsProdCropModalOpen(false)}
        onApply={applyProdCrop}
      />

      {/* DELETE PRODUCT PHOTO CONFIRMATION MODAL */}
      <ConfirmModal
        isOpen={isDeleteProdPhotoModalOpen}
        title={t('deleteProductPhotoTitle')}
        message={t('deleteProductPhotoMessage')}
        onCancel={() => setIsDeleteProdPhotoModalOpen(false)}
        onConfirm={() => {
          setProdForm(prev => ({ ...prev, photo: '', photoOriginal: '' }));
          if (prodFileInputRef.current) {
            prodFileInputRef.current.value = '';
          }
          setIsDeleteProdPhotoModalOpen(false);
          showToast(t('productPhotoDeletedToast'));
        }}
      />

      {/* DELETE AD PHOTO CONFIRMATION MODAL */}
      <ConfirmModal
        isOpen={isDeleteAdPhotoModalOpen}
        title={t('adDeletePhotoTitle')}
        message={t('adDeletePhotoMessage')}
        onCancel={() => setIsDeleteAdPhotoModalOpen(false)}
        onConfirm={() => {
          setAdForm(prev => ({ ...prev, photo: '', photoOriginal: '', enabled: false }));
          if (adFileInputRef.current) {
            adFileInputRef.current.value = '';
          }
          setIsDeleteAdPhotoModalOpen(false);
          showToast(t('adPhotoDeletedToast'));
        }}
      />

      {/* AD PHOTO CROP & POSITIONING POPUP MODAL */}
      <ImageCropModal
        isOpen={isAdCropModalOpen}
        image={tempAdImg}
        title={t('adCropTitle')}
        subtitle={t('adCropSubtitle')}
        labels={{
          dragHint: t('cropDragHint'),
          zoom: t('cropZoom'),
          reset: t('cropReset'),
          cancel: t('cancel'),
          apply: t('cropApply'),
        }}
        crop={{ crop: adCrop, zoom: adZoom }}
        aspect={9 / 16}
        onCropChange={onAdCropChange}
        onZoomChange={onAdZoomChange}
        onCropComplete={onAdCropComplete}
        onClose={() => setIsAdCropModalOpen(false)}
        onApply={applyAdCrop}
      />

      {/* WELCOME POPUP */}
      <NotAdminModal
        isOpen={showWelcome}
        logo={cafeInfo?.logo ?? null}
        title={t('welcomeTitle').replace('{name}', (getCafeOwnerName(cafeInfo, lang) || currentUser?.user_metadata?.full_name || currentUser?.email?.split('@')[0] || '').trim().split(/\s+/)[0] || '')}
        text={(cafeInfo?.greetingAdminEnabled ? getRandomGreeting(getCafeAdminGreeting(cafeInfo, lang)) : '') || t(welcomeMsgKey)}
        okLabel={t('toWork')}
        onOk={() => setShowWelcome(false)}
      />
    </main>
  );
}
