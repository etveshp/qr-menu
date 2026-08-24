import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, collection, getDocs, deleteDoc, onSnapshot, type Unsubscribe } from 'firebase/firestore';
import {
  getAuth,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  User,
  Auth
} from 'firebase/auth';
import firebaseAppletConfig from '../firebase-applet-config.json';
import { validateCafeInfo, validateCategory, validateProduct } from './validation';

// Types
export interface CafeInfo {
  name: string;
  description: string;
  banner: string;
  logo: string;
  instagram: string;
  bannerScale?: number;
  bannerX?: number;
  bannerY?: number;
  logoScale?: number;
  logoX?: number;
  logoY?: number;
}

export interface Category {
  id: string;
  nameUk: string;
  nameHu: string;
  nameEn: string;
  photo: string;
}

export interface Product {
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
}

// Default empty cafe data (only user-configured data will be used)
const DEFAULT_CAFE_INFO: CafeInfo = {
  name: "",
  description: "",
  banner: "",
  logo: "",
  instagram: "",
  bannerScale: 1,
  bannerX: 50,
  bannerY: 50,
  logoScale: 1,
  logoX: 50,
  logoY: 50
};

const DEFAULT_CATEGORIES: Category[] = [
  {
    id: "espresso-bar",
    nameUk: "Еспресо бар",
    nameHu: "Eszpresszó bár",
    nameEn: "Espresso Bar",
    photo: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: "signature",
    nameUk: "Авторські напої",
    nameHu: "Különleges italok",
    nameEn: "Signature Drinks",
    photo: "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: "tea-matcha",
    nameUk: "Чай та Матча",
    nameHu: "Tea és Matcha",
    nameEn: "Tea & Matcha",
    photo: "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&q=80&w=400"
  },
  {
    id: "desserts",
    nameUk: "Вишукані десерти",
    nameHu: "Különleges desszertek",
    nameEn: "Exquisite Desserts",
    photo: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&q=80&w=400"
  }
];

