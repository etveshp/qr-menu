'use client';

import { useEffect, useState } from 'react';
import {
  subscribeCafeInfo,
  subscribeCategories,
  subscribeProducts,
  type CafeInfo,
  type Category,
  type Product,
} from '@/lib/supabase';

export interface MenuDataInitial {
  cafeInfo: Record<string, unknown> | null;
  categories: Record<string, unknown>[];
  products: Record<string, unknown>[];
}

function toCafeInfo(data: Record<string, unknown> | null | undefined): CafeInfo | null {
  if (!data) return null;
  return data as unknown as CafeInfo;
}

function toCategories(data: Record<string, unknown>[] | undefined): Category[] {
  return (data ?? []) as unknown as Category[];
}

function toProducts(data: Record<string, unknown>[] | undefined): Product[] {
  return (data ?? []) as unknown as Product[];
}

export function useMenuData(initialData?: MenuDataInitial) {
  const [cafeInfo, setCafeInfo] = useState<CafeInfo | null>(() => {
    if (initialData?.cafeInfo) return toCafeInfo(initialData.cafeInfo);
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('cafeInfo');
        if (cached) return JSON.parse(cached) as CafeInfo;
      } catch {
        // ignore invalid cache
      }
    }
    return null;
  });
  const [categories, setCategories] = useState<Category[]>(() => {
    if (initialData && Array.isArray(initialData.categories) && initialData.categories.length > 0) {
      return toCategories(initialData.categories);
    }
    return [];
  });
  const [products, setProducts] = useState<Product[]>(() => {
    if (initialData && Array.isArray(initialData.products) && initialData.products.length > 0) {
      return toProducts(initialData.products);
    }
    return [];
  });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;
    let pending = 3;
    const tick = () => {
      pending -= 1;
      if (pending === 0 && !cancelled) {
        setLoading(false);
      }
    };

    const unsubCafe = subscribeCafeInfo((info) => {
      setCafeInfo(info);
      tick();
    });
    const unsubCats = subscribeCategories((cats) => {
      setCategories(cats);
      tick();
    });
    const unsubProds = subscribeProducts((prods) => {
      setProducts(prods);
      tick();
    });

    return () => {
      cancelled = true;
      unsubCafe();
      unsubCats();
      unsubProds();
    };
  }, []);

  return { cafeInfo, categories, products, loading };
}
