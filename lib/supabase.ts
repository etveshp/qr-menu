import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import { validateCafeInfo, validateCategory, validateProduct, validateTextBanner } from './validation';

// Types (same as the original lib, kept for compatibility)
export interface CafeInfo {
  ownerNameUk: string; ownerNameHu: string; ownerNameEn: string;
  nameUk: string; nameHu: string; nameEn: string;
  descriptionUk: string; descriptionHu: string; descriptionEn: string;
  banner: string; logo: string; instagram: string;
  bannerScale?: number; bannerX?: number; bannerY?: number;
  logoScale?: number; logoX?: number; logoY?: number;
  bannerOriginal?: string; logoOriginal?: string;
  greetingCustomerUk?: string; greetingCustomerHu?: string; greetingCustomerEn?: string;
  greetingCustomerEnabled?: boolean;
  greetingAdminUk?: string; greetingAdminHu?: string; greetingAdminEn?: string;
  greetingAdminEnabled?: boolean;
}

export const getCafeName = (info: CafeInfo | null, lang: string): string => {
  if (!info) return '';
  return lang === 'hu' ? info.nameHu : lang === 'en' ? info.nameEn : info.nameUk;
};

export const getCafeDescription = (info: CafeInfo | null, lang: string): string => {
  if (!info) return '';
  return lang === 'hu' ? info.descriptionHu : lang === 'en' ? info.descriptionEn : info.descriptionUk;
};

export const getCafeOwnerName = (info: CafeInfo | null, lang: string): string => {
  if (!info) return '';
  return lang === 'hu' ? info.ownerNameHu : lang === 'en' ? info.ownerNameEn : info.ownerNameUk;
};

export const getCafeCustomerGreeting = (info: CafeInfo | null, lang: string): string => {
  if (!info) return '';
  return lang === 'hu' ? (info.greetingCustomerHu ?? '') : lang === 'en' ? (info.greetingCustomerEn ?? '') : (info.greetingCustomerUk ?? '');
};

export const getCafeAdminGreeting = (info: CafeInfo | null, lang: string): string => {
  if (!info) return '';
  return lang === 'hu' ? (info.greetingAdminHu ?? '') : lang === 'en' ? (info.greetingAdminEn ?? '') : (info.greetingAdminUk ?? '');
};

// Greetings are stored as several greetings separated by a newline ("\n").
// We also tolerate ";" so previously seeded data keeps working. Pick one at random.
export const getRandomGreeting = (raw: string | undefined | null, rng: () => number = Math.random): string => {
  if (!raw) return '';
  const list = raw.split(/[\n;]+/).map(s => s.trim()).filter(Boolean);
  if (list.length === 0) return '';
  return list[Math.floor(rng() * list.length) % list.length];
};
export interface Category { id: string; nameUk: string; nameHu: string; nameEn: string; photo: string; photoScale?: number; photoX?: number; photoY?: number; photoOriginal?: string; }
export interface Product {
  id: string; categoryId: string;
  nameUk: string; nameHu: string; nameEn: string;
  descriptionUk: string; descriptionHu: string; descriptionEn: string;
  ingredientsUk: string; ingredientsHu: string; ingredientsEn: string;
  price: number; photo: string; recommendedIds: string[];
  photoOriginal?: string;
}
export interface Advertising {
  photo: string;
  photoOriginal?: string;
  delaySeconds: number;
  enabled: boolean;
  showUntil?: string;
}
export interface TextBanner {
  text: string;
  categoryId?: string;
  productId?: string;
  enabled: boolean;
}

// Default data (same as the original lib)
const DEFAULT_CAFE_INFO: CafeInfo = { ownerNameUk: "", ownerNameHu: "", ownerNameEn: "", nameUk: "", nameHu: "", nameEn: "", descriptionUk: "", descriptionHu: "", descriptionEn: "", banner: "", logo: "", instagram: "" };
const DEFAULT_CATEGORIES: Category[] = [];
const DEFAULT_PRODUCTS: Product[] = [];

// Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
export const supabase: SupabaseClient | null = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey) : null;
export const useSupabase = !!supabase;

// Marks that a Google sign-in was just initiated so the landing page
// can forward the authenticated admin straight to the admin cabinet.
export const PENDING_ADMIN_REDIRECT_KEY = 'svk_pending_admin';

// Local storage helpers
const getLocal = (key: string, def: any) => {
  if (typeof window === 'undefined') return def;
  try { const d = localStorage.getItem(key); return d ? JSON.parse(d) : def; } catch { return def; }
};
const setLocal = (key: string, data: any) => {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(key, JSON.stringify(data)); } catch { /* ignore */ }
};

