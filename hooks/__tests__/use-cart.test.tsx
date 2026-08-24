import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, cleanup } from '@testing-library/react';
import { useCart } from '../use-cart';

afterEach(() => {
  cleanup();
  localStorage.clear();
});

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('useCart', () => {
  const products = [
    { id: 'a', price: 10 },
    { id: 'b', price: 20 },
  ];

  it('starts with empty cart', () => {
    const { result } = renderHook(() => useCart(products));
    expect(result.current.itemsCount).toBe(0);
    expect(result.current.totalPrice).toBe(0);
  });

  it('adds an item', () => {
    const { result } = renderHook(() => useCart(products));
    act(() => result.current.addItem('a'));
    expect(result.current.getQty('a')).toBe(1);
    expect(result.current.itemsCount).toBe(1);
  });

  it('increments an existing item', () => {
    const { result } = renderHook(() => useCart(products));
    act(() => result.current.addItem('a'));
    act(() => result.current.incrementItem('a'));
    expect(result.current.getQty('a')).toBe(2);
  });

  it('sets quantity directly', () => {
    const { result } = renderHook(() => useCart(products));
    act(() => result.current.setQty('b', 3));
    expect(result.current.getQty('b')).toBe(3);
    expect(result.current.totalPrice).toBe(60);
  });

  it('decrements an item and removes at zero', () => {
    const { result } = renderHook(() => useCart(products));
    act(() => result.current.addItem('a'));
    act(() => result.current.decrementItem('a'));
    expect(result.current.getQty('a')).toBe(0);
    expect(result.current.itemsCount).toBe(0);
  });

  it('computes total price', () => {
    const { result } = renderHook(() => useCart(products));
    act(() => result.current.addItem('a'));
    act(() => result.current.addItem('b'));
    expect(result.current.totalPrice).toBe(30);
  });

  it('persists cart to localStorage', () => {
    const { result } = renderHook(() => useCart(products));
    act(() => result.current.addItem('a'));
    const stored = JSON.parse(localStorage.getItem('aura_cart') || '{}');
    expect(stored).toEqual({ a: 1 });
  });

  it('loads persisted cart on init', () => {
    localStorage.setItem('aura_cart', JSON.stringify({ b: 2 }));
    const { result } = renderHook(() => useCart(products));
    expect(result.current.getQty('b')).toBe(2);
  });
});