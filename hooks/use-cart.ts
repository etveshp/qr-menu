'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  addToCart,
  setCartQty,
  decrementCartItem,
  removeCartItem,
  getCartItemQty,
  getProductQty as cartProductQty,
  getCartTotalPrice,
  type Cart,
} from '@/lib/cart';

const CART_STORAGE_KEY = 'aura_cart';

function loadPersistedCart(): Cart {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export function useCart(products: Array<{ id: string; price: number }>) {
  const [cart, setCart] = useState<Cart>({});
  const hydratedRef = useRef(false);

  // Load persisted cart after mount to avoid SSR hydration mismatch.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCart(loadPersistedCart());
    hydratedRef.current = true;
  }, []);

  // Persist on every change after the initial hydration.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!hydratedRef.current) return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      console.error('Cart persistence error:', e);
    }
  }, [cart]);

  const addItem = useCallback((lineKey: string) => {
    setCart(prev => addToCart(prev, lineKey));
  }, []);

  const setQty = useCallback((lineKey: string, qty: number) => {
    setCart(prev => setCartQty(prev, lineKey, qty));
  }, []);

  const incrementItem = useCallback((lineKey: string) => {
    setCart(prev => addToCart(prev, lineKey));
  }, []);

  const decrementItem = useCallback((lineKey: string) => {
    setCart(prev => decrementCartItem(prev, lineKey));
  }, []);

  const removeItem = useCallback((lineKey: string) => {
    setCart(prev => removeCartItem(prev, lineKey));
  }, []);

  const getQty = useCallback(
    (lineKey: string) => getCartItemQty(cart, lineKey),
    [cart]
  );

  const getProductQty = useCallback(
    (productId: string) => cartProductQty(cart, productId),
    [cart]
  );

  const itemsCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0);
  const totalPrice = getCartTotalPrice(cart, products);

  return {
    cart,
    addItem,
    setQty,
    incrementItem,
    decrementItem,
    removeItem,
    getQty,
    getProductQty,
    itemsCount,
    totalPrice,
  };
}