// Auth
export const loginWithEmail = async (email: string, pass: string): Promise<User> => {
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
  if (error) throw error;
  return data.user as User;
};
export const loginWithGoogle = async (): Promise<void> => {
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: window.location.origin + '/admin' } });
  if (error) throw error;
  // OAuth redirects; the session is handled by onAuthStateChange
};
export const resetUserPassword = async (email: string): Promise<void> => {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/admin' });
  if (error) throw error;
};
export const logoutUser = async (): Promise<void> => {
  if (supabase) await supabase.auth.signOut();
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('aura_admin_auth');
    localStorage.removeItem('aura_admin_auth');
    localStorage.removeItem('isAdmin');
  }
};
export const subscribeToAuth = (callback: (user: User | null) => void): (() => void) => {
  if (!supabase) { callback(null); return () => {}; }
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null);
  });
  return () => subscription.unsubscribe();
};
// Handles the password-recovery link (PKCE): verifies the token_hash from the
// URL and establishes the recovery session. Returns true when a recovery flow
// was processed so the caller can show a change-password form.
export const handleRecoveryToken = async (): Promise<boolean> => {
  if (!supabase || typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  const tokenHash = params.get('token_hash');
  const type = params.get('type');
  if (!tokenHash || type !== 'recovery') return false;
  const { error } = await supabase.auth.verifyOtp({ type: 'recovery', token_hash: tokenHash });
  if (error) return false;
  window.history.replaceState({}, '', window.location.pathname);
  return true;
};
export const ADMIN_EMAILS = ['svitkavyvisk@gmail.com'];
export const isUserAdmin = (user: User | null): boolean => {
  if (!user?.email) return false;
  return ADMIN_EMAILS.some(e => e.toLowerCase() === user.email!.toLowerCase());
};
export const hasAdminAccess = async (user: User | null): Promise<boolean> => {
  if (!user) return false;
  if (isUserAdmin(user)) return true;
  // Check Supabase profiles table
  try {
    const { data } = await supabase!.from('profiles').select('is_admin').eq('id', user.id).single();
    return data?.is_admin === true;
  } catch { return false; }
};

// Data helpers
const mapCafeInfo = (row: any): CafeInfo => ({
  ownerNameUk: row.owner_name_uk ?? '', ownerNameHu: row.owner_name_hu ?? '', ownerNameEn: row.owner_name_en ?? '',
  nameUk: row.name_uk ?? '', nameHu: row.name_hu ?? '', nameEn: row.name_en ?? '',
  descriptionUk: row.description_uk ?? '', descriptionHu: row.description_hu ?? '', descriptionEn: row.description_en ?? '',
  banner: row.banner, logo: row.logo, instagram: row.instagram,
  bannerX: row.banner_x, bannerY: row.banner_y, bannerScale: row.banner_scale,
  logoX: row.logo_x, logoY: row.logo_y, logoScale: row.logo_scale,
  bannerOriginal: row.banner_original ?? '', logoOriginal: row.logo_original ?? '',
  greetingCustomerUk: row.greeting_customer_uk ?? '', greetingCustomerHu: row.greeting_customer_hu ?? '', greetingCustomerEn: row.greeting_customer_en ?? '',
  greetingCustomerEnabled: row.greeting_customer_enabled ?? false,
  greetingAdminUk: row.greeting_admin_uk ?? '', greetingAdminHu: row.greeting_admin_hu ?? '', greetingAdminEn: row.greeting_admin_en ?? '',
  greetingAdminEnabled: row.greeting_admin_enabled ?? false,
});
const mapCategory = (row: any): Category => ({
  id: row.id, nameUk: row.name_uk, nameHu: row.name_hu, nameEn: row.name_en, photo: row.photo,
  photoX: row.photo_x, photoY: row.photo_y, photoScale: row.photo_scale,
  photoOriginal: row.photo_original ?? '',
});
const mapProduct = (row: any): Product => ({
  id: row.id, categoryId: row.category_id,
  nameUk: row.name_uk, nameHu: row.name_hu, nameEn: row.name_en,
  descriptionUk: row.description_uk, descriptionHu: row.description_hu, descriptionEn: row.description_en,
  ingredientsUk: row.ingredients_uk, ingredientsHu: row.ingredients_hu, ingredientsEn: row.ingredients_en,
  price: Number(row.price), photo: row.photo,
  recommendedIds: Array.isArray(row.recommended_ids) ? row.recommended_ids : [],
  photoOriginal: row.photo_original ?? '',
});

// 1. Cafe Info
export const getCafeInfo = async (): Promise<CafeInfo> => {
  if (supabase) {
    const { data, error } = await supabase.from('cafe_info').select('*').eq('id', 1).single();
    if (!error && data) {
      const info: CafeInfo = mapCafeInfo(data);
      setLocal('cafeInfo', info); return info;
    }
  }
  return getLocal('cafeInfo', DEFAULT_CAFE_INFO);
};
export const subscribeCafeInfo = (callback: (info: CafeInfo) => void): (() => void) => {
  if (!supabase) return () => {};
  // Fetch current value first (Realtime only pushes changes, not the initial state)
  supabase.from('cafe_info').select('*').eq('id', 1).single().then(({ data, error }) => {
    if (!error && data) {
      const info: CafeInfo = mapCafeInfo(data);
      setLocal('cafeInfo', info); callback(info);
    }
  }, () => {});
  const channel = supabase.channel('cafe_info');
  channel.on('postgres_changes', { event: '*', schema: 'public', table: 'cafe_info', filter: 'id=eq.1' }, (payload) => {
    const row = payload.new as any;
    if (row) {
      const info: CafeInfo = mapCafeInfo(row);
      setLocal('cafeInfo', info); callback(info);
    }
  }).subscribe();
  return () => { supabase.removeChannel(channel); };
};
export const updateCafeInfo = async (info: CafeInfo): Promise<void> => {
  const validation = validateCafeInfo(info);
  if (!validation.ok) throw new Error(validation.error);
  setLocal('cafeInfo', info);
  if (supabase) {
    const { error } = await supabase.from('cafe_info').upsert({
      id: 1,
      owner_name_uk: info.ownerNameUk ?? '', owner_name_hu: info.ownerNameHu ?? '', owner_name_en: info.ownerNameEn ?? '',
      name_uk: info.nameUk ?? '', name_hu: info.nameHu ?? '', name_en: info.nameEn ?? '',
      description_uk: info.descriptionUk ?? '', description_hu: info.descriptionHu ?? '', description_en: info.descriptionEn ?? '',
      banner: info.banner, logo: info.logo,
      instagram: info.instagram, banner_x: info.bannerX ?? 50, banner_y: info.bannerY ?? 50,
      banner_scale: info.bannerScale ?? 1, logo_x: info.logoX ?? 50, logo_y: info.logoY ?? 50,
      logo_scale: info.logoScale ?? 1, banner_original: info.bannerOriginal ?? '', logo_original: info.logoOriginal ?? '',
      greeting_customer_uk: info.greetingCustomerUk ?? '', greeting_customer_hu: info.greetingCustomerHu ?? '', greeting_customer_en: info.greetingCustomerEn ?? '',
      greeting_customer_enabled: info.greetingCustomerEnabled ?? false,
      greeting_admin_uk: info.greetingAdminUk ?? '', greeting_admin_hu: info.greetingAdminHu ?? '', greeting_admin_en: info.greetingAdminEn ?? '',
      greeting_admin_enabled: info.greetingAdminEnabled ?? false,
      updated_at: new Date().toISOString(),
    });
    if (error) { console.error('Supabase error writing cafeInfo', error); throw new Error('Помилка збереження налаштувань'); }
  }
};

// 2. Categories
export const getCategories = async (): Promise<Category[]> => {
  if (supabase) {
    const { data, error } = await supabase.from('categories').select('*');
    if (!error && data?.length) { const cats = data.map(mapCategory); setLocal('categories', cats); return cats; }
  }
  return getLocal('categories', DEFAULT_CATEGORIES);
};
export const subscribeCategories = (callback: (cats: Category[]) => void): (() => void) => {
  if (!supabase) return () => {};
  // Fetch current value first (Realtime only pushes changes, not the initial state)
  supabase.from('categories').select('*').then(({ data, error }) => {
    if (!error && data?.length) {
      const cats = data.map(mapCategory); setLocal('categories', cats); callback(cats);
    }
  }, () => {});
  const channel = supabase.channel('categories');
  channel.on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, async (payload) => {
    if (payload.eventType === 'DELETE') {
      const current = getLocal('categories', DEFAULT_CATEGORIES) as Category[];
      const updated = current.filter(c => c.id !== payload.old?.id);
      setLocal('categories', updated); callback(updated);
    } else {
      const { data } = await supabase!.from('categories').select('*');
      const cats = (data ?? []).map(mapCategory);
      setLocal('categories', cats); callback(cats);
    }
  }).subscribe();
  return () => { supabase.removeChannel(channel); };
};
export const saveCategory = async (category: Category): Promise<void> => {
  const validation = validateCategory(category);
  if (!validation.ok) throw new Error(validation.error);
  const current = await getCategories();
  const idx = current.findIndex(c => c.id === category.id);
  if (idx >= 0) current[idx] = category; else current.push(category);
  setLocal('categories', current);
  if (supabase) {
    const { error } = await supabase.from('categories').upsert({ id: category.id, name_uk: category.nameUk, name_hu: category.nameHu, name_en: category.nameEn, photo: category.photo, photo_x: category.photoX ?? 50, photo_y: category.photoY ?? 50, photo_scale: category.photoScale ?? 1, photo_original: category.photoOriginal ?? '' });
    if (error) { console.error('Supabase error saving category', error); throw new Error('Помилка збереження категорії'); }
  }
};
export const deleteCategory = async (id: string): Promise<void> => {
  const current = await getCategories();
  setLocal('categories', current.filter(c => c.id !== id));
  if (supabase) {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) { console.error('Supabase error deleting category', error); throw new Error('Помилка видалення категорії'); }
  }
};