const DEFAULT_PRODUCTS: Product[] = [
  {
    id: "espresso",
    categoryId: "espresso-bar",
    nameUk: "Подвійне еспресо",
    nameHu: "Dupla Eszpresszó",
    nameEn: "Double Espresso",
    price: 65,
    photo: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&q=80&w=300",
    descriptionUk: "Зварено на спешелті зерні свіжого обсмаження (100% арабіка). Має насичений смак з нотками темного шоколаду, карамелі та цитрусовою кислинкою.",
    descriptionHu: "Frissen pörkölt specialty kávéból főzve (100% arabica). Intenzív íz étcsokoládé, karamell és citrusos savasság jegyeivel.",
    descriptionEn: "Brewed on freshly roasted specialty beans (100% Arabica). Rich taste with notes of dark chocolate, caramel, and citrus acidity.",
    ingredientsUk: "Спешелті кава, очищена вода",
    ingredientsHu: "Specialty kávé, tisztított víz",
    ingredientsEn: "Specialty coffee, purified water"
  },
  {
    id: "flat-white",
    categoryId: "espresso-bar",
    nameUk: "Флет Вайт",
    nameHu: "Flat White",
    nameEn: "Flat White",
    price: 95,
    photo: "https://images.unsplash.com/photo-1577968897966-3d4325b36b61?auto=format&fit=crop&q=80&w=300",
    descriptionUk: "Ідеальний баланс подвійного еспресо та оксамитового ніжного молока з мінімальною піною.",
    descriptionHu: "A dupla eszpresszó és a selymesen lágy tej tökéletes egyensúlya, minimális habbal.",
    descriptionEn: "The perfect balance of double espresso and silky smooth milk with minimal microfoam.",
    ingredientsUk: "Подвійне еспресо, незбиране молоко",
    ingredientsHu: "Dupla eszpresszó, teljes tej",
    ingredientsEn: "Double espresso, whole milk"
  },
  {
    id: "lavender-latte",
    categoryId: "signature",
    nameUk: "Лавандовий раф",
    nameHu: "Levendulás Raf",
    nameEn: "Lavender Raf",
    price: 110,
    photo: "https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&q=80&w=300",
    descriptionUk: "Вершковий ніжний напій з додаванням натуральних квітів лаванди та домашнього ванільного сиропу.",
    descriptionHu: "Krémes, lágy ital valódi levendulavirágokkal és házi vaníliasziruppal.",
    descriptionEn: "Creamy, smooth drink infused with natural lavender flowers and homemade vanilla syrup.",
    ingredientsUk: "Еспресо, вершки, лавандовий цвіт, ванільний сироп",
    ingredientsHu: "Eszpresszó, tejszín, levendulavirág, vaníliaszirup",
    ingredientsEn: "Espresso, cream, lavender flowers, vanilla syrup"
  },
  {
    id: "pistachio-latte",
    categoryId: "signature",
    nameUk: "Фісташковий лате",
    nameHu: "Pisztáciás Latte",
    nameEn: "Pistachio Latte",
    price: 130,
    photo: "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?auto=format&fit=crop&q=80&w=300",
    descriptionUk: "Справжній гурманський досвід: еспресо з додаванням преміальної пасти з добірних фісташок та ніжною молочною піною.",
    descriptionHu: "Igazi gourmet élmény: eszpresszó prémium pisztáciapasztával és finom tejhabbal.",
    descriptionEn: "A true gourmet experience: espresso with premium pistachio paste and silky milk foam.",
    ingredientsUk: "Еспресо, натуральна фісташкова паста, незбиране молоко, фісташкова крихта",
    ingredientsHu: "Eszpresszó, természetes pisztáciapaszta, teljes tej, pisztácia törmelék",
    ingredientsEn: "Espresso, natural pistachio paste, whole milk, pistachio crumbs"
  },
  {
    id: "ceremonial-matcha",
    categoryId: "tea-matcha",
    nameUk: "Церемоніальна Матча Лате",
    nameHu: "Szertartásos Matcha Latte",
    nameEn: "Ceremonial Matcha Latte",
    price: 120,
    photo: "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?auto=format&fit=crop&q=80&w=300",
    descriptionUk: "Японський чай матча вищого церемоніального класу Uji, збитий з рослинним молоком для кремової текстури та солодкуватого смаку.",
    descriptionHu: "Prémium japán ceremóniás matcha tea (Uji), növényi tejjel habosítva a krémes textúra és az enyhén édes íz érdekében.",
    descriptionEn: "Premium Japanese ceremonial grade Matcha from Uji, whisked with plant-based milk for a creamy texture and naturally sweet finish.",
    ingredientsUk: "Церемоніальна матча Uji, вівсяне або мигдальне молоко, очищена гаряча вода",
    ingredientsHu: "Szertartásos Matcha Uji, zab- vagy mandulatej, forró víz",
    ingredientsEn: "Ceremonial Matcha Uji, oat or almond milk, purified hot water"
  },
  {
    id: "pistachio-macaron",
    categoryId: "desserts",
    nameUk: "Макарон Фісташка-Малина",
    nameHu: "Pisztácia-Málna Macaron",
    nameEn: "Pistachio-Raspberry Macaron",
    price: 80,
    photo: "https://images.unsplash.com/photo-1569864358642-9d1684040f43?auto=format&fit=crop&q=80&w=300",
    descriptionUk: "Традиційне французьке тістечко на основі мигдалевого борошна з ганашем з білого шоколаду, фісташковою пастою та свіжим малиновим кюлі в центрі.",
    descriptionHu: "Hagyományos francia mandulás sütemény fehér csokoládé ganache-sal, pisztáciapasztával és friss málna kuli központtal.",
    descriptionEn: "Traditional French almond macaron filled with white chocolate pistachio ganache and a fresh raspberry coulis center.",
    ingredientsUk: "Мигдалеве борошно, цукрова пудра, яєчний білок, білий шоколад, фісташкова паста, малина, пектин",
    ingredientsHu: "Mandulaliszt, porcukor, tojásfehérje, fehér csokoládé, pisztáciapaszta, málna, pektin",
    ingredientsEn: "Almond flour, powdered sugar, egg whites, white chocolate, pistachio paste, raspberry, pectin"
  }
];

