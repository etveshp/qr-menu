import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import { validateCafeInfo, validateCategory, validateProduct, validateTextBanner } from './validation';
import {
  PHOTO_BUCKET,
  CAFE_PHOTO_PATHS,
  ADVERTISING_PHOTO_PATHS,
  entityPhotoPaths,
  isDataUriPhoto,
  dataUriMime,
  objectPublicUrl,
} from './photo-storage';
import { nextSortOrder } from './reorder';

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
export interface Category { id: string; nameUk: string; nameHu: string; nameEn: string; photo: string; photoScale?: number; photoX?: number; photoY?: number; photoOriginal?: string; sortOrder?: number; }
export interface Product {
  id: string; categoryId: string;
  nameUk: string; nameHu: string; nameEn: string;
  descriptionUk: string; descriptionHu: string; descriptionEn: string;
  ingredientsUk: string; ingredientsHu: string; ingredientsEn: string;
  price: number; photo: string; recommendedIds: string[];
  photoOriginal?: string; sortOrder?: number;
}
export interface Advertising {
  photo: string;
  photoOriginal?: string;
  delaySeconds: number;
  enabled: boolean;
  showUntil?: string;
  categoryId?: string;
  productId?: string;
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

// Stores an inline data: photo into Supabase Storage and returns its public
// URL. Non-data values (already-stored URLs, empty strings) pass through
// unchanged. Deterministic object path + upsert means re-saving a crop
// overwrites the same object. When Storage is unavailable (no bucket/policies
// yet, offline), the inline value is kept so saving never breaks.
const storeOrKeep = async (value: string, path: string): Promise<string> => {
  if (!supabase || !value || !isDataUriPhoto(value)) return value;
  try {
    const res = await fetch(value);
    const blob = await res.blob();
    const { error } = await supabase.storage.from(PHOTO_BUCKET).upload(path, blob, {
      contentType: dataUriMime(value),
      upsert: true,
    });
    if (error) throw error;
    return objectPublicUrl(supabaseUrl, PHOTO_BUCKET, path);
  } catch (e) {
    console.error('Photo storage upload failed, keeping inline value', e);
    return value;
  }
};

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
  // After OAuth, Supabase redirects straight to the admin cabinet. The admin
  // page restores the session via getSession() and shows the cabinet; non-admins
  // are signed out and bounced back to the menu.
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
  sortOrder: row.sort_order ?? 0,
});
const mapProduct = (row: any): Product => ({
  id: row.id, categoryId: row.category_id,
  nameUk: row.name_uk, nameHu: row.name_hu, nameEn: row.name_en,
  descriptionUk: row.description_uk, descriptionHu: row.description_hu, descriptionEn: row.description_en,
  ingredientsUk: row.ingredients_uk, ingredientsHu: row.ingredients_hu, ingredientsEn: row.ingredients_en,
  price: Number(row.price), photo: row.photo,
  recommendedIds: Array.isArray(row.recommended_ids) ? row.recommended_ids : [],
  photoOriginal: row.photo_original ?? '',
  sortOrder: row.sort_order ?? 0,
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
  const banner = await storeOrKeep(info.banner, CAFE_PHOTO_PATHS.banner);
  const logo = await storeOrKeep(info.logo, CAFE_PHOTO_PATHS.logo);
  const bannerOriginal = await storeOrKeep(info.bannerOriginal ?? '', CAFE_PHOTO_PATHS.bannerOriginal);
  const logoOriginal = await storeOrKeep(info.logoOriginal ?? '', CAFE_PHOTO_PATHS.logoOriginal);
  const storedInfo: CafeInfo = { ...info, banner, logo, bannerOriginal, logoOriginal };
  setLocal('cafeInfo', storedInfo);
  if (supabase) {
    const { error } = await supabase.from('cafe_info').upsert({
      id: 1,
      owner_name_uk: storedInfo.ownerNameUk ?? '', owner_name_hu: storedInfo.ownerNameHu ?? '', owner_name_en: storedInfo.ownerNameEn ?? '',
      name_uk: storedInfo.nameUk ?? '', name_hu: storedInfo.nameHu ?? '', name_en: storedInfo.nameEn ?? '',
      description_uk: storedInfo.descriptionUk ?? '', description_hu: storedInfo.descriptionHu ?? '', description_en: storedInfo.descriptionEn ?? '',
      banner: storedInfo.banner, logo: storedInfo.logo,
      instagram: storedInfo.instagram, banner_x: storedInfo.bannerX ?? 50, banner_y: storedInfo.bannerY ?? 50,
      banner_scale: storedInfo.bannerScale ?? 1, logo_x: storedInfo.logoX ?? 50, logo_y: storedInfo.logoY ?? 50,
      logo_scale: storedInfo.logoScale ?? 1, banner_original: storedInfo.bannerOriginal ?? '', logo_original: storedInfo.logoOriginal ?? '',
      greeting_customer_uk: storedInfo.greetingCustomerUk ?? '', greeting_customer_hu: storedInfo.greetingCustomerHu ?? '', greeting_customer_en: storedInfo.greetingCustomerEn ?? '',
      greeting_customer_enabled: storedInfo.greetingCustomerEnabled ?? false,
      greeting_admin_uk: storedInfo.greetingAdminUk ?? '', greeting_admin_hu: storedInfo.greetingAdminHu ?? '', greeting_admin_en: storedInfo.greetingAdminEn ?? '',
      greeting_admin_enabled: storedInfo.greetingAdminEnabled ?? false,
      updated_at: new Date().toISOString(),
    });
    if (error) { console.error('Supabase error writing cafeInfo', error); throw new Error('Помилка збереження налаштувань'); }
  }
};

// 2. Categories
export const getCategories = async (): Promise<Category[]> => {
  if (supabase) {
    const { data, error } = await supabase.from('categories').select('*').order('sort_order');
    if (!error && data?.length) { const cats = data.map(mapCategory); setLocal('categories', cats); return cats; }
  }
  return getLocal('categories', DEFAULT_CATEGORIES);
};
export const subscribeCategories = (callback: (cats: Category[]) => void): (() => void) => {
  if (!supabase) return () => {};
  let fetchTimer: ReturnType<typeof setTimeout> | null = null;
  const fetchAll = async () => {
    const { data } = await supabase!.from('categories').select('*').order('sort_order');
    const cats = (data ?? []).map(mapCategory);
    setLocal('categories', cats); callback(cats);
  };
  // Fetch current value first (Realtime only pushes changes, not the initial state)
  fetchAll();
  const channel = supabase.channel('categories');
  channel.on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, (payload) => {
    if (payload.eventType === 'DELETE') {
      const current = getLocal('categories', DEFAULT_CATEGORIES) as Category[];
      const updated = current.filter(c => c.id !== payload.old?.id);
      setLocal('categories', updated); callback(updated);
      return;
    }
    // Debounce batch updates (e.g. reorder writes many rows at once).
    if (fetchTimer) clearTimeout(fetchTimer);
    fetchTimer = setTimeout(() => { fetchAll(); }, 250);
  }).subscribe();
  return () => {
    if (fetchTimer) clearTimeout(fetchTimer);
    supabase.removeChannel(channel);
  };
};
export const reorderCategories = async (orderedIds: string[]): Promise<void> => {
  if (!orderedIds.length) return;
  const current = await getCategories();
  const positions = new Map(orderedIds.map((id, i) => [id, i]));
  const next = current.map(c => positions.has(c.id) ? { ...c, sortOrder: positions.get(c.id)! } : c);
  setLocal('categories', next);
  if (supabase) {
    const rows = next.filter(c => positions.has(c.id)).map(c => ({ id: c.id, sort_order: c.sortOrder ?? 0 }));
    const failed: string[] = [];
    // Reorder only touches existing rows: a plain UPDATE per row is safer than a
    // partial-column batch UPSERT (which PostgREST can reject when not all
    // NOT NULL columns are provided).
    for (const row of rows) {
      const { error } = await supabase.from('categories').update({ sort_order: row.sort_order }).eq('id', row.id);
      if (error) {
        console.error('Supabase error reordering category', row.id, error);
        failed.push(row.id);
      }
    }
    if (failed.length) throw new Error('Помилка збереження порядку категорій');
  }
};
export const saveCategory = async (category: Category): Promise<void> => {
  const validation = validateCategory(category);
  if (!validation.ok) throw new Error(validation.error);
  const paths = entityPhotoPaths('category', category.id);
  const photo = await storeOrKeep(category.photo, paths.photo);
  const photoOriginal = await storeOrKeep(category.photoOriginal ?? '', paths.photoOriginal);
  const current = await getCategories();
  const idx = current.findIndex(c => c.id === category.id);
  const sortOrder = idx >= 0 ? (category.sortOrder ?? current[idx].sortOrder ?? idx) : nextSortOrder(current);
  const stored: Category = { ...category, photo, photoOriginal, sortOrder };
  if (idx >= 0) current[idx] = stored; else current.push(stored);
  setLocal('categories', current);
  if (supabase) {
    const { error } = await supabase.from('categories').upsert({ id: stored.id, name_uk: stored.nameUk, name_hu: stored.nameHu, name_en: stored.nameEn, photo: stored.photo, photo_x: stored.photoX ?? 50, photo_y: stored.photoY ?? 50, photo_scale: stored.photoScale ?? 1, photo_original: stored.photoOriginal ?? '', sort_order: stored.sortOrder ?? 0 });
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
    const { data, error } = await supabase.from('products').select('*').order('sort_order');
    if (!error && data?.length) { const prods = data.map(mapProduct); setLocal('products', prods); return prods; }
  }
  return getLocal('products', DEFAULT_PRODUCTS);
};
export const subscribeProducts = (callback: (prods: Product[]) => void): (() => void) => {
  if (!supabase) return () => {};
  let fetchTimer: ReturnType<typeof setTimeout> | null = null;
  const fetchAll = async () => {
    const { data } = await supabase!.from('products').select('*').order('sort_order');
    const prods = (data ?? []).map(mapProduct);
    setLocal('products', prods); callback(prods);
  };
  // Fetch current value first (Realtime only pushes changes, not the initial state)
  fetchAll();
  const channel = supabase.channel('products');
  channel.on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
    // Debounce batch updates (e.g. reorder writes many rows at once).
    if (fetchTimer) clearTimeout(fetchTimer);
    fetchTimer = setTimeout(() => { fetchAll(); }, 250);
  }).subscribe();
  return () => {
    if (fetchTimer) clearTimeout(fetchTimer);
    supabase.removeChannel(channel);
  };
};
export const reorderProducts = async (orderedIds: string[]): Promise<void> => {
  if (!orderedIds.length) return;
  const current = await getProducts();
  const positions = new Map(orderedIds.map((id, i) => [id, i]));
  const next = current.map(p => positions.has(p.id) ? { ...p, sortOrder: positions.get(p.id)! } : p);
  setLocal('products', next);
  if (supabase) {
    const rows = next.filter(p => positions.has(p.id)).map(p => ({ id: p.id, sort_order: p.sortOrder ?? 0 }));
    const failed: string[] = [];
    for (const row of rows) {
      const { error } = await supabase.from('products').update({ sort_order: row.sort_order }).eq('id', row.id);
      if (error) {
        console.error('Supabase error reordering product', row.id, error);
        failed.push(row.id);
      }
    }
    if (failed.length) throw new Error('Помилка збереження порядку страв');
  }
};
export const saveProduct = async (product: Product): Promise<void> => {
  const validation = validateProduct(product);
  if (!validation.ok) throw new Error(validation.error);
  const paths = entityPhotoPaths('product', product.id);
  const photo = await storeOrKeep(product.photo, paths.photo);
  const photoOriginal = await storeOrKeep(product.photoOriginal ?? '', paths.photoOriginal);
  const current = await getProducts();
  const idx = current.findIndex(p => p.id === product.id);
  const existing = idx >= 0 ? current[idx] : undefined;
  let sortOrder: number;
  if (!existing || existing.categoryId !== product.categoryId) {
    sortOrder = nextSortOrder(current.filter(p => p.categoryId === product.categoryId));
  } else {
    sortOrder = product.sortOrder ?? existing.sortOrder ?? idx;
  }
  const stored: Product = { ...product, photo, photoOriginal, sortOrder };
  if (idx >= 0) current[idx] = stored; else current.push(stored);
  setLocal('products', current);
  if (supabase) {
    const { error } = await supabase.from('products').upsert({
      id: stored.id, category_id: stored.categoryId,
      name_uk: stored.nameUk, name_hu: stored.nameHu, name_en: stored.nameEn,
      description_uk: stored.descriptionUk, description_hu: stored.descriptionHu, description_en: stored.descriptionEn,
      ingredients_uk: stored.ingredientsUk, ingredients_hu: stored.ingredientsHu, ingredients_en: stored.ingredientsEn,
      price: Number(stored.price), photo: stored.photo, photo_original: stored.photoOriginal ?? '',
      recommended_ids: stored.recommendedIds ?? [],
      sort_order: stored.sortOrder ?? 0,
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
const DEFAULT_ADVERTISING: Advertising = { photo: '', delaySeconds: 5, enabled: false, showUntil: '', categoryId: '', productId: '' };

const mapAdvertising = (row: any): Advertising => ({
  photo: row.photo ?? '',
  photoOriginal: row.photo_original ?? '',
  delaySeconds: row.delay_seconds ?? 5,
  enabled: row.enabled ?? false,
  showUntil: row.show_until ?? '',
  categoryId: row.category_id ?? '',
  productId: row.product_id ?? '',
});

export const getAdvertising = async (): Promise<Advertising> => {
  if (supabase) {
    const { data, error } = await supabase.from('advertising').select('*').eq('id', 1).single();
    if (!error && data) {
      const ad = mapAdvertising(data);
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
      const ad = mapAdvertising(data);
      setLocal('advertising', ad); callback(ad);
    }
  }, () => {});
  const channel = supabase.channel(topic);
  channel.on('postgres_changes', { event: '*', schema: 'public', table: 'advertising', filter: 'id=eq.1' }, (payload) => {
    const row = payload.new as any;
    if (row) {
      const ad = mapAdvertising(row);
      setLocal('advertising', ad); callback(ad);
    }
  }).subscribe();
  return () => { supabase.removeChannel(channel); };
};

export const saveAdvertising = async (ad: Advertising): Promise<void> => {
  const photo = await storeOrKeep(ad.photo ?? '', ADVERTISING_PHOTO_PATHS.photo);
  const photoOriginal = await storeOrKeep(ad.photoOriginal ?? '', ADVERTISING_PHOTO_PATHS.photoOriginal);
  const storedAd: Advertising = { ...ad, photo, photoOriginal };
  setLocal('advertising', storedAd);
  if (supabase) {
    const { error } = await supabase.from('advertising').upsert({
      id: 1,
      photo: storedAd.photo ?? '',
      photo_original: storedAd.photoOriginal ?? '',
      delay_seconds: storedAd.delaySeconds ?? 5,
      enabled: storedAd.enabled ?? false,
      show_until: storedAd.showUntil || null,
      category_id: storedAd.categoryId || null,
      product_id: storedAd.productId || null,
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