// 3. Products
export const getProducts = async (): Promise<Product[]> => {
  if (supabase) {
    const { data, error } = await supabase.from('products').select('*');
    if (!error && data?.length) { const prods = data.map(mapProduct); setLocal('products', prods); return prods; }
  }
  return getLocal('products', DEFAULT_PRODUCTS);
};
export const subscribeProducts = (callback: (prods: Product[]) => void): (() => void) => {
  if (!supabase) return () => {};
  // Fetch current value first (Realtime only pushes changes, not the initial state)
  supabase.from('products').select('*').then(({ data, error }) => {
    if (!error && data?.length) {
      const prods = data.map(mapProduct); setLocal('products', prods); callback(prods);
    }
  }, () => {});
  const channel = supabase.channel('products');
  channel.on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, async () => {
    const { data } = await supabase!.from('products').select('*');
    const prods = (data ?? []).map(mapProduct);
    setLocal('products', prods); callback(prods);
  }).subscribe();
  return () => { supabase.removeChannel(channel); };
};
export const saveProduct = async (product: Product): Promise<void> => {
  const validation = validateProduct(product);
  if (!validation.ok) throw new Error(validation.error);
  const current = await getProducts();
  const idx = current.findIndex(p => p.id === product.id);
  if (idx >= 0) current[idx] = product; else current.push(product);
  setLocal('products', current);
  if (supabase) {
    const { error } = await supabase.from('products').upsert({
      id: product.id, category_id: product.categoryId,
      name_uk: product.nameUk, name_hu: product.nameHu, name_en: product.nameEn,
      description_uk: product.descriptionUk, description_hu: product.descriptionHu, description_en: product.descriptionEn,
      ingredients_uk: product.ingredientsUk, ingredients_hu: product.ingredientsHu, ingredients_en: product.ingredientsEn,
      price: Number(product.price), photo: product.photo, photo_original: product.photoOriginal ?? '',
      recommended_ids: product.recommendedIds ?? [],
    });
    if (error) { console.error('Supabase error saving product', error); throw new Error('Помилка збереження страви'); }
  }
};
export const deleteProduct = async (id: string): Promise<void> => {
  const current = await getProducts();
  setLocal('products', current.filter(p => p.id !== id));
  if (supabase) {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) { console.error('Supabase error deleting product', error); throw new Error('Помилка видалення страви'); }
  }
};

