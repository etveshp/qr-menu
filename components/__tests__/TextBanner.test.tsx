import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { TextBanner } from '../menu/TextBanner';
import type { TextBanner as TextBannerData, Product } from '../../lib/supabase';

const category = (id: string, nameUk: string) => ({
  id, nameUk, nameHu: nameUk, nameEn: nameUk, photo: '',
});

const product = (id: string, categoryId: string, nameUk: string): Product => ({
  id,
  categoryId,
  nameUk,
  nameHu: nameUk,
  nameEn: nameUk,
  descriptionUk: '',
  descriptionHu: '',
  descriptionEn: '',
  ingredientsUk: '',
  ingredientsHu: '',
  ingredientsEn: '',
  price: 0,
  photo: '',
  recommendedIds: [],
});

const products = [product('p1', 'c1', 'Кава'), product('p2', 'c2', 'Десерт')];

const mockT = (key: string) => {
  const map: Record<string, string> = { textBannerClose: 'Close banner' };
  return map[key] ?? key;
};

const baseBanner: TextBannerData = { text: '🔥 Акція на каву', categoryId: 'c1', productId: 'p1', enabled: true };

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('TextBanner', () => {
  const renderBanner = (overrides?: Partial<Parameters<typeof TextBanner>[0]>) =>
    render(
      <TextBanner
        banner={baseBanner}
        products={products}
        categories={[]}
        headerHeight={65}
        onOpenProduct={() => {}}
        onOpenCategory={() => {}}
        t={mockT}
        {...overrides}
      />
    );

  it('does not render when disabled', () => {
    renderBanner({ banner: { ...baseBanner, enabled: false } });
    expect(screen.queryByText('🔥 Акція на каву')).not.toBeInTheDocument();
  });

  it('renders the banner text when enabled', async () => {
    renderBanner();
    await waitFor(() => {
      expect(screen.getByText('🔥 Акція на каву')).toBeInTheDocument();
    });
  });

  it('opens the linked product when clicked', async () => {
    const onOpenProduct = vi.fn();
    renderBanner({ onOpenProduct });
    await waitFor(() => {
      expect(screen.getByText('🔥 Акція на каву')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('🔥 Акція на каву'));
    expect(onOpenProduct).toHaveBeenCalledTimes(1);
  });

  it('opens the linked category when the banner has a category but no product', async () => {
    const onOpenCategory = vi.fn();
    renderBanner({
      banner: { ...baseBanner, categoryId: 'c2', productId: '' },
      categories: [category('c2', 'Десерти')],
      onOpenCategory,
    });
    await waitFor(() => {
      expect(screen.getByText('🔥 Акція на каву')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('🔥 Акція на каву'));
    expect(onOpenCategory).toHaveBeenCalledTimes(1);
    expect(onOpenCategory).toHaveBeenCalledWith('c2');
  });

  it('closes the banner when the close button is clicked', async () => {
    renderBanner();
    await waitFor(() => {
      expect(screen.getByText('🔥 Акція на каву')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByLabelText('Close banner'));
    await waitFor(() => {
      expect(screen.queryByText('🔥 Акція на каву')).not.toBeInTheDocument();
    });
  });

  it('does not open a link when no link is set', async () => {
    const onOpenProduct = vi.fn();
    const onOpenCategory = vi.fn();
    renderBanner({ banner: { ...baseBanner, categoryId: '', productId: '' }, onOpenProduct, onOpenCategory });
    await waitFor(() => {
      expect(screen.getByText('🔥 Акція на каву')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('🔥 Акція на каву'));
    expect(onOpenProduct).not.toHaveBeenCalled();
    expect(onOpenCategory).not.toHaveBeenCalled();
  });
});
