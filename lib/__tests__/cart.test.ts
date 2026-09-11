import { describe, it, expect } from 'vitest';
import {
  addToCart,
  setCartQty,
  decrementCartItem,
  getCartItemQty,
  getCartItemsCount,
  getCartTotalPrice,
  cartLineKey,
  parseCartKey,
  getProductQty,
  cartLineUnitPrice,
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

describe('cart line keys & modifiers', () => {
  const juice = {
    id: 'juice',
    price: 45,
    modifiers: [
      {
        id: 'flavor',
        nameUk: 'Смак', nameHu: '', nameEn: '',
        type: 'single' as const, required: true, display: 'chips' as const, sortOrder: 0,
        options: [
          { id: 'orange', nameUk: 'Апельсин', nameHu: '', nameEn: '', priceDelta: 0, sortOrder: 0 },
          { id: 'peach', nameUk: 'Персик', nameHu: '', nameEn: '', priceDelta: 5, sortOrder: 1 },
        ],
      },
      {
        id: 'size',
        nameUk: 'Обʼєм', nameHu: '', nameEn: '',
        type: 'single' as const, required: true, display: 'chips' as const, sortOrder: 1,
        options: [
          { id: '03', nameUk: '0.3 л', nameHu: '', nameEn: '', priceDelta: 0, sortOrder: 0 },
          { id: '05', nameUk: '0.5 л', nameHu: '', nameEn: '', priceDelta: 10, sortOrder: 1 },
        ],
      },
    ],
  };

  it('uses the plain product id when nothing is selected', () => {
    expect(cartLineKey('juice')).toBe('juice');
    expect(parseCartKey('juice')).toEqual({ productId: 'juice', optionIds: [] });
  });

  it('sorts option ids so the same configuration maps to one line', () => {
    expect(cartLineKey('juice', ['05', 'orange'])).toBe('juice#05,orange');
    expect(cartLineKey('juice', ['orange', '05'])).toBe('juice#05,orange');
  });

  it('parses a configured key back into product + options', () => {
    expect(parseCartKey('juice#05,orange')).toEqual({ productId: 'juice', optionIds: ['05', 'orange'] });
  });

  it('sums quantity across all configured lines of a product', () => {
    const cart = { 'juice#05,orange': 2, 'juice#03,peach': 1, other: 5 };
    expect(getProductQty(cart, 'juice')).toBe(3);
    expect(getProductQty(cart, 'other')).toBe(5);
    expect(getProductQty(cart, 'nope')).toBe(0);
  });

  it('adds option deltas to the base price', () => {
    expect(cartLineUnitPrice(juice, [])).toBe(45);
    expect(cartLineUnitPrice(juice, ['orange', '05'])).toBe(55);
    expect(cartLineUnitPrice(juice, ['peach'])).toBe(50);
  });

  it('computes the total across configured lines', () => {
    const cart = { 'juice#05,orange': 2, 'juice#03,peach': 1 };
    expect(getCartTotalPrice(cart, [juice])).toBe(55 * 2 + 50);
  });
});