// 4. Advertising
const DEFAULT_ADVERTISING: Advertising = { photo: '', delaySeconds: 5, enabled: false, showUntil: '' };

export const getAdvertising = async (): Promise<Advertising> => {
  if (supabase) {
    const { data, error } = await supabase.from('advertising').select('*').eq('id', 1).single();
    if (!error && data) {
      const ad: Advertising = { photo: data.photo ?? '', photoOriginal: data.photo_original ?? '', delaySeconds: data.delay_seconds ?? 5, enabled: data.enabled ?? false, showUntil: data.show_until ?? '' };
      setLocal('advertising', ad); return ad;
    }
  }
  return getLocal('advertising', DEFAULT_ADVERTISING);
};

let advertisingSubId = 0;

export const subscribeAdvertising = (callback: (ad: Advertising) => void): (() => void) => {
  if (!supabase) return () => {};
  // Use a unique channel topic per subscription: `supabase.channel(topic)`
  // reuses an existing channel with the same topic, which would already be
  // subscribed (and .on() after subscribe() throws) when the effect re-runs
  // (e.g. React StrictMode double-mount in dev) or when several subscribers
  // are registered. A unique topic guarantees a fresh, unsubscribed channel.
  const topic = `advertising-${advertisingSubId++}`;
  supabase.from('advertising').select('*').eq('id', 1).single().then(({ data, error }) => {
    if (!error && data) {
      const ad: Advertising = { photo: data.photo ?? '', photoOriginal: data.photo_original ?? '', delaySeconds: data.delay_seconds ?? 5, enabled: data.enabled ?? false, showUntil: data.show_until ?? '' };
      setLocal('advertising', ad); callback(ad);
    }
  }, () => {});
  const channel = supabase.channel(topic);
  channel.on('postgres_changes', { event: '*', schema: 'public', table: 'advertising', filter: 'id=eq.1' }, (payload) => {
    const row = payload.new as any;
    if (row) {
      const ad: Advertising = { photo: row.photo ?? '', photoOriginal: row.photo_original ?? '', delaySeconds: row.delay_seconds ?? 5, enabled: row.enabled ?? false, showUntil: row.show_until ?? '' };
      setLocal('advertising', ad); callback(ad);
    }
  }).subscribe();
  return () => { supabase.removeChannel(channel); };
};

