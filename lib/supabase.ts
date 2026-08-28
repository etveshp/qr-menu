import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import { validateCafeInfo, validateCategory, validateProduct } from './validation';

// Types (same as the original lib, kept for compatibility)
export interface CafeInfo {
  name: string; description: string; banner: string; logo: string; instagram: string;
  bannerScale?: number; bannerX?: number; bannerY?: number;
  logoScale?: number; logoX?: number; logoY?: number;
}
export interface Category { id: string; nameUk: string; nameHu: string; nameEn: string; photo: string; photoScale?: number; photoX?: number; photoY?: number; }
export interface Product {
  id: string; categoryId: string;
  nameUk: string; nameHu: string; nameEn: string;
  descriptionUk: string; descriptionHu: string; descriptionEn: string;
  ingredientsUk: string; ingredientsHu: string; ingredientsEn: string;
  price: number; photo: string; recommendedIds: string[];
}

// Default data (same as the original lib)
const DEFAULT_CAFE_INFO: CafeInfo = { name: "", description: "", banner: "", logo: "", instagram: "" };
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
const mapCategory = (row: any): Category => ({
  id: row.id, nameUk: row.name_uk, nameHu: row.name_hu, nameEn: row.name_en, photo: row.photo,
  photoX: row.photo_x, photoY: row.photo_y, photoScale: row.photo_scale,
});
const mapProduct = (row: any): Product => ({
  id: row.id, categoryId: row.category_id,
  nameUk: row.name_uk, nameHu: row.name_hu, nameEn: row.name_en,
  descriptionUk: row.description_uk, descriptionHu: row.description_hu, descriptionEn: row.description_en,
  ingredientsUk: row.ingredients_uk, ingredientsHu: row.ingredients_hu, ingredientsEn: row.ingredients_en,
  price: Number(row.price), photo: row.photo,
  recommendedIds: Array.isArray(row.recommended_ids) ? row.recommended_ids : [],
});

// 1. Cafe Info
export const getCafeInfo = async (): Promise<CafeInfo> => {
  if (supabase) {
    const { data, error } = await supabase.from('cafe_info').select('*').eq('id', 1).single();
    if (!error && data) {
      const info: CafeInfo = { name: data.name, description: data.description, banner: data.banner, logo: data.logo, instagram: data.instagram, bannerX: data.banner_x, bannerY: data.banner_y, bannerScale: data.banner_scale, logoX: data.logo_x, logoY: data.logo_y, logoScale: data.logo_scale };
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
      const info: CafeInfo = { name: data.name, description: data.description, banner: data.banner, logo: data.logo, instagram: data.instagram, bannerX: data.banner_x, bannerY: data.banner_y, bannerScale: data.banner_scale, logoX: data.logo_x, logoY: data.logo_y, logoScale: data.logo_scale };
      setLocal('cafeInfo', info); callback(info);
    }
  }, () => {});
  const channel = supabase.channel('cafe_info');
  channel.on('postgres_changes', { event: '*', schema: 'public', table: 'cafe_info', filter: 'id=eq.1' }, (payload) => {
    const row = payload.new as any;
    if (row) {
      const info: CafeInfo = { name: row.name, description: row.description, banner: row.banner, logo: row.logo, instagram: row.instagram, bannerX: row.banner_x, bannerY: row.banner_y, bannerScale: row.banner_scale, logoX: row.logo_x, logoY: row.logo_y, logoScale: row.logo_scale };
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
      id: 1, name: info.name, description: info.description, banner: info.banner, logo: info.logo,
      instagram: info.instagram, banner_x: info.bannerX ?? 50, banner_y: info.bannerY ?? 50,
      banner_scale: info.bannerScale ?? 1, logo_x: info.logoX ?? 50, logo_y: info.logoY ?? 50,
      logo_scale: info.logoScale ?? 1, updated_at: new Date().toISOString(),
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
    const { error } = await supabase.from('categories').upsert({ id: category.id, name_uk: category.nameUk, name_hu: category.nameHu, name_en: category.nameEn, photo: category.photo, photo_x: category.photoX ?? 50, photo_y: category.photoY ?? 50, photo_scale: category.photoScale ?? 1 });
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
      price: Number(product.price), photo: product.photo,
      recommended_ids: product.recommendedIds ?? [],
    });
    if (error) { console.error('Supabase error saving product', error); throw new Error('Помилка збереження товару'); }
  }
};
export const deleteProduct = async (id: string): Promise<void> => {
  const current = await getProducts();
  setLocal('products', current.filter(p => p.id !== id));
  if (supabase) {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) { console.error('Supabase error deleting product', error); throw new Error('Помилка видалення товару'); }
  }
};