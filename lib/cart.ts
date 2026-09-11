import type { ModifierGroup } from './supabase';

export type Cart = Record<string, number>;

/** Separates a product id from its selected option ids inside a cart key. */
const OPTION_SEPARATOR = '#';

export interface CartLine {
  productId: string;
  optionIds: string[];
}

/**
 * Build the cart key for a product + selected options. A product without a
 * selection keeps its plain id (so existing persisted carts stay valid); a
 * configured product gets `id#optionA,optionB` with the option ids sorted, so
 * the same configuration always maps to the same line.
 */
export const cartLineKey = (productId: string, optionIds: string[] = []): string =>
  optionIds.length === 0 ? productId : `${productId}${OPTION_SEPARATOR}${[...optionIds].sort().join(',')}`;

export const parseCartKey = (key: string): CartLine => {
  const idx = key.indexOf(OPTION_SEPARATOR);
  if (idx === -1) return { productId: key, optionIds: [] };
  const rest = key.slice(idx + 1);
  return { productId: key.slice(0, idx), optionIds: rest ? rest.split(',') : [] };
};

export const addToCart = (cart: Cart, lineKey: string): Cart => ({
  ...cart,
  [lineKey]: (cart[lineKey] || 0) + 1,
});

export const setCartQty = (cart: Cart, lineKey: string, qty: number): Cart => ({
  ...cart,
  [lineKey]: qty,
});

export const decrementCartItem = (cart: Cart, lineKey: string): Cart => {
  const qty = cart[lineKey];
  if (!qty || qty <= 1) {
    const { [lineKey]: _removed, ...rest } = cart;
    return rest;
  }
  return { ...cart, [lineKey]: qty - 1 };
};

export const removeCartItem = (cart: Cart, lineKey: string): Cart => {
  const { [lineKey]: _removed, ...rest } = cart;
  return rest;
};

export const getCartItemQty = (cart: Cart, lineKey: string): number =>
  cart[lineKey] || 0;

/** Total quantity of a product across all its configured lines. */
export const getProductQty = (cart: Cart, productId: string): number =>
  Object.entries(cart).reduce(
    (sum, [key, qty]) => (parseCartKey(key).productId === productId ? sum + qty : sum),
    0
  );

export const getCartItemsCount = (cart: Cart): number =>
  Object.values(cart).reduce((sum, qty) => sum + qty, 0);

/** Unit price of a configured line: base price + sum of the option deltas. */
export const cartLineUnitPrice = (
  product: { price: number; modifiers?: ModifierGroup[] },
  optionIds: string[]
): number => {
  let price = product.price;
  if (optionIds.length === 0 || !product.modifiers) return price;
  for (const group of product.modifiers) {
    for (const optionId of optionIds) {
      const option = group.options.find((o) => o.id === optionId);
      if (option) price += option.priceDelta;
    }
  }
  return price;
};

export const getCartTotalPrice = (
  cart: Cart,
  products: Array<{ id: string; price: number; modifiers?: ModifierGroup[] }>
): number =>
  Object.entries(cart).reduce((sum, [key, qty]) => {
    const { productId, optionIds } = parseCartKey(key);
    const product = products.find((p) => p.id === productId);
    if (!product) return sum;
    return sum + cartLineUnitPrice(product, optionIds) * qty;
  }, 0);
