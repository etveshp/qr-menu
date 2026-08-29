export type Cart = Record<string, number>;

export const addToCart = (cart: Cart, productId: string): Cart => ({
  ...cart,
  [productId]: (cart[productId] || 0) + 1,
});

export const setCartQty = (cart: Cart, productId: string, qty: number): Cart => ({
  ...cart,
  [productId]: qty,
});

export const incrementCartItem = addToCart;

export const decrementCartItem = (cart: Cart, productId: string): Cart => {
  const qty = cart[productId];
  if (!qty || qty <= 1) {
    const { [productId]: _removed, ...rest } = cart;
    return rest;
  }
  return { ...cart, [productId]: qty - 1 };
};

export const removeCartItem = (cart: Cart, productId: string): Cart => {
  const { [productId]: _removed, ...rest } = cart;
  return rest;
};

export const getCartItemQty = (cart: Cart, productId: string): number =>
  cart[productId] || 0;

export const getCartItemsCount = (cart: Cart): number =>
  Object.values(cart).reduce((sum, qty) => sum + qty, 0);

export const getCartTotalPrice = (
  cart: Cart,
  products: Array<{ id: string; price: number }>
): number =>
  Object.entries(cart).reduce((sum, [id, qty]) => {
    const product = products.find((p) => p.id === id);
    return sum + (product ? product.price * qty : 0);
  }, 0);