export const saveAdvertising = async (ad: Advertising): Promise<void> => {
  setLocal('advertising', ad);
  if (supabase) {
    const { error } = await supabase.from('advertising').upsert({
      id: 1,
      photo: ad.photo ?? '',
      photo_original: ad.photoOriginal ?? '',
      delay_seconds: ad.delaySeconds ?? 5,
      enabled: ad.enabled ?? false,
      show_until: ad.showUntil || null,
      updated_at: new Date().toISOString(),
    });
    if (error) { console.error('Supabase error writing advertising', error); throw new Error('Помилка збереження реклами'); }
  }
};

// 5. Text Banner
const DEFAULT_TEXT_BANNER: TextBanner = { text: '', categoryId: '', productId: '', enabled: false };

const mapTextBanner = (row: any): TextBanner => ({
  text: row.text ?? '',
  categoryId: row.category_id ?? '',
  productId: row.product_id ?? '',
  enabled: row.enabled ?? false,
});

export const getTextBanner = async (): Promise<TextBanner> => {
  if (supabase) {
    const { data, error } = await supabase.from('text_banner').select('*').eq('id', 1).single();
    if (!error && data) {
      const banner = mapTextBanner(data);
      setLocal('textBanner', banner); return banner;
    }
  }
  return getLocal('textBanner', DEFAULT_TEXT_BANNER);
};

let textBannerSubId = 0;

export const subscribeTextBanner = (callback: (banner: TextBanner) => void): (() => void) => {
  if (!supabase) return () => {};
  // Unique topic per subscription: `supabase.channel(topic)` reuses an existing
  // channel with the same topic, which would already be subscribed (and .on()
  // after subscribe() throws) when the effect re-runs. A unique topic
  // guarantees a fresh, unsubscribed channel.
  const topic = `text-banner-${textBannerSubId++}`;
  supabase.from('text_banner').select('*').eq('id', 1).single().then(({ data, error }) => {
    if (!error && data) {
      const banner = mapTextBanner(data);
      setLocal('textBanner', banner); callback(banner);
    }
  }, () => {});
  const channel = supabase.channel(topic);
  channel.on('postgres_changes', { event: '*', schema: 'public', table: 'text_banner', filter: 'id=eq.1' }, (payload) => {
    const row = payload.new as any;
    if (row) {
      const banner = mapTextBanner(row);
      setLocal('textBanner', banner); callback(banner);
    }
  }).subscribe();
  return () => { supabase.removeChannel(channel); };
};

export const saveTextBanner = async (banner: TextBanner): Promise<void> => {
  const validation = validateTextBanner(banner);
  if (!validation.ok) throw new Error(validation.error);
  setLocal('textBanner', banner);
  if (supabase) {
    const { error } = await supabase.from('text_banner').upsert({
      id: 1,
      text: banner.text,
      category_id: banner.categoryId || null,
      product_id: banner.productId || null,
      enabled: banner.enabled ?? false,
      updated_at: new Date().toISOString(),
    });
    if (error) { console.error('Supabase error writing text banner', error); throw new Error('Помилка збереження текстового банера'); }
  }
};