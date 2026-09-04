import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import { TextBanner } from '../menu/TextBanner';
import type { TextBanner as TextBannerData, Product } from '../../lib/supabase';

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
  it('does not render when disabled', () => {
    render(
      <TextBanner
        banner={{ ...baseBanner, enabled: false }}
        products={products}
        headerHeight={65}
        onOpenProduct={() => {}}
        t={mockT}
      />
    );
    expect(screen.queryByText('🔥 Акція на каву')).not.toBeInTheDocument();
  });

  it('renders the banner text when enabled', async () => {
    render(
      <TextBanner
        banner={baseBanner}
        products={products}
        headerHeight={65}
        onOpenProduct={() => {}}
        t={mockT}
      />
    );
    await waitFor(() => {
      expect(screen.getByText('🔥 Акція на каву')).toBeInTheDocument();
    });
  });

  it('opens the linked product when clicked', async () => {
    const onOpenProduct = vi.fn();
    render(
      <TextBanner
        banner={baseBanner}
        products={products}
        headerHeight={65}
        onOpenProduct={onOpenProduct}
        t={mockT}
      />
    );
    await waitFor(() => {
      expect(screen.getByText('🔥 Акція на каву')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('🔥 Акція на каву'));
    expect(onOpenProduct).toHaveBeenCalledTimes(1);
  });

  it('closes the banner when the close button is clicked', async () => {
    render(
      <TextBanner
        banner={baseBanner}
        products={products}
        headerHeight={65}
        onOpenProduct={() => {}}
        t={mockT}
      />
    );
    await waitFor(() => {
      expect(screen.getByText('🔥 Акція на каву')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByLabelText('Close banner'));
    await waitFor(() => {
      expect(screen.queryByText('🔥 Акція на каву')).not.toBeInTheDocument();
    });
  });

  it('does not open a product when no link is set', async () => {
    const onOpenProduct = vi.fn();
    render(
      <TextBanner
        banner={{ ...baseBanner, categoryId: '', productId: '' }}
        products={products}
        headerHeight={65}
        onOpenProduct={onOpenProduct}
        t={mockT}
      />
    );
    await waitFor(() => {
      expect(screen.getByText('🔥 Акція на каву')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('🔥 Акція на каву'));
    expect(onOpenProduct).not.toHaveBeenCalled();
  });
});
