import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { RecommendedProductsPicker } from '../admin/RecommendedProductsPicker';
import type { Category, Product } from '@/lib/supabase';

const t = (key: string) =>
  ({
    chooseProductCategory: 'Виберіть категорію',
    back: 'Назад',
    noCategories: 'Немає категорій',
    recommendedProductsEmpty: 'Порожньо',
    add: 'Додати',
  }[key] ?? key);

const categories: Category[] = [
  { id: 'c1', nameUk: 'Кава', nameHu: '', nameEn: '', photo: '', sortOrder: 0 },
  { id: 'c2', nameUk: 'Десерти', nameHu: '', nameEn: '', photo: '', sortOrder: 1 },
];

const product = (id: string, categoryId: string, name: string): Product => ({
  id,
  categoryId,
  nameUk: name,
  nameHu: '',
  nameEn: '',
  descriptionUk: '',
  descriptionHu: '',
  descriptionEn: '',
  ingredientsUk: '',
  ingredientsHu: '',
  ingredientsEn: '',
  price: 10,
  photo: '',
  recommendedIds: [],
});

const products: Product[] = [
  product('p1', 'c1', 'Лате'),
  product('p2', 'c1', 'Еспресо'),
  product('p3', 'c2', 'Чізкейк'),
];

function renderPicker(overrides: Partial<Parameters<typeof RecommendedProductsPicker>[0]> = {}) {
  return render(
    <RecommendedProductsPicker
      isOpen
      categories={categories}
      products={products}
      selectedIds={[]}
      lang="uk"
      onClose={vi.fn()}
      onConfirm={vi.fn()}
      t={t as any}
      {...overrides}
    />
  );
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('RecommendedProductsPicker', () => {
  it('renders nothing when closed', () => {
    renderPicker({ isOpen: false });
    expect(screen.queryByText('Виберіть категорію')).not.toBeInTheDocument();
  });

  it('drills from category to its products', () => {
    renderPicker();
    expect(screen.getByText('Виберіть категорію')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Кава'));
    expect(screen.getByText('Лате')).toBeInTheDocument();
    expect(screen.getByText('Еспресо')).toBeInTheDocument();
    expect(screen.queryByText('Чізкейк')).not.toBeInTheDocument();
  });

  it('hides the excluded product', () => {
    renderPicker({ excludeId: 'p2' });
    fireEvent.click(screen.getByText('Кава'));
    expect(screen.getByText('Лате')).toBeInTheDocument();
    expect(screen.queryByText('Еспресо')).not.toBeInTheDocument();
  });

  it('confirms the selected product and closes', () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    renderPicker({ onConfirm, onClose });
    fireEvent.click(screen.getByText('Кава'));
    fireEvent.click(screen.getByText('Лате'));
    fireEvent.click(screen.getByRole('button', { name: 'Додати' }));
    expect(onConfirm).toHaveBeenCalledWith(['p1']);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not allow selecting an already added product', () => {
    renderPicker({ selectedIds: ['p1'] });
    fireEvent.click(screen.getByText('Кава'));
    fireEvent.click(screen.getByText('Лате'));
    expect(screen.getByRole('button', { name: 'Додати' })).toBeDisabled();
  });

  it('returns to the category step via back', () => {
    renderPicker();
    fireEvent.click(screen.getByText('Кава'));
    fireEvent.click(screen.getByRole('button', { name: 'Назад' }));
    expect(screen.getByText('Виберіть категорію')).toBeInTheDocument();
  });

  it('shows an empty message when a category has no products', () => {
    renderPicker({ products: [] });
    fireEvent.click(screen.getByText('Десерти'));
    expect(screen.getByText('Порожньо')).toBeInTheDocument();
  });
});
