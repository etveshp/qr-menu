import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';

vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(''),
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
}));

import { ToastProvider } from '@/components/Toast';
import { MenuContainer } from '../menu/MenuContainer';

const cafeInfo = {
  ownerNameUk: '',
  ownerNameHu: '',
  ownerNameEn: '',
  nameUk: 'Світ Кави',
  nameHu: 'Svit Kavy',
  nameEn: 'Svit',
  descriptionUk: 'Опис',
  descriptionHu: '',
  descriptionEn: '',
  banner: '',
  logo: '',
  instagram: '',
  defaultLang: 'uk',
  enabledLangs: ['uk', 'hu', 'en'],
  greetingCustomerEnabled: false,
  greetingAdminEnabled: false,
  showTableNumber: false,
};

const categories = [
  { id: 'c1', nameUk: 'Кава', nameHu: 'Kave', nameEn: 'Coffee', photo: '', sortOrder: 0 },
];

const products = [
  {
    id: 'p1',
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
    photo: '',
    recommendedIds: [],
    sortOrder: 0,
  },
];

function renderMenu(overrides: { cafeInfo?: Record<string, unknown>; categories?: unknown[]; products?: unknown[] } = {}) {
  return render(
    <ToastProvider>
      <MenuContainer
        initialData={{
          cafeInfo: overrides.cafeInfo ?? cafeInfo,
          categories: (overrides.categories ?? categories) as Record<string, unknown>[],
          products: (overrides.products ?? products) as Record<string, unknown>[],
        }}
      />
    </ToastProvider>
  );
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('MenuContainer', () => {
  it('renders categories from SSR data', () => {
    renderMenu();
    expect(screen.getByText('Кава')).toBeInTheDocument();
    expect(screen.getAllByText('Світ Кави').length).toBeGreaterThan(0);
  });

  it('shows a category\u2019s products when selected', async () => {
    renderMenu();
    fireEvent.click(screen.getByRole('button', { name: 'Кава' }));
    expect(await screen.findByText('Лате')).toBeInTheDocument();
    expect(screen.getByText('На головну')).toBeInTheDocument();
  });

  it('shows the empty state when there are no categories', () => {
    renderMenu({ categories: [] });
    expect(screen.getByText("Меню скоро з'явиться")).toBeInTheDocument();
  });

  it('opens the product modal from a product card', async () => {
    renderMenu();
    fireEvent.click(screen.getByRole('button', { name: 'Кава' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Додати' }));
    expect(await screen.findByRole('button', { name: 'Close' })).toBeInTheDocument();
  });

  it('closes the product modal', async () => {
    renderMenu();
    fireEvent.click(screen.getByRole('button', { name: 'Кава' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Додати' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Close' }));
    await waitFor(() =>
      expect(screen.queryByRole('button', { name: 'Close' })).not.toBeInTheDocument()
    );
  });

  it('renders the language selector for enabled languages', () => {
    renderMenu();
    expect(screen.getByRole('button', { name: 'UA' })).toBeInTheDocument();
  });
});