// Firebase configuration loaded from environment variables first,
// falling back to firebase-applet-config.json (template) or mock values.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || firebaseAppletConfig?.apiKey || "mock-api-key-aura-premium",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || firebaseAppletConfig?.authDomain || "aura-premium.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || firebaseAppletConfig?.projectId || "aura-premium",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || firebaseAppletConfig?.storageBucket || "aura-premium.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || firebaseAppletConfig?.messagingSenderId || "123456789",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || firebaseAppletConfig?.appId || "1:1234:web:1234"
};

let db: any = null;
let auth: Auth | null = null;
let useFirebase = false;

export const ADMIN_EMAILS = [
  "etvesh.p@gmail.com",
  "admin@aura.cafe",
  "svitkavy@gmail.com"
];

try {
  const isReal = firebaseConfig.apiKey && firebaseConfig.apiKey !== "mock-api-key-aura-premium" && !firebaseConfig.apiKey.includes("mock");
  if (isReal) {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    const dbId = process.env.NEXT_PUBLIC_FIREBASE_FIRESTORE_DATABASE_ID || (firebaseAppletConfig as any)?.firestoreDatabaseId || undefined;
    db = getFirestore(app, dbId);
    auth = getAuth(app);
    useFirebase = true;
  }
} catch (e) {
  console.warn("Firebase initialization skipped or failed. Using robust LocalStorage engine instead.", e);
}

export { auth, db };

// ---------------- FIREBASE AUTH ENGINE ----------------

export const loginWithEmail = async (email: string, pass: string): Promise<User> => {
  if (!auth) throw new Error("Firebase Auth is not initialized");
  const userCredential = await signInWithEmailAndPassword(auth, email.trim(), pass);
  return userCredential.user;
};

export const loginWithGoogle = async (): Promise<User> => {
  if (!auth) throw new Error("Firebase Auth is not initialized");
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const result = await signInWithPopup(auth, provider);
  return result.user;
};

export const resetUserPassword = async (email: string): Promise<void> => {
  if (!auth) throw new Error("Firebase Auth is not initialized");
  await sendPasswordResetEmail(auth, email.trim());
};

export const logoutUser = async (): Promise<void> => {
  if (auth) {
    await signOut(auth);
  }
  if (typeof window !== "undefined") {
    sessionStorage.removeItem("aura_admin_auth");
    localStorage.removeItem("aura_admin_auth");
    localStorage.removeItem("isAdmin");
  }
};

export const subscribeToAuth = (callback: (user: User | null) => void): (() => void) => {
  if (!auth) {
    callback(null);
    return () => {};
  }
  return onAuthStateChanged(auth, callback);
};

export const isUserAdmin = (user: User | null): boolean => {
  if (!user || !user.email) return false;
  const emailLower = user.email.toLowerCase();
  return ADMIN_EMAILS.some(adminEmail => adminEmail.toLowerCase() === emailLower);
};

// Check admin access using Firebase custom claims (isAdmin claim) with email allow-list fallback.
export const hasAdminAccess = async (user: User | null): Promise<boolean> => {
  if (!user) return false;
  if (isUserAdmin(user)) return true;
  try {
    const idTokenResult = await user.getIdTokenResult();
    return idTokenResult.claims?.admin === true;
  } catch (e) {
    console.warn("Failed to read admin claim:", e);
    return false;
  }
};

// ---------------- LOCAL STORAGE SYNC ENGINE ----------------
// We use localStorage as a fallback AND local cache for ultra-fast, smooth performance.
const getLocalData = (key: string, defaultValue: any) => {
  if (typeof window === "undefined") return defaultValue;
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (e) {
    return defaultValue;
  }
};

