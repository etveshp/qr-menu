import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import type { RefObject } from 'react';

vi.mock('@/hooks/use-media-query');

import { useMediaQuery } from '@/hooks/use-media-query';
import { ProductModal } from '../menu/ProductModal';
import type { Product } from '@/lib/supabase';

const mockedMedia = vi.mocked(useMediaQuery);

const t = (key: string) =>
  ({
    priceCurrency: '₴',
    ingredients: 'Інгредієнти',
    recommendedWith: 'Разом',
    addToCart: 'Додати',
    addedToCart: 'Додано',
    chooseModifier: 'Оберіть',
    cart: 'Кошик',
    badgeNew: 'Новинка',
  }[key] ?? key);

const product: Product = {
  id: 'p1',
  categoryId: 'c1',
  nameUk: 'Лате',
  nameHu: 'Latte',
  nameEn: 'Latte',
  descriptionUk: 'Смачний лате',
  descriptionHu: '',
  descriptionEn: '',
  ingredientsUk: 'кава, молоко',
  ingredientsHu: '',
  ingredientsEn: '',
  price: 95,
  photo: '/img.png',
  recommendedIds: [],
  badge: 'new',
  modifiers: [
    {
      id: 'size',
      nameUk: 'Обʼєм',
      nameHu: '',
      nameEn: '',
      type: 'single',
      required: true,
      display: 'chips',
      sortOrder: 0,
      options: [
        { id: 's', nameUk: 'S', nameHu: '', nameEn: '', priceDelta: 0, sortOrder: 0 },
        { id: 'l', nameUk: 'L', nameHu: '', nameEn: '', priceDelta: 10, sortOrder: 1 },
      ],
    },
  ],
};

function baseProps() {
  return {
    product,
    headerHeight: 65,
    cartButtonRect: null,
    cartToast: null,
    modalQty: 1,
    isJustAdded: false,
    recommendedProducts: [] as Product[],
    recIsDragging: false,
    recScrollRef: { current: null } as RefObject<HTMLDivElement | null>,
    totalCartItemsCount: 0,
    bouncingCart: false,
    getProductName: (p: Product) => p.nameUk,
    getProductDesc: (p: Product) => p.descriptionUk,
    getProductIngredients: (p: Product) =>
      p.ingredientsUk ? p.ingredientsUk.split(',').map((s) => s.trim()) : [],
    t: t as any,
    lang: 'uk',
    selection: {} as Record<string, string[]>,
    onSetGroup: vi.fn(),
    unitPrice: 95,
    onClose: vi.fn(),
    onDecrementQty: vi.fn(),
    onIncrementQty: vi.fn(),
    onAddToCart: vi.fn(),
    onOpenProduct: vi.fn(),
    onOpenCart: vi.fn(),
    onRecPointerDown: vi.fn(),
    onRecPointerUp: vi.fn(),
    onRecPointerMove: vi.fn(),
  };
}

beforeEach(() => {
  mockedMedia.mockReturnValue(false);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('ProductModal (mobile)', () => {
  it('renders name, price, ingredients and badge', () => {
    render(<ProductModal {...baseProps()} />);
    expect(screen.getAllByText('Лате').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/95 ₴/).length).toBeGreaterThan(0);
    expect(screen.getByText('кава')).toBeInTheDocument();
    expect(screen.getByText('Новинка')).toBeInTheDocument();
  });

  it('blocks adding while a required modifier group is empty', () => {
    render(<ProductModal {...baseProps()} />);
    const addButton = screen.getByRole('button', { name: /Оберіть/ });
    expect(addButton).toBeDisabled();
  });

  it('adds to cart once the required selection is made', () => {
    const onAddToCart = vi.fn();
    render(
      <ProductModal {...baseProps()} selection={{ size: ['s'] }} onAddToCart={onAddToCart} />
    );
    const addButton = screen.getByRole('button', { name: /Додати/ });
    expect(addButton).not.toBeDisabled();
    fireEvent.click(addButton);
    expect(onAddToCart).toHaveBeenCalledTimes(1);
  });

  it('closes via the close button', () => {
    const onClose = vi.fn();
    render(<ProductModal {...baseProps()} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('opens a recommended product on click', () => {
    const onOpenProduct = vi.fn();
    const rec: Product = { ...product, id: 'p2', nameUk: 'Мока', badge: '' };
    render(
      <ProductModal
        {...baseProps()}
        recommendedProducts={[rec]}
        onOpenProduct={onOpenProduct}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /Мока/ }));
    expect(onOpenProduct).toHaveBeenCalledWith(rec);
  });
});

describe('ProductModal (desktop)', () => {
  it('renders the wide layout with name, price and close', () => {
    mockedMedia.mockReturnValue(true);
    const onClose = vi.fn();
    render(<ProductModal {...baseProps()} onClose={onClose} />);
    expect(screen.getByText('Лате')).toBeInTheDocument();
    expect(screen.getAllByText(/95 ₴/).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
