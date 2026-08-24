import { describe, it, expect } from 'vitest';
import {
  addToCart,
  setCartQty,
  incrementCartItem,
  decrementCartItem,
  getCartItemQty,
  getCartItemsCount,
  getCartTotalPrice,
} from '../cart';

describe('addToCart', () => {
  it('adds a new item with quantity 1', () => {
    expect(addToCart({}, 'p1')).toEqual({ p1: 1 });
  });

  it('increments an existing item', () => {
    expect(addToCart({ p1: 2 }, 'p1')).toEqual({ p1: 3 });
  });

  it('does not mutate the original cart', () => {
    const cart = { p1: 1 };
    addToCart(cart, 'p1');
    expect(cart).toEqual({ p1: 1 });
  });

  it('keeps other items untouched', () => {
    expect(addToCart({ p2: 2 }, 'p1')).toEqual({ p1: 1, p2: 2 });
  });
});

describe('setCartQty', () => {
  it('sets quantity directly', () => {
    expect(setCartQty({}, 'p1', 5)).toEqual({ p1: 5 });
  });
});

describe('incrementCartItem', () => {
  it('behaves like addToCart', () => {
    expect(incrementCartItem({ p1: 1 }, 'p1')).toEqual({ p1: 2 });
  });
});

describe('decrementCartItem', () => {
  it('decreases quantity', () => {
    expect(decrementCartItem({ p1: 3 }, 'p1')).toEqual({ p1: 2 });
  });

  it('removes the item when quantity is 1', () => {
    expect(decrementCartItem({ p1: 1 }, 'p1')).toEqual({});
  });

  it('is a no-op for missing items', () => {
    expect(decrementCartItem({ p2: 1 }, 'p1')).toEqual({ p2: 1 });
  });

  it('does not mutate the original cart', () => {
    const cart = { p1: 1 };
    decrementCartItem(cart, 'p1');
    expect(cart).toEqual({ p1: 1 });
  });
});

describe('getCartItemQty', () => {
  it('returns 0 for missing items', () => {
    expect(getCartItemQty({}, 'p1')).toBe(0);
  });

  it('returns stored quantity', () => {
    expect(getCartItemQty({ p1: 4 }, 'p1')).toBe(4);
  });
});

describe('getCartItemsCount', () => {
  it('sums all quantities', () => {
    expect(getCartItemsCount({ a: 2, b: 3 })).toBe(5);
  });

  it('returns 0 for an empty cart', () => {
    expect(getCartItemsCount({})).toBe(0);
  });
});

describe('getCartTotalPrice', () => {
  const products = [
    { id: 'a', price: 10 },
    { id: 'b', price: 20 },
  ];

  it('computes the total price', () => {
    expect(getCartTotalPrice({ a: 2, b: 1 }, products)).toBe(40);
  });

  it('returns 0 for an empty cart', () => {
    expect(getCartTotalPrice({}, products)).toBe(0);
  });

  it('ignores products that no longer exist', () => {
    expect(getCartTotalPrice({ ghost: 5 }, products)).toBe(0);
  });
});