const setLocalData = (key: string, data: any) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error("LocalStorage write error:", e);
  }
};

// Returns cached array, or the provided default when the cache is empty/missing.
// Prevents an empty Firestore collection from erasing the demo/default data.
const getLocalArray = <T>(key: string, defaultValue: T[]): T[] => {
  if (typeof window === "undefined") return defaultValue;
  try {
    const data = localStorage.getItem(key);
    if (!data) return defaultValue;
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : defaultValue;
  } catch (e) {
    return defaultValue;
  }
};

// Helper to ensure Firestore calls don't hang the app if offline/unreachable
const withTimeout = <T>(promise: Promise<T>, ms = 2000): Promise<T> => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("Firestore query timeout")), ms);
    promise
      .then((res) => {
        clearTimeout(timer);
        resolve(res);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
};

// ---------------- API WRAPPERS ----------------

// 1. Cafe Info
export const getCafeInfo = async (): Promise<CafeInfo> => {
  if (useFirebase && db) {
    try {
      const docRef = doc(db, "settings", "cafeInfo");
      const docSnap = await withTimeout(getDoc(docRef), 2000);
      if (docSnap.exists()) {
        const data = docSnap.data() as CafeInfo;
        setLocalData("cafeInfo", data);
        return data;
      }
    } catch (e) {
      console.warn("Firestore error reading cafeInfo, returning local cached version", e);
    }
  }
  return getLocalData("cafeInfo", DEFAULT_CAFE_INFO);
};

// Realtime subscriptions: push cached data immediately, then live updates from Firestore.
export const subscribeCafeInfo = (callback: (info: CafeInfo) => void): Unsubscribe => {
  callback(getLocalData("cafeInfo", DEFAULT_CAFE_INFO));
  if (useFirebase && db) {
    const ref = doc(db, "settings", "cafeInfo");
    return onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as CafeInfo;
          setLocalData("cafeInfo", data);
          callback(data);
        }
      },
      (e) => console.warn("Firestore subscription error for cafeInfo:", e)
    );
  }
  return () => {};
};

export const subscribeCategories = (callback: (cats: Category[]) => void): Unsubscribe => {
  callback(getLocalArray("categories", DEFAULT_CATEGORIES));
  if (useFirebase && db) {
    const ref = collection(db, "categories");
    return onSnapshot(
      ref,
      (snap) => {
        if (snap.size === 0) return;
        const cats: Category[] = [];
        snap.forEach((d) => cats.push({ id: d.id, ...d.data() } as Category));
        setLocalData("categories", cats);
        callback(cats);
      },
      (e) => console.warn("Firestore subscription error for categories:", e)
    );
  }
  return () => {};
};

export const subscribeProducts = (callback: (prods: Product[]) => void): Unsubscribe => {
  callback(getLocalArray("products", DEFAULT_PRODUCTS));
  if (useFirebase && db) {
    const ref = collection(db, "products");
    return onSnapshot(
      ref,
      (snap) => {
        if (snap.size === 0) return;
        const prods: Product[] = [];
        snap.forEach((d) => prods.push({ id: d.id, ...d.data() } as Product));
        setLocalData("products", prods);
        callback(prods);
      },
      (e) => console.warn("Firestore subscription error for products:", e)
    );
  }
  return () => {};
};

export const updateCafeInfo = async (info: CafeInfo): Promise<void> => {
  const validation = validateCafeInfo(info);
  if (!validation.ok) throw new Error(validation.error);
  setLocalData("cafeInfo", info);
  if (useFirebase && db) {
    try {
      const docRef = doc(db, "settings", "cafeInfo");
      await setDoc(docRef, info);
    } catch (e) {
      console.error("Firestore error writing cafeInfo", e);
      throw new Error("Помилка збереження налаштувань у Firestore");
    }
  }
};

