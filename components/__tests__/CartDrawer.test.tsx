import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { CartDrawer } from '../menu/CartDrawer';
import type { Product } from '@/lib/supabase';

afterEach(() => {
  cleanup();
});

const products: Product[] = [
  {
    id: 'p1',
    categoryId: 'c1',
    nameUk: 'Еспресо',
    nameHu: 'Eszpresszó',
    nameEn: 'Espresso',
    descriptionUk: '',
    descriptionHu: '',
    descriptionEn: '',
    ingredientsUk: '',
    ingredientsHu: '',
    ingredientsEn: '',
    price: 65,
    photo: '/img.png',
    recommendedIds: [],
  },
  {
    id: 'p2',
    categoryId: 'c1',
    nameUk: 'Лате',
    nameHu: 'Latte',
    nameEn: 'Latte',
    descriptionUk: '',
    descriptionHu: '',
    descriptionEn: '',
    ingredientsUk: '',
    ingredientsHu: '',
    ingredientsEn: '',
    price: 95,
    photo: '/img2.png',
    recommendedIds: [],
  },
];

const t = (key: string) => {
  const map: Record<string, string> = {
    cart: 'Ваше замовлення',
    cartNotice: 'Повідомлення',
    emptyCart: 'Кошик порожній',
    priceCurrency: '₴',
    total: 'Разом',
    backToMenu: 'Назад до меню',
  };
  return map[key] ?? key;
};

function renderCart(overrides: Partial<Parameters<typeof CartDrawer>[0]> = {}) {
  return render(
    <CartDrawer
      isOpen
      cart={{ p1: 2 }}
      products={products}
      totalCartPrice={130}
      getProductName={(p) => p.nameUk}
      t={t as any}
      onClose={vi.fn()}
      onDecrement={vi.fn()}
      onIncrement={vi.fn()}
      onRemove={vi.fn()}
      {...overrides}
    />
  );
}

describe('CartDrawer', () => {
  it('shows cart notice and product', () => {
    renderCart();
    expect(screen.getByText('Еспресо')).toBeInTheDocument();
    expect(screen.getByText('Повідомлення')).toBeInTheDocument();
  });

  it('shows total price', () => {
    renderCart();
    expect(screen.getByText('130 ₴')).toBeInTheDocument();
  });

  it('shows empty state when cart is empty', () => {
    renderCart({ cart: {} });
    expect(screen.getByText('Кошик порожній')).toBeInTheDocument();
  });

  it('calls onDecrement when minus is pressed', () => {
    const onDecrement = vi.fn();
    renderCart({ onDecrement });
    fireEvent.click(screen.getAllByRole('button', { name: 'Decrease quantity' })[0]);
    expect(onDecrement).toHaveBeenCalledWith('p1');
  });

  it('calls onIncrement when plus is pressed', () => {
    const onIncrement = vi.fn();
    renderCart({ onIncrement });
    fireEvent.click(screen.getAllByRole('button', { name: 'Increase quantity' })[0]);
    expect(onIncrement).toHaveBeenCalledWith('p1');
  });
});