// 2. Categories
export const getCategories = async (): Promise<Category[]> => {
  if (useFirebase && db) {
    try {
      const querySnapshot = await withTimeout(getDocs(collection(db, "categories")), 2000);
      const categories: Category[] = [];
      querySnapshot.forEach((doc) => {
        categories.push({ id: doc.id, ...doc.data() } as Category);
      });
      if (categories.length > 0) {
        setLocalData("categories", categories);
        return categories;
      }
    } catch (e) {
      console.warn("Firestore error reading categories, returning local cached version", e);
    }
  }
  return getLocalArray("categories", DEFAULT_CATEGORIES);
};

export const saveCategory = async (category: Category): Promise<void> => {
  const validation = validateCategory(category);
  if (!validation.ok) throw new Error(validation.error);
  const current = await getCategories();
  const index = current.findIndex(c => c.id === category.id);
  if (index >= 0) {
    current[index] = category;
  } else {
    current.push(category);
  }
  setLocalData("categories", current);

  if (useFirebase && db) {
    try {
      await setDoc(doc(db, "categories", category.id), {
        nameUk: category.nameUk,
        nameHu: category.nameHu,
        nameEn: category.nameEn,
        photo: category.photo
      });
    } catch (e) {
      console.error("Firestore error saving category", e);
      throw new Error("Помилка збереження категорії у Firestore");
    }
  }
};

export const deleteCategory = async (id: string): Promise<void> => {
  const current = await getCategories();
  const filtered = current.filter(c => c.id !== id);
  setLocalData("categories", filtered);

  if (useFirebase && db) {
    try {
      await deleteDoc(doc(db, "categories", id));
    } catch (e) {
      console.error("Firestore error deleting category", e);
      throw new Error("Помилка видалення категорії у Firestore");
    }
  }
};

// 3. Products
export const getProducts = async (): Promise<Product[]> => {
  if (useFirebase && db) {
    try {
      const querySnapshot = await withTimeout(getDocs(collection(db, "products")), 2000);
      const products: Product[] = [];
      querySnapshot.forEach((doc) => {
        products.push({ id: doc.id, ...doc.data() } as Product);
      });
      if (products.length > 0) {
        setLocalData("products", products);
        return products;
      }
    } catch (e) {
      console.warn("Firestore error reading products, returning local cached version", e);
    }
  }
  return getLocalArray("products", DEFAULT_PRODUCTS);
};

export const saveProduct = async (product: Product): Promise<void> => {
  const validation = validateProduct(product);
  if (!validation.ok) throw new Error(validation.error);
  const current = await getProducts();
  const index = current.findIndex(p => p.id === product.id);
  if (index >= 0) {
    current[index] = product;
  } else {
    current.push(product);
  }
  setLocalData("products", current);

  if (useFirebase && db) {
    try {
      await setDoc(doc(db, "products", product.id), {
        categoryId: product.categoryId,
        nameUk: product.nameUk,
        nameHu: product.nameHu,
        nameEn: product.nameEn,
        descriptionUk: product.descriptionUk,
        descriptionHu: product.descriptionHu,
        descriptionEn: product.descriptionEn,
        ingredientsUk: product.ingredientsUk,
        ingredientsHu: product.ingredientsHu,
        ingredientsEn: product.ingredientsEn,
        price: Number(product.price),
        photo: product.photo
      });
    } catch (e) {
      console.error("Firestore error saving product", e);
      throw new Error("Помилка збереження товару у Firestore");
    }
  }
};

export const deleteProduct = async (id: string): Promise<void> => {
  const current = await getProducts();
  const filtered = current.filter(p => p.id !== id);
  setLocalData("products", filtered);

  if (useFirebase && db) {
    try {
      await deleteDoc(doc(db, "products", id));
    } catch (e) {
      console.error("Firestore error deleting product", e);
      throw new Error("Помилка видалення товару у Firestore");
    }
  }